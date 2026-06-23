import { SignJWT, jwtVerify } from "jose";
import type { AuthSession } from "@/domain/auth/auth";
import type { UserId } from "@/domain/users/user";

/**
 * Signed user-session handling.
 *
 * SECURITY: Authorization decisions must NEVER be derived from the
 * client-readable `session_data` cookie (it is attacker-controlled and can be
 * forged trivially). The httpOnly `session` cookie holds an HMAC-signed JWT
 * whose payload is the source of truth for the authenticated identity. Reads
 * that gate access go through {@link getVerifiedSession} / {@link verifySessionToken},
 * which reject any token that is missing, tampered with, or expired.
 */

export const SESSION_COOKIE = "session";
export const SESSION_DATA_COOKIE = "session_data";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionClaims = AuthSession & { [key: string]: unknown };

const getSecret = (): Uint8Array => {
  // Reuse the existing admin JWT secret if present; otherwise fall back to a
  // dedicated session secret. One of these must be configured in production.
  const secret = process.env.SESSION_JWT_SECRET || process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_JWT_SECRET (or ADMIN_JWT_SECRET) environment variable not set"
    );
  }
  return new TextEncoder().encode(secret);
};

/**
 * Create a signed session token (HMAC SHA-256) from a trusted server-built
 * AuthSession. Store the returned value in the httpOnly `session` cookie.
 */
export const createSessionToken = async (
  session: AuthSession
): Promise<string> => {
  return new SignJWT(session as SessionClaims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(session.expiresAt ?? "7d")
    .sign(getSecret());
};

/**
 * Verify a signed session token. Returns the trusted AuthSession on success,
 * or null if the token is absent, tampered with, or expired.
 */
export const verifySessionToken = async (
  token: string | undefined | null
): Promise<AuthSession | null> => {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.userId;
    const email = payload.email;
    if (typeof userId !== "string" || typeof email !== "string") {
      return null;
    }
    return {
      userId: userId as UserId,
      email,
      username:
        typeof payload.username === "string" ? payload.username : undefined,
      role: typeof payload.role === "string" ? payload.role : "user",
      expiresAt:
        typeof payload.expiresAt === "string"
          ? payload.expiresAt
          : new Date(((payload.exp as number) ?? 0) * 1000).toISOString(),
    };
  } catch {
    return null;
  }
};

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

/**
 * Read and verify the session from a cookie store (next/headers cookies() or
 * NextRequest.cookies). Returns the trusted AuthSession or null.
 */
export const getVerifiedSession = async (
  cookieStore: CookieReader
): Promise<AuthSession | null> => {
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
};

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
};

/**
 * Non-sensitive, client-readable view of the session for UI hydration only.
 * This value is NEVER trusted for authorization.
 */
export const sessionDataCookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
};
