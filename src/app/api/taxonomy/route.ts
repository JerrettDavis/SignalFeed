import { buildGetTaxonomy } from "@/application/use-cases/taxonomy/get-taxonomy";
import { getTaxonomyRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk } from "@/shared/http";

export const runtime = "nodejs";

const taxonomyRepository = getTaxonomyRepository();
const getTaxonomy = buildGetTaxonomy({ repository: taxonomyRepository });

export const GET = async () => {
  const result = await getTaxonomy();

  if (!result.ok) {
    return jsonOk({ data: result.error });
  }

  return jsonOk({ data: result.value });
};
