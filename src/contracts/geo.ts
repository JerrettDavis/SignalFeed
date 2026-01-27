import { z } from "zod";

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const PolygonSchema = z.object({
  points: z.array(LatLngSchema).min(3),
});

export type LatLngContract = z.infer<typeof LatLngSchema>;
export type PolygonContract = z.infer<typeof PolygonSchema>;
