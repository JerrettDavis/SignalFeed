import { describe, expect, it } from "vitest";
import {
  mapSignalSightingRow,
  type SightingRow,
} from "./signal-sighting-matches";

const baseRow = {
  id: "sighting-1",
  type_id: "type-earthquake",
  category_id: "cat-emergency",
  description: "M 4.3 - test earthquake",
  details: null,
  importance: "normal",
  status: "active",
  observed_at: "2026-05-11T02:27:44.485Z",
  created_at: "2026-05-12T00:48:37.643Z",
  fields: {},
  reporter_id: "system-usgs",
  upvotes: 0,
  downvotes: 0,
  confirmations: 0,
  disputes: 0,
  spam_reports: 0,
  score: 0,
  hot_score: 0,
} satisfies Omit<SightingRow, "location">;

describe("mapSignalSightingRow", () => {
  it("normalizes serialized postgres JSON locations", () => {
    const sighting = mapSignalSightingRow({
      ...baseRow,
      location: '{"lat":41.146,"lng":142.3161}',
    });

    expect(sighting.location).toEqual({ lat: 41.146, lng: 142.3161 });
  });
});
