import { requireAuth } from "@/shared/auth-helpers";
import { jsonOk } from "@/shared/http";
import { getUserRepository } from "@/adapters/repositories/repository-factory";

export const GET = async (request: Request) => {
  await requireAuth();

  const { url } = request;
  const searchParams = new URL(url).searchParams;

  // Parse query parameters
  const role = searchParams.get("role") as
    | "user"
    | "moderator"
    | "admin"
    | null;
  const status = searchParams.get("status") as
    | "active"
    | "suspended"
    | "banned"
    | null;
  const search = searchParams.get("search");

  const userRepository = getUserRepository();

  const filters: Record<string, string> = {};
  if (role) filters.role = role;
  if (status) filters.status = status;
  if (search) filters.search = search;

  const users = await userRepository.list(filters);

  return jsonOk({ data: users });
};
