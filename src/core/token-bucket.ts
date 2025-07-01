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

    const elapsed: number = (now - this.timestamp) / 1000 / 60;

    const tokensToAdd: number = elapsed * this.rate;

    this.timestamp = now;
    this.tokens = Math.min(this.cap, this.tokens + tokensToAdd);

    if (this.tokens >= 1) {
      this.tokens -= 1;

      return true;
    }

    return false;
  }
}
