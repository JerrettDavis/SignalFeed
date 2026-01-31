import type {
  CredentialsRepository,
  UserCredentials,
} from "@/domain/auth/auth";
import type { UserId } from "@/domain/users/user";

type Store = Map<string, UserCredentials>;

const getStore = (): Store => {
  const globalAny = globalThis as { __sightsignal_credentials_store?: Store };
  if (!globalAny.__sightsignal_credentials_store) {
    globalAny.__sightsignal_credentials_store = new Map<
      string,
      UserCredentials
    >();
  }
  return globalAny.__sightsignal_credentials_store;
};

export class InMemoryCredentialsRepository implements CredentialsRepository {
  private store: Store;

  constructor() {
    this.store = getStore();
  }

  async create(credentials: UserCredentials): Promise<void> {
    this.store.set(credentials.id, credentials);
  }

  async getByEmail(email: string): Promise<UserCredentials | null> {
    for (const creds of this.store.values()) {
      if (creds.email.toLowerCase() === email.toLowerCase()) {
        return creds;
      }
    }
    return null;
  }

  async getByUserId(userId: UserId): Promise<UserCredentials | null> {
    return this.store.get(userId) || null;
  }

  async update(credentials: UserCredentials): Promise<void> {
    this.store.set(credentials.id, credentials);
  }

  async delete(userId: UserId): Promise<void> {
    this.store.delete(userId);
  }
}
