import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import {
  getPasskeyRepository,
  getUserRepository,
} from "@/adapters/repositories/repository-factory";
import { createSession } from "@/domain/auth/auth";
import {
  jsonOk,
  jsonBadRequest,
  jsonUnauthorized,
  jsonServerError,
} from "@/shared/http";
import {
  createSessionToken,
  sessionCookieOptions,
  sessionDataCookieOptions,
} from "@/shared/session";
import { cookies } from "next/headers";
import { z } from "zod";
import type { PasskeyId } from "@/domain/auth/passkey";
import type { UserId } from "@/domain/users/user";

export const runtime = "nodejs";

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";

const CredentialSchema = z.object({
  credential: z.object({ id: z.string().min(1) }).passthrough(),
});

// POST /api/auth/passkey/login/verify
export const POST = async (request: Request) => {
  try {
    const cookieStore = await cookies();
    const challengeCookie = cookieStore.get("passkey_auth_challenge");
    const userIdCookie = cookieStore.get("passkey_auth_user_id");

    if (!challengeCookie || !userIdCookie) {
      return jsonBadRequest("No challenge found");
    }

    const body = await request.json();

    // Validate the shape of the client-supplied credential before use. The raw
    // credential object is still passed to the cryptographic verifier below,
    // but branch decisions use the validated id.
    const parsed = CredentialSchema.safeParse(body);
    if (!parsed.success) {
      return jsonBadRequest("Missing credential");
    }
    const credential = body.credential;
    const validatedCredentialId = parsed.data.credential.id;

    const userId = userIdCookie.value as UserId;
    const credentialId = validatedCredentialId as PasskeyId;

    const passkeyRepo = getPasskeyRepository();
    const passkey = await passkeyRepo.getById(credentialId);

    if (!passkey || passkey.userId !== userId) {
      return jsonUnauthorized("Invalid passkey");
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeCookie.value,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: passkey.id,
        publicKey: new Uint8Array(
          passkey.credentialPublicKey
        ) as Uint8Array<ArrayBuffer>,
        counter: passkey.counter,
        transports: passkey.transports as (
          | "usb"
          | "nfc"
          | "ble"
          | "internal"
          | "hybrid"
        )[],
      },
    });

    if (!verification.verified) {
      return jsonUnauthorized("Verification failed");
    }

    await passkeyRepo.updateCounter(
      passkey.id,
      verification.authenticationInfo.newCounter
    );
    await passkeyRepo.updateLastUsed(passkey.id, new Date().toISOString());

    const userRepo = getUserRepository();
    const user = await userRepo.getById(userId);

    if (!user || user.status !== "active") {
      return jsonUnauthorized("Account not active");
    }

    const session = createSession(
      user.id,
      user.email,
      user.username,
      user.role
    );
    const sessionToken = await createSessionToken(session);

    const response = jsonOk({
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      },
    });

    response.cookies.set("session", sessionToken, sessionCookieOptions);
    response.cookies.set(
      "session_data",
      JSON.stringify(session),
      sessionDataCookieOptions
    );

    response.cookies.delete("passkey_auth_challenge");
    response.cookies.delete("passkey_auth_user_id");

    return response;
  } catch (error) {
    console.error("Error verifying passkey auth:", error);
    return jsonServerError("Failed to verify");
  }
};
