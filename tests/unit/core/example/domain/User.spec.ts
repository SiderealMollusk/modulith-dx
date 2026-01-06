import { describe, it, expect, beforeEach, vi } from 'vitest';
import { User } from '@core/example/domain/entities/User';
import { createEmail } from '@core/example/domain/valueObjects/Email';

describe('User Entity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('create', () => {
    it('should create a new user with valid email', () => {
      const emailResult = createEmail('test@example.com');
      expect(emailResult.isSuccess).toBe(true);
      if (!emailResult.isSuccess) throw emailResult.error;

      const user = User.create(emailResult.value);

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('changeEmail', () => {
    it('should update email and updatedAt timestamp', () => {
      const now = new Date('2026-01-04T00:00:00Z');
      vi.setSystemTime(now);
      const initialEmailResult = createEmail('initial@example.com');
      if (!initialEmailResult.isSuccess) throw initialEmailResult.error;
      const user = User.create(initialEmailResult.value);
      const initialUpdatedAt = user.updatedAt;

      vi.setSystemTime(new Date('2026-01-04T00:00:01Z'));
      const newEmailResult = createEmail('new@example.com');
      if (!newEmailResult.isSuccess) throw newEmailResult.error;
      user.changeEmail(newEmailResult.value);

      expect(user.email).toBe('new@example.com');
      expect(user.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', () => {
      const emailResult = createEmail('test@example.com');
      if (!emailResult.isSuccess) throw emailResult.error;
      const user = User.create(emailResult.value);

      user.deactivate();

      expect(user.isActive).toBe(false);
    });
  });

  describe('activate', () => {
    it('should set isActive to true', () => {
      const emailResult = createEmail('test@example.com');
      if (!emailResult.isSuccess) throw emailResult.error;
      const user = User.create(emailResult.value);

      user.deactivate();
      user.activate();

      expect(user.isActive).toBe(true);
    });
  });
});
