import { failure, success, type Result } from '@shared/kernel/result';
import { DomainError } from '@shared/kernel/errors';

export class WeakPasswordError extends DomainError {
  constructor(message: string) {
    super(message, 'WEAK_PASSWORD');
  }
}

export class PasswordPolicy {
  private static readonly MIN_LENGTH = 8;
  private static readonly UPPERCASE_REGEX = /[A-Z]/;
  private static readonly LOWERCASE_REGEX = /[a-z]/;
  private static readonly DIGIT_REGEX = /\d/;
  private static readonly SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

  public static validate(password: string): Result<void, WeakPasswordError> {
    if (password.length < this.MIN_LENGTH) {
      return failure(
        new WeakPasswordError(
          `Password must be at least ${this.MIN_LENGTH} characters long`,
        ),
      );
    }

    if (!this.UPPERCASE_REGEX.test(password)) {
      return failure(
        new WeakPasswordError('Password must contain at least one uppercase letter'),
      );
    }

    if (!this.LOWERCASE_REGEX.test(password)) {
      return failure(
        new WeakPasswordError('Password must contain at least one lowercase letter'),
      );
    }

    if (!this.DIGIT_REGEX.test(password)) {
      return failure(new WeakPasswordError('Password must contain at least one digit'));
    }

    if (!this.SPECIAL_CHAR_REGEX.test(password)) {
      return failure(
        new WeakPasswordError('Password must contain at least one special character'),
      );
    }

    return success(undefined);
  }
}
