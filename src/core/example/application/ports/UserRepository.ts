import type { User } from '../../domain/entities/User';
import type { UserId } from '../../domain/valueObjects/UserId';

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  delete(id: UserId): Promise<void>;
}
