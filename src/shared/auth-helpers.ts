import { cookies } from "next/headers";
import { jwtService } from "@/adapters/auth/jwt-service";
import { getVerifiedSession } from "@/shared/session";
import type { TokenPayload } from "@/ports/auth";
import type { AdminUserId } from "@/domain/auth/admin-user";

export const isAuthEnabled = (): boolean => {
  return process.env.ADMIN_AUTH_ENABLED !== "false";
};

export const getAuthToken = async (): Promise<TokenPayload | null> => {
  if (!isAuthEnabled()) {
    return {
      userId: "no-auth" as AdminUserId,
      username: "system",
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token) return null;

  const service = jwtService();
  return service.verify(token);
};

export const requireAuth = async (): Promise<TokenPayload> => {
  const accessResult = await getAdminAccess();

  if (!accessResult.isAdmin) {
    throw new Error("Unauthorized");
  }

  // Return a TokenPayload-compatible object
  // For session-based admin access, we use the email/username as a placeholder ID
  const userId = (accessResult.username ||
    accessResult.email ||
    "admin") as AdminUserId;

  return {
    userId,
    username: accessResult.username || accessResult.email || "admin",
  };
};

/**
 * Check if an email is in the admin accounts list
 */
export const isAdminEmail = (email: string): boolean => {
  const adminAccounts = process.env.ADMIN_ACCOUNTS || "";
  console.log("[isAdminEmail] Checking email:", email);
  console.log("[isAdminEmail] ADMIN_ACCOUNTS env:", adminAccounts);

  if (!adminAccounts) {
    console.log("[isAdminEmail] No ADMIN_ACCOUNTS configured");
    return false;
  }

  const adminEmails = adminAccounts
    .split(";")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  console.log("[isAdminEmail] Admin emails list:", adminEmails);
  const isAdmin = adminEmails.includes(email.toLowerCase());
  console.log("[isAdminEmail] Is admin?", isAdmin);

  return isAdmin;
};

/**
 * Check if the current user session has admin access
 * Either via admin token OR via email-based admin access
 */
export const getAdminAccess = async (): Promise<{
  isAdmin: boolean;
  username: string | null;
  email?: string;
}> => {
  console.log("[getAdminAccess] Starting admin access check...");

  // First, check for admin token (credential-based login)
  const adminToken = await getAuthToken();
  if (adminToken) {
    console.log("[getAdminAccess] Admin token found:", adminToken.username);
    return {
      isAdmin: true,
      username: adminToken.username,
    };
  }

  console.log("[getAdminAccess] No admin token, checking user session...");

  // Second, check for a regular user session with an admin email.
  // SECURITY: identity is taken from the server-verified signed session token,
  // never from the forgeable client-readable `session_data` cookie.
  const cookieStore = await cookies();
  const session = await getVerifiedSession(cookieStore);

  if (!session) {
    console.log("[getAdminAccess] No valid session");
    return { isAdmin: false, username: null };
  }

  // Check if user's email is in admin list
  if (session.email && isAdminEmail(session.email)) {
    return {
      isAdmin: true,
      username: session.username || session.email,
      email: session.email,
    };
  }

  return { isAdmin: false, username: null };
};
