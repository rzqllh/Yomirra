// @vitest-environment node
import { AsyncResource } from "node:async_hooks";
import { Duplex } from "node:stream";
import { setImmediate } from "node:timers/promises";
import Redis, { Command, type RedisOptions } from "ioredis";
import AbstractConnector from "ioredis/built/connectors/AbstractConnector";
import type { NetStream } from "ioredis/built/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RedisCircuitGuard, type RedisCircuitOptions } from "../redis-circuit";

const QUOTA = "ERR max requests limit exceeded";
const bulk = (text: string) => `$${Buffer.byteLength(text)}\r\n${text}\r\n`;
const flush = async () => { for (let i = 0; i < 10; i++) await setImmediate(); };

// No sockets: ioredis's real DataHandler parses RESP from this duplex transport.
class RespPeer extends Duplex {
  readonly resource = new AsyncResource("fake-redis-transport");
  readonly commands: string[][] = [];
  private transaction: string[] | null = null;
  holdPing = false;
  holdInfo = false;
  holdGet = false;
  quotaGet = false;
  quotaPing = false;
  quotaExec = false;
  quotaAuth = false;
  pendingPing: (() => void) | null = null;
  pendingInfo: (() => void) | null = null;

  override _read() {}
  setNoDelay() { return this; }
  setKeepAlive() { return this; }

  reply(resp: string) {
    queueMicrotask(() => this.resource.runInAsyncScope(() => {
      if (!this.destroyed) this.push(Buffer.from(resp));
    }));
  }

  remoteClose() { this.resource.runInAsyncScope(() => this.destroy()); }
  override _final(done: (error?: Error | null) => void) { done(); this.destroy(); }

  override _write(chunk: Buffer, _encoding: BufferEncoding, done: (error?: Error | null) => void) {
    const data = chunk.toString();
    let offset = 0;
    while (offset < data.length) {
      const end = data.indexOf("\r\n", offset);
      const count = Number(data.slice(offset + 1, end));
      offset = end + 2;
      const args: string[] = [];
      for (let i = 0; i < count; i++) {
        const header = data.indexOf("\r\n", offset);
        const length = Number(data.slice(offset + 1, header));
        args.push(data.slice(header + 2, header + 2 + length));
        offset = header + 2 + length + 2;
      }
      this.commands.push(args);
      this.respond(args);
    }
    done();
  }

  private respond(args: string[]) {
    const name = args[0].toLowerCase();
    if (name === "multi") {
      this.transaction = [];
      this.reply("+OK\r\n");
    } else if (name === "exec") {
      const replies = this.transaction ?? [];
      this.transaction = null;
      this.reply(`*${replies.length}\r\n${replies.join("")}`);
    } else if (this.transaction) {
      this.transaction.push(this.quotaExec ? `-${QUOTA}\r\n` : bulk("value"));
      this.reply("+QUEUED\r\n");
    } else if (name === "info") {
      const reply = () => this.reply(bulk("loading:0\r\n"));
      if (this.holdInfo) this.pendingInfo = reply;
      else reply();
    } else if (name === "ping") {
      const reply = () => this.reply(this.quotaPing ? `-${QUOTA}\r\n` : "+PONG\r\n");
      if (this.holdPing) this.pendingPing = reply;
      else reply();
    } else if (name === "get") {
      if (!this.holdGet) this.reply(this.quotaGet ? `-${QUOTA}\r\n` : bulk("value"));
    } else if (name === "auth" && this.quotaAuth) {
      this.reply(`-${QUOTA}\r\n`);
    } else {
      this.reply("+OK\r\n");
    }
  }
}

const clients: RedisCircuitGuard[] = [];
function createClient(circuit: RedisCircuitOptions = {}, options: RedisOptions = {}) {
  const peers: RespPeer[] = [];
  let configure: (peer: RespPeer) => void = () => {};
  class Connector extends AbstractConnector {
    constructor() { super(1); }
    async connect() {
      const peer = new RespPeer();
      configure(peer);
      peers.push(peer);
      this.stream = peer as unknown as NetStream;
      return this.stream;
    }
  }
  const client = new RedisCircuitGuard("redis://:secret@fake.invalid:6379/2", {
    Connector,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => times <= 2 ? 5 : null,
    ...options,
  }, { quotaCooldownsMs: [100, 200, 400], probeTimeoutMs: 50, ...circuit });
  clients.push(client);
  return {
    client, peers,
    configure: (fn: (peer: RespPeer) => void) => { configure = fn; },
    commands: () => peers.flatMap((peer) => peer.commands.map((args) => args[0].toLowerCase())),
  };
}

beforeEach(() => { vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] }); });
afterEach(async () => {
  for (const client of clients.splice(0)) client.disconnect();
  await flush();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function openCircuit(fixture: ReturnType<typeof createClient>) {
  await fixture.client.connect();
  fixture.peers[0].quotaGet = true;
  await expect(fixture.client.get("quota")).rejects.toThrow(QUOTA);
  await flush();
  expect(fixture.client.getCircuitState()).toBe("open");
  expect(fixture.client.status).toBe("end");
}

describe("Redis circuit through the real ioredis lifecycle", () => {
  it("preserves promise, callback, pipeline and MULTI when closed", async () => {
    const { client, commands } = createClient();
    await client.connect();
    expect(commands()).toEqual(expect.arrayContaining(["auth", "select", "client", "info"]));
    expect(await client.get("key")).toBe("value");
    await new Promise<void>((resolve, reject) => {
      void client.get("key", (error, value) => {
        if (error) return reject(error);
        expect(value).toBe("value");
        resolve();
      });
    });
    expect(await client.pipeline().get("one").get("two").exec()).toEqual([[null, "value"], [null, "value"]]);
    expect(await client.multi().get("one").get("two").exec()).toEqual([[null, "value"], [null, "value"]]);
  });

  it("times out a silent connection and reconnects without replaying the pending command", async () => {
    const fixture = createClient({}, {
      commandTimeout: 30,
      socketTimeout: 45,
      autoResendUnfulfilledCommands: false,
    });
    await fixture.client.connect();
    fixture.peers[0].holdGet = true;
    const settled = expect(fixture.client.get("silent")).rejects.toThrow("Command timed out");
    await vi.advanceTimersByTimeAsync(30);
    await settled;
    expect(fixture.peers[0].destroyed).toBe(false);

    await vi.advanceTimersByTimeAsync(30);
    await flush();
    expect(fixture.peers[0].destroyed).toBe(true);
    expect(fixture.peers).toHaveLength(2);
    expect(fixture.commands().filter((name) => name === "get")).toHaveLength(1);
    await expect(fixture.client.get("recovered")).resolves.toBe("value");
  });

  it("opens synchronously before a quota callback can dispatch another command", async () => {
    const fixture = createClient();
    await fixture.client.connect();
    fixture.peers[0].quotaGet = true;
    const callback = vi.fn();
    await new Promise<void>((resolve) => {
      void fixture.client.get("quota", (error) => {
        callback(error);
        expect(fixture.client.getCircuitState()).toBe("open");
        void fixture.client.get("leak").catch(() => resolve());
      });
    });
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ message: QUOTA }));
    expect(fixture.commands().filter((name) => name === "get")).toHaveLength(1);
  });

  it("settles rejected command identities, callbacks, pipelines and MULTI without writes", async () => {
    const fixture = createClient();
    await openCircuit(fixture);
    const before = fixture.commands();
    const command = new Command("get", ["key"]);
    expect(fixture.client.sendCommand(command)).toBe(command.promise);
    await expect(command.promise).rejects.toThrow("circuit breaker");
    const callback = vi.fn();
    await expect(fixture.client.get("key", callback)).rejects.toThrow("circuit breaker");
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBeInstanceOf(Error);
    const pipelineCallback = vi.fn();
    const rows = await fixture.client.pipeline().get("one").ping().exec(pipelineCallback);
    expect(rows).toHaveLength(2);
    expect(rows?.every(([error]) => error instanceof Error)).toBe(true);
    expect(pipelineCallback).toHaveBeenCalledTimes(1);
    await expect(fixture.client.multi().get("one").exec()).rejects.toThrow("circuit breaker");
    const multiCallback = vi.fn();
    await expect(fixture.client.multi().get("one").exec(multiCallback)).rejects.toThrow("circuit breaker");
    expect(multiCallback).toHaveBeenCalledTimes(1);
    expect(multiCallback.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(fixture.commands()).toEqual(before);
  });

  it("shares one half-open probe across 100 callers, with no ordinary command leakage", async () => {
    const fixture = createClient();
    await openCircuit(fixture);
    fixture.configure((peer) => { peer.holdPing = true; });
    await vi.advanceTimersByTimeAsync(100);
    const recovery = fixture.client.kickRecovery();
    expect(recovery).not.toBeNull();
    const callers = Array.from({ length: 100 }, () => {
      expect(fixture.client.isCircuitOpen()).toBe(true);
      expect(fixture.client.isCommandAllowed()).toBe(false);
      expect(fixture.client.kickRecovery()).toBe(recovery);
      return fixture.client.get("blocked").catch((error: Error) => error);
    });
    await flush();
    expect(fixture.peers).toHaveLength(2);
    expect(fixture.commands().filter((name) => name === "ping")).toHaveLength(1);
    expect(fixture.commands().filter((name) => name === "get")).toHaveLength(1);
    await expect(fixture.client.ping()).rejects.toThrow("circuit breaker");
    const pipeline = await fixture.client.pipeline().get("leak").ping().exec();
    expect(pipeline?.every(([error]) => error instanceof Error)).toBe(true);
    await expect(fixture.client.multi().get("leak").exec()).rejects.toThrow("circuit breaker");
    expect((await Promise.all(callers)).every((result) => result instanceof Error)).toBe(true);
    fixture.peers[1].pendingPing!();
    await expect(recovery).resolves.toBe(true);
    expect(fixture.client.isCircuitOpen()).toBe(false);
    expect(fixture.client.isCommandAllowed()).toBe(true);
    expect(await fixture.client.get("recovered")).toBe("value");
  });

  it("starts nonblocking recovery from admission checks alone after the timestamp", async () => {
    const fixture = createClient();
    await openCircuit(fixture);
    await vi.advanceTimersByTimeAsync(99);
    expect(fixture.client.isCommandAllowed()).toBe(false);
    expect(fixture.peers).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fixture.client.isCircuitOpen()).toBe(true);
    await flush();
    expect(fixture.client.getCircuitState()).toBe("closed");
    expect(fixture.commands().filter((name) => name === "ping")).toHaveLength(1);
  });

  it("opens on nested EXEC quota errors too", async () => {
    const fixture = createClient();
    await fixture.client.connect();
    fixture.peers[0].quotaExec = true;
    const rows = await fixture.client.multi().get("one").get("two").exec();
    expect(rows?.every(([error]) => error?.message === QUOTA)).toBe(true);
    expect(fixture.client.getCircuitState()).toBe("open");
  });

  it("uses bounded configurable cooldown tiers and ignores duplicate outage replies", async () => {
    const fixture = createClient();
    await openCircuit(fixture);
    fixture.client.recordQuotaExceeded();
    fixture.configure((peer) => { peer.quotaPing = true; });
    for (const cooldown of [100, 200, 400, 400]) {
      await vi.advanceTimersByTimeAsync(cooldown - 1);
      expect(fixture.client.kickRecovery()).toBeNull();
      await vi.advanceTimersByTimeAsync(1);
      const recovery = fixture.client.kickRecovery();
      await flush();
      await expect(recovery).resolves.toBe(false);
      expect(fixture.client.getCircuitState()).toBe("open");
    }
    fixture.configure(() => {});
    await vi.advanceTimersByTimeAsync(400);
    const recovery = fixture.client.kickRecovery();
    await expect(recovery).resolves.toBe(true);
    fixture.client.recordQuotaExceeded();
    await flush();
    await vi.advanceTimersByTimeAsync(100);
    expect(fixture.client.getCircuitState()).toBe("half-open");
  });

  it("times out a PING and fences a late successful completion from the next attempt", async () => {
    const fixture = createClient();
    await openCircuit(fixture);
    fixture.configure((peer) => { peer.holdPing = true; });
    await vi.advanceTimersByTimeAsync(100);
    const oldRecovery = fixture.client.kickRecovery();
    await flush();
    const oldCommand = fixture.client.commandQueue.peekAt(0)!.command;
    await vi.advanceTimersByTimeAsync(50);
    await expect(oldRecovery).resolves.toBe(false);
    await flush();
    await vi.advanceTimersByTimeAsync(100);
    const newRecovery = fixture.client.kickRecovery();
    await flush();
    oldCommand.resolve(Buffer.from("PONG"));
    await flush();
    expect(fixture.client.getCircuitState()).toBe("half-open");
    fixture.peers[2].pendingPing!();
    await expect(newRecovery).resolves.toBe(true);
  });

  it("bounds a stalled handshake and never dispatches PING after late ready", async () => {
    const fixture = createClient();
    await openCircuit(fixture);
    fixture.configure((peer) => { peer.holdInfo = true; });
    const applicationCalls: Promise<unknown>[] = [];
    fixture.client.once("connect", () => {
      applicationCalls.push(...[
        fixture.client.get("event-leak"), fixture.client.ping(),
        fixture.client.info(), fixture.client.client("SETNAME", "event-leak"),
      ].map((promise) => promise.catch((error: unknown) => error)));
    });
    await vi.advanceTimersByTimeAsync(100);
    const recovery = fixture.client.kickRecovery();
    await flush();
    expect(fixture.client.status).toBe("connect");
    expect(applicationCalls).toHaveLength(4);
    expect((await Promise.all(applicationCalls)).every((error) => error instanceof Error)).toBe(true);
    await expect(fixture.client.info()).rejects.toThrow("circuit breaker");
    await expect(fixture.client.auth("secret")).rejects.toThrow("circuit breaker");
    const lateInfo = fixture.client.commandQueue.peekAt(0)!.command;
    await vi.advanceTimersByTimeAsync(50);
    await expect(recovery).resolves.toBe(false);
    lateInfo.resolve(Buffer.from("loading:0\r\n"));
    await flush();
    expect(fixture.client.getCircuitState()).toBe("open");
    expect(fixture.commands().filter((name) => name === "ping")).toHaveLength(0);
  });

  it("strips handshake authority from connect error callbacks and their async descendants", async () => {
    const fixture = createClient();
    await openCircuit(fixture);
    fixture.configure((peer) => { peer.holdInfo = true; });
    const applicationCalls: Promise<unknown>[] = [];
    let callbackError: Error | null | undefined;
    const connect = fixture.client.connect;
    vi.spyOn(fixture.client, "connect").mockImplementation(function (this: RedisCircuitGuard) {
      return connect.call(this, (error) => {
        callbackError = error;
        const commands = () => [
          fixture.client.get("callback-leak"), fixture.client.ping(), fixture.client.info(),
          fixture.client.client("SETNAME", "callback-leak"), fixture.client.auth("secret"),
        ];
        applicationCalls.push(...commands().map((promise) => promise.catch((failure: unknown) => failure)));
        applicationCalls.push(Promise.resolve().then(() => Promise.all(
          commands().map((promise) => promise.catch((failure: unknown) => failure)),
        )));
      });
    });
    await vi.advanceTimersByTimeAsync(100);
    const recovery = fixture.client.kickRecovery();
    await flush();
    void fixture.client.connect().catch(() => {});
    await flush();
    expect(callbackError).toBeInstanceOf(Error);
    expect(applicationCalls).toHaveLength(6);
    const results = (await Promise.all(applicationCalls)).flat();
    expect(results).toHaveLength(10);
    expect(results.every((error) => error instanceof Error && error.message.includes("circuit breaker"))).toBe(true);
    expect(fixture.peers[1].commands.some((args) => args.includes("callback-leak"))).toBe(false);
    fixture.peers[1].pendingInfo!();
    await expect(recovery).resolves.toBe(true);
    expect(fixture.commands().filter((name) => name === "ping")).toHaveLength(1);
  });

  it.each(["resolve", "reject", "quota"] as const)("fences late probe %s even when a mock transport cannot cancel completion", async (settle) => {
    const fixture = createClient();
    await openCircuit(fixture);
    const original = Redis.prototype.sendCommand;
    let oldCommand!: Command;
    const send = vi.spyOn(Redis.prototype, "sendCommand").mockImplementation(function (this: Redis, command, stream) {
      if (command.name === "ping") {
        oldCommand = command;
        return command.promise;
      }
      return original.call(this, command, stream);
    });
    await vi.advanceTimersByTimeAsync(100);
    const oldRecovery = fixture.client.kickRecovery();
    await flush();
    expect(oldCommand).toBeDefined();
    await vi.advanceTimersByTimeAsync(50);
    await expect(oldRecovery).resolves.toBe(false);
    await flush();
    send.mockRestore();
    fixture.configure((peer) => { peer.holdPing = true; });
    await vi.advanceTimersByTimeAsync(100);
    const newRecovery = fixture.client.kickRecovery();
    await flush();
    if (settle === "resolve") oldCommand.resolve(Buffer.from("PONG"));
    else oldCommand.reject(new Error(settle === "quota" ? QUOTA : "late transport rejection"));
    await flush();
    expect(fixture.client.getCircuitState()).toBe("half-open");
    fixture.peers[2].pendingPing!();
    await expect(newRecovery).resolves.toBe(true);
  });

  it("never replays a probe across a transport close", async () => {
    const fixture = createClient();
    await openCircuit(fixture);
    fixture.configure((peer) => { peer.holdPing = true; });
    await vi.advanceTimersByTimeAsync(100);
    const recovery = fixture.client.kickRecovery();
    await flush();
    fixture.peers[1].remoteClose();
    await flush();
    await expect(recovery).resolves.toBe(false);
    await vi.advanceTimersByTimeAsync(10);
    await flush();
    expect(fixture.peers).toHaveLength(2);
    expect(fixture.commands().filter((name) => name === "ping")).toHaveLength(1);
    expect(fixture.client.getCircuitState()).toBe("open");
  });

  it("allows bounded reconnect during recovery handshake before dispatching one PING", async () => {
    const fixture = createClient();
    await openCircuit(fixture);
    fixture.configure((peer) => { peer.holdInfo = true; });
    await vi.advanceTimersByTimeAsync(100);
    const recovery = fixture.client.kickRecovery();
    await flush();
    fixture.configure(() => {});
    fixture.peers[1].remoteClose();
    await flush();
    expect(fixture.client.status).toBe("reconnecting");
    await vi.advanceTimersByTimeAsync(5);
    await flush();
    await expect(recovery).resolves.toBe(true);
    expect(fixture.peers).toHaveLength(3);
    expect(fixture.commands().filter((name) => name === "ping")).toHaveLength(1);
    expect(fixture.client.isCommandAllowed()).toBe(true);
  });

  it("records quota in callback-based AUTH and suppresses reconnect during cooldown", async () => {
    const fixture = createClient();
    fixture.configure((peer) => { peer.quotaAuth = true; });
    await expect(fixture.client.connect()).rejects.toThrow();
    await flush();
    expect(fixture.client.getCircuitState()).toBe("open");
    await vi.advanceTimersByTimeAsync(99);
    expect(fixture.peers).toHaveLength(1);
  });

  it("preserves normal ioredis reconnect and handshake after a transport close", async () => {
    const fixture = createClient();
    await fixture.client.connect();
    fixture.peers[0].remoteClose();
    await flush();
    expect(fixture.client.status).toBe("reconnecting");
    await vi.advanceTimersByTimeAsync(5);
    await flush();
    expect(fixture.client.status).toBe("ready");
    expect(fixture.peers).toHaveLength(2);
    expect(fixture.peers[1].commands.map(([name]) => name.toLowerCase())).toEqual(
      expect.arrayContaining(["auth", "select", "client", "info"]),
    );
    expect(await fixture.client.get("key")).toBe("value");
  });
});
