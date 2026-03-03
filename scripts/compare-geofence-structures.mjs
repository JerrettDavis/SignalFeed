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

async function compareStructures() {
  try {
    console.log('🔍 Comparing Geofence Polygon Structures');
    console.log('=========================================\n');

    // Get the working geofence (Wildlife in Gathering Place)
    const workingGeofence = await sql`
      SELECT * FROM geofences WHERE id = 'seed-geofence-004' LIMIT 1
    `;

    // Get some non-working geofences
    const nonWorkingGeofences = await sql`
      SELECT * FROM geofences
      WHERE id IN ('geofence-001', 'geofence-002', 'geofence-003')
      ORDER BY id
    `;

    console.log('✓ WORKING Geofence (Wildlife in Gathering Place):');
    console.log('================================================');
    console.log(`ID: ${workingGeofence[0].id}`);
    console.log(`Name: ${workingGeofence[0].name}`);
    console.log('Polygon structure:');
    console.log(JSON.stringify(workingGeofence[0].polygon, null, 2));
    console.log(`Has 'points' property: ${!!workingGeofence[0].polygon.points}`);
    console.log(`Number of points: ${workingGeofence[0].polygon.points?.length || 'N/A'}`);
    console.log('');

    console.log('✗ NON-WORKING Geofences:');
    console.log('========================');
    nonWorkingGeofences.forEach(g => {
      console.log(`\nID: ${g.id}`);
      console.log(`Name: ${g.name}`);
      console.log('Polygon structure:');
      console.log(JSON.stringify(g.polygon, null, 2));
      console.log(`Has 'points' property: ${!!g.polygon.points}`);
      console.log(`Number of points: ${g.polygon.points?.length || 'N/A'}`);
    });

    console.log('\n=========================================');
    console.log('Analysis:');
    console.log('=========================================');

    const workingHasPoints = !!workingGeofence[0].polygon.points;
    const nonWorkingHavePoints = nonWorkingGeofences.every(g => !!g.polygon.points);

    if (workingHasPoints && !nonWorkingHavePoints) {
      console.log('⚠️  Non-working geofences are missing the "points" property!');
      console.log('This is why they fail on the frontend.');
    } else if (!workingHasPoints && nonWorkingHavePoints) {
      console.log('⚠️  Working geofence is missing "points" but non-working have it?');
      console.log('This is unexpected - need to investigate further.');
    } else {
      console.log('✓ All geofences have the same structure.');
      console.log('The issue might be elsewhere in the frontend code.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

compareStructures();
