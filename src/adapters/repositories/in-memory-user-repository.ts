import type { User, UserId } from "@/domain/users/user";
import type { UserRepository, UserListFilters } from "@/ports/user-repository";

type Store = Map<string, User>;

const getStore = (): Store => {
  const globalAny = globalThis as { __sightsignal_users_store?: Store };
  if (!globalAny.__sightsignal_users_store) {
    globalAny.__sightsignal_users_store = new Map<string, User>();
  }
  return globalAny.__sightsignal_users_store;
};

export const inMemoryUserRepository = (): UserRepository => {
  const store = getStore();

  return {
    async getById(id: UserId): Promise<User | null> {
      return store.get(id) || null;
    },

    async getByEmail(email: string): Promise<User | null> {
      for (const user of store.values()) {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          return user;
        }
      }
      return null;
    },

    async list(filters?: UserListFilters): Promise<User[]> {
      let users = Array.from(store.values());

      if (filters) {
        // Filter by role
        if (filters.role) {
          users = users.filter((u) => u.role === filters.role);
        }

        // Filter by status
        if (filters.status) {
          users = users.filter((u) => u.status === filters.status);
        }

        // Search by email or username
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          users = users.filter(
            (u) =>
              u.email.toLowerCase().includes(searchLower) ||
              u.username?.toLowerCase().includes(searchLower)
          );
        }
      }

      // Sort by creation date (newest first)
      return users.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },

    async create(user: User): Promise<void> {
      store.set(user.id, user);
    },

    async update(user: User): Promise<void> {
      store.set(user.id, user);
    },

    async delete(id: UserId): Promise<void> {
      store.delete(id);
    },

    async deleteMany(ids: UserId[]): Promise<void> {
      for (const id of ids) {
        store.delete(id);
      }
    },

    async count(filters?: UserListFilters): Promise<number> {
      const users = await this.list(filters);
      return users.length;
    },
  };
};
