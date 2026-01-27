# Signal Evaluation Engine

## Overview

The Signal Evaluation Engine is a pure functional service that determines when signals should trigger based on sighting events. It handles all the complex matching logic for signals without performing any I/O operations.

## Purpose

The evaluator is used by:

- **Real-time sighting processing** - When new sightings are created, find matching signals to trigger notifications
- **Batch evaluation** - Periodic checks for score_threshold triggers on existing sightings
- **Subscription notifications** - Determine which subscribers should be notified
- **Signal preview** - Show users what sightings would match their signal filters
- **RSS feed generation** - Filter sightings for signal-specific feeds

## Core Functions

### evaluateSighting

Evaluate a sighting against all active signals to find matches.

```typescript
const matchingSignals = evaluateSighting(
  sighting,
  allSignals,
  { type: "new_sighting", sighting },
  evaluationContext
);
```

**Parameters:**

- `sighting` - The sighting to evaluate
- `signals` - Array of all signals to check against
- `event` - The event that triggered evaluation (new_sighting, sighting_confirmed, etc.)
- `context` - Evaluation context with geofences, sighting types, and user reputation

**Returns:** Array of signals that match the sighting

**Use cases:**

- Real-time notification triggering when sightings are created
- Finding all signals that should receive a notification

### evaluateSightingDetailed

Same as `evaluateSighting` but includes detailed reasons for matches/non-matches.

```typescript
const results = evaluateSightingDetailed(
  sighting,
  allSignals,
  { type: "new_sighting", sighting },
  evaluationContext
);

// Each result includes:
// - signal: The signal being evaluated
// - matched: boolean
// - reason: String explaining why it matched or didn't
```

**Use cases:**

- Admin debugging interfaces
- Signal testing/preview tools
- Audit logging

### matchesGeography

Check if a sighting's location matches a signal's geographic target.

```typescript
const isInBounds = matchesGeography(sighting, signal, context);
```

**Supports:**

- **Global targets** - Always match
- **Geofence targets** - Check if point is within referenced geofence polygon
- **Custom polygon targets** - Check if point is within signal's custom polygon

**Use cases:**

- Geographic filtering in signal feeds
- Preview what areas a signal covers

### matchesSignalConditions

Check if a sighting matches a signal's filter conditions.

```typescript
const matchesFilters = matchesSignalConditions(sighting, signal, context);
```

**Checks:**

- Category IDs
- Type IDs
- Tags (from sighting type)
- Importance level
- Trust level (reporter's reputation tier)
- Score range (min/max)
- Operator logic (AND/OR)

**Use cases:**

- Content filtering for signals
- Quality control (trust level, score filters)

### shouldTrigger

Check if a signal should trigger for a given event type.

```typescript
const shouldFire = shouldTrigger(signal, "new_sighting");
```

**Trigger types:**

- `new_sighting` - When sighting is first created
- `sighting_confirmed` - When sighting receives confirmation reaction
- `sighting_disputed` - When sighting receives dispute reaction
- `score_threshold` - When sighting crosses a score threshold

**Use cases:**

- Filter signals by event type before evaluation
- Performance optimization

### wouldMatch

Check if a sighting would match a signal, regardless of trigger type.

```typescript
const wouldMatchSignal = wouldMatch(sighting, signal, context);
```

**Use cases:**

- Signal preview ("Show me what sightings would match this signal")
- Signal creation UI (live preview)
- Testing signal configurations

### evaluateSignalFeed

Batch evaluate multiple sightings against a single signal.

```typescript
const feedSightings = evaluateSignalFeed(allRecentSightings, signal, context);
```

**Use cases:**

- Generate RSS feeds for signals
- Display signal-specific sighting feeds
- Bulk filtering

### findScoreThresholdSignals

Find signals that have score_threshold triggers and are active.

```typescript
const thresholdSignals = findScoreThresholdSignals(allSignals);
```

**Use cases:**

- Batch job processing (periodic checks for score changes)
- Finding signals that need score monitoring

### crossedScoreThreshold

Check if a sighting's score crossed a threshold since last evaluation.

```typescript
const justCrossed = crossedScoreThreshold(
  currentScore,
  previousScore,
  threshold
);
```

**Logic:** Returns true only when crossing from below to above (or equal to) the threshold.

**Use cases:**

- Batch processing of score_threshold triggers
- Avoid duplicate notifications

## Evaluation Context

The evaluation context provides necessary data for signal matching:

```typescript
type EvaluationContext = {
  geofences: Map<string, Geofence>;
  sightingTypes: Map<string, SightingType>;
  userReputation: Map<string, { score: number; isVerified?: boolean }>;
};
```

Build context from repository data:

```typescript
const context = buildEvaluationContext({
  geofences: await geofenceRepository.list(),
  sightingTypes: await taxonomyRepository.getTypes(),
  userReputation: await reputationRepository.getAllUsers(),
});
```

## Performance Optimizations

### Pre-filtering

Pre-filter signals before full evaluation using fast checks:

```typescript
const candidates = preFilterSignals(sighting, allSignals, event);
const matches = evaluateSighting(sighting, candidates, event, context);
```

**Fast checks:**

- Signal is active
- Trigger type matches event
- Category/type quick match (for AND operators)
- Global vs geographic targeting

**Benefits:**

- Reduces number of full evaluations
- Significant speedup when dealing with hundreds of signals

### Match Scoring

Calculate relevance scores for ranking signals:

```typescript
const score = calculateMatchScore(signal, sighting);
```

**Scoring factors:**

- Base score: 10 points
- Category match: +20 points
- Type match: +30 points (most specific)
- Importance match: +15 points
- Score within range: +10 points each (min/max)
- Custom polygon: +5 points (geographic specificity)

**Use cases:**

- Ranking signals by relevance
- Prioritizing notifications
- Featured/recommended signals

## Usage Examples

### Real-time Notification Triggering

```typescript
import {
  evaluateSighting,
  buildEvaluationContext,
} from "@/application/services/signal-evaluator";

async function notifyOnNewSighting(sighting: Sighting) {
  // Build context from repositories
  const context = buildEvaluationContext({
    geofences: await geofenceRepository.list(),
    sightingTypes: await taxonomyRepository.getTypes(),
    userReputation: await reputationRepository.getAllUsers(),
  });

  // Get all active signals
  const signals = await signalRepository.list({ isActive: true });

  // Find matching signals
  const event = { type: "new_sighting", sighting };
  const matchingSignals = evaluateSighting(sighting, signals, event, context);

  // Queue notifications for each matching signal
  for (const signal of matchingSignals) {
    await notificationQueue.add({
      signalId: signal.id,
      sightingId: sighting.id,
      event: "new_sighting",
    });
  }
}
```

### Batch Score Threshold Processing

```typescript
import {
  findScoreThresholdSignals,
  crossedScoreThreshold,
  evaluateSighting,
  buildEvaluationContext,
} from "@/application/services/signal-evaluator";

async function processScoreThresholds() {
  const context = buildEvaluationContext({
    geofences: await geofenceRepository.list(),
    sightingTypes: await taxonomyRepository.getTypes(),
    userReputation: await reputationRepository.getAllUsers(),
  });

  // Find signals that care about score thresholds
  const allSignals = await signalRepository.list({ isActive: true });
  const thresholdSignals = findScoreThresholdSignals(allSignals);

  // Get recently updated sightings
  const recentlyUpdated = await sightingRepository.listRecentlyScored();

  for (const sighting of recentlyUpdated) {
    // Check if score crossed threshold since last check
    const previousScore = sighting.previousScore || 0;
    const threshold = 10; // Example threshold

    if (crossedScoreThreshold(sighting.score, previousScore, threshold)) {
      // Evaluate against threshold signals
      const event = { type: "score_threshold", sighting };
      const matches = evaluateSighting(
        sighting,
        thresholdSignals,
        event,
        context
      );

      // Trigger notifications
      for (const signal of matches) {
        await notificationQueue.add({
          signalId: signal.id,
          sightingId: sighting.id,
          event: "score_threshold",
        });
      }
    }
  }
}
```

### Signal Preview (Live Matching Count)

```typescript
import {
  wouldMatch,
  buildEvaluationContext,
} from "@/application/services/signal-evaluator";

async function previewSignalMatches(signal: Signal) {
  const context = buildEvaluationContext({
    geofences: await geofenceRepository.list(),
    sightingTypes: await taxonomyRepository.getTypes(),
    userReputation: await reputationRepository.getAllUsers(),
  });

  // Get recent sightings (e.g., last 30 days)
  const recentSightings = await sightingRepository.list({
    since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  });

  // Count how many would match
  const matchCount = recentSightings.filter((sighting) =>
    wouldMatch(sighting, signal, context)
  ).length;

  // Get sample matches
  const sampleMatches = recentSightings
    .filter((sighting) => wouldMatch(sighting, signal, context))
    .slice(0, 5);

  return {
    matchCount,
    sampleMatches,
    message: `This signal would match ${matchCount} sightings in the last 30 days`,
  };
}
```

### RSS Feed Generation

```typescript
import {
  evaluateSignalFeed,
  buildEvaluationContext,
} from "@/application/services/signal-evaluator";

async function generateSignalRSSFeed(signalId: string) {
  const signal = await signalRepository.getById(signalId);
  if (!signal) throw new Error("Signal not found");

  const context = buildEvaluationContext({
    geofences: await geofenceRepository.list(),
    sightingTypes: await taxonomyRepository.getTypes(),
    userReputation: await reputationRepository.getAllUsers(),
  });

  // Get all recent sightings
  const allSightings = await sightingRepository.list({
    since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    sortBy: "hot",
    limit: 500,
  });

  // Filter to matching sightings
  const matchingSightings = evaluateSignalFeed(allSightings, signal, context);

  // Convert to RSS format
  return generateRSS({
    title: signal.name,
    description: signal.description,
    items: matchingSightings.slice(0, 50), // Limit RSS to 50 items
  });
}
```

### Admin Debugging Interface

```typescript
import {
  evaluateSightingDetailed,
  explainEvaluation,
  buildEvaluationContext,
} from "@/application/services/signal-evaluator";

async function debugSignalMatching(sightingId: string, signalId?: string) {
  const sighting = await sightingRepository.getById(sightingId);
  if (!sighting) throw new Error("Sighting not found");

  const context = buildEvaluationContext({
    geofences: await geofenceRepository.list(),
    sightingTypes: await taxonomyRepository.getTypes(),
    userReputation: await reputationRepository.getAllUsers(),
  });

  // Get signals to test (all or specific one)
  const signals = signalId
    ? [await signalRepository.getById(signalId)]
    : await signalRepository.list();

  // Get detailed evaluation results
  const event = { type: "new_sighting", sighting };
  const results = evaluateSightingDetailed(sighting, signals, event, context);

  // Format for display
  return results.map((result) => ({
    signalId: result.signal.id,
    signalName: result.signal.name,
    matched: result.matched,
    explanation: explainEvaluation(result),
  }));
}
```

## Architecture Notes

### Pure Functional Design

The evaluator is **pure** - no side effects, no I/O operations:

- ✅ All functions are deterministic
- ✅ No database queries
- ✅ No network calls
- ✅ No state mutations
- ✅ Easily testable

**Benefits:**

- Fast execution (no I/O waits)
- Easy to test (no mocking required)
- Predictable behavior
- Cacheable results
- Parallelizable

### Clean Architecture

The evaluator sits in the **application service layer**:

- Uses domain entities (Signal, Sighting, Geofence)
- Uses domain logic (matchesConditions from Signal domain)
- No knowledge of infrastructure (repositories, databases)
- No knowledge of presentation (API, UI)

### Context Pattern

The `EvaluationContext` pattern provides:

- All necessary data in one place
- Easy to build from repositories
- Easy to mock for testing
- Can be cached/reused across evaluations
- Clear separation of concerns

### Performance Considerations

**Fast operations:**

- Simple boolean checks (trigger type, active status)
- Category/type ID matching (string equality)
- Point-in-polygon checks (optimized algorithm)

**Potentially slow operations:**

- Evaluating hundreds of signals per sighting
- Complex polygon geometries

**Mitigation:**

- Use `preFilterSignals` before full evaluation
- Cache evaluation context across multiple sightings
- Consider indexing/filtering at repository layer
- For high-volume scenarios, consider background processing

## Testing

The evaluator has comprehensive test coverage:

- 45 unit tests covering all functions
- Tests for geography matching (geofence, polygon, global)
- Tests for condition matching (all filter types)
- Tests for AND/OR logic
- Tests for trust level checking
- Tests for batch operations
- Tests for edge cases (missing data, inactive signals, etc.)

Run tests:

```bash
npm test -- signal-evaluator.test.ts
```

## Future Enhancements

Potential improvements:

- [ ] Spatial indexing for faster geographic lookups
- [ ] Caching of frequent evaluations
- [ ] Parallel evaluation for large signal sets
- [ ] Machine learning for signal relevance scoring
- [ ] Time-based conditions (time of day, day of week)
- [ ] Distance-based conditions (within X miles of point)
- [ ] Custom field matching (sighting custom fields)
- [ ] Aggregation conditions (count, average over time)
