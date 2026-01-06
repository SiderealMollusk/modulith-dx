import { failure, success, type Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';

declare const emailBrand: unique symbol;
export type Email = string & { readonly [emailBrand]: 'Email' };

export class InvalidEmailError extends DomainError {
  constructor(value: string) {
    super(`Invalid email: ${value}`, 'INVALID_EMAIL');
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createEmail = (value: string): Result<Email, InvalidEmailError> => {
  const trimmed = value.trim().toLowerCase();
  
  if (!EMAIL_REGEX.test(trimmed)) {
    return failure(new InvalidEmailError(value));
  }
  
  if (trimmed.length > 254) {
    return failure(new InvalidEmailError(value));
  }
  
  return success(trimmed as Email);
};

export const emailToString = (email: Email): string => email;
