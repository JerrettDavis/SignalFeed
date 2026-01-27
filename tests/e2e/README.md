# E2E Tests for SightSignal

Comprehensive end-to-end tests for the SightSignal application using Playwright.

## Test Files

### 1. `sidebar-navigation.spec.ts`

Tests for sidebar opening, closing, and navigation:

- Opening and closing Explore, Report, and Geofences sidebars
- Closing with ESC key
- Switching between sidebars
- Backdrop click to close

### 2. `explore-sidebar.spec.ts`

Tests for Explore sidebar filtering and display:

- Category filter buttons (6 categories)
- Importance level filter
- Single and multiple category selection
- Filter toggling
- Combined category + importance filtering
- Clear filters functionality
- Signal card display with importance indicators
- 15 signal limit enforcement

### 3. `report-sidebar.spec.ts`

Tests for Report sidebar form functionality:

- All form fields present
- Dynamic type dropdown based on category
- Required field validation
- Successful sighting submission
- Form clearing after submission
- Error handling for invalid coordinates
- Custom field functionality
- "Use my location" button with geolocation
- Button disabled states

### 4. `geofences-sidebar.spec.ts`

Tests for Geofences sidebar functionality:

- Map display and controls
- Sample polygon and clear points
- Create geofence form and submission
- Subscribe form with email, target, trust level
- Category and type checkboxes
- Public geofences list
- Button disabled states
- Subscription to drawn polygon vs existing geofence

### 5. `theme-and-ui.spec.ts`

Tests for theme toggle and general UI:

- Header, logo, navigation visibility
- Theme toggle between light/dark/system
- Theme persistence on reload
- Welcome card and "Get started" button
- Map loading
- Floating action button on mobile
- Responsive navigation
- Fixed header positioning
- Backdrop click behavior
- Keyboard focus trap
- Accessibility (ARIA labels)

### 6. `integration-workflow.spec.ts`

Full workflow integration tests:

- Complete explore → filter → report → verify flow
- Create geofence → subscribe to it flow
- Filter persistence across view switches
- Custom fields in API requests
- Multiple sequential reports
- Error handling and recovery
- Theme persistence across navigation

## Running Tests

### Run all E2E tests

```bash
npm run e2e
```

### Run specific test file

```bash
npx playwright test sidebar-navigation
```

### Run tests in UI mode (interactive)

```bash
npx playwright test --ui
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run tests with specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug a specific test

```bash
npx playwright test --debug sidebar-navigation.spec.ts
```

## Test Coverage

### Core Functionality

- ✅ Sidebar navigation and management
- ✅ Category and importance filtering
- ✅ Signal listing with 15-item limit
- ✅ Form submission with validation
- ✅ Geofence creation and management
- ✅ Subscription creation
- ✅ Theme toggling and persistence

### User Workflows

- ✅ Browse signals → apply filters → view results
- ✅ Submit new sighting → verify it appears
- ✅ Create geofence → subscribe to it
- ✅ Error handling → correction → retry

### UI/UX

- ✅ Responsive design (mobile/desktop)
- ✅ Keyboard navigation (ESC, Tab)
- ✅ Accessibility (ARIA labels, focus management)
- ✅ Theme persistence
- ✅ Loading states
- ✅ Error states

## Test Data

Tests use the API endpoints with file-based data storage:

- `SIGHTSIGNAL_DATA_STORE=file`
- Data stored in `.local/e2e` directory
- Fresh data on each test run via `global-setup.ts`

## Configuration

See `playwright.config.ts` for:

- Test directory: `./tests/e2e`
- Base URL: `http://127.0.0.1:3000`
- Timeout: 30 seconds
- Workers: 1 (sequential execution)
- Web server auto-start on port 3000

## Best Practices

1. **Wait for network idle**: Tests wait for page load and API responses
2. **Use semantic selectors**: Prefer `getByRole`, `getByTestId`, `getByText`
3. **Verify state changes**: Check UI updates after actions
4. **Test error paths**: Include negative test cases
5. **Mobile viewport**: Test responsive behavior
6. **Accessibility**: Verify ARIA attributes and keyboard navigation

## Troubleshooting

### Tests timing out

- Increase timeout in `playwright.config.ts`
- Check dev server is running on port 3000
- Verify database is accessible

### Flaky tests

- Add `waitForTimeout()` for animations
- Wait for specific network responses
- Use `waitForLoadState('networkidle')`

### Test data issues

- Reset E2E data: `rm -rf .local/e2e`
- Check `global-setup.ts` runs correctly
- Verify API endpoints return expected data

## CI/CD

To run in CI environments:

```bash
# Install browsers
npx playwright install --with-deps

# Run tests
npm run e2e
```

Set `CI=true` environment variable to disable server reuse.
