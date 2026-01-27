import type { User, UserId, UserRole, UserStatus } from "@/domain/users/user";

export type UserListFilters = {
  role?: UserRole;
  status?: UserStatus;
  search?: string; // Search by email or username
};

export type UserRepository = {
  // Basic CRUD
  getById: (id: UserId) => Promise<User | null>;
  getByEmail: (email: string) => Promise<User | null>;
  list: (filters?: UserListFilters) => Promise<User[]>;
  create: (user: User) => Promise<void>;
  update: (user: User) => Promise<void>;
  delete: (id: UserId) => Promise<void>;
  deleteMany: (ids: UserId[]) => Promise<void>;

  // Stats
  count: (filters?: UserListFilters) => Promise<number>;
};
