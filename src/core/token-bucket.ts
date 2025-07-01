const TEN_MINUTES_IN_MILLISECONDS = 10 * 60 * 1000;

export class TokenBucket {
  protected timestamp: number;
  protected tokens: number;

  constructor(
    protected rate: number,
    protected cap: number,
  ) {
    this.timestamp = Date.now();
    this.tokens = this.cap;
  }

  public async get(): Promise<boolean> {
    const now: number = Date.now();

    const elapsedMs: number = now - this.timestamp;

    const tokenIntervalMs = TEN_MINUTES_IN_MILLISECONDS / this.rate;
    const tokensToAdd = Math.floor(elapsedMs / tokenIntervalMs);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.cap, this.tokens + tokensToAdd);
      this.timestamp += tokensToAdd * tokenIntervalMs;
    }

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }
}
