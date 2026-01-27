import { getSignalRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk } from "@/shared/http";

export const runtime = "nodejs";

const signalRepository = getSignalRepository();

export const GET = async (_request: Request) => {
  // Get all active signals (no auth required for public signals)
  const signals = await signalRepository.list({ isActive: true });

  // TODO: Filter by visibility when that property is added to the domain model
  // For now, return all active signals

  return jsonOk({ data: signals });
};
