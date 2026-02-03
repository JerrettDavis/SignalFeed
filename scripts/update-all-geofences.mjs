#!/usr/bin/env node

/**
 * Comprehensive script to update all geofence names with location context
 */

import postgres from 'postgres';

const POSTGRES_URL = "process.env.POSTGRES_URL";

const sql = postgres(POSTGRES_URL);

// Manual mapping for geofences that couldn't be automatically detected
const MANUAL_LOCATION_MAP = {
  'geofence-001': 'San Francisco, CA', // Downtown District - SF coordinates
  'geofence-002': 'San Francisco, CA', // Harbor Area - SF coordinates
  'geofence-003': 'San Francisco, CA', // University Campus - SF coordinates
  'geofence-004': 'San Francisco, CA', // Airport Vicinity - SF coordinates
  'geofence-005': 'San Francisco, CA', // Industrial Zone - SF coordinates
};

async function getAllGeofences() {
  const geofences = await sql`
    SELECT id, name, visibility, polygon
    FROM geofences
    ORDER BY id;
  `;

  return geofences;
}

function determineLocation(geofence) {
  // Check manual mapping first
  if (MANUAL_LOCATION_MAP[geofence.id]) {
    return MANUAL_LOCATION_MAP[geofence.id];
  }

  const polygon = geofence.polygon;

  if (polygon?.points && polygon.points.length > 0) {
    const lat = polygon.points[0].lat;
    const lng = polygon.points[0].lng;

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
  }

  return null;
}

function needsUpdate(currentName, location) {
  if (!location) return false;

  // Already has location context
  if (currentName.includes(location)) return false;

  // Has some state abbreviation
  if (/,\s*[A-Z]{2}/.test(currentName)) return false;

  // Check if location is redundant (e.g., "Downtown Tulsa" + "Tulsa, OK")
  const locationCity = location.split(',')[0].trim();
  if (currentName.includes(locationCity)) return false;

  return true;
}

async function generateUpdates() {
  console.log('🔍 Analyzing all geofences...\n');

  const geofences = await getAllGeofences();
  const updates = [];

  for (const geofence of geofences) {
    const location = determineLocation(geofence);

    console.log(`${geofence.id}: ${geofence.name}`);

    if (location) {
      console.log(`  📍 Detected location: ${location}`);

      if (needsUpdate(geofence.name, location)) {
        const newName = `${geofence.name}, ${location}`;
        updates.push({
          id: geofence.id,
          currentName: geofence.name,
          newName,
          location
        });
        console.log(`  ✏️  Proposed: "${newName}"`);
      } else {
        console.log(`  ✅ Name already descriptive`);
      }
    } else {
      console.log(`  ⚠️  Could not determine location`);
    }
    console.log();
  }

  return { geofences, updates };
}

async function applyUpdates(updates, dryRun = true) {
  console.log('\n' + '='.repeat(80));
  console.log(`🔧 ${dryRun ? 'DRY RUN - PREVIEW' : 'APPLYING UPDATES'}`);
  console.log('='.repeat(80) + '\n');

  if (updates.length === 0) {
    console.log('✅ All geofences already have descriptive names!\n');
    return;
  }

  console.log(`Found ${updates.length} geofence(s) to update:\n`);

  for (const update of updates) {
    console.log(`${dryRun ? '[DRY RUN]' : '[UPDATING]'} ${update.id}`);
    console.log(`  Current: "${update.currentName}"`);
    console.log(`  New:     "${update.newName}"`);

    if (!dryRun) {
      await sql`
        UPDATE geofences
        SET name = ${update.newName}
        WHERE id = ${update.id}
      `;
      console.log(`  ✅ Updated successfully`);
    }
    console.log();
  }

  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN. No changes were made to the database.');
    console.log('To apply these changes, run: node scripts/update-all-geofences.mjs --apply\n');
  } else {
    console.log(`\n✅ Successfully updated ${updates.length} geofence name(s)!\n`);
  }
}

async function verifySignals() {
  console.log('='.repeat(80));
  console.log('🔍 VERIFYING SIGNAL-GEOFENCE ASSOCIATIONS');
  console.log('='.repeat(80) + '\n');

  const result = await sql`
    SELECT
      s.id,
      s.name,
      s.target,
      s.is_active,
      g.id as geofence_id,
      g.name as geofence_name
    FROM signals s
    LEFT JOIN geofences g ON (s.target->>'geofenceId') = g.id
    WHERE s.target->>'kind' = 'geofence'
    ORDER BY s.name;
  `;

  console.log(`Found ${result.length} geofence-based signal(s):\n`);

  let allValid = true;

  for (const signal of result) {
    if (!signal.geofence_id) {
      console.log(`❌ ${signal.name} (${signal.id})`);
      console.log(`   Missing geofence: ${signal.target.geofenceId}`);
      allValid = false;
    } else {
      console.log(`✅ ${signal.name}`);
      console.log(`   → ${signal.geofence_name} (${signal.geofence_id})`);
    }
  }

  console.log();

  if (allValid) {
    console.log('✅ All signals are properly associated with valid geofences!\n');
  } else {
    console.log('⚠️  Some signals are missing valid geofence associations.\n');
  }

  return allValid;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');

  console.log('\n🚀 GEOFENCE NAME UPDATER\n');
  console.log('='.repeat(80));
  console.log(`Database: Production (${POSTGRES_URL.split('@')[1].split('/')[0]}...)`);
  console.log(`Mode: ${apply ? '🔴 LIVE - CHANGES WILL BE COMMITTED' : '🟡 DRY RUN - PREVIEW ONLY'}`);
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Generate proposed updates
    const { geofences, updates } = await generateUpdates();

    // Step 2: Apply updates (or show preview)
    await applyUpdates(updates, !apply);

    // Step 3: Verify all signals have valid geofences
    const signalsValid = await verifySignals();

    // Final summary
    console.log('='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total geofences: ${geofences.length}`);
    console.log(`Geofences updated: ${updates.length}`);
    console.log(`All signals valid: ${signalsValid ? '✅ Yes' : '❌ No'}`);

    if (!apply && updates.length > 0) {
      console.log('\n💡 To apply these changes, run:');
      console.log('   node scripts/update-all-geofences.mjs --apply\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
