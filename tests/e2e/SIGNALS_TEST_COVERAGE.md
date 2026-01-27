# Signals E2E Test Coverage

## Overview

Comprehensive end-to-end testing for the Signals feature, covering UI components, API integration, and complete workflows.

## Test Files

### 1. `signals-sidebar.spec.ts` - UI Component Tests

Tests the Signals sidebar user interface and interactions.

#### Covered Scenarios:

- **Sidebar Display**
  - Displays signals browser
  - Shows "My Signals" heading
  - Renders filter buttons (All, Active, Inactive)
  - Shows Create Signal button
  - Displays loading state initially
  - Sticky filter section at top
  - Scrollable signals list

- **Filter Functionality**
  - Default filter is Active
  - Switches between All/Active/Inactive filters
  - Updates signal count per filter
  - Shows filter-specific empty states
  - Empty state "show all" button works

- **Signal Cards**
  - Displays signal name
  - Shows trigger and target information
  - Shows description when available
  - Displays active/inactive status indicator
  - Hover effects on cards
  - Truncates long signal names
  - Limits description to 2 lines

- **Empty States**
  - Shows "No signals created yet" when empty
  - Shows filter-specific messages (e.g., "No inactive signals")
  - Provides link to show all signals from filtered empty state

- **Navigation**
  - Opens from Explore menu
  - Closes when clicking outside
  - Proper dropdown behavior

- **Create Signal**
  - Create button shows "coming soon" alert (placeholder)

#### Test Count: 33 tests

### 2. `signals-integration.spec.ts` - API Integration Tests

Tests the Signals API endpoints and integration workflows.

#### Covered Scenarios:

- **Signal Creation (POST /api/signals)**
  - Creates global signal
  - Creates geofence signal (with linked geofence)
  - Creates polygon signal with custom area
  - Validates required fields (name, target, triggers)
  - Validates geofence target has geofenceId
  - Validates polygon target has polygon points
  - Validates trigger types
  - Returns proper error codes for invalid data

- **Signal Retrieval (GET /api/signals)**
  - Lists all signals
  - Filters signals by isActive parameter
  - Gets signal by ID
  - Returns 404 for non-existent signal
  - Returns all required fields in response

- **Signal Display in UI**
  - Signal appears in UI after creation
  - Inactive signals only appear in All/Inactive filters
  - Signals with complex conditions display correctly
  - Shows correct trigger count

- **Signal Subscriptions (POST/GET /api/signal-subscriptions)**
  - Creates signal subscription
  - Lists signal subscriptions
  - Validates required fields (signalId, deliveryMethod, deliveryTarget)
  - Validates delivery method enum values
  - Returns proper error codes for invalid data

- **Complex Workflows**
  - Create geofence → Create signal → Subscribe
  - Create signal → Verify in UI → Filter by status
  - Create signal with conditions → Verify display

#### Test Count: 21 tests

## Total Coverage

**Total Tests: 54**

### By Category:

- UI/UX Tests: 33
- API Tests: 15
- Integration Tests: 6

### By Feature Area:

- Signal Display: 12 tests
- Filtering: 8 tests
- Signal Creation: 8 tests
- Signal Retrieval: 5 tests
- Signal Subscriptions: 4 tests
- Navigation: 4 tests
- Validation: 8 tests
- Empty States: 3 tests
- Styling/Layout: 2 tests

## Running the Tests

### Run all signal tests:

```bash
npm run test:e2e -- signals-sidebar.spec.ts signals-integration.spec.ts
```

### Run UI tests only:

```bash
npm run test:e2e -- signals-sidebar.spec.ts
```

### Run API integration tests only:

```bash
npm run test:e2e -- signals-integration.spec.ts
```

### Run in headed mode (see browser):

```bash
npm run test:e2e -- signals-sidebar.spec.ts --headed
```

### Run specific test:

```bash
npm run test:e2e -- signals-sidebar.spec.ts -g "displays filter buttons"
```

## Test Data Requirements

Tests may create the following test data:

- Signals with names like "Test Signal", "UI Test Signal", etc.
- Geofences with names like "Signal Test Geofence"
- Signal subscriptions with email "test@example.com"
- Test user IDs like "test-user-001"

All test data is created via the API and should be cleaned up between test runs or use the in-memory data store during testing.

## Known Limitations

1. **Create Signal UI**: Currently shows an alert "coming soon" instead of opening a modal. Tests verify the alert appears.

2. **Signal Evaluation**: The signal evaluation engine is implemented but not directly tested in E2E tests. It's tested at the unit level.

3. **Real-time Updates**: Tests don't verify WebSocket or real-time updates for new signals. They rely on page refresh or API polling.

4. **Authentication**: Tests don't require authentication. When auth is added, tests will need to be updated to authenticate first.

## Future Test Additions

When these features are implemented, add tests for:

- [ ] Signal creation modal workflow
- [ ] Signal editing
- [ ] Signal deletion
- [ ] Signal evaluation triggering notifications
- [ ] Bulk operations on signals
- [ ] Signal search/filtering by name or description
- [ ] Signal statistics and analytics
- [ ] Notification delivery tracking
- [ ] Geographic visualization of signal coverage
- [ ] Signal permissions and ownership

## Test Quality Metrics

- **Coverage**: Core user workflows and API endpoints
- **Stability**: Uses proper waits and timeouts, not prone to flakiness
- **Maintainability**: Clear test names, follows existing patterns
- **Performance**: Tests complete in reasonable time (<30s each)
- **Independence**: Tests can run independently or in parallel

## Architecture Alignment

These tests verify:
✅ Domain models (Signal, SignalTarget, SignalConditions)
✅ Use cases (create signal, list signals, filter signals)
✅ Repository layer (data persistence and retrieval)
✅ API contracts (request/response validation)
✅ UI components (SignalsBrowser, filter buttons, cards)
✅ Navigation flow (Explore menu → Signals)

## Related Files

**Source Files:**

- `src/domain/signals/signal.ts` - Domain models
- `src/application/use-cases/signals/` - Use cases
- `src/app/api/signals/` - API endpoints
- `src/components/signals/SignalsBrowser.tsx` - UI component

**Test Files:**

- `tests/e2e/signals-sidebar.spec.ts` - UI tests
- `tests/e2e/signals-integration.spec.ts` - API tests
- `src/domain/signals/signal.test.ts` - Unit tests

## Maintenance Notes

- When adding new signal trigger types, update validation tests
- When adding new signal target types, add creation and validation tests
- When adding new signal conditions, add tests for complex condition display
- Update empty state tests if UI messages change
- Add performance tests if signal lists grow large
