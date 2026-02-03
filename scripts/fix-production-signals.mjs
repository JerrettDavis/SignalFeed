#!/usr/bin/env node

/**
 * Script to fix production signals and geofences:
 * 1. Identify signals without valid geofences
 * 2. Update geofence names to be more descriptive with location context
 * 3. Ensure all signals are properly tied to geofences
 */

import postgres from 'postgres';

const POSTGRES_URL = "process.env.POSTGRES_URL";

const sql = postgres(POSTGRES_URL);

async function analyzeCurrentState() {
  console.log('🔍 ANALYZING CURRENT STATE\n');
  console.log('=' .repeat(80));

  // Get all signals with their geofence info
  const signals = await sql`
    SELECT
      s.id,
      s.name,
      s.target,
      s.is_active,
      g.id as geofence_id,
      g.name as geofence_name,
      g.visibility
    FROM signals s
    LEFT JOIN geofences g ON (s.target->>'geofenceId') = g.id
    ORDER BY s.created_at DESC;
  `;

  console.log(`\n📊 SIGNALS SUMMARY (${signals.length} total):`);
  console.log('-'.repeat(80));

  const signalsWithoutGeofences = [];
  const signalsWithGeofences = [];
  const globalSignals = [];

  for (const signal of signals) {
    const targetKind = signal.target?.kind || 'unknown';

    if (targetKind === 'global') {
      globalSignals.push(signal);
      console.log(`✅ ${signal.name}`);
      console.log(`   ID: ${signal.id}`);
      console.log(`   Type: Global signal`);
      console.log(`   Active: ${signal.is_active}`);
    } else if (targetKind === 'geofence') {
      if (!signal.geofence_id) {
        signalsWithoutGeofences.push(signal);
        console.log(`❌ ${signal.name}`);
        console.log(`   ID: ${signal.id}`);
        console.log(`   Type: Geofence signal`);
        console.log(`   Problem: Missing geofence (ID: ${signal.target.geofenceId})`);
        console.log(`   Active: ${signal.is_active}`);
      } else {
        signalsWithGeofences.push(signal);
        console.log(`✅ ${signal.name}`);
        console.log(`   ID: ${signal.id}`);
        console.log(`   Type: Geofence signal`);
        console.log(`   Geofence: ${signal.geofence_name} (${signal.geofence_id})`);
        console.log(`   Active: ${signal.is_active}`);
      }
    }
    console.log();
  }

  // Get all geofences
  const geofences = await sql`
    SELECT id, name, visibility, owner_id, polygon
    FROM geofences
    ORDER BY name;
  `;

  console.log(`\n🗺️  GEOFENCES SUMMARY (${geofences.length} total):`);
  console.log('-'.repeat(80));

  const needsImprovement = [];

  for (const geofence of geofences) {
    // Check if name is descriptive enough (should ideally have location context)
    const hasLocationContext = /,\s*[A-Z]{2}/.test(geofence.name) || // Has state abbreviation
                                /Tulsa|Oklahoma|Austin|Texas|City|County/.test(geofence.name);

    if (!hasLocationContext) {
      needsImprovement.push(geofence);
      console.log(`⚠️  ${geofence.name}`);
      console.log(`   ID: ${geofence.id}`);
      console.log(`   Issue: Name lacks location context`);
    } else {
      console.log(`✅ ${geofence.name}`);
      console.log(`   ID: ${geofence.id}`);
    }
    console.log(`   Visibility: ${geofence.visibility}`);

    // Extract approximate center from polygon
    if (geofence.polygon?.points && geofence.polygon.points.length > 0) {
      const firstPoint = geofence.polygon.points[0];
      console.log(`   Location: ~${firstPoint.lat.toFixed(4)}, ${firstPoint.lng.toFixed(4)}`);
    }
    console.log();
  }

  return {
    signals,
    geofences,
    signalsWithoutGeofences,
    signalsWithGeofences,
    globalSignals,
    geofencesNeedingImprovement: needsImprovement
  };
}

async function proposeGeofenceNameUpdates(geofences) {
  console.log('\n\n📝 PROPOSED GEOFENCE NAME UPDATES\n');
  console.log('=' .repeat(80));

  const updates = [];

  for (const geofence of geofences) {
    // Try to determine location from coordinates
    const polygon = geofence.polygon;
    let location = '';

    if (polygon?.points && polygon.points.length > 0) {
      const lat = polygon.points[0].lat;
      const lng = polygon.points[0].lng;

      // Tulsa, OK area (roughly 36.1°N, 95.9°W)
      if (lat > 36.0 && lat < 36.3 && lng < -95.8 && lng > -96.1) {
        location = 'Tulsa, OK';
      }
      // Austin, TX area (roughly 30.3°N, 97.7°W)
      else if (lat > 30.1 && lat < 30.5 && lng < -97.5 && lng > -97.9) {
        location = 'Austin, TX';
      }
      // San Francisco area (roughly 37.7°N, 122.4°W)
      else if (lat > 37.6 && lat < 37.9 && lng < -122.3 && lng > -122.5) {
        location = 'San Francisco, CA';
      }
    }

    if (location) {
      const currentName = geofence.name;
      const newName = `${currentName}, ${location}`;

      // Only suggest update if it would actually change
      if (currentName !== newName && !currentName.includes(location)) {
        updates.push({
          id: geofence.id,
          currentName,
          newName,
          location
        });

        console.log(`Update: ${geofence.id}`);
        console.log(`  Current: "${currentName}"`);
        console.log(`  New:     "${newName}"`);
        console.log();
      }
    }
  }

  return updates;
}

async function applyUpdates(updates, dryRun = true) {
  if (updates.length === 0) {
    console.log('\n✅ No updates needed!\n');
    return;
  }

  console.log('\n\n🔧 APPLYING UPDATES\n');
  console.log('=' .repeat(80));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be committed)'}\n`);

  for (const update of updates) {
    console.log(`${dryRun ? '[DRY RUN]' : '[UPDATING]'} ${update.id}`);
    console.log(`  "${update.currentName}" → "${update.newName}"`);

    if (!dryRun) {
      await sql`
        UPDATE geofences
        SET name = ${update.newName}
        WHERE id = ${update.id}
      `;
      console.log(`  ✅ Updated`);
    }
    console.log();
  }

  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN. No changes were made.');
    console.log('To apply these changes, run: node fix-production-signals.mjs --apply\n');
  } else {
    console.log(`\n✅ Successfully updated ${updates.length} geofence names!\n`);
  }
}

async function identifySignalsNeedingGeofences(signalsWithoutGeofences) {
  if (signalsWithoutGeofences.length === 0) {
    console.log('\n✅ All signals have valid geofences!\n');
    return;
  }

  console.log('\n\n⚠️  SIGNALS REQUIRING ATTENTION\n');
  console.log('=' .repeat(80));
  console.log(`Found ${signalsWithoutGeofences.length} signal(s) without valid geofences:\n`);

  for (const signal of signalsWithoutGeofences) {
    console.log(`Signal: ${signal.name} (${signal.id})`);
    console.log(`  Target: ${JSON.stringify(signal.target)}`);
    console.log(`  Problem: Referenced geofence does not exist`);
    console.log(`  Recommendation: Either create the missing geofence or convert to global signal`);
    console.log();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');

  console.log('\n🚀 PRODUCTION SIGNALS & GEOFENCES FIXER\n');
  console.log('=' .repeat(80));
  console.log(`Database: ${POSTGRES_URL.split('@')[1].split('/')[0]}...`);
  console.log(`Mode: ${apply ? 'APPLY CHANGES' : 'DRY RUN'}`);
  console.log('=' .repeat(80));

  try {
    // Step 1: Analyze current state
    const analysis = await analyzeCurrentState();

    // Step 2: Propose geofence name updates
    const updates = await proposeGeofenceNameUpdates(analysis.geofencesNeedingImprovement);

    // Step 3: Apply updates (or show what would be applied)
    await applyUpdates(updates, !apply);

    // Step 4: Identify signals that need attention
    await identifySignalsNeedingGeofences(analysis.signalsWithoutGeofences);

    // Final summary
    console.log('\n📊 FINAL SUMMARY\n');
    console.log('=' .repeat(80));
    console.log(`Total Signals: ${analysis.signals.length}`);
    console.log(`  - Global signals: ${analysis.globalSignals.length}`);
    console.log(`  - Signals with valid geofences: ${analysis.signalsWithGeofences.length}`);
    console.log(`  - Signals missing geofences: ${analysis.signalsWithoutGeofences.length}`);
    console.log();
    console.log(`Total Geofences: ${analysis.geofences.length}`);
    console.log(`  - Geofences with descriptive names: ${analysis.geofences.length - analysis.geofencesNeedingImprovement.length}`);
    console.log(`  - Geofences needing improvement: ${analysis.geofencesNeedingImprovement.length}`);
    console.log(`  - Proposed updates: ${updates.length}`);
    console.log();

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
