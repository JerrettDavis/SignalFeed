# Flairs and Time-Based Scoring System

## Overview

SightSignal now features a comprehensive flair system and category-specific time decay algorithm that dramatically improves content relevance and user experience. This document describes the architecture, features, and usage of these systems.

## Key Features

### 1. Flair System

Flairs are visual and algorithmic tags that can be applied to sightings to:
- **Provide context** (e.g., "Resolved", "Safety Hazard", "Trending")
- **Affect visibility** (boost important content, suppress resolved issues)
- **Influence scoring** (adjust ranking based on status)
- **Enable filtering** (find specific types of content)

#### Flair Types

- **Status Flairs**: Ongoing, Verified, Unconfirmed
- **Safety Flairs**: Safety Hazard, Avoid Area, All Clear
- **Urgency Flairs**: Urgent, Time Sensitive
- **Resolution Flairs**: Resolved, Cleared, False Alarm
- **Community Flairs**: Trending, Popular, Needs Attention, Duplicate

#### System-Wide vs Category-Specific Flairs

- **System-wide flairs** apply to all sightings regardless of category
- **Category-specific flairs** only appear for sightings in specific categories
  - Example: "Heavy Traffic" flair only for Transportation sightings
  - Example: "Severe Weather" flair only for Weather sightings

### 2. Flair Assignment Methods

#### Manual Assignment
- Original reporter can assign flairs to their own sightings
- Useful for marking resolved issues or updating status

#### Moderator Assignment
- Signal moderators can assign flairs within their signals
- Provides oversight and quality control

#### Community Consensus
- Any user can suggest a flair
- Suggestions are voted on by the community
- Auto-applied when reaching threshold (10% of engaged users or minimum 3 votes)

#### Automatic Assignment
- System automatically assigns flairs based on conditions
- Examples:
  - "Trending" when engagement is high
  - "Needs Attention" when underrepresented
  - "False Alarm" when spam reports exceed threshold

### 3. Category-Specific Time Decay

Different categories have different relevance lifespans:

#### Fast Decay (Hours)
- **Transportation** (decay rate: 2.5, window: 6 hours)
  - Traffic incidents become irrelevant quickly
- **Weather** (decay rate: 2.0, window: 12 hours)
  - Weather conditions change rapidly
- **Food & Drink** (decay rate: 2.2, window: 8 hours)
  - Food trucks and deals are time-sensitive
- **Technology** (decay rate: 1.9, window: 12 hours)
  - Tech issues need urgent resolution

#### Medium Decay (Days)
- **Law Enforcement** (decay rate: 1.5, window: 48 hours)
- **Public Safety** (decay rate: 1.4, window: 72 hours)
- **Community Events** (decay rate: 1.6, window: 48 hours)
- **Hazards** (decay rate: 1.8, window: 24 hours)
- **Curb Alerts** (decay rate: 1.5, window: 24 hours)
- **Health & Wellness** (decay rate: 1.6, window: 48 hours)
- **Entertainment** (decay rate: 1.8, window: 24 hours)
- **Sports & Recreation** (decay rate: 1.7, window: 36 hours)

#### Slow Decay (Weeks)
- **Lost & Found** (decay rate: 1.0, window: 336 hours / 2 weeks)
- **Wildlife** (decay rate: 1.2, window: 168 hours / 1 week)
- **Infrastructure** (decay rate: 0.8, window: 720 hours / 30 days)
- **Urban Finds** (decay rate: 1.1, window: 504 hours / 3 weeks)
- **Automotive** (decay rate: 1.3, window: 168 hours / 1 week)
- **Civic Engagement** (decay rate: 1.4, window: 168 hours / 1 week)
- **Business** (decay rate: 1.4, window: 168 hours / 1 week)
- **Real Estate** (decay rate: 1.0, window: 336 hours / 2 weeks)
- **Environmental** (decay rate: 1.1, window: 240 hours / 10 days)

### 4. Enhanced Scoring Algorithm

The new time-adjusted score combines multiple factors:

```
time_adjusted_score = (base_score + flair_modifier) * importance_multiplier / (age_hours + 2)^decay_rate
```

Where:
- **base_score**: Upvotes, downvotes, confirmations, disputes
- **flair_modifier**: Sum of all assigned flairs' score modifiers
- **importance_multiplier**:
  - Critical: 2.0x
  - High: 1.5x
  - Normal: 1.0x
  - Low: 0.5x
- **decay_rate**: Category-specific decay power (0.6 - 2.5)

### 5. Visibility States

Sightings can have different visibility states based on flairs:

- **Boosted**: Flairs with "boost" impact (Safety Hazard, Urgent, etc.)
- **Visible**: Default state, normal ranking
- **Suppressed**: Flairs with "suppress" impact (Resolved, Cleared)
- **Hidden**: Flairs with "hide" impact (False Alarm, severe spam)
- **Archived**: Manually archived by moderators or reporters

## Database Schema

### New Tables

#### `flairs`
Defines available flair types
- System-wide and category-specific flairs
- Score modifiers and visibility impacts
- Auto-assignment conditions
- Display ordering

#### `sighting_flairs`
Many-to-many relationship between sightings and flairs
- Assignment metadata (who, when, how)
- Triggers automatic score recalculation

#### `flair_suggestions`
Community-driven flair suggestions
- Vote tracking
- Status (pending, applied, rejected)
- Auto-application logic

#### `category_decay_config`
Category-specific decay configurations
- Decay rate (power factor)
- Relevance window (hours)
- Importance multipliers per category

### Enhanced Sighting Columns

New columns added to `sightings` table:
- `time_adjusted_score`: Real-time relevance score
- `relevance_score`: 0-1 score within relevance window
- `decay_rate`: Category-specific or custom decay rate
- `last_score_update`: Timestamp of last calculation
- `flair_count`: Number of assigned flairs
- `primary_flair_id`: Most prominent flair
- `visibility_state`: Current visibility state

## API Endpoints

### Flairs

#### `GET /api/flairs`
Get available flairs
- Query params:
  - `categoryId`: Filter by category (includes system-wide)
  - `type`: Filter by flair type
  - `includeInactive`: Include inactive flairs

#### `GET /api/sightings/[id]/flairs`
Get all flairs assigned to a sighting

#### `POST /api/sightings/[id]/flairs`
Assign a flair to a sighting
- Body:
  ```json
  {
    "flairId": "flair-resolved",
    "assignmentMethod": "manual" | "moderator" | "consensus",
    "userId": "user123",
    "isModerator": false
  }
  ```

#### `DELETE /api/sightings/[id]/flairs?flairId=...&userId=...`
Remove a flair from a sighting

#### `POST /api/flair-suggestions/[id]/vote`
Vote on a community flair suggestion
- Body:
  ```json
  {
    "userId": "user123"
  }
  ```

### Enhanced Sighting Queries

Sighting list endpoints now support:
- Sorting by `time_adjusted_score` (default)
- Filtering by `visibilityState`
- Filtering by `primaryFlairId`

## Use Cases

### 1. Reporter Marks Sighting Resolved
```typescript
POST /api/sightings/123/flairs
{
  "flairId": "flair-resolved",
  "assignmentMethod": "manual",
  "userId": "reporter-id"
}
```
Result:
- Flair assigned
- Score modifier -0.5 applied
- Visibility state becomes "suppressed"
- Sighting drops in ranking

### 2. Moderator Marks Safety Hazard
```typescript
POST /api/sightings/456/flairs
{
  "flairId": "flair-safety-hazard",
  "assignmentMethod": "moderator",
  "userId": "mod-id",
  "isModerator": true
}
```
Result:
- Flair assigned
- Score modifier +2.0 applied
- Visibility state becomes "boosted"
- Sighting rises to top of feed

### 3. Community Suggests "Trending" Flair
```typescript
POST /api/sightings/789/flairs
{
  "flairId": "flair-trending",
  "assignmentMethod": "consensus",
  "userId": "user-id"
}
```
Result:
- Suggestion created with 1 vote
- If threshold reached (10% of engaged users), auto-applied

### 4. Auto-Assignment of "Urgent" Flair
System automatically assigns when:
- Sighting has high score within first hour
- Category is time-sensitive (e.g., Public Safety)
- Meets auto-assignment conditions

## Configuration

### Decay Rate Presets

Use these presets when creating categories:

```typescript
DECAY_PRESETS = {
  REAL_TIME: { decayRate: 2.5, relevanceWindowHours: 6 },
  HOURLY: { decayRate: 2.2, relevanceWindowHours: 12 },
  DAILY: { decayRate: 1.8, relevanceWindowHours: 24 },
  MULTI_DAY: { decayRate: 1.5, relevanceWindowHours: 72 },
  WEEKLY: { decayRate: 1.2, relevanceWindowHours: 168 },
  MONTHLY: { decayRate: 0.9, relevanceWindowHours: 720 },
  PERSISTENT: { decayRate: 0.6, relevanceWindowHours: 2160 },
}
```

### Creating Custom Flairs

```sql
INSERT INTO flairs (id, label, description, icon, color, category_id, flair_type, score_modifier, visibility_impact, display_order)
VALUES (
  'flair-custom',
  'Custom Status',
  'Custom description',
  '🔵',
  '#3b82f6',
  'cat-transportation', -- NULL for system-wide
  'status',
  0.5,
  'neutral',
  10
);
```

## Expanded Taxonomy

The taxonomy has been significantly expanded with 8 new categories:

### New Categories
1. **Health & Wellness** (🏥) - Medical facilities, health services, wellness resources
2. **Education** (📚) - School activities, educational resources, learning opportunities
3. **Entertainment** (🎭) - Live performances, shows, concerts, entertainment venues
4. **Sports & Recreation** (⚽) - Sports events, recreational activities, fitness opportunities
5. **Business** (💼) - Business openings, closures, sales, commercial activity
6. **Real Estate** (🏠) - Property listings, open houses, neighborhood changes
7. **Environmental** (🌱) - Environmental issues, conservation, sustainability efforts
8. **Technology** (💻) - Tech events, digital infrastructure, connectivity issues

### New Sighting Types (60+)
- Ambulance responses, mobile clinics, COVID testing sites
- School buses, book sales, educational workshops
- Street musicians, concerts, theater shows, outdoor movies
- Pickup games, running groups, hiking groups, kayaking
- Grand openings, flash sales, now hiring signs
- Open houses, for sale signs, new developments
- Pollution reports, recycling events, community cleanups
- Internet outages, EV charging stations, tech meetups

See `db/migrations/010_expand_taxonomy.sql` for the complete list.

## Migration Guide

### Running Migrations

```bash
# Apply flair system migration
psql $DATABASE_URL < db/migrations/009_add_flairs_and_decay_rates.sql

# Apply taxonomy expansion
psql $DATABASE_URL < db/migrations/010_expand_taxonomy.sql
```

### Updating Existing Code

If you're querying sightings, update to use the new scoring:

```typescript
// Old
ORDER BY hot_score DESC

// New
ORDER BY time_adjusted_score DESC, hot_score DESC
```

### UI Updates

When displaying sightings:
- Show primary flair as a badge
- Respect visibility state (don't show hidden items)
- Provide flair assignment UI for reporters/moderators
- Show flair suggestions with vote counts

## Performance Considerations

### Automatic Score Updates

Scores are automatically recalculated when:
- A flair is assigned or removed (via trigger)
- A reaction is added or removed (existing behavior)

For batch updates or periodic refresh:
```sql
UPDATE sightings
SET time_adjusted_score = calculate_time_adjusted_score(id),
    last_score_update = NOW()
WHERE last_score_update < NOW() - INTERVAL '1 hour';
```

### Indexing

New indexes support efficient queries:
- `idx_sightings_time_adjusted_score` - Primary sorting
- `idx_sightings_visibility_state` - Filtering hidden content
- `idx_sightings_primary_flair` - Flair-based filtering
- `idx_sighting_flairs_sighting` - Flair lookups
- `idx_category_decay_config_rate` - Decay config lookups

## Best Practices

### When to Use Flairs

1. **Resolved/Cleared**: When issue is no longer active
2. **Safety Hazard**: For immediate safety concerns
3. **Urgent**: Time-critical situations
4. **Verified**: Multiple confirmations or official sources
5. **Trending**: High community engagement
6. **Duplicate**: Similar sighting already exists

### Moderator Guidelines

- Use flairs to improve content quality, not to editorialize
- Apply "Verified" only with strong evidence
- Use "Duplicate" to reduce clutter
- Mark "False Alarm" for incorrect reports
- Boost "Safety Hazard" flairs for community awareness

### Community Guidelines

- Suggest flairs honestly and accurately
- Vote on suggestions you can verify
- Don't spam flair suggestions
- Respect moderator decisions

## Future Enhancements

Potential additions:
- Custom flairs per signal
- Flair reputation (accuracy tracking)
- Time-based auto-removal of flairs
- Flair analytics dashboard
- ML-powered auto-assignment
- User flair preferences (hide resolved, boost safety)

## Support

For questions or issues:
- Check the API documentation
- Review use case examples above
- File an issue on GitHub
- Contact the development team
