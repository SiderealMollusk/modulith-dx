import { describe, it, expect, beforeEach } from 'vitest';
import { CreateUserUseCase, UserAlreadyExistsError } from '@core/example/application/use-cases/CreateUserUseCase';
import { InMemoryUserRepository } from '@core/example/infrastructure/adapters/InMemoryUserRepository';
import { FixedClock } from '@shared/kernel/time';
import { InvalidEmailError } from '@core/example/domain/valueObjects/Email';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let repository: InMemoryUserRepository;
  let clock: FixedClock;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    clock = new FixedClock(new Date('2026-01-04T00:00:00Z'));
    useCase = new CreateUserUseCase(repository, clock);
  });

  it('should create a new user successfully', async () => {
    const result = await useCase.execute('test@example.com');

    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) throw result.error;
    expect(result.value.email).toBe('test@example.com');
    expect(result.value.isActive).toBe(true);
    expect(result.value.createdAt).toEqual(new Date('2026-01-04T00:00:00Z'));
  });

  it('should fail when email is invalid', async () => {
    const result = await useCase.execute('invalid-email');

    expect(result.isFailure).toBe(true);
    if (!result.isFailure) throw new Error('Expected failure');
    expect(result.error).toBeInstanceOf(InvalidEmailError);
  });

  it('should fail when user already exists', async () => {
    await useCase.execute('existing@example.com');
    const result = await useCase.execute('existing@example.com');

    expect(result.isFailure).toBe(true);
    if (!result.isFailure) throw new Error('Expected failure');
    expect(result.error).toBeInstanceOf(UserAlreadyExistsError);
    expect(result.error.message).toContain('existing@example.com');
  });

  it('should normalize email to lowercase', async () => {
    const result = await useCase.execute('TEST@EXAMPLE.COM');

    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) throw result.error;
    expect(result.value.email).toBe('test@example.com');
  });
});
