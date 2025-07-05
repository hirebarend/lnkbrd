export class TokenBucket {
  protected timestamp: number;
  protected tokens: number;

  constructor(
    protected tokensPerInterval: number,
    protected maximumNumberOfTokens: number,
    protected intervalInMilliseconds: number,
  ) {
    this.timestamp = Date.now();
    this.tokens = this.maximumNumberOfTokens;
  }

  public async get(): Promise<boolean> {
    const now: number = Date.now();

    const elapsedMs: number = now - this.timestamp;

    const tokenIntervalMs =
      this.intervalInMilliseconds / this.tokensPerInterval;
    const tokensToAdd = Math.floor(elapsedMs / tokenIntervalMs);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(
        this.maximumNumberOfTokens,
        this.tokens + tokensToAdd,
      );
      this.timestamp += tokensToAdd * tokenIntervalMs;
    }

    this.tokens -= 1;

    return this.tokens >= 0;
  }
}
