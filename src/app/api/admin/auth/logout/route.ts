import { cookies } from "next/headers";
import { jsonOk } from "@/shared/http";

export const runtime = "nodejs";

export const POST = async () => {
  const cookieStore = await cookies();

  // Delete both admin token and user session cookies
  cookieStore.delete("admin-token");
  cookieStore.delete("session");
  cookieStore.delete("session_data");

  return jsonOk({ success: true });
};
