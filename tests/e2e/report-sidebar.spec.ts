import { test, expect } from "@playwright/test";

test.describe("Report Sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open Report sidebar - use .first() to avoid strict mode violation (desktop nav + FAB)
    await page
      .getByRole("button", { name: "Report", exact: true })
      .first()
      .click();
    await page.waitForTimeout(300); // Wait for animation
  });

  test("displays all form fields", async ({ page }) => {
    // Category and Type
    await expect(
      page.getByRole("combobox", { name: "Category" })
    ).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Type" })).toBeVisible();

    // Description (required)
    await expect(page.getByTestId("report-description")).toBeVisible();

    // Details (optional)
    await expect(page.getByRole("textbox", { name: "Details" })).toBeVisible();

    // Importance
    await expect(
      page.getByRole("combobox", { name: "Importance" })
    ).toBeVisible();

    // Observed at
    await expect(
      page.getByRole("textbox", { name: "Observed at" })
    ).toBeVisible();

    // Location
    await expect(page.getByTestId("report-lat")).toBeVisible();
    await expect(page.getByTestId("report-lng")).toBeVisible();

    // Custom fields
    await expect(
      page.getByRole("textbox", { name: "Custom field key" })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Custom field value" })
    ).toBeVisible();

    // Submit button
    await expect(page.getByTestId("report-submit")).toBeVisible();
  });

  test("updates types when category changes", async ({ page }) => {
    const categorySelect = page.getByRole("combobox", { name: "Category" });
    const typeSelect = page.getByRole("combobox", { name: "Type" });

    // Select Nature category
    await categorySelect.selectOption("cat-nature");
    await expect(typeSelect).toHaveValue("type-birds");

    // Check that type options are appropriate for Nature
    const typeOptions = await typeSelect.locator("option").allTextContents();
    expect(typeOptions).toContain("Birds");
    expect(typeOptions).toContain("Wildlife");

    // Select Public Safety category
    await categorySelect.selectOption("cat-public-safety");

    // Type should update to first option in Public Safety
    const newTypeValue = await typeSelect.inputValue();
    expect(newTypeValue).toBeTruthy();
  });

  test("validates required description field", async ({ page }) => {
    // Leave description empty and try to submit
    await page.getByTestId("report-lat").fill("37.8042");
    await page.getByTestId("report-lng").fill("-122.4087");

    // Click submit without description
    await page.getByTestId("report-submit").click();

    // Browser validation should prevent submission
    const description = page.getByTestId("report-description");
    const isRequired = await description.evaluate(
      (el) => (el as HTMLInputElement).required
    );
    expect(isRequired).toBe(true);
  });

  test("submits a sighting successfully", async ({ page }) => {
    // Fill out the form
    await page
      .getByRole("combobox", { name: "Category" })
      .selectOption("cat-nature");
    await page
      .getByRole("combobox", { name: "Type" })
      .selectOption("type-birds");
    await page
      .getByTestId("report-description")
      .fill("Test bird sighting from E2E");
    await page
      .getByRole("textbox", { name: "Details" })
      .fill("Beautiful blue heron");
    await page
      .getByRole("combobox", { name: "Importance" })
      .selectOption("normal");
    await page.getByTestId("report-lat").fill("37.8042");
    await page.getByTestId("report-lng").fill("-122.4087");

    // Wait for POST request
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/sightings") &&
        response.request().method() === "POST"
    );

    // Submit
    await page.getByTestId("report-submit").click();
    const response = await responsePromise;

    // Verify success
    expect(response.ok()).toBe(true);
    await expect(page.getByText("Submitted successfully")).toBeVisible();
  });

  test("clears form after successful submission", async ({ page }) => {
    // Fill and submit
    await page.getByTestId("report-description").fill("Test sighting");
    await page.getByRole("textbox", { name: "Details" }).fill("Test details");
    await page.getByTestId("report-lat").fill("37.8042");
    await page.getByTestId("report-lng").fill("-122.4087");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/sightings") &&
        response.request().method() === "POST"
    );

    await page.getByTestId("report-submit").click();
    await responsePromise;
    await expect(page.getByText("Submitted successfully")).toBeVisible();

    // Verify fields are cleared
    await expect(page.getByTestId("report-description")).toHaveValue("");
    await expect(page.getByRole("textbox", { name: "Details" })).toHaveValue(
      ""
    );
  });

  test("shows error for invalid coordinates", async ({ page }) => {
    await page.getByTestId("report-description").fill("Test sighting");
    await page.getByTestId("report-lat").fill("invalid");
    await page.getByTestId("report-lng").fill("not-a-number");

    await page.getByTestId("report-submit").click();

    // Should show error message
    await expect(
      page.getByText("Please check inputs and try again")
    ).toBeVisible();
  });

  test("uses custom field when provided", async ({ page }) => {
    await page.getByTestId("report-description").fill("Test event");
    await page.getByTestId("report-lat").fill("37.8042");
    await page.getByTestId("report-lng").fill("-122.4087");
    await page
      .getByRole("textbox", { name: "Custom field key" })
      .fill("organizer");
    await page
      .getByRole("textbox", { name: "Custom field value" })
      .fill("Test Organization");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/sightings") &&
        response.request().method() === "POST"
    );

    await page.getByTestId("report-submit").click();
    const response = await responsePromise;

    // Verify request includes custom field
    const requestBody = JSON.parse(
      (await response.request().postData()) || "{}"
    );
    expect(requestBody.fields).toEqual({ organizer: "Test Organization" });
  });

  test("disables submit button while saving", async ({ page }) => {
    await page.getByTestId("report-description").fill("Test sighting");
    await page.getByTestId("report-lat").fill("37.8042");
    await page.getByTestId("report-lng").fill("-122.4087");

    // Start submission
    const submitButton = page.getByTestId("report-submit");
    await submitButton.click();

    // Button should show "Submitting..." and be disabled
    await expect(submitButton).toHaveText("Submitting...");
    await expect(submitButton).toBeDisabled();
  });

  test("'Use my location' button triggers geolocation", async ({ page }) => {
    // Grant geolocation permission
    await page.context().grantPermissions(["geolocation"]);
    await page
      .context()
      .setGeolocation({ latitude: 37.7749, longitude: -122.4194 });

    // Click "Use my location"
    await page.getByRole("button", { name: "Use my location" }).click();

    // Wait for fields to be populated
    await page.waitForTimeout(500);

    // Verify coordinates are filled
    const lat = await page.getByTestId("report-lat").inputValue();
    const lng = await page.getByTestId("report-lng").inputValue();

    expect(parseFloat(lat)).toBeCloseTo(37.7749, 2);
    expect(parseFloat(lng)).toBeCloseTo(-122.4194, 2);
  });

  test("validates latitude/longitude are numbers", async ({ page }) => {
    await page.getByTestId("report-description").fill("Test");
    await page.getByTestId("report-lat").fill("37.8042");
    await page.getByTestId("report-lng").fill("-122.4087");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/sightings") &&
        response.request().method() === "POST"
    );

    await page.getByTestId("report-submit").click();
    const response = await responsePromise;

    // Should succeed with valid numbers
    expect(response.ok()).toBe(true);
  });
});
