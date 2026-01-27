import { SignJWT, jwtVerify } from "jose";
import type { JwtService, TokenPayload } from "@/ports/auth";

const getSecret = (): Uint8Array => {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET environment variable not set");
  }
  return new TextEncoder().encode(secret);
};

export const jwtService = (): JwtService => {
  return {
    async sign(payload) {
      const token = await new SignJWT(payload as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(getSecret());
      return token;
    },

    async verify(token) {
      try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as TokenPayload;
      } catch {
        return null;
      }
    },
  };
};
