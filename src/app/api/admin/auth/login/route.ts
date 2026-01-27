import { buildLogin } from "@/application/use-cases/auth/login";
import { envAdminRepository } from "@/adapters/auth/env-admin-repository";
import { jwtService } from "@/adapters/auth/jwt-service";
import { passwordService } from "@/adapters/auth/password-service";
import { jsonBadRequest, jsonOk } from "@/shared/http";
import { z } from "zod";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const login = buildLogin({
  repository: envAdminRepository(),
  jwtService: jwtService(),
  passwordService: passwordService(),
});

export const POST = async (request: Request) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }

  const parsed = LoginSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const result = await login(parsed.data);

  if (!result.ok) {
    return jsonBadRequest({ message: result.error.message });
  }

  // Set httpOnly cookie for security
  const cookieStore = await cookies();
  cookieStore.set("admin-token", result.value.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return jsonOk({
    success: true,
    username: result.value.username,
  });
};
