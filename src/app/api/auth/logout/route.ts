import { jsonOk } from "@/shared/http";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// POST /api/auth/logout
export const POST = async () => {
  const cookieStore = await cookies();

  // Delete session cookies
  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  cookieStore.set("session_data", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return jsonOk({ data: { message: "Logged out successfully" } });
};
