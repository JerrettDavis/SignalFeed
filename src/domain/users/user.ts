import { err, ok, type DomainError, type Result } from "@/shared/result";
import { type MembershipTier } from "./membership-tier";

export type UserId = string & { readonly __brand: "UserId" };

export type UserRole = "user" | "moderator" | "admin";
export type UserStatus = "active" | "suspended" | "banned";

export type User = {
  id: UserId;
  email: string;
  username?: string;
  role: UserRole;
  status: UserStatus;
  membershipTier: MembershipTier;
  createdAt: string;
  updatedAt: string;
};

export type NewUser = Omit<User, "id" | "createdAt" | "updatedAt" | "membershipTier"> & {
  membershipTier?: MembershipTier;
};
export type UpdateUser = Partial<Omit<NewUser, "email">>;

/**
 * Validates email format
 */
export const validateEmail = (email: string): Result<string, DomainError> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return err({
      code: "user.invalid_email",
      message: "Invalid email format.",
    });
  }
  return ok(email);
};

/**
 * Validates username format (3-30 alphanumeric chars, underscores, hyphens)
 */
export const validateUsername = (
  username: string
): Result<string, DomainError> => {
  if (username.length < 3 || username.length > 30) {
    return err({
      code: "user.invalid_username",
      message: "Username must be between 3 and 30 characters.",
    });
  }

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return err({
      code: "user.invalid_username",
      message:
        "Username can only contain letters, numbers, underscores, and hyphens.",
    });
  }

  return ok(username);
};

/**
 * Creates a new user with validation
 */
export const createUser = (
  id: string,
  data: NewUser
): Result<User, DomainError> => {
  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.ok) {
    return emailValidation;
  }

  // Validate username if provided
  if (data.username) {
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.ok) {
      return usernameValidation;
    }
  }

  const now = new Date().toISOString();

  return ok({
    id: id as UserId,
    email: data.email,
    username: data.username,
    role: data.role || "user",
    status: data.status || "active",
    membershipTier: data.membershipTier || "free",
    createdAt: now,
    updatedAt: now,
  });
};

/**
 * Updates an existing user with validation
 */
export const updateUser = (
  existing: User,
  updates: UpdateUser
): Result<User, DomainError> => {
  // Validate username if being updated
  if (updates.username !== undefined) {
    if (updates.username === "") {
      // Allow clearing username
      updates.username = undefined;
    } else {
      const usernameValidation = validateUsername(updates.username);
      if (!usernameValidation.ok) {
        return usernameValidation;
      }
    }
  }

  return ok({
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};
