import { describe, it, expect } from 'vitest';
import { PasswordPolicy, WeakPasswordError } from '@core/example/domain/policies/PasswordPolicy';

describe('PasswordPolicy', () => {
  describe('validate', () => {
    it('should succeed for valid password', () => {
      const result = PasswordPolicy.validate('ValidPass1!');

      expect(result.isSuccess).toBe(true);
    });

    it('should fail when password is too short', () => {
      const result = PasswordPolicy.validate('Short1!');

      expect(result.isFailure).toBe(true);
      if (!result.isFailure) throw new Error('Expected failure');
      expect(result.error).toBeInstanceOf(WeakPasswordError);
      expect(result.error.message).toContain('at least 8 characters');
    });

    it('should fail when password has no uppercase letter', () => {
      const result = PasswordPolicy.validate('lowercase1!');

      expect(result.isFailure).toBe(true);
      if (!result.isFailure) throw new Error('Expected failure');
      expect(result.error.message).toContain('uppercase letter');
    });

    it('should fail when password has no lowercase letter', () => {
      const result = PasswordPolicy.validate('UPPERCASE1!');

      expect(result.isFailure).toBe(true);
      if (!result.isFailure) throw new Error('Expected failure');
      expect(result.error.message).toContain('lowercase letter');
    });

    it('should fail when password has no digit', () => {
      const result = PasswordPolicy.validate('NoDigits!');

      expect(result.isFailure).toBe(true);
      if (!result.isFailure) throw new Error('Expected failure');
      expect(result.error.message).toContain('digit');
    });

    it('should fail when password has no special character', () => {
      const result = PasswordPolicy.validate('NoSpecial1');

      expect(result.isFailure).toBe(true);
      if (!result.isFailure) throw new Error('Expected failure');
      expect(result.error.message).toContain('special character');
    });
  });
});
