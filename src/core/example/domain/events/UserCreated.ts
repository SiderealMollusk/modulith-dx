import { BaseDomainEvent } from '@shared/kernel/events';
import { createId } from '@shared/kernel/id';
import type { Email } from '../valueObjects/Email';

export class UserCreated extends BaseDomainEvent {
  public readonly email: string;

  constructor(aggregateId: string, email: Email, occurredAt: Date = new Date()) {
    super(aggregateId, createId('UserCreated'), occurredAt);
    this.email = email;
  }
}
