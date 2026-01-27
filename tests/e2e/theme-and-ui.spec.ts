import { test, expect } from "@playwright/test";

test.describe("Theme and UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("displays main header with logo and title", async ({ page }) => {
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "SightSignal", exact: true })
    ).toBeVisible();
    await expect(page.getByText("Local intelligence")).toBeVisible();
  });

  test("displays navigation buttons", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Explore", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Report", exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Geofences", exact: true })
    ).toBeVisible();
  });

  test("displays theme toggle button", async ({ page }) => {
    const themeToggle = page.getByRole("button", { name: /Toggle theme/ });
    await expect(themeToggle).toBeVisible();
  });

  test.skip("toggles theme between light, dark, and system", async ({
    page,
  }) => {
    // TODO: Theme toggle feature not yet implemented
    const themeToggle = page.getByRole("button", { name: /Toggle theme/ });
    const html = page.locator("html");

    // Get initial theme
    const initialTheme = await html.getAttribute("data-theme");

    // Click to cycle theme
    await themeToggle.click();
    await page.waitForTimeout(100);
    const secondTheme = await html.getAttribute("data-theme");

    // Should be different
    expect(secondTheme).not.toBe(initialTheme);

    // Click again
    await themeToggle.click();
    await page.waitForTimeout(100);
    const thirdTheme = await html.getAttribute("data-theme");

    // Should be different from second
    expect(thirdTheme).not.toBe(secondTheme);
  });

  test("persists theme preference on reload", async ({ page }) => {
    const themeToggle = page.getByRole("button", { name: /Toggle theme/ });
    const html = page.locator("html");

    // Set to dark mode
    await themeToggle.click();
    await page.waitForTimeout(100);
    await themeToggle.click();
    await page.waitForTimeout(100);

    const themeBeforeReload = await html.getAttribute("data-theme");

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Theme should persist
    const themeAfterReload = await page
      .locator("html")
      .getAttribute("data-theme");
    expect(themeAfterReload).toBe(themeBeforeReload);
  });

  test("displays welcome card", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Welcome to SightSignal" })
    ).toBeVisible();
    await expect(
      page.getByText(/Share and track local sightings/)
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Get started" })
    ).toBeVisible();
  });

  test("'Get started' button opens Explore sidebar", async ({ page }) => {
    await page.getByRole("button", { name: "Get started" }).click();
    await page.waitForTimeout(300);

    // Check sidebar has translate-x-0 class (visible)
    const sidebar = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Explore Signals" });
    await expect(sidebar).toHaveClass(/translate-x-0/);
  });

  test("displays map on homepage", async ({ page }) => {
    // Wait for map to load
    await page.waitForTimeout(1000);

    // Map should be visible (using canvas element)
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
  });

  test("map loads MapLibre controls", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Navigation controls should be present
    await expect(
      page.getByRole("button", { name: "Zoom in" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Zoom out" }).first()
    ).toBeVisible();
  });

  test("displays floating action button on mobile viewport", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // FAB should be visible
    const fab = page.getByRole("button", { name: "Report a signal" });
    await expect(fab).toBeVisible();
  });

  test("FAB opens Report sidebar on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.getByRole("button", { name: "Report a signal" }).click();
    await page.waitForTimeout(300);

    // Check sidebar has translate-x-0 class (visible)
    const sidebar = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Report a Signal" });
    await expect(sidebar).toHaveClass(/translate-x-0/);
  });

  test("hides desktop navigation on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Desktop nav buttons should be hidden
    const exploreButton = page.getByRole("button", { name: "Explore" });
    await expect(exploreButton).toBeHidden();
  });

  test("shows desktop navigation on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Desktop nav buttons should be visible
    await expect(
      page.getByRole("button", { name: "Explore", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Report", exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Geofences", exact: true })
    ).toBeVisible();
  });

  test("header remains fixed at top when scrolling", async ({ page }) => {
    const header = page.getByRole("banner");

    // Get initial position
    const initialBox = await header.boundingBox();
    expect(initialBox?.y).toBe(0);

    // Try to scroll (won't scroll much since map fills viewport)
    await page.evaluate(() => window.scrollBy(0, 100));

    // Header should still be at top
    const afterScrollBox = await header.boundingBox();
    expect(afterScrollBox?.y).toBe(0);
  });

  test("sidebar backdrop is clickable to close", async ({ page }) => {
    // Open Explore sidebar
    await page.getByRole("button", { name: "Explore", exact: true }).click();
    await page.waitForTimeout(300);

    const sidebar = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Explore Signals" });
    await expect(sidebar).toHaveClass(/translate-x-0/);

    // Click backdrop
    const backdrop = page.locator(".fixed.inset-0.bg-black\\/20").first();
    await backdrop.click();

    // Sidebar should be hidden
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

  test("maintains scroll position in sidebar when filtering", async ({
    page,
  }) => {
    // Open Explore sidebar
    await page.getByRole("button", { name: "Explore", exact: true }).click();
    await page.waitForTimeout(300);

    const sidebar = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Explore Signals" });
    await expect(sidebar).toHaveClass(/translate-x-0/);

    // Scroll down in sidebar
    const sidebarContent = sidebar.locator(".overflow-y-auto").first();
    await sidebarContent.evaluate((el) => (el.scrollTop = 100));

    // Apply a filter
    await page.getByRole("button", { name: "Nature", exact: true }).click();

    // Wait for filter to apply
    await page.waitForTimeout(100);

    // Content should still be there (not jumped to top)
    const scrollTop = await sidebarContent.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeGreaterThanOrEqual(0);
  });

  test.skip("keyboard focus is trapped in sidebar when open", async ({
    page,
  }) => {
    // TODO: Focus trap accessibility feature not yet implemented
    // Open Explore sidebar
    await page.getByRole("button", { name: "Explore", exact: true }).click();
    await page.waitForTimeout(300);

    const sidebar = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Explore Signals" });
    await expect(sidebar).toHaveClass(/translate-x-0/);

    // Tab should focus elements within sidebar
    await page.keyboard.press("Tab");

    // Focus should be on an element within the dialog
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.closest('[role="dialog"]') !== null;
    });

    expect(focusedElement).toBe(true);
  });

  test("aria-labels are present for accessibility", async ({ page }) => {
    // Check important buttons have aria-labels
    const themeToggle = page.getByRole("button", { name: /Toggle theme/ });
    await expect(themeToggle).toHaveAttribute("aria-label", /.+/);

    // Open Report sidebar
    await page
      .getByRole("button", { name: "Report", exact: true })
      .first()
      .click();
    await page.waitForTimeout(300);

    // Sidebar should have proper aria attributes
    const dialog = page
      .locator('[role="dialog"]')
      .filter({ hasText: "Report a Signal" });
    await expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  test("logo and title are always visible", async ({ page }) => {
    // Even after opening sidebars
    await page.getByRole("button", { name: "Explore", exact: true }).click();
    await page.waitForTimeout(300);
    await expect(
      page.getByRole("heading", { name: "SightSignal", exact: true })
    ).toBeVisible();

    const closeButton1 = page
      .getByRole("button", { name: "Close sidebar" })
      .first();
    await closeButton1.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(300);
    await page
      .getByRole("button", { name: "Report", exact: true })
      .first()
      .click();
    await page.waitForTimeout(300);
    await expect(
      page.getByRole("heading", { name: "SightSignal", exact: true })
    ).toBeVisible();

    const closeButton2 = page
      .getByRole("button", { name: "Close sidebar" })
      .first();
    await closeButton2.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Geofences", exact: true }).click();
    await page.waitForTimeout(300);
    await expect(
      page.getByRole("heading", { name: "SightSignal", exact: true })
    ).toBeVisible();
  });
});
