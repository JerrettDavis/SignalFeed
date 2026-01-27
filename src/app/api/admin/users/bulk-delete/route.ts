import { requireAuth } from "@/shared/auth-helpers";
import { jsonBadRequest, jsonOk } from "@/shared/http";
import { getUserRepository } from "@/adapters/repositories/repository-factory";
import { z } from "zod";
import type { UserId } from "@/domain/users/user";

const BulkDeleteRequestSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export const POST = async (request: Request) => {
  await requireAuth();

  const body = await request.json();
  const validation = BulkDeleteRequestSchema.safeParse(body);

  if (!validation.success) {
    return jsonBadRequest({
      message: "Invalid request body.",
      details: validation.error.format(),
    });
  }

  const userRepository = getUserRepository();
  const ids = validation.data.ids as UserId[];

  await userRepository.deleteMany(ids);

  return jsonOk({
    success: true,
    deletedCount: ids.length,
  });
};
