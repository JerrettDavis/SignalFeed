import { jsonOk, jsonUnauthorized } from "@/shared/http";
import { getVerifiedSession } from "@/shared/session";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// GET /api/auth/me
export const GET = async () => {
  const cookieStore = await cookies();
  // Authoritative identity comes from the verified signed session token.
  const session = await getVerifiedSession(cookieStore);

  if (!session) {
    return jsonUnauthorized("Not authenticated");
  }

  return jsonOk({
    data: {
      user: {
        id: session.userId,
        email: session.email,
        username: session.username,
        role: session.role,
      },
    },
  });
};
