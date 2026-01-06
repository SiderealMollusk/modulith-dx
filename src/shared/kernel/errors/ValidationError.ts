import { ApplicationError } from './ApplicationError';

export class ValidationError extends ApplicationError {
  public readonly field?: string;
  public readonly violations: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    violations: Array<{ field: string; message: string }> = [],
    field?: string,
  ) {
    super(message, 'VALIDATION_ERROR', { violations, field });
    this.field = field;
    this.violations = violations;
  }

  public static singleField(field: string, message: string): ValidationError {
    return new ValidationError(message, [{ field, message }], field);
  }
}
