import { getAuthToken } from "@/shared/auth-helpers";
import { jsonOk, jsonUnauthorized } from "@/shared/http";

export const runtime = "nodejs";

export const GET = async () => {
  const payload = await getAuthToken();

  if (!payload) {
    return jsonUnauthorized("Not authenticated.");
  }

  return jsonOk({
    authenticated: true,
    username: payload.username,
  });
};
