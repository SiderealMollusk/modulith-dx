import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryUserRepository } from '@core/example/infrastructure/adapters/InMemoryUserRepository';
import { User } from '@core/example/domain/entities/User';
import { createEmail } from '@core/example/domain/valueObjects/Email';
import { fromString } from '@shared/kernel/id';

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
  });

  describe('save and findById', () => {
    it('should save and retrieve a user by id', async () => {
      const emailResult = createEmail('test@example.com');
      if (!emailResult.isSuccess) throw emailResult.error;
      const user = User.create(emailResult.value);

      await repository.save(user);
      const found = await repository.findById(user.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(user.id);
      expect(found?.email).toBe(user.email);
    });

    it('should return null when user not found by id', async () => {
      const found = await repository.findById(fromString('non-existent-id'));

      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const emailResult = createEmail('test@example.com');
      if (!emailResult.isSuccess) throw emailResult.error;
      const user = User.create(emailResult.value);

      await repository.save(user);
      const found = await repository.findByEmail('test@example.com');

      expect(found).not.toBeNull();
      expect(found?.email).toBe('test@example.com');
    });

    it('should return null when user not found by email', async () => {
      const found = await repository.findByEmail('nonexistent@example.com');

      expect(found).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const emailResult = createEmail('test@example.com');
      if (!emailResult.isSuccess) throw emailResult.error;
      const user = User.create(emailResult.value);

      await repository.save(user);
      await repository.delete(user.id);
      const found = await repository.findById(user.id);

      expect(found).toBeNull();
    });
  });
});
