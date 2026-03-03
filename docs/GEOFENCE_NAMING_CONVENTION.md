# Geofence Naming Convention

## Overview

All geofences in the SignalFeed application **MUST** include location context in their names to ensure users can easily differentiate between similarly named areas across different cities.

## Naming Format

```
[Area Name], [City], [State Abbreviation]
```

### Examples

✅ **Good Names** (with location context):
- `Cherry Street District, Tulsa, OK`
- `Downtown District, San Francisco, CA`
- `Edison High School Zone, Tulsa, OK`
- `Harbor Area, San Francisco, CA`

❌ **Bad Names** (lacking location context):
- `Cherry Street District` - Which city?
- `Downtown District` - Which downtown?
- `City Center` - Extremely generic
- `Harbor Area` - Which harbor?

### Special Cases

When the location is already part of the natural name, avoid redundancy:

✅ **Good**:
- `Downtown Tulsa` (location already included)
- `Austin Airport Vicinity` (location already included)

❌ **Avoid Redundancy**:
- `Downtown Tulsa, Tulsa, OK` (redundant)
- `Austin Airport Vicinity, Austin, TX` (redundant)

## Rationale

### The Problem

Without location context, users face confusion when dealing with:
- Multiple "Downtown District" geofences across different cities
- Dozens of "City Center" areas
- Hundreds of similarly named neighborhoods

### The Solution

By including `[City], [State]` in every geofence name:
1. **Instant Recognition**: Users immediately know which city a geofence covers
2. **Better Search**: Location-based filtering and searching becomes possible
3. **Scalability**: System can grow to thousands of geofences without naming collisions
4. **User Experience**: No confusion when viewing lists or selecting geofences

## Implementation

### Database Updates

All existing geofences in production have been updated to follow this convention. See the migration history:

- **Script**: `scripts/update-all-geofences.mjs`
- **Date Applied**: 2026-02-02
- **Geofences Updated**: 12 out of 13 (1 already had location context)

### Seed Data

Both seed data files have been updated:
- `db/seed-data.sql` - SQL seed file
- `scripts/seed-database.mjs` - JavaScript seed script

### Creating New Geofences

When creating a new geofence:

1. **Determine the location** from coordinates or user input
2. **Format the name** as `[Area Name], [City], [State]`
3. **Check for redundancy** - if the city name is already in the area name, don't add it again

### Automated Location Detection

The `update-all-geofences.mjs` script includes logic to automatically detect locations from coordinates:

```javascript
// Tulsa, OK area (roughly 36.1°N, 95.9°W)
if (lat > 36.0 && lat < 36.3 && lng < -95.8 && lng > -96.1) {
  return 'Tulsa, OK';
}

// Austin, TX area (roughly 30.3°N, 97.7°W)
else if (lat > 30.1 && lat < 30.5 && lng < -97.5 && lng > -97.9) {
  return 'Austin, TX';
}

// San Francisco area (roughly 37.7°N, 122.4°W)
else if (lat > 37.6 && lat < 37.9 && lng < -122.3 && lng > -122.5) {
  return 'San Francisco, CA';
}
```

## Tools

### Audit Script

Run `node scripts/update-all-geofences.mjs` to:
- Analyze all geofences for naming compliance
- Show proposed updates (dry run by default)
- Apply updates with `--apply` flag

### Verification

The script also verifies that all signals are properly associated with valid geofences.

## Current Status

As of 2026-02-02:

✅ **All Production Geofences Compliant**
- Total geofences: 13
- Geofences with location context: 13 (100%)
- Signals with valid geofences: 9 out of 9 (100%)

### Breakdown by Location

**San Francisco, CA**: 5 geofences
- Downtown District, San Francisco, CA
- Harbor Area, San Francisco, CA
- University Campus, San Francisco, CA
- Airport Vicinity, San Francisco, CA
- Industrial Zone, San Francisco, CA

**Tulsa, OK**: 8 geofences
- Cherry Street District, Tulsa, OK
- Gathering Place Park, Tulsa, OK
- Brady Arts District, Tulsa, OK
- Edison High School Zone, Tulsa, OK
- River Parks Trail, Tulsa, OK
- Brookside District, Tulsa, OK
- Downtown Tulsa (location already in name)
- Midtown Corridor, Tulsa, OK

## Best Practices

1. **Always include location** unless it's already in the natural name
2. **Use standard abbreviations** for states (OK, CA, TX, etc.)
3. **Be descriptive** - "Cherry Street District" is better than just "Cherry Street"
4. **Consider the user** - they should immediately understand where this geofence is
5. **Test for redundancy** - avoid "Downtown Tulsa, Tulsa, OK"

## Future Considerations

As the application scales:
- Consider adding country codes for international geofences
- May need additional context for very large cities (borough, district)
- Consider hierarchical naming for nested geofences

## Related Documentation

- [Database Schema](../db/schema.sql)
- [Seed Data](../db/seed-data.sql)
- [Signals Documentation](./signals.md) (if exists)
