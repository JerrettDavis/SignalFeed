import { jsonOk } from "@/shared/http";

export const runtime = "nodejs";

// POST /api/auth/logout
export const POST = async () => {
  const response = jsonOk({ data: { message: "Logged out successfully" } });

  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("session_data", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
};
