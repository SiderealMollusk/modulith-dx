# Value Object Generator

**Status**: 🟠 [Not yet implemented](../status.md) — this is the specification.

See [docs/ddd-implementation/primitives/value-object/specification.md](../../ddd-implementation/primitives/value-object/specification.md) for full details.

## Quick Start

```bash
nx generate @local/ddd:value-object --context=identity --name=Email
```

**Creates**:
```
src/core/identity/domain/value-objects/
├── Email.ts (generated)
└── Email.spec.ts (generated)
```

## Generated Structure

### ValueObject Class
```typescript
import { ValueObject, Result, DomainError } from '@shared/kernel';

export class Email extends ValueObject<string> {
  private constructor(readonly value: string) {
    super(value);
  }

  static create(email: string): Result<Email, DomainError> {
    if (!this.isValid(email)) {
      return Result.fail(new DomainError('INVALID_EMAIL', 'Email format invalid'));
    }
    return Result.ok(new Email(email));
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  toString(): string {
    return this.value;
  }
}
```

### Test Template
```typescript
describe('Email ValueObject', () => {
  describe('create', () => {
    it('should create valid email', () => {
      const result = Email.create('user@example.com');
      expect(result.isSuccess).toBe(true);
      expect(result.value?.value).toBe('user@example.com');
    });
  });

  describe('validation', () => {
    it('should reject invalid email', () => {
      const result = Email.create('not-an-email');
      expect(result.isFailure).toBe(true);
    });
  });

  describe('equality', () => {
    it('should equal same value', () => {
      const email1 = Email.create('user@example.com').value!;
      const email2 = Email.create('user@example.com').value!;
      expect(email1.equals(email2)).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const email = Email.create('user@example.com').value!;
      expect(() => {
        // @ts-expect-error
        email.value = 'other@example.com';
      }).toThrow();
    });
  });
});
```

## Key Features

- ✅ Extends `ValueObject<T>`
- ✅ Immutable (readonly fields)
- ✅ Private constructor + static factory
- ✅ Returns `Result<ValueObject, DomainError>`
- ✅ Validation via Zod or custom logic
- ✅ Structural equality (ValueObject.equals)
- ✅ Includes unit test stub
