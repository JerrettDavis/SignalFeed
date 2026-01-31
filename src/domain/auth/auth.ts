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

/**
 * Hash password using Web Crypto API
 */
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + process.env.PASSWORD_SALT || "sightsignal-salt");
  
  // Use Node.js crypto for server-side
  if (typeof window === "undefined") {
    const crypto = await import("crypto");
    return crypto.createHash("sha256").update(password + (process.env.PASSWORD_SALT || "sightsignal-salt")).digest("hex");
  }
  
  // Use Web Crypto API for client-side (shouldn't happen, but fallback)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * Verify password against hash
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
};

/**
 * Generate a session token (simple implementation - use JWT in production)
 */
export const generateSessionToken = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
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
