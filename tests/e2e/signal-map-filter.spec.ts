import { expect, test } from "@playwright/test";

test("selected signal filters the map without showing a load error", async ({
  page,
}) => {
  const signalSightingsResponses: number[] = [];

  page.on("response", (response) => {
    if (
      response.url().includes("/api/signals/signal-all/sightings") &&
      response.request().method() === "GET"
    ) {
      signalSightingsResponses.push(response.status());
    }
  });

  await page.goto("/?view=signals");
  await page.locator("canvas.maplibregl-canvas").waitFor({ state: "visible" });

  await page
    .getByRole("button", { name: /All Sightings/i })
    .first()
    .click();

  await expect(
    page.getByText("Unable to load sightings", { exact: false })
  ).toHaveCount(0);
  await expect.poll(() => signalSightingsResponses.includes(200)).toBe(true);
});
