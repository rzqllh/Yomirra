import { AsyncLocalStorage } from "node:async_hooks";
import Redis, { Command, type RedisOptions } from "ioredis";

export type CircuitState = "closed" | "open" | "half-open";

export interface RedisCircuitOptions {
  quotaCooldownsMs?: readonly number[];
  probeTimeoutMs?: number;
}

const DEFAULT_COOLDOWNS = [30_000, 60_000, 120_000, 300_000, 900_000];
const boundedMs = (value: number) => Math.min(900_000, Math.max(1, value));

export function isQuotaExceededError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /max requests limit exceeded/i.test(message);
}

interface Probe {
  command?: Command;
  finish(success: boolean, quota?: boolean): void;
}

export class RedisCircuitGuard extends Redis {
  private circuitState: CircuitState = "closed";
  private reopenAt = 0;
  private quotaTier = 0;
  private readonly cooldowns: readonly number[];
  private readonly probeTimeoutMs: number;
  private probe: Probe | null = null;
  private recovery: Promise<boolean> | null = null;
  private readonly lifecycle = new AsyncLocalStorage<Probe>();
  private readonly observed = new WeakSet<Command>();

  constructor(url: string, options: RedisOptions, circuit: RedisCircuitOptions = {}) {
    // ioredis owns reconnect scheduling; suppress it only during quota cooldown.
    super(url, options);
    const clientOptions = this.options ?? options;
    const retryStrategy = clientOptions.retryStrategy;
    clientOptions.retryStrategy = (times) => {
      if (this.circuitState !== "closed" && !this.probe) return null;
      return retryStrategy?.(times) ?? null;
    };
    const cooldowns = circuit.quotaCooldownsMs ?? DEFAULT_COOLDOWNS;
    if (!cooldowns.length || cooldowns.some((ms) => !Number.isFinite(ms) || ms <= 0)) {
      throw new Error("Redis quota cooldowns must contain positive finite durations");
    }
    this.cooldowns = cooldowns.map(boundedMs).sort((a, b) => a - b);
    this.probeTimeoutMs = Number.isFinite(circuit.probeTimeoutMs)
      ? boundedMs(circuit.probeTimeoutMs!) : 3_000;
    this.on("error", (error: unknown) => {
      if (isQuotaExceededError(error)) this.recordQuotaExceeded();
    });
    this.on("close", () => {
      // Never replay a possibly executed probe across connections.
      if (this.probe?.command) this.probe.finish(false);
    });
  }

  getCircuitState(): CircuitState {
    if (this.circuitState === "open" && Date.now() >= this.reopenAt) {
      this.circuitState = "half-open";
    }
    return this.circuitState;
  }

  override emit(event: string | symbol, ...args: unknown[]): boolean {
    // Application event listeners must not inherit internal handshake authority.
    return this.lifecycle
      ? this.lifecycle.exit(() => super.emit(event, ...args))
      : super.emit(event, ...args);
  }

  override connect(callback?: Parameters<Redis["connect"]>[0]): Promise<void> {
    // Reconnects enter the same bounded attempt, regardless of timer context.
    if (!this.probe) return super.connect(callback);
    const applicationCallback: typeof callback = typeof callback === "function"
      ? (...args) => this.lifecycle.exit(() => callback(...args))
      : callback;
    return this.lifecycle.run(this.probe, () => super.connect(applicationCallback));
  }

  isCircuitOpen(): boolean {
    const open = this.getCircuitState() !== "closed";
    if (open) void this.kickRecovery();
    return open;
  }

  isCommandAllowed(): boolean {
    return !this.isCircuitOpen();
  }

  recordQuotaExceeded(): void {
    // A burst of replies from an already dispatched pipeline is one outage.
    if (this.circuitState === "open") return;
    if (this.probe) this.probe.finish(false, true);
    else this.open(true);
  }

  private open(quota: boolean): void {
    if (quota) {
      this.quotaTier = this.circuitState === "closed"
        ? 0 : Math.min(this.quotaTier + 1, this.cooldowns.length - 1);
    }
    this.circuitState = "open";
    this.reopenAt = Date.now() + this.cooldowns[this.quotaTier];
    // Stop automatic reconnect/command replay throughout the cooldown.
    this.disconnect();
  }

  kickRecovery(): Promise<boolean> | null {
    if (this.getCircuitState() !== "half-open") return this.recovery;
    if (this.recovery) return this.recovery;

    let resolve!: (success: boolean) => void;
    this.recovery = new Promise<boolean>((done) => { resolve = done; });
    const result = this.recovery;
    const probe: Probe = {
      finish: (success, quota = false) => {
        // A timeout or quota reply revokes this attempt, including late ready/PONG.
        if (this.probe !== probe) return;
        clearTimeout(timer);
        this.probe = null;
        this.recovery = null;
        if (success) {
          this.circuitState = "closed";
          this.quotaTier = 0;
        } else {
          this.open(quota);
        }
        resolve(success);
      },
    };
    this.probe = probe;
    const timer = setTimeout(() => probe.finish(false), this.probeTimeoutMs);
    void (async () => {
      try {
        await waitForRedisReady(this, this.probeTimeoutMs);
        if (this.probe !== probe) return;
        const command = new Command("ping", [], { replyEncoding: "utf8" });
        probe.command = command;
        const reply = await this.sendCommand(command);
        probe.finish(reply === "PONG");
      } catch (error) {
        probe.finish(false, isQuotaExceededError(error));
      }
    })();
    return result;
  }

  override sendCommand(command: Command, stream?: Parameters<Redis["sendCommand"]>[1]): ReturnType<Redis["sendCommand"]> {
    const probe = this.probe;
    // Only this exact PING is authorized. A user PING, pipeline or MULTI cannot borrow it.
    const authorizedProbe = probe?.command === command && !stream;
    const handshake = probe && this.lifecycle.getStore() === probe &&
      this.status === "connect" && !stream &&
      Command.checkFlag("HANDSHAKE_COMMANDS", command.name);
    if (this.getCircuitState() !== "closed" && !authorizedProbe && !handshake) {
      void this.kickRecovery();
      command.reject(new Error("Redis unavailable: quota circuit breaker is open or in half-open state"));
      return command.promise;
    }

    // Observe settlement before callbacks; EXEC can nest quota errors in a reply.
    if (!this.observed.has(command)) {
      this.observed.add(command);
      const reject = command.reject;
      const resolve = command.resolve;
      command.reject = (error) => {
        if ((!probe || this.probe === probe) && isQuotaExceededError(error)) this.recordQuotaExceeded();
        reject(error);
      };
      command.resolve = (reply: unknown) => {
        const hasQuota = (value: unknown): boolean =>
          value instanceof Error ? isQuotaExceededError(value) :
            Array.isArray(value) && value.some(hasQuota);
        if ((!probe || this.probe === probe) && hasQuota(reply)) this.recordQuotaExceeded();
        resolve(reply);
      };
    }
    return super.sendCommand(command, stream);
  }
}

export function waitForRedisReady(client: Redis, timeoutMs = 2_500): Promise<void> {
  if (client.status === "ready") return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      client.removeListener("ready", handleReady);
      client.removeListener("end", handleEnd);
      if (error) reject(error);
      else resolve();
    };
    const handleReady = () => {
      if (client.status === "ready") finish();
    };
    const handleEnd = () => finish(new Error("Redis connection ended before becoming ready"));
    const timer = setTimeout(() => finish(new Error("Redis connection timed out waiting for ready state")), timeoutMs);
    client.once("ready", handleReady);
    client.once("end", handleEnd);
    if (client.status === "wait" || client.status === "end") {
      try {
        void client.connect().then(handleReady, (error: unknown) => {
          if (client.status === "connecting" || client.status === "reconnecting") return;
          finish(error instanceof Error ? error : new Error(String(error)));
        });
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    }
    handleReady();
  });
}
