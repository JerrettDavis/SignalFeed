import { z } from "zod";
import { PolygonSchema } from "@/contracts/geo";

export const SubscriptionTrustSchema = z.enum(["raw", "vetted", "all"]);

export const SubscriptionTargetSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("geofence"),
    geofenceId: z.string().min(1),
  }),
  z.object({
    kind: z.literal("polygon"),
    polygon: PolygonSchema,
  }),
]);

export const CreateSubscriptionRequestSchema = z.object({
  email: z.string().email(),
  target: SubscriptionTargetSchema,
  categoryIds: z.array(z.string()).optional(),
  typeIds: z.array(z.string()).optional(),
  trustLevel: SubscriptionTrustSchema.optional(),
});

export const UpdateSubscriptionRequestSchema = z.object({
  email: z.string().email().optional(),
  target: SubscriptionTargetSchema.optional(),
  categoryIds: z.array(z.string()).optional(),
  typeIds: z.array(z.string()).optional(),
  trustLevel: SubscriptionTrustSchema.optional(),
});

export const SubscriptionSchema = CreateSubscriptionRequestSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime(),
});

export type CreateSubscriptionRequest = z.infer<
  typeof CreateSubscriptionRequestSchema
>;
export type SubscriptionResponse = z.infer<typeof SubscriptionSchema>;
