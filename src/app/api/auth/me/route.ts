import { jsonOk, jsonUnauthorized } from "@/shared/http";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// GET /api/auth/me
export const GET = async () => {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("session_data");

  if (!sessionData) {
    return jsonUnauthorized("Not authenticated");
  }

  try {
    const session = JSON.parse(sessionData.value);

    // Check if session expired
    if (new Date(session.expiresAt) < new Date()) {
      return jsonUnauthorized("Session expired");
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
  } catch (error) {
    console.error("Failed to parse session:", error);
    return jsonUnauthorized("Invalid session");
  }
};
