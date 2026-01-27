import { getTaxonomyRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk } from "@/shared/http";
import type { CategoryId } from "@/domain/taxonomy/taxonomy";

export const runtime = "nodejs";

const taxonomyRepository = getTaxonomyRepository();

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("categoryId");

  const subcategories = await taxonomyRepository.getSubcategories(
    categoryId as CategoryId | undefined
  );

  return jsonOk({ data: subcategories });
};
