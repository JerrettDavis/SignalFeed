import { test, expect } from "@playwright/test";

test.describe("Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("opens and closes Explore sidebar", async ({ page }) => {
    // Open Explore sidebar
    await page.getByRole("button", { name: "Explore", exact: true }).click();

    // Check that Explore sidebar is visible by checking it has translate-x-0 class
    const exploreSidebar = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Explore Signals" });
    await expect(exploreSidebar).toHaveClass(/translate-x-0/);

    // Close with close button
    await page.getByRole("button", { name: "Close sidebar" }).first().click();
    await expect(exploreSidebar).toHaveClass(/-translate-x-full/);
  });

  test("opens and closes Report sidebar", async ({ page }) => {
    // Open Report sidebar (click desktop button, not FAB)
    await page
      .getByRole("button", { name: "Report", exact: true })
      .first()
      .click();

    // Check that Report sidebar is visible
    const reportSidebar = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Report a Signal" });
    await expect(reportSidebar).toHaveClass(/translate-x-0/);

    // Close with close button
    await page.getByRole("button", { name: "Close sidebar" }).nth(1).click();
    await expect(reportSidebar).toHaveClass(/-translate-x-full/);
  });

  test("opens and closes Geofences sidebar", async ({ page }) => {
    // Open Geofences sidebar
    await page.getByRole("button", { name: "Geofences", exact: true }).click();

    // Check that Geofences sidebar is visible
    const geofencesSidebar = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Geofences" });
    await expect(geofencesSidebar).toHaveClass(/translate-x-0/);

    // Close with close button
    await page.getByRole("button", { name: "Close sidebar" }).nth(2).click();
    await expect(geofencesSidebar).toHaveClass(/-translate-x-full/);
  });

  test("closes sidebar with ESC key", async ({ page }) => {
    // Open Explore sidebar
    await page.getByRole("button", { name: "Explore", exact: true }).click();

    const exploreSidebar = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Explore Signals" });
    await expect(exploreSidebar).toHaveClass(/translate-x-0/);

    // Close with ESC key
    await page.keyboard.press("Escape");
    await expect(exploreSidebar).toHaveClass(/-translate-x-full/);
  });

  test("switches between sidebars", async ({ page }) => {
    const exploreSidebar = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Explore Signals" });
    const reportSidebar = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Report a Signal" });
    const geofencesSidebar = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Geofences" });

    // Open Explore
    await page.getByRole("button", { name: "Explore", exact: true }).click();
    await expect(exploreSidebar).toHaveClass(/translate-x-0/);

    // Close Explore first, then open Report
    await page.getByRole("button", { name: "Close sidebar" }).first().click();
    await expect(exploreSidebar).toHaveClass(/-translate-x-full/);

    await page
      .getByRole("button", { name: "Report", exact: true })
      .first()
      .click();
    await expect(reportSidebar).toHaveClass(/translate-x-0/);

    // Close Report, then open Geofences
    await page.getByRole("button", { name: "Close sidebar" }).nth(1).click();
    await expect(reportSidebar).toHaveClass(/-translate-x-full/);

    await page.getByRole("button", { name: "Geofences", exact: true }).click();
    await expect(geofencesSidebar).toHaveClass(/translate-x-0/);
  });
});
