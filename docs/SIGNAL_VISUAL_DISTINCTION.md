# Signal Visual Distinction

## Overview

Signals now have clear visual indicators to distinguish between **Global Signals** and **Geofenced (Area-Specific) Signals**. This helps users instantly understand the scope and coverage of each signal.

## Visual Indicators

### Signal List Sidebar

In the signal list sidebar, each signal now displays:

1. **Icon Badge**
   - **Global Signals**: 🌐 Blue globe icon
   - **Geofenced Signals**: 📍 Green location pin icon

2. **Text Badge**
   - **Global**: Small blue badge with "GLOBAL" text
   - **Area**: Small green badge with "AREA" text

3. **Color Coding**
   - Global signals use **blue** color scheme
   - Geofenced signals use **green** color scheme

### Signal Cards (Browse/Management View)

Signal cards feature enhanced visual distinction:

1. **Target Badge**
   - Colored pill badge showing signal type
   - Different icons for each type:
     - **Global Coverage**: Globe icon with blue background
     - **Area-Specific**: Location pin with green background
     - **Custom Area**: Polygon icon with purple background

2. **Card Border**
   - Active signals have colored borders matching their type:
     - **Global**: Blue border (hover: darker blue)
     - **Geofenced**: Green border (hover: darker green)
     - **Polygon**: Purple border (hover: darker purple)

3. **Text Labels**
   - **Global signals**: "Global Coverage"
   - **Geofenced signals**: "Area-Specific"
   - **Polygon signals**: "Custom Area"

## Color Scheme

### Global Signals
- **Primary Color**: Blue (#3B82F6)
- **Background**: Light blue (#EFF6FF)
- **Border**: Blue-200 (#BFDBFE)
- **Text**: Blue-700 (#1D4ED8)

### Geofenced Signals
- **Primary Color**: Green (#10B981)
- **Background**: Light green (#F0FDF4)
- **Border**: Green-200 (#BBF7D0)
- **Text**: Green-700 (#15803D)

### Custom Polygon Signals
- **Primary Color**: Purple (#8B5CF6)
- **Background**: Light purple (#FAF5FF)
- **Border**: Purple-200 (#DDD6FE)
- **Text**: Purple-700 (#6D28D9)

## User Experience Benefits

1. **Quick Recognition**: Users can instantly identify signal types at a glance
2. **Better Navigation**: Clear visual distinction helps users find area-specific vs. global signals
3. **Reduced Confusion**: No more wondering why a signal doesn't zoom to a location (global signals don't have one!)
4. **Consistent Design**: Color coding is consistent across all views

## Implementation Details

### Files Modified

1. **`src/components/navigation/SignalListSidebar.tsx`**
   - Added icon indicators (globe vs. location pin)
   - Added text badges (GLOBAL vs. AREA)
   - Applied color coding to icons and badges

2. **`src/components/signals/SignalCard.tsx`**
   - Enhanced target badge with colored backgrounds
   - Added different icons for each signal type
   - Applied colored borders to cards
   - Updated text labels for clarity

### Key Functions

#### SignalCard Component

```typescript
// Get human-readable label
const getTargetLabel = () => {
  switch (signal.target.kind) {
    case "geofence": return "Area-Specific";
    case "polygon": return "Custom Area";
    case "global": return "Global Coverage";
    default: return "Unknown";
  }
};

// Get color styles for each type
const getTargetStyles = () => {
  switch (signal.target.kind) {
    case "geofence":
      return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" };
    case "polygon":
      return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" };
    case "global":
      return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
  }
};

// Get card border style
const cardBorderStyle = () => {
  if (!signal.isActive) return "border-[color:var(--border)] opacity-60";

  switch (signal.target.kind) {
    case "global": return "border-blue-200 hover:border-blue-300";
    case "geofence": return "border-green-200 hover:border-green-300";
    case "polygon": return "border-purple-200 hover:border-purple-300";
    default: return "border-white/70";
  }
};
```

## Examples

### Global Signal Examples
- "All Sightings" - Monitors all sightings everywhere
- "Traffic Alerts" - Global traffic monitoring
- "Wildlife Watchers" - Wildlife sightings anywhere
- "Infrastructure Alerts" - Infrastructure issues globally
- "Emergency Alerts - Citywide" - Emergency alerts across all areas

### Geofenced Signal Examples
- "Downtown Emergencies" - Critical events in Downtown District, San Francisco, CA
- "Harbor Area Activities" - Events in Harbor Area, San Francisco, CA
- "Cherry Street Food Scene" - Food trucks in Cherry Street District, Tulsa, OK
- "School Zone Safety Alerts" - Alerts near Edison High School Zone, Tulsa, OK
- "River Parks Trail Updates" - Trail conditions along River Parks Trail, Tulsa, OK

## Accessibility

- Color is not the only indicator (icons and text labels also used)
- High contrast ratios maintained for text readability
- Icons use standard SVG paths for screen reader compatibility
- Hover states provide additional visual feedback

## Future Enhancements

Potential improvements to consider:
1. Filter signals by type (show only global, only geofenced, etc.)
2. Group signals by type in the sidebar
3. Add tooltips explaining the difference between signal types
4. Allow users to set preferences for which type they prefer to see first
5. Add keyboard shortcuts for filtering by signal type

## Related Documentation

- [Geofence Naming Convention](./GEOFENCE_NAMING_CONVENTION.md)
- [Signal Architecture](./signals-architecture.md) (if exists)
- [UI Design System](./ui-design-system.md) (if exists)
