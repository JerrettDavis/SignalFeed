import { getTaxonomyRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk } from "@/shared/http";

export const runtime = "nodejs";

const taxonomyRepository = getTaxonomyRepository();

export const GET = async () => {
  const categories = await taxonomyRepository.getCategories();
  return jsonOk({ data: categories });
};
