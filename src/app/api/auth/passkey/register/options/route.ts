import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getPasskeyRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk, jsonUnauthorized, jsonServerError } from "@/shared/http";
import { getVerifiedSession } from "@/shared/session";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const RP_NAME = "SignalFeed";
const RP_ID = process.env.NEXT_PUBLIC_RP_ID || "localhost";

// POST /api/auth/passkey/register/options
export const POST = async () => {
  try {
    const cookieStore = await cookies();
    const session = await getVerifiedSession(cookieStore);

    if (!session) {
      console.error("[Passkey Register Options] No valid session");
      return jsonUnauthorized("Must be logged in to register a passkey");
    }

    const passkeyRepo = getPasskeyRepository();
    const existingPasskeys = await passkeyRepo.listByUserId(session.userId);

    console.log(
      "[Passkey Register Options] Existing passkeys:",
      existingPasskeys.length
    );

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: session.email,
      userDisplayName: session.username || session.email,
      excludeCredentials: existingPasskeys.map((pk) => ({
        id: pk.id,
        transports: pk.transports as (
          | "usb"
          | "nfc"
          | "ble"
          | "internal"
          | "hybrid"
        )[],
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    console.log("[Passkey Register Options] Options generated successfully");

    const response = jsonOk({ data: options });
    response.cookies.set("passkey_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 5,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Passkey Register Options] Error:", error);
    return jsonServerError("Failed to generate registration options");
  }
};
