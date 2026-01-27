import { z } from "zod";
import { PolygonSchema } from "@/contracts/geo";

// Trigger type schema
export const TriggerTypeSchema = z.enum([
  "new_sighting",
  "sighting_confirmed",
  "sighting_disputed",
  "score_threshold",
]);

// Signal target schema
export const SignalTargetSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("geofence"),
    geofenceId: z.string().min(1),
  }),
  z.object({
    kind: z.literal("polygon"),
    polygon: PolygonSchema,
  }),
  z.object({
    kind: z.literal("global"),
  }),
]);

// Reputation tier schema
export const ReputationTierSchema = z.enum([
  "unverified",
  "new",
  "trusted",
  "verified",
]);

// Sighting importance schema
export const SightingImportanceSchema = z.enum([
  "low",
  "normal",
  "high",
  "critical",
]);

// Signal conditions schema
export const SignalConditionsSchema = z.object({
  categoryIds: z.array(z.string()).optional(),
  typeIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  importance: z.array(SightingImportanceSchema).optional(),
  minTrustLevel: ReputationTierSchema.optional(),
  minScore: z.number().optional(),
  maxScore: z.number().optional(),
  operator: z.enum(["AND", "OR"]).optional(),
});

// Create signal request schema
export const CreateSignalRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  target: SignalTargetSchema,
  triggers: z.array(TriggerTypeSchema).min(1).max(10),
  conditions: SignalConditionsSchema.optional(),
  isActive: z.boolean().optional(),
});

// Update signal request schema
export const UpdateSignalRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  target: SignalTargetSchema.optional(),
  triggers: z.array(TriggerTypeSchema).min(1).max(10).optional(),
  conditions: SignalConditionsSchema.optional(),
  isActive: z.boolean().optional(),
});

// Signal response schema
export const SignalResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  ownerId: z.string(),
  target: SignalTargetSchema,
  triggers: z.array(TriggerTypeSchema),
  conditions: SignalConditionsSchema,
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Delivery method schema
export const DeliveryMethodSchema = z.enum(["email", "webhook", "push"]);

// Delivery config schemas
export const EmailDeliveryConfigSchema = z.object({
  method: z.literal("email"),
  email: z.string().email(),
});

export const WebhookDeliveryConfigSchema = z.object({
  method: z.literal("webhook"),
  url: z.string().url(),
  secret: z.string().optional(),
});

export const PushDeliveryConfigSchema = z.object({
  method: z.literal("push"),
  subscription: z.unknown(), // PushSubscription from browser
});

export const DeliveryConfigSchema = z.discriminatedUnion("method", [
  EmailDeliveryConfigSchema,
  WebhookDeliveryConfigSchema,
  PushDeliveryConfigSchema,
]);

// Subscribe request schema
export const SubscribeToSignalRequestSchema = z.object({
  deliveryMethod: DeliveryMethodSchema,
  deliveryConfig: DeliveryConfigSchema,
});

// Update subscription request schema
export const UpdateSubscriptionRequestSchema = z.object({
  isActive: z.boolean().optional(),
  deliveryConfig: DeliveryConfigSchema.optional(),
});

// Subscription response schema
export const SignalSubscriptionResponseSchema = z.object({
  id: z.string(),
  signalId: z.string(),
  userId: z.string(),
  deliveryMethod: DeliveryMethodSchema,
  deliveryConfig: DeliveryConfigSchema,
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Type exports
export type CreateSignalRequest = z.infer<typeof CreateSignalRequestSchema>;
export type UpdateSignalRequest = z.infer<typeof UpdateSignalRequestSchema>;
export type SignalResponse = z.infer<typeof SignalResponseSchema>;
export type SubscribeToSignalRequest = z.infer<
  typeof SubscribeToSignalRequestSchema
>;
export type UpdateSubscriptionRequest = z.infer<
  typeof UpdateSubscriptionRequestSchema
>;
export type SignalSubscriptionResponse = z.infer<
  typeof SignalSubscriptionResponseSchema
>;
export type DeliveryMethod = z.infer<typeof DeliveryMethodSchema>;
export type DeliveryConfig = z.infer<typeof DeliveryConfigSchema>;
