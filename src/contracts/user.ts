import { z } from "zod";

export const UserRoleSchema = z.enum(["user", "moderator", "admin"]);
export const UserStatusSchema = z.enum(["active", "suspended", "banned"]);

export const UpdateUserRequestSchema = z.object({
  username: z.string().min(3).max(30).optional().or(z.literal("")),
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
});

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
