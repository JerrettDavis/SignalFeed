import { getPasskeyRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk, jsonUnauthorized } from "@/shared/http";
import { getVerifiedSession } from "@/shared/session";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// GET /api/auth/passkey/list
export const GET = async () => {
  try {
    const cookieStore = await cookies();
    const session = await getVerifiedSession(cookieStore);

    if (!session) {
      console.error("[Passkey List] No valid session");
      return jsonUnauthorized("Not authenticated");
    }

    const passkeyRepo = getPasskeyRepository();
    const passkeys = await passkeyRepo.listByUserId(session.userId);

    console.log("[Passkey List] Found passkeys:", passkeys.length);

    // Don't send sensitive data to client
    const safePasskeys = passkeys.map((pk) => ({
      id: pk.id,
      name: pk.name,
      createdAt: pk.createdAt,
      lastUsedAt: pk.lastUsedAt,
      transports: pk.transports,
    }));

    return jsonOk({ data: { passkeys: safePasskeys } });
  } catch (error) {
    console.error("[Passkey List] Error:", error);
    return jsonUnauthorized("Failed to list passkeys");
  }
};
