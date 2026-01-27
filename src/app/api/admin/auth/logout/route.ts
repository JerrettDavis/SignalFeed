import { cookies } from "next/headers";
import { jsonOk } from "@/shared/http";

export const runtime = "nodejs";

export const POST = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("admin-token");
  return jsonOk({ success: true });
};
