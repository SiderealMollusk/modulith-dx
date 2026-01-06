import { fromString, isValidUUID, type UserId } from '@shared/kernel/id';
import { failure, success, type Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';

export class InvalidUserIdError extends DomainError {
  constructor(value: string) {
    super(`Invalid UserId: ${value}`, 'INVALID_USER_ID');
  }
}

export const createUserId = (value: string): Result<UserId, InvalidUserIdError> => {
  if (!isValidUUID(value)) {
    return failure(new InvalidUserIdError(value));
  }
  return success(fromString<'UserId'>(value, 'UserId'));
};

export type { UserId };
