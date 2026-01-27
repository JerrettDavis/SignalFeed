import { cookies } from "next/headers";
import { jwtService } from "@/adapters/auth/jwt-service";
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
  const payload = await getAuthToken();

  if (!payload) {
    throw new Error("Unauthorized");
  }

  return payload;
};
