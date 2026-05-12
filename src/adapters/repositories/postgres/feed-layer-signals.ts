import type { Sql } from "postgres";

export const FEED_LAYER_SIGNAL_IDS = [
  "signal-layer-weather-alerts",
  "signal-layer-tornado-alerts",
  "signal-layer-flood-alerts",
  "signal-layer-storm-alerts",
  "signal-layer-winter-weather-alerts",
  "signal-layer-tropical-cyclones",
  "signal-layer-heat-alerts",
  "signal-layer-earthquakes",
] as const;

export const ensureFeedLayerSignals = async (sql: Sql): Promise<boolean> => {
  const existing = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM signals
    WHERE id = ANY(${[...FEED_LAYER_SIGNAL_IDS]})
  `;
  const hasMissingSignals =
    Number(existing[0]?.count ?? 0) !== FEED_LAYER_SIGNAL_IDS.length;

  const staleFeedSightings = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM sightings
    WHERE
      (
        fields->>'feedSource' = 'noaa-weather'
        AND (
          category_id <> 'cat-weather-alerts'
          OR type_id NOT IN (
            'type-tornado-alert',
            'type-severe-thunderstorm-alert',
            'type-flood-alert',
            'type-winter-storm-alert',
            'type-hurricane-alert',
            'type-heat-alert',
            'type-weather-alert'
          )
        )
      )
      OR (
        fields->>'feedSource' = 'usgs-earthquakes'
        AND (category_id <> 'cat-seismic-events' OR type_id <> 'type-earthquake')
      )
  `;
  const hasStaleFeedSightings = Number(staleFeedSightings[0]?.count ?? 0) > 0;

  if (!hasMissingSignals && !hasStaleFeedSightings) {
    return false;
  }

  await sql`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
  `;
  await sql`
    ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('user', 'moderator', 'admin', 'system'))
  `;
  await sql`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_membership_tier_check
  `;
  await sql`
    ALTER TABLE users
      ADD CONSTRAINT users_membership_tier_check
      CHECK (membership_tier IN ('free', 'paid', 'admin', 'system'))
  `;

  await sql`
    INSERT INTO users (id, email, username, role, status, membership_tier, created_at, updated_at)
    VALUES
      ('system-noaa', 'feeds+noaa@sightsignal.app', 'NOAA Weather Service', 'system', 'active', 'system', NOW(), NOW()),
      ('system-usgs', 'feeds+usgs@sightsignal.app', 'USGS Earthquake Hazards', 'system', 'active', 'system', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      updated_at = NOW()
  `;

  await sql`
    INSERT INTO categories (id, label, icon, description)
    VALUES
      ('cat-weather-alerts', 'Weather Alerts', '⚠️', 'Official watches, warnings, and advisories from weather feeds'),
      ('cat-seismic-events', 'Seismic Events', '🏔️', 'Earthquakes, tsunami risk, and geological event feeds')
    ON CONFLICT (id) DO UPDATE SET
      label = EXCLUDED.label,
      icon = EXCLUDED.icon,
      description = EXCLUDED.description
  `;

  await sql`
    INSERT INTO subcategories (id, label, category_id, description)
    VALUES
      ('sub-weather-warnings', 'Weather Warnings', 'cat-weather-alerts', 'Official weather warnings and watches'),
      ('sub-weather-advisories', 'Weather Advisories', 'cat-weather-alerts', 'Official weather advisories and lower-severity alerts'),
      ('sub-earthquakes', 'Earthquakes', 'cat-seismic-events', 'USGS earthquake events and seismic activity'),
      ('sub-tsunami-risk', 'Tsunami Risk', 'cat-seismic-events', 'Seismic events with tsunami risk metadata')
    ON CONFLICT (id) DO UPDATE SET
      label = EXCLUDED.label,
      category_id = EXCLUDED.category_id,
      description = EXCLUDED.description
  `;

  await sql`
    INSERT INTO sighting_types (id, category_id, subcategory_id, label, icon, tags)
    VALUES
      ('type-tornado-alert', 'cat-weather-alerts', 'sub-weather-warnings', 'Tornado Alert', '🌪️', ARRAY['weather', 'tornado', 'warning', 'watch', 'noaa']),
      ('type-severe-thunderstorm-alert', 'cat-weather-alerts', 'sub-weather-warnings', 'Severe Thunderstorm Alert', '⛈️', ARRAY['weather', 'storm', 'thunderstorm', 'warning', 'noaa']),
      ('type-flood-alert', 'cat-weather-alerts', 'sub-weather-warnings', 'Flood Alert', '🌊', ARRAY['weather', 'flood', 'water', 'warning', 'noaa']),
      ('type-winter-storm-alert', 'cat-weather-alerts', 'sub-weather-warnings', 'Winter Storm Alert', '❄️', ARRAY['weather', 'winter', 'snow', 'ice', 'noaa']),
      ('type-hurricane-alert', 'cat-weather-alerts', 'sub-weather-warnings', 'Tropical Cyclone Alert', '🌀', ARRAY['weather', 'hurricane', 'tropical', 'warning', 'noaa']),
      ('type-heat-alert', 'cat-weather-alerts', 'sub-weather-advisories', 'Heat Alert', '🌡️', ARRAY['weather', 'heat', 'advisory', 'warning', 'noaa']),
      ('type-weather-alert', 'cat-weather-alerts', 'sub-weather-advisories', 'Weather Alert', '⚠️', ARRAY['weather', 'alert', 'advisory', 'noaa']),
      ('type-earthquake', 'cat-seismic-events', 'sub-earthquakes', 'Earthquake', '🏔️', ARRAY['geological', 'seismic', 'earthquake', 'usgs'])
    ON CONFLICT (id) DO UPDATE SET
      category_id = EXCLUDED.category_id,
      subcategory_id = EXCLUDED.subcategory_id,
      label = EXCLUDED.label,
      icon = EXCLUDED.icon,
      tags = EXCLUDED.tags
  `;

  await sql`
    UPDATE sightings
    SET
      category_id = 'cat-weather-alerts',
      type_id = CASE type_id
        WHEN 'type-tornado' THEN 'type-tornado-alert'
        WHEN 'type-severe-weather' THEN 'type-severe-thunderstorm-alert'
        WHEN 'type-flood' THEN 'type-flood-alert'
        WHEN 'type-flooding' THEN 'type-flood-alert'
        WHEN 'type-winter-storm' THEN 'type-winter-storm-alert'
        WHEN 'type-hurricane' THEN 'type-hurricane-alert'
        WHEN 'type-heat-advisory' THEN 'type-heat-alert'
        ELSE 'type-weather-alert'
      END
    WHERE fields->>'feedSource' = 'noaa-weather'
  `;

  await sql`
    UPDATE sightings
    SET
      category_id = 'cat-seismic-events',
      type_id = 'type-earthquake'
    WHERE fields->>'feedSource' = 'usgs-earthquakes'
  `;

  await sql`
    INSERT INTO signals (
      id,
      name,
      description,
      owner_id,
      target,
      triggers,
      conditions,
      is_active,
      classification,
      view_count,
      unique_viewers,
      active_viewers,
      sighting_count,
      created_at,
      updated_at
    )
    VALUES
      ('signal-layer-weather-alerts', 'Weather Alerts', 'Official NOAA weather alerts as a global map layer.', 'system-noaa', '{"kind":"global"}'::jsonb, ARRAY['new_sighting']::text[], '{"categoryIds":["cat-weather-alerts"]}'::jsonb, TRUE, 'official', 0, 0, 0, 0, NOW(), NOW()),
      ('signal-layer-tornado-alerts', 'Tornado Alerts', 'Official tornado watches and warnings.', 'system-noaa', '{"kind":"global"}'::jsonb, ARRAY['new_sighting']::text[], '{"typeIds":["type-tornado-alert"]}'::jsonb, TRUE, 'official', 0, 0, 0, 0, NOW(), NOW()),
      ('signal-layer-flood-alerts', 'Flood Alerts', 'Official flood and flash flood alerts.', 'system-noaa', '{"kind":"global"}'::jsonb, ARRAY['new_sighting']::text[], '{"typeIds":["type-flood-alert"]}'::jsonb, TRUE, 'official', 0, 0, 0, 0, NOW(), NOW()),
      ('signal-layer-storm-alerts', 'Severe Storm Alerts', 'Official severe thunderstorm watches and warnings.', 'system-noaa', '{"kind":"global"}'::jsonb, ARRAY['new_sighting']::text[], '{"typeIds":["type-severe-thunderstorm-alert"]}'::jsonb, TRUE, 'official', 0, 0, 0, 0, NOW(), NOW()),
      ('signal-layer-winter-weather-alerts', 'Winter Weather Alerts', 'Official winter storm, blizzard, and ice storm alerts.', 'system-noaa', '{"kind":"global"}'::jsonb, ARRAY['new_sighting']::text[], '{"typeIds":["type-winter-storm-alert"]}'::jsonb, TRUE, 'official', 0, 0, 0, 0, NOW(), NOW()),
      ('signal-layer-tropical-cyclones', 'Tropical Cyclone Alerts', 'Official hurricane and tropical storm alerts.', 'system-noaa', '{"kind":"global"}'::jsonb, ARRAY['new_sighting']::text[], '{"typeIds":["type-hurricane-alert"]}'::jsonb, TRUE, 'official', 0, 0, 0, 0, NOW(), NOW()),
      ('signal-layer-heat-alerts', 'Heat Alerts', 'Official heat advisories, watches, and warnings.', 'system-noaa', '{"kind":"global"}'::jsonb, ARRAY['new_sighting']::text[], '{"typeIds":["type-heat-alert"]}'::jsonb, TRUE, 'official', 0, 0, 0, 0, NOW(), NOW()),
      ('signal-layer-earthquakes', 'Earthquakes', 'Official USGS earthquake events as a global map layer.', 'system-usgs', '{"kind":"global"}'::jsonb, ARRAY['new_sighting']::text[], '{"categoryIds":["cat-seismic-events"]}'::jsonb, TRUE, 'official', 0, 0, 0, 0, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      owner_id = EXCLUDED.owner_id,
      target = EXCLUDED.target,
      triggers = EXCLUDED.triggers,
      conditions = EXCLUDED.conditions,
      is_active = EXCLUDED.is_active,
      classification = EXCLUDED.classification,
      updated_at = NOW()
  `;

  return true;
};

export const associateFeedSightingsWithLayerSignals = async (sql: Sql) => {
  await sql`
    WITH layer_matches(signal_id, category_id, type_id) AS (
      VALUES
        ('signal-layer-weather-alerts', 'cat-weather-alerts', NULL),
        ('signal-layer-tornado-alerts', NULL, 'type-tornado-alert'),
        ('signal-layer-flood-alerts', NULL, 'type-flood-alert'),
        ('signal-layer-storm-alerts', NULL, 'type-severe-thunderstorm-alert'),
        ('signal-layer-winter-weather-alerts', NULL, 'type-winter-storm-alert'),
        ('signal-layer-tropical-cyclones', NULL, 'type-hurricane-alert'),
        ('signal-layer-heat-alerts', NULL, 'type-heat-alert'),
        ('signal-layer-earthquakes', 'cat-seismic-events', NULL)
    )
    INSERT INTO signal_sightings (id, signal_id, sighting_id, added_by, added_at)
    SELECT
      'ss-' || s.id || '-' || lm.signal_id,
      lm.signal_id,
      s.id,
      CASE
        WHEN s.category_id = 'cat-seismic-events' THEN 'system-usgs'
        ELSE 'system-noaa'
      END,
      COALESCE(s.created_at, NOW())
    FROM sightings s
    JOIN layer_matches lm
      ON (lm.category_id IS NOT NULL AND s.category_id = lm.category_id)
      OR (lm.type_id IS NOT NULL AND s.type_id = lm.type_id)
    ON CONFLICT (signal_id, sighting_id) DO NOTHING
  `;

  await sql`
    UPDATE signals
    SET sighting_count = COALESCE(counts.total, 0)
    FROM (
      SELECT signal_id, COUNT(*)::int AS total
      FROM signal_sightings
      WHERE signal_id = ANY(${[...FEED_LAYER_SIGNAL_IDS]})
      GROUP BY signal_id
    ) counts
    WHERE signals.id = counts.signal_id
  `;
};
