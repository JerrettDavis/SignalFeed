import { expect, test, type Page } from "@playwright/test";

type ClusterSummary = {
  zoom: number;
  clusterCount: number;
  maxClusterSize: number;
  totalClusteredPoints: number;
  visiblePointCount: number;
  clusters: Array<{
    count: number;
    lng: number;
    lat: number;
    radius: number;
  }>;
};

const observedAt = "2026-05-12T12:00:00.000Z";

const makeSighting = (
  id: string,
  lat: number,
  lng: number,
  importance: "low" | "normal" | "high" | "critical" = "normal"
) => ({
  id,
  typeId: "weather-alert",
  categoryId: "weather",
  location: { lat, lng },
  description: `Synthetic map clustering sighting ${id}`,
  importance,
  status: "active",
  observedAt,
  createdAt: observedAt,
  upvotes: 0,
  downvotes: 0,
  confirmations: 0,
  disputes: 0,
  spamReports: 0,
  score: 0,
  hotScore: 0,
});

const denseGrid = (
  prefix: string,
  center: { lat: number; lng: number },
  rows: number,
  cols: number,
  spacingDegrees: number
) => {
  const sightings = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      sightings.push(
        makeSighting(
          `${prefix}-${row}-${col}`,
          center.lat + (row - rows / 2) * spacingDegrees,
          center.lng + (col - cols / 2) * spacingDegrees,
          row % 5 === 0 ? "high" : "normal"
        )
      );
    }
  }
  return sightings;
};

const syntheticSightings = [
  ...denseGrid("chicago", { lat: 41.88, lng: -87.63 }, 8, 8, 0.006),
  ...denseGrid("milwaukee", { lat: 43.04, lng: -87.91 }, 5, 5, 0.008),
  ...Array.from({ length: 10 }, (_, index) =>
    makeSighting(
      `isolated-${index}`,
      39.5 + index * 0.65,
      -94 + index * 0.9,
      "low"
    )
  ),
];

const installSyntheticSightings = async (page: Page) => {
  await page.route("**/api/sightings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: syntheticSightings }),
    });
  });
};

const getClusterSummary = async (page: Page) =>
  page.evaluate(
    () =>
      (
        window as typeof window & {
          __signalFeedMapDebug?: {
            getClusterSummary: () => ClusterSummary | null;
          };
        }
      ).__signalFeedMapDebug?.getClusterSummary() ?? null
  );

const setMapZoom = async (page: Page, zoom: number) => {
  await page.evaluate(
    async ({ zoom }) => {
      const center: [number, number] = [-87.63, 41.88];
      await (
        window as typeof window & {
          __signalFeedMapDebug?: {
            setView: (view: {
              zoom: number;
              center: [number, number];
            }) => Promise<void>;
          };
        }
      ).__signalFeedMapDebug?.setView({ zoom, center });
    },
    { zoom }
  );
};

test("map clusters progressively split and reveal dots across zoom levels", async ({
  page,
}) => {
  await installSyntheticSightings(page);

  await page.goto("/");
  await page.locator("canvas.maplibregl-canvas").waitFor({ state: "visible" });
  await page
    .getByRole("button", { name: /got it/i })
    .click({ timeout: 3000 })
    .catch(() => {});
  await expect
    .poll(
      async () => (await getClusterSummary(page))?.totalClusteredPoints ?? 0
    )
    .toBeGreaterThan(0);

  const summaries: Record<string, ClusterSummary> = {};

  for (const zoom of [4, 6, 8, 10, 12, 14]) {
    await setMapZoom(page, zoom);
    await page.screenshot({
      path: `test-results/map-clustering-zoom-${zoom}.png`,
      fullPage: false,
    });
    const summary = await getClusterSummary(page);
    expect(summary, `cluster summary at zoom ${zoom}`).not.toBeNull();
    summaries[String(zoom)] = summary!;
  }

  expect(summaries["4"].maxClusterSize).toBeGreaterThan(35);
  expect(summaries["8"].maxClusterSize).toBeLessThan(
    summaries["4"].maxClusterSize
  );
  expect(summaries["10"].maxClusterSize).toBeLessThanOrEqual(
    summaries["8"].maxClusterSize
  );
  expect(summaries["10"].clusterCount).toBeLessThanOrEqual(8);
  expect(summaries["12"].totalClusteredPoints).toBeLessThan(
    summaries["4"].totalClusteredPoints
  );
  expect(summaries["12"].visiblePointCount).toBeGreaterThan(
    summaries["10"].visiblePointCount
  );
  expect(summaries["12"].clusterCount).toBeGreaterThan(0);
  expect(summaries["12"].clusterCount).toBeLessThanOrEqual(32);
  expect(summaries["12"].maxClusterSize).toBeLessThanOrEqual(8);
  expect(summaries["14"].maxClusterSize).toBeLessThanOrEqual(3);
  expect(summaries["14"].visiblePointCount).toBeGreaterThanOrEqual(
    summaries["12"].visiblePointCount
  );

  for (const zoom of ["10", "12", "14"]) {
    expect(
      summaries[zoom].clusters.filter((cluster) => cluster.count > 35),
      `oversized clusters should not survive at zoom ${zoom}`
    ).toHaveLength(0);
  }
});
