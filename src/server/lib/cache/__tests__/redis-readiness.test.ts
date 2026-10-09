import { beforeEach, describe, expect, it, vi } from "vitest";

type RedisStatus =
  | "wait"
  | "reconnecting"
  | "connecting"
  | "connect"
  | "ready"
  | "close"
  | "end";

type Listener = (...args: unknown[]) => void;

interface RedisMockClient {
  status: RedisStatus;
  connect: ReturnType<typeof vi.fn>;
  emit(event: string, ...args: unknown[]): void;
}

const state = vi.hoisted(() => ({
  client: null as RedisMockClient | null,
}));

vi.mock("ioredis", () => ({
  default: class RedisMock {
    status: RedisStatus = "wait";
    private readonly listeners = new Map<string, Set<Listener>>();

    connect = vi.fn(() => {
      this.status = "connecting";

      return new Promise<void>((resolve, reject) => {
        this.once("ready", () => resolve());
        this.once("end", () => reject(new Error("Redis connection ended")));
      });
    });

    constructor() {
      state.client = this;
    }

    on(event: string, listener: Listener) {
      const listeners = this.listeners.get(event) ?? new Set<Listener>();
      listeners.add(listener);
      this.listeners.set(event, listeners);
      return this;
    }

    once(event: string, listener: Listener) {
      const onceListener: Listener = (...args) => {
        this.removeListener(event, onceListener);
        listener(...args);
      };

      return this.on(event, onceListener);
    }

    removeListener(event: string, listener: Listener) {
      this.listeners.get(event)?.delete(listener);
      return this;
    }

    emit(event: string, ...args: unknown[]) {
      for (const listener of [...(this.listeners.get(event) ?? [])]) {
        listener(...args);
      }
    }
  },
}));

vi.mock("@/env", () => ({
  env: {
    NODE_ENV: "production",
    REDIS_URL: "redis://example.test:6379",
  },
}));

vi.mock("@/shared/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const loadRedis = async () => {
  const redisModule = await import("@/server/lib/cache/redis");
  const client = state.client;

  if (!client) throw new Error("Redis mock was not created");

  return { ...redisModule, client };
};

describe("ensureRedisReady", () => {
  beforeEach(() => {
    vi.resetModules();
    state.client = null;
    process.env.REDIS_URL = "redis://example.test:6379";
  });

  it("returns immediately when Redis is ready", async () => {
    const { client, ensureRedisReady } = await loadRedis();
    client.status = "ready";

    await ensureRedisReady();

    expect(client.connect).not.toHaveBeenCalled();
  });

  it("connects once from the lazy wait state and waits for readiness", async () => {
    const { client, ensureRedisReady } = await loadRedis();

    const readiness = ensureRedisReady();
    expect(client.connect).toHaveBeenCalledTimes(1);

    client.status = "ready";
    client.emit("ready");

    await expect(readiness).resolves.toBeUndefined();
  });

  it("waits for an existing connection without reconnecting", async () => {
    const { client, ensureRedisReady } = await loadRedis();
    client.status = "connecting";

    const readiness = ensureRedisReady();
    expect(client.connect).not.toHaveBeenCalled();

    client.status = "ready";
    client.emit("ready");

    await expect(readiness).resolves.toBeUndefined();
  });

  it("shares one connection attempt across concurrent callers", async () => {
    const { client, ensureRedisReady } = await loadRedis();

    const callers = [ensureRedisReady(), ensureRedisReady(), ensureRedisReady()];
    expect(client.connect).toHaveBeenCalledTimes(1);

    client.status = "ready";
    client.emit("ready");

    await expect(Promise.all(callers)).resolves.toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("propagates connection failure", async () => {
    const { client, ensureRedisReady } = await loadRedis();

    const readiness = ensureRedisReady();
    client.status = "end";
    client.emit("end");

    await expect(readiness).rejects.toThrow("Redis connection ended");
  });

  it("allows a later attempt after connection failure", async () => {
    const { client, ensureRedisReady } = await loadRedis();

    const failedAttempt = ensureRedisReady();
    client.status = "end";
    client.emit("end");
    await expect(failedAttempt).rejects.toThrow("Redis connection ended");

    const recoveryAttempt = ensureRedisReady();
    expect(client.connect).toHaveBeenCalledTimes(2);

    client.status = "ready";
    client.emit("ready");

    await expect(recoveryAttempt).resolves.toBeUndefined();
  });

  it("reuses the ready client after a successful connection", async () => {
    const { client, ensureRedisReady } = await loadRedis();

    const firstAttempt = ensureRedisReady();
    client.status = "ready";
    client.emit("ready");
    await firstAttempt;

    await ensureRedisReady();

    expect(client.connect).toHaveBeenCalledTimes(1);
  });

  it("rejects when Redis is not configured", async () => {
    delete process.env.REDIS_URL;
    const { ensureRedisReady } = await loadRedis();

    await expect(ensureRedisReady()).rejects.toThrow("Redis is not configured");
  });

  it("times out if connection neither becomes ready nor ends within bound", async () => {
    vi.useFakeTimers();
    try {
      const { client, ensureRedisReady } = await loadRedis();
      client.status = "connecting";

      const readiness = ensureRedisReady();
      expect(client.connect).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2600);

      await expect(readiness).rejects.toThrow(
        "Redis connection timed out waiting for ready state"
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("waits and resolves when reconnecting to Redis", async () => {
    const { client, ensureRedisReady } = await loadRedis();
    client.status = "reconnecting";

    const readiness = ensureRedisReady();
    expect(client.connect).not.toHaveBeenCalled();

    client.status = "ready";
    client.emit("ready");

    await expect(readiness).resolves.toBeUndefined();
  });

  it("times out when initiating connection from wait state if connection never settles", async () => {
    vi.useFakeTimers();
    try {
      const { client, ensureRedisReady } = await loadRedis();
      client.status = "wait";
      client.connect = vi.fn(() => new Promise<void>(() => {}));

      const readiness = ensureRedisReady();
      expect(client.connect).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(2600);

      await expect(readiness).rejects.toThrow(
        "Redis connection timed out waiting for ready state"
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("times out when reconnecting from end state if connection never settles", async () => {
    vi.useFakeTimers();
    try {
      const { client, ensureRedisReady } = await loadRedis();
      client.status = "end";
      client.connect = vi.fn(() => new Promise<void>(() => {}));

      const readiness = ensureRedisReady();
      expect(client.connect).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(2600);

      await expect(readiness).rejects.toThrow(
        "Redis connection timed out waiting for ready state"
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("handles late rejection after caller timeout without throwing unhandled rejection", async () => {
    vi.useFakeTimers();
    try {
      const { client, ensureRedisReady } = await loadRedis();
      client.status = "wait";
      let rejectLateConnect!: (error: Error) => void;
      client.connect = vi.fn(
        () =>
          new Promise<void>((_, reject) => {
            rejectLateConnect = reject;
          })
      );

      const readiness = ensureRedisReady();
      expect(client.connect).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(2600);

      await expect(readiness).rejects.toThrow(
        "Redis connection timed out waiting for ready state"
      );

      // Late rejection must not cause unhandled rejection
      expect(() => {
        rejectLateConnect(new Error("Late connection closed"));
      }).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });

  it("propagates synchronous connect rejection", async () => {
    const { client, ensureRedisReady } = await loadRedis();
    client.status = "wait";
    client.connect = vi.fn(() => {
      throw new Error("Immediate synchronous failure");
    });

    await expect(ensureRedisReady()).rejects.toThrow(
      "Immediate synchronous failure"
    );
  });

  it("reflects readiness state correctly through isRedisReady", async () => {
    const { client, isRedisReady } = await loadRedis();
    client.status = "wait";
    expect(isRedisReady()).toBe(false);

    client.status = "connecting";
    expect(isRedisReady()).toBe(false);

    client.status = "reconnecting";
    expect(isRedisReady()).toBe(false);

    client.status = "end";
    expect(isRedisReady()).toBe(false);

    client.status = "ready";
    expect(isRedisReady()).toBe(true);
  });

  it("keeps waiting when initial connect() rejects while client is reconnecting", async () => {
    const { client, ensureRedisReady } = await loadRedis();
    client.status = "wait";
    client.connect = vi.fn(() => {
      client.status = "reconnecting";
      return Promise.reject(new Error("Connection is closed."));
    });

    const readiness = ensureRedisReady();
    expect(client.connect).toHaveBeenCalledTimes(1);

    client.status = "ready";
    client.emit("ready");

    await expect(readiness).resolves.toBeUndefined();
  });
});
