import type { Email } from '../../domain/valueObjects/Email';

export interface CreateUserRequest {
  email: string;
}

export interface CreateUserResponse {
  userId: string;
  email: Email;
  createdAt: Date;
}
