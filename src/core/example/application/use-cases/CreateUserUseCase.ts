import { failure, success, type Result } from '@shared/kernel/result';
import type { Clock } from '@shared/kernel/time';
import { User } from '../../domain/entities/User';
import { createEmail } from '../../domain/valueObjects/Email';
import type { UserRepository } from '../ports/UserRepository';
import { ApplicationError } from '@shared/kernel/errors';

export class UserAlreadyExistsError extends ApplicationError {
  constructor(email: string) {
    super(`User with email ${email} already exists`, 'USER_ALREADY_EXISTS', { email });
  }
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {}

  public async execute(
    email: string,
  ): Promise<Result<User, UserAlreadyExistsError | Error>> {
    const emailResult = createEmail(email);
    if (emailResult.isFailure) {
      return failure(emailResult.error);
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      return failure(new UserAlreadyExistsError(email));
    }

    const user = User.create(emailResult.value, this.clock.now());
    await this.userRepository.save(user);

    return success(user);
  }
}
