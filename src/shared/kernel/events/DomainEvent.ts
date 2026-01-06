export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly eventType: string;
  readonly aggregateId: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public readonly eventType: string;

  constructor(
    public readonly aggregateId: string,
    eventId: string,
    occurredAt: Date,
  ) {
    this.eventId = eventId;
    this.occurredAt = occurredAt;
    this.eventType = this.constructor.name;
  }
}
