import type { User } from '../../domain/entities/User';
import type { UserRepository } from '../../application/ports/UserRepository';
import type { UserId } from '../../domain/valueObjects/UserId';

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  public async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  public async findById(id: UserId): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  public async delete(id: UserId): Promise<void> {
    this.users.delete(id);
  }

  public clear(): void {
    this.users.clear();
  }
}
