import { z } from "zod";
import { PolygonSchema } from "@/contracts/geo";

export const GeofenceVisibilitySchema = z.enum(["public", "private"]);

export const CreateGeofenceRequestSchema = z.object({
  name: z.string().min(1).max(80),
  polygon: PolygonSchema,
  visibility: GeofenceVisibilitySchema,
  ownerId: z.string().optional(),
});

export const UpdateGeofenceRequestSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  polygon: PolygonSchema.optional(),
  visibility: GeofenceVisibilitySchema.optional(),
  ownerId: z.string().optional(),
});

export const GeofenceSchema = CreateGeofenceRequestSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime(),
});

export type CreateGeofenceRequest = z.infer<typeof CreateGeofenceRequestSchema>;
export type GeofenceResponse = z.infer<typeof GeofenceSchema>;
