interface WakeLockSentinel {
  release(): Promise<void>;
  readonly released: boolean;
  readonly type: "screen";
}

interface Navigator {
  wakeLock?: {
    request(type: "screen"): Promise<WakeLockSentinel>;
  };
}
