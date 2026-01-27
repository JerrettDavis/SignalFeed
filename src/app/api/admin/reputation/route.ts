import { requireAuth } from "@/shared/auth-helpers";
import { buildGetReputationLeaderboard } from "@/application/use-cases/reputation/get-reputation-leaderboard";
import { getReputationRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk } from "@/shared/http";

export const runtime = "nodejs";

export const GET = async (request: Request) => {
  await requireAuth();

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const repository = getReputationRepository();
  const getLeaderboard = buildGetReputationLeaderboard({ repository });

  const result = await getLeaderboard(limit);

  if (!result.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch leaderboard" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return jsonOk({ data: result.value });
};
