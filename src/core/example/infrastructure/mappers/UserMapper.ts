import type { User } from '../../domain/entities/User';
import type { CreateUserResponse } from '../../application/dtos/CreateUserDto';

export class UserMapper {
  public static toCreateUserResponse(user: User): CreateUserResponse {
    return {
      userId: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
