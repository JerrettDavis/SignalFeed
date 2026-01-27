import { getTaxonomyRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk } from "@/shared/http";
import type { CategoryId, SubcategoryId } from "@/domain/taxonomy/taxonomy";

export const runtime = "nodejs";

const taxonomyRepository = getTaxonomyRepository();

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("categoryId");
  const subcategoryId = url.searchParams.get("subcategoryId");
  const tagsParam = url.searchParams.get("tags");

  const tags = tagsParam
    ? tagsParam.split(",").map((t) => t.trim())
    : undefined;

  const types = await taxonomyRepository.getTypes({
    categoryId: categoryId as CategoryId | undefined,
    subcategoryId: subcategoryId as SubcategoryId | undefined,
    tags,
  });

  return jsonOk({ data: types });
};
