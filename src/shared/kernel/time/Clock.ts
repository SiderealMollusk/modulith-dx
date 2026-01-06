export interface Clock {
  now(): Date;
  timestamp(): number;
}

export class SystemClock implements Clock {
  public now(): Date {
    return new Date();
  }

  public timestamp(): number {
    return Date.now();
  }
}

export class FixedClock implements Clock {
  constructor(private readonly fixedDate: Date) {}

  public now(): Date {
    return this.fixedDate;
  }

  public timestamp(): number {
    return this.fixedDate.getTime();
  }
}
