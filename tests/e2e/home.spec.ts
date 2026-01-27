import { test, expect } from "@playwright/test";

test("home page loads and displays core UI elements", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Check header is visible
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "SightSignal", exact: true })
  ).toBeVisible();
  await expect(page.getByText("Local intelligence")).toBeVisible();

  // Check navigation buttons exist
  await expect(
    page.getByRole("button", { name: "Explore", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Report", exact: true }).first()
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Geofences", exact: true })
  ).toBeVisible();

  // Check map is displayed
  await expect(page.getByTestId("sightings-map")).toBeVisible();

  // Check welcome card is visible
  await expect(
    page.getByRole("heading", { name: "Welcome to SightSignal" })
  ).toBeVisible();
  await expect(page.getByText(/Share and track local sightings/)).toBeVisible();

  // Test opening a sidebar
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.waitForTimeout(300);

  const exploreSidebar = page
    .locator('[role="dialog"]')
    .filter({ hasText: "Explore Signals" });
  await expect(exploreSidebar).toHaveClass(/translate-x-0/);

  // Close sidebar
  await page.getByRole("button", { name: "Close sidebar" }).first().click();
  await expect(exploreSidebar).toHaveClass(/-translate-x-full/);
});
