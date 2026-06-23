import { randomBytes } from "crypto";
import { err, ok, type DomainError, type Result } from "@/shared/result";
import type { UserId } from "@/domain/users/user";

export type UserCredentials = {
  id: UserId;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type NewUserCredentials = {
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  username?: string;
};

export type AuthSession = {
  userId: UserId;
  email: string;
  username?: string;
  role: string;
  expiresAt: string;
};

/**
 * Validates password strength
 * Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export const validatePassword = (
  password: string
): Result<string, DomainError> => {
  if (password.length < 8) {
    return err({
      code: "VALIDATION_ERROR",
      message: "Password must be at least 8 characters long",
    });
  }

  if (!/[A-Z]/.test(password)) {
    return err({
      code: "VALIDATION_ERROR",
      message: "Password must contain at least one uppercase letter",
    });
  }

  if (!/[a-z]/.test(password)) {
    return err({
      code: "VALIDATION_ERROR",
      message: "Password must contain at least one lowercase letter",
    });
  }

  if (!/[0-9]/.test(password)) {
    return err({
      code: "VALIDATION_ERROR",
      message: "Password must contain at least one number",
    });
  }

  return ok(password);
};

// Cost factor for bcrypt. 12 is a reasonable adaptive default for 2024+.
const BCRYPT_ROUNDS = 12;

/**
 * Hash a password using bcrypt (adaptive, salted).
 *
 * SECURITY: Uses a slow, salted, adaptive hash. Do NOT replace with a fast
 * unsalted digest (e.g. a single SHA-256) — those are trivially brute-forced.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

/**
 * Verify a password against a stored hash using a constant-time bcrypt compare.
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const bcrypt = (await import("bcryptjs")).default;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
};

/**
 * Generate a session token using a cryptographically secure random source.
 *
 * SECURITY: Must use crypto.randomBytes — never Math.random(), which is
 * predictable and unsuitable for security tokens.
 */
export const generateSessionToken = (): string => {
  return randomBytes(32).toString("hex");
};

/**
 * Create session data
 */
export const createSession = (
  userId: UserId,
  email: string,
  username: string | undefined,
  role: string
): AuthSession => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  return {
    userId,
    email,
    username,
    role,
    expiresAt: expiresAt.toISOString(),
  };
};

// Repository interface for credentials
export interface CredentialsRepository {
  create(credentials: UserCredentials): Promise<void>;
  getByEmail(email: string): Promise<UserCredentials | null>;
  getByUserId(userId: UserId): Promise<UserCredentials | null>;
  update(credentials: UserCredentials): Promise<void>;
  delete(userId: UserId): Promise<void>;
}
