import { requireAuth } from "@/shared/auth-helpers";
import { categories } from "@/data/taxonomy";
import { jsonOk, jsonBadRequest } from "@/shared/http";
import { z } from "zod";

export const runtime = "nodejs";

const CreateCategorySchema = z.object({
  id: z.string().min(1, "ID is required"),
  label: z.string().min(1, "Label is required"),
});

export const GET = async () => {
  await requireAuth();
  return jsonOk({ data: categories });
};

export const POST = async (request: Request) => {
  await requireAuth();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }

  const parsed = CreateCategorySchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const { id, label } = parsed.data;

  // Check if ID already exists
  if (categories.some((c) => c.id === id)) {
    return jsonBadRequest({
      message: "Category with this ID already exists.",
    });
  }

  // Add new category
  categories.push({ id, label });

  return jsonOk({ data: { id, label } });
};
