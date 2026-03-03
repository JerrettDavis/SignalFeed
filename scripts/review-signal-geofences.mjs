#!/usr/bin/env node

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
function loadEnv() {
  const envFiles = ['.env.production.local', '.env.local'];
  for (const envFile of envFiles) {
    try {
      const envPath = join(__dirname, `../${envFile}`);
      const envContent = readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          value = value.replace(/\\r/g, '').replace(/\\n/g, '').replace(/\\\$/g, '$');
          process.env[key] = value;
        }
      });
      console.log(`✅ Loaded environment from ${envFile}`);
      return;
    } catch {
      continue;
    }
  }
}

loadEnv();

const databaseUrl = process.env.POSTGRES_URL || process.env.SIGNALFEED_DATABASE_URL || process.env.SIGHTSIGNAL_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: Database URL not set');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function reviewSignals() {
  try {
    console.log('📊 Production Signal Review');
    console.log('==========================\n');

    // Get all active signals
    const signals = await sql`
      SELECT
        s.id,
        s.name,
        s.target,
        s.is_active,
        COUNT(DISTINCT ss.sighting_id) as sighting_count
      FROM signals s
      LEFT JOIN signal_sightings ss ON s.id = ss.signal_id
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.target, s.is_active
      ORDER BY s.created_at DESC
    `;

    console.log(`Found ${signals.length} active signals\n`);

    // Get all geofences for reference
    const geofences = await sql`
      SELECT id, name
      FROM geofences
      ORDER BY name
    `;

    const geofenceMap = new Map(geofences.map(g => [g.id, g.name]));

    console.log('📍 Available Geofences:');
    console.log('======================');
    geofences.forEach(g => {
      console.log(`  ${g.id} → ${g.name}`);
    });
    console.log('');

    // Analyze signals
    const signalsWithGeofence = [];
    const signalsWithGlobal = [];
    const signalsMissingGeofence = [];

    signals.forEach(signal => {
      const target = signal.target;
      const targetKind = target?.kind || 'unknown';
      const geofenceId = target?.geofenceId;

      const signalInfo = {
        id: signal.id,
        name: signal.name,
        targetKind,
        geofenceId,
        geofenceName: geofenceId ? geofenceMap.get(geofenceId) : null,
        sightingCount: Number(signal.sighting_count),
      };

      if (targetKind === 'global') {
        signalsWithGlobal.push(signalInfo);
      } else if (targetKind === 'geofence') {
        if (geofenceId && geofenceMap.has(geofenceId)) {
          signalsWithGeofence.push(signalInfo);
        } else {
          signalsMissingGeofence.push(signalInfo);
        }
      }
    });

    // Report
    console.log('🎯 Signals with Valid Geofences:');
    console.log('================================');
    if (signalsWithGeofence.length === 0) {
      console.log('  (none)');
    } else {
      signalsWithGeofence.forEach(s => {
        console.log(`  ✓ ${s.name}`);
        console.log(`    - ID: ${s.id}`);
        console.log(`    - Geofence: ${s.geofenceName} (${s.geofenceId})`);
        console.log(`    - Sightings: ${s.sightingCount}`);
        console.log('');
      });
    }

    console.log('🌍 Signals with Global Target:');
    console.log('==============================');
    if (signalsWithGlobal.length === 0) {
      console.log('  (none)');
    } else {
      signalsWithGlobal.forEach(s => {
        console.log(`  ○ ${s.name}`);
        console.log(`    - ID: ${s.id}`);
        console.log(`    - Target: global (no geofence)`);
        console.log(`    - Sightings: ${s.sightingCount}`);
        console.log('');
      });
    }

    console.log('⚠️  Signals with Missing Geofences:');
    console.log('===================================');
    if (signalsMissingGeofence.length === 0) {
      console.log('  (none)');
    } else {
      signalsMissingGeofence.forEach(s => {
        console.log(`  ✗ ${s.name}`);
        console.log(`    - ID: ${s.id}`);
        console.log(`    - Referenced Geofence: ${s.geofenceId} (NOT FOUND)`);
        console.log(`    - Sightings: ${s.sightingCount}`);
        console.log('');
      });
    }

    // Summary
    console.log('📈 Summary:');
    console.log('===========');
    console.log(`  Total Active Signals: ${signals.length}`);
    console.log(`  Signals with Valid Geofences: ${signalsWithGeofence.length}`);
    console.log(`  Signals with Global Target: ${signalsWithGlobal.length}`);
    console.log(`  Signals with Missing Geofences: ${signalsMissingGeofence.length}`);
    console.log(`  Available Geofences: ${geofences.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

reviewSignals();
