# Signals Domain

The Signals domain provides automated alert functionality for the SightSignal application. Signals allow users to monitor sightings based on geographic areas and specific conditions, receiving notifications when matching sightings are created or updated.

## Core Concepts

### Signal Entity

A Signal represents an automated alert rule that monitors sightings and triggers notifications when conditions are met.

```typescript
type Signal = {
  id: SignalId;
  name: string;
  description?: string;
  ownerId: string;
  target: SignalTarget;
  triggers: TriggerType[];
  conditions: SignalConditions;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### Geographic Targeting

Signals can target sightings in three ways:

1. **Global** - Monitor all sightings regardless of location
2. **Geofence** - Monitor sightings within a predefined geofence
3. **Polygon** - Monitor sightings within a custom polygon

```typescript
type SignalTarget =
  | { kind: "global" }
  | { kind: "geofence"; geofenceId: string }
  | { kind: "polygon"; polygon: Polygon };
```

### Trigger Types

Signals can be triggered by different sighting events:

- `new_sighting` - Fires when a new sighting is created
- `sighting_confirmed` - Fires when a sighting receives a confirmation
- `sighting_disputed` - Fires when a sighting is disputed
- `score_threshold` - Fires when a sighting's score crosses a threshold

### Conditions

Signals can filter sightings using multiple condition types:

```typescript
type SignalConditions = {
  // Taxonomy filters
  categoryIds?: string[];
  typeIds?: string[];
  tags?: string[];

  // Importance filter
  importance?: SightingImportance[];

  // Trust level filter (minimum reputation tier)
  minTrustLevel?: ReputationTier;

  // Score filters
  minScore?: number;
  maxScore?: number;

  // Logic operator for combining conditions
  operator?: "AND" | "OR";
};
```

#### Condition Logic

- **AND operator (default)**: All conditions must be met
- **OR operator**: At least one condition must be met

## Usage Examples

### Creating a Signal

```typescript
import { createSignal } from "@/domain/signals/signal";

const input: NewSignal = {
  name: "Critical Wildlife Alerts",
  description: "Notify me of urgent wildlife sightings in my area",
  ownerId: "user-123",
  target: { kind: "geofence", geofenceId: "geofence-456" },
  triggers: ["new_sighting", "sighting_confirmed"],
  conditions: {
    categoryIds: ["wildlife"],
    importance: ["critical", "high"],
    minTrustLevel: "trusted",
    operator: "AND",
  },
  isActive: true,
};

const result = createSignal(input, {
  id: "signal-123" as SignalId,
  createdAt: new Date().toISOString(),
});

if (result.ok) {
  const signal = result.value;
  // Signal created successfully
} else {
  const error = result.error;
  // Handle validation error
}
```

### Updating a Signal

```typescript
import { updateSignal } from "@/domain/signals/signal";

const updates: UpdateSignal = {
  isActive: false,
  triggers: ["new_sighting"],
};

const result = updateSignal(existingSignal, updates, {
  updatedAt: new Date().toISOString(),
});
```

### Checking if a Sighting Matches Signal Conditions

```typescript
import { matchesConditions } from "@/domain/signals/signal";

const sightingData: SightingMatchData = {
  categoryId: "wildlife",
  typeId: "deer",
  tags: ["mammal", "forest"],
  importance: "high",
  score: 85,
  reporterTrustLevel: "trusted",
};

const matches = matchesConditions(signal.conditions, sightingData);

if (matches) {
  // Sighting matches signal conditions, fire notification
}
```

### Checking if a Signal Should Trigger

```typescript
import { shouldTrigger } from "@/domain/signals/signal";

if (shouldTrigger(signal, "new_sighting")) {
  // Signal is active and monitoring new sightings
  // Check if sighting matches conditions
}
```

### Describing Conditions (Human-Readable)

```typescript
import { describeConditions } from "@/domain/signals/signal";

const description = describeConditions(signal.conditions);
// Example output: "Categories: wildlife AND Importance: high, critical AND Min trust: trusted"
```

## Validation Rules

### Signal Name

- Required (non-empty after trimming)
- Maximum 100 characters

### Description

- Optional
- Maximum 500 characters when provided

### Owner ID

- Required (non-empty after trimming)

### Target

- **Geofence**: Must have non-empty `geofenceId`
- **Polygon**: Must have at least 3 valid points
- **Global**: No additional validation

### Triggers

- At least one trigger required
- Maximum 10 triggers allowed
- No duplicate triggers
- Valid trigger types only

### Conditions

#### Array Limits

- Maximum 20 category IDs
- Maximum 50 type IDs
- Maximum 30 tags

#### Score Range

- `minScore` must be ≤ `maxScore` when both are specified

#### Trust Level

- Must be a valid `ReputationTier`: "unverified", "new", "trusted", or "verified"

## Trust Level Hierarchy

Trust levels are hierarchical. When `minTrustLevel` is specified, sightings from users at or above that level will match:

1. `unverified` (0 points)
2. `new` (10-49 points)
3. `trusted` (50+ points)
4. `verified` (admin-verified)

Example: `minTrustLevel: "new"` will match sightings from "new", "trusted", and "verified" users, but not "unverified" users.

## Business Logic

### Condition Matching

The `matchesConditions` function evaluates a sighting against signal conditions:

1. Each specified condition type generates a boolean check
2. If no conditions are specified, all sightings match
3. For array conditions (categories, types, tags):
   - Categories and types check for exact matches
   - Tags check if any tag overlaps
4. The operator determines how checks are combined:
   - `AND`: All checks must pass
   - `OR`: At least one check must pass

### Trigger Evaluation

The `shouldTrigger` function determines if a signal should fire for a given event:

1. Signal must be active (`isActive: true`)
2. The trigger type must be in the signal's `triggers` array

### Permission Model

- Signals have an `ownerId` that identifies the user who created them
- The owner ID cannot be changed after creation
- Signals are personal - only the owner receives notifications
- Future enhancement: Add shared signals or signal subscriptions

## Integration Points

### With Sighting Domain

Signals evaluate sightings using:

- Category ID
- Type ID
- Tags
- Importance level
- Score
- Reporter's trust level

### With Reputation Domain

Signals filter by reporter trust level:

- Uses `ReputationTier` type
- Hierarchical comparison (e.g., "trusted" includes "verified")

### With Geo Domain

Signals use geographic validation:

- Validates polygon points with `validatePolygon`
- Supports both predefined geofences and custom polygons

## Error Codes

All validation errors follow the pattern `signal.<error_type>`:

- `signal.name_required` - Name is empty
- `signal.name_too_long` - Name exceeds 100 characters
- `signal.description_too_long` - Description exceeds 500 characters
- `signal.owner_required` - Owner ID is empty
- `signal.geofence_required` - Geofence target missing ID
- `signal.triggers_required` - No triggers specified
- `signal.too_many_triggers` - More than 10 triggers
- `signal.duplicate_triggers` - Same trigger listed multiple times
- `signal.too_many_categories` - More than 20 category IDs
- `signal.too_many_types` - More than 50 type IDs
- `signal.too_many_tags` - More than 30 tags
- `signal.invalid_score_range` - minScore > maxScore
- `signal.invalid_id` - Signal ID is empty

Additional errors may come from geographic validation:

- `geo.invalid_polygon` - Polygon has fewer than 3 points
- `geo.invalid_lat` - Latitude out of range
- `geo.invalid_lng` - Longitude out of range

## Future Enhancements

Potential additions to the signals domain:

1. **Notification Preferences**
   - Email, SMS, push notifications
   - Notification frequency limits
   - Quiet hours

2. **Advanced Filtering**
   - Date/time ranges
   - Weather conditions
   - Proximity to specific locations

3. **Signal Templates**
   - Predefined signal configurations
   - Community-shared signals

4. **Signal Analytics**
   - Track how many times a signal has fired
   - False positive tracking
   - Signal effectiveness metrics

5. **Signal Groups**
   - Combine multiple signals with nested logic
   - Priority levels for different signals

6. **Collaborative Signals**
   - Share signals with other users
   - Public signal subscriptions
   - Signal marketplace
