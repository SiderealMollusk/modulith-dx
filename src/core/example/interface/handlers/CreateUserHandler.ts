import type { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import type { CreateUserRequest, CreateUserResponse } from '../../application/dtos/CreateUserDto';
import { UserMapper } from '../../infrastructure/mappers/UserMapper';

export class CreateUserHandler {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  public async handle(request: CreateUserRequest): Promise<CreateUserResponse> {
    const result = await this.createUserUseCase.execute(request.email);

    if (result.isFailure) {
      throw result.error;
    }

    return UserMapper.toCreateUserResponse(result.value);
  }
}
