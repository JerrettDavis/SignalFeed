export const runtime = "nodejs";

export const GET = async () => {
  return Response.json({
    ADMIN_AUTH_ENABLED: process.env.ADMIN_AUTH_ENABLED,
    ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET ? "***set***" : "NOT SET",
    ADMIN_USERS: process.env.ADMIN_USERS
      ? process.env.ADMIN_USERS.substring(0, 30) + "..."
      : "NOT SET",
  });
};
