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
    } catch (error) {
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

async function checkGeofences() {
  try {
    console.log('🔍 Checking geofence polygon structure...\n');

    const geofences = await sql`
      SELECT id, name, polygon
      FROM geofences
      LIMIT 3
    `;

    geofences.forEach((geofence) => {
      console.log(`Geofence: ${geofence.name} (${geofence.id})`);
      console.log('Polygon structure:', JSON.stringify(geofence.polygon, null, 2));
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

checkGeofences();
