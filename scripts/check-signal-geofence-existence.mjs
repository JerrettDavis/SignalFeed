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

async function checkGeofenceExistence() {
  try {
    console.log('🔍 Checking Signal Geofence Existence');
    console.log('======================================\n');

    // Get all signals with geofence targets
    const signals = await sql`
      SELECT id, name, target
      FROM signals
      WHERE is_active = true
      AND target->>'kind' = 'geofence'
      ORDER BY name
    `;

    console.log(`Found ${signals.length} signals with geofence targets\n`);

    const missingGeofences = [];
    const existingGeofences = [];

    for (const signal of signals) {
      const geofenceId = signal.target.geofenceId;

      // Check if geofence exists
      const geofenceExists = await sql`
        SELECT id, name
        FROM geofences
        WHERE id = ${geofenceId}
        LIMIT 1
      `;

      if (geofenceExists.length > 0) {
        existingGeofences.push({
          signalId: signal.id,
          signalName: signal.name,
          geofenceId,
          geofenceName: geofenceExists[0].name,
        });
        console.log(`✓ ${signal.name}`);
        console.log(`  Signal: ${signal.id}`);
        console.log(`  Geofence: ${geofenceId} (${geofenceExists[0].name})`);
        console.log('');
      } else {
        missingGeofences.push({
          signalId: signal.id,
          signalName: signal.name,
          geofenceId,
        });
        console.log(`✗ ${signal.name}`);
        console.log(`  Signal: ${signal.id}`);
        console.log(`  Referenced Geofence: ${geofenceId} (DOES NOT EXIST)`);
        console.log('');
      }
    }

    console.log('========================================');
    console.log('Summary:');
    console.log(`  Signals with valid geofences: ${existingGeofences.length}`);
    console.log(`  Signals with missing geofences: ${missingGeofences.length}`);
    console.log('========================================');

    if (missingGeofences.length > 0) {
      console.log('\n⚠️  Missing Geofences:');
      missingGeofences.forEach(s => {
        console.log(`  - ${s.signalName}: needs ${s.geofenceId}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

checkGeofenceExistence();
