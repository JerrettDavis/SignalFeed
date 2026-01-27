# Signals Domain - Quick Reference

## Import

```typescript
import {
  createSignal,
  updateSignal,
  matchesConditions,
  shouldTrigger,
  describeConditions,
  validateSignalId,
  type Signal,
  type NewSignal,
  type UpdateSignal,
  type SignalId,
  type SignalTarget,
  type SignalConditions,
  type TriggerType,
  type SightingMatchData,
} from "@/domain/signals/signal";
```

## Create a Signal

```typescript
const input: NewSignal = {
  name: "My Alert",
  description: "Alert description",
  ownerId: "user-123",
  target: { kind: "global" }, // or "geofence" or "polygon"
  triggers: ["new_sighting"],
  conditions: {
    categoryIds: ["wildlife"],
    importance: ["high", "critical"],
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
} else {
  const error = result.error; // { code, message, field? }
}
```

## Update a Signal

```typescript
const result = updateSignal(
  existingSignal,
  { isActive: false },
  { updatedAt: new Date().toISOString() }
);
```

## Target Types

```typescript
// Global (all locations)
{ kind: "global" }

// Geofence
{ kind: "geofence", geofenceId: "geofence-123" }

// Custom Polygon
{
  kind: "polygon",
  polygon: {
    points: [
      { lat: 40.7, lng: -74.0 },
      { lat: 40.8, lng: -73.9 },
      { lat: 40.7, lng: -73.9 },
    ]
  }
}
```

## Trigger Types

```typescript
type TriggerType =
  | "new_sighting" // New sighting created
  | "sighting_confirmed" // Sighting confirmed
  | "sighting_disputed" // Sighting disputed
  | "score_threshold"; // Score crosses threshold
```

## Conditions

```typescript
type SignalConditions = {
  // Match specific categories
  categoryIds?: string[];

  // Match specific types
  typeIds?: string[];

  // Match sightings with any of these tags
  tags?: string[];

  // Match importance levels
  importance?: ("low" | "normal" | "high" | "critical")[];

  // Minimum reporter trust level
  minTrustLevel?: "unverified" | "new" | "trusted" | "verified";

  // Score range
  minScore?: number;
  maxScore?: number;

  // How to combine conditions (default: "AND")
  operator?: "AND" | "OR";
};
```

## Check if Signal Should Trigger

```typescript
if (shouldTrigger(signal, "new_sighting")) {
  // Signal is active and monitoring this trigger type
}
```

## Check if Sighting Matches Conditions

```typescript
const sightingData: SightingMatchData = {
  categoryId: "wildlife",
  typeId: "bear",
  tags: ["mammal"],
  importance: "high",
  score: 75,
  reporterTrustLevel: "trusted",
};

if (matchesConditions(signal.conditions, sightingData)) {
  // Conditions match - fire notification
}
```

## Get Human-Readable Description

```typescript
const description = describeConditions(signal.conditions);
// "Categories: wildlife AND Importance: high, critical AND Min trust: trusted"
```

## Validation Errors

All errors have this shape:

```typescript
{
  code: "signal.name_required",  // Error code
  message: "Signal name is required.",  // Human message
  field?: "name"  // Optional field identifier
}
```

### Common Error Codes

- `signal.name_required` - Name is empty
- `signal.name_too_long` - Name > 100 chars
- `signal.owner_required` - Owner ID is empty
- `signal.triggers_required` - No triggers specified
- `signal.duplicate_triggers` - Same trigger listed twice
- `signal.invalid_score_range` - minScore > maxScore
- `geo.invalid_polygon` - Polygon has < 3 points

## Limits

```typescript
MAX_NAME_LENGTH = 100;
MAX_DESCRIPTION_LENGTH = 500;
MAX_TRIGGERS = 10;
MAX_CATEGORY_IDS = 20;
MAX_TYPE_IDS = 50;
MAX_TAGS = 30;
```

## Complete Example

```typescript
import {
  createSignal,
  shouldTrigger,
  matchesConditions,
} from "@/domain/signals/signal";

// 1. Create signal
const signalResult = createSignal(
  {
    name: "Wildlife Alerts",
    ownerId: "user-123",
    target: { kind: "global" },
    triggers: ["new_sighting", "sighting_confirmed"],
    conditions: {
      categoryIds: ["wildlife"],
      importance: ["critical"],
      minTrustLevel: "trusted",
    },
  },
  { id: "sig-1" as SignalId, createdAt: new Date().toISOString() }
);

if (!signalResult.ok) {
  console.error(signalResult.error);
  return;
}

const signal = signalResult.value;

// 2. When a sighting event occurs
function onSightingEvent(
  triggerType: TriggerType,
  sighting: SightingMatchData
) {
  // Check if this signal cares about this event
  if (!shouldTrigger(signal, triggerType)) {
    return;
  }

  // Check if sighting matches conditions
  if (!matchesConditions(signal.conditions, sighting)) {
    return;
  }

  // Fire notification!
  console.log(`Signal "${signal.name}" triggered!`);
  sendNotification(signal.ownerId, signal.name, sighting);
}

// 3. Usage
onSightingEvent("new_sighting", {
  categoryId: "wildlife",
  typeId: "bear",
  tags: ["mammal", "dangerous"],
  importance: "critical",
  score: 90,
  reporterTrustLevel: "trusted",
});
```

## Trust Level Hierarchy

When using `minTrustLevel`, remember the hierarchy:

```
unverified (0)
    ↓
new (10-49)
    ↓
trusted (50+)
    ↓
verified (admin)
```

`minTrustLevel: "new"` matches: new, trusted, verified (but NOT unverified)

## AND vs OR Logic

```typescript
// AND (all must match)
{
  categoryIds: ["wildlife"],
  importance: ["critical"],
  operator: "AND"
}
// Matches: wildlife AND critical

// OR (any can match)
{
  categoryIds: ["wildlife", "weather"],
  operator: "OR"
}
// Matches: wildlife OR weather
```

## Default Values

```typescript
conditions: {
} // Empty conditions = match all
operator: "AND"; // Default operator
isActive: true; // New signals are active by default
```

## Tips

1. **Start Simple**: Begin with basic conditions, add complexity as needed
2. **Test Thoroughly**: Use `matchesConditions()` to test your logic
3. **Use Descriptions**: Call `describeConditions()` to verify your logic
4. **Handle Errors**: Always check `result.ok` before using `result.value`
5. **Owner Immutability**: Owner ID cannot be changed after creation
6. **Tag Matching**: Tags use "any match" logic (OR between tags)
7. **Array Conditions**: Use arrays for multiple options (OR within the array)

## See Also

- `README.md` - Complete documentation
- `examples.ts` - Real-world usage examples
- `signal.test.ts` - Test suite with more examples
