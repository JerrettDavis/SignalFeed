import { requireAuth } from "@/shared/auth-helpers";
import { sightingTypes, categories } from "@/data/taxonomy";
import { jsonOk, jsonBadRequest } from "@/shared/http";
import { z } from "zod";

export const runtime = "nodejs";

const CreateTypeSchema = z.object({
  id: z.string().min(1, "ID is required"),
  label: z.string().min(1, "Label is required"),
  categoryId: z.string().min(1, "Category is required"),
});

export const GET = async () => {
  await requireAuth();
  return jsonOk({ data: sightingTypes });
};

export const POST = async (request: Request) => {
  await requireAuth();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }

  const parsed = CreateTypeSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const { id, label, categoryId } = parsed.data;

  // Check if ID already exists
  if (sightingTypes.some((t) => t.id === id)) {
    return jsonBadRequest({
      message: "Type with this ID already exists.",
    });
  }

  // Check if category exists
  if (!categories.some((c) => c.id === categoryId)) {
    return jsonBadRequest({
      message: "Category does not exist.",
    });
  }

  // Add new type
  sightingTypes.push({ id, label, categoryId });

  return jsonOk({ data: { id, label, categoryId } });
};
