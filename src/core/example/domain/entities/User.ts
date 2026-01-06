import { createId, fromString, type UserId } from '@shared/kernel/id';
import type { Email } from '../valueObjects/Email';
import { BaseDomainEvent } from '@shared/kernel/events';

export interface UserProps {
  id: UserId;
  email: Email;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  public static create(email: Email, createdAt: Date = new Date()): User {
    return new User({
      id: createId<'UserId'>('UserId'),
      email,
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    });
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  public get id(): UserId {
    return this.props.id;
  }

  public get email(): Email {
    return this.props.email;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public changeEmail(newEmail: Email): void {
    this.props.email = newEmail;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }
}
