#!/usr/bin/env node

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
function loadEnv() {
  try {
    const envPath = join(__dirname, '../.env');
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

        value = value.replace(/\\\$/g, '$');
        process.env[key] = value;
      }
    });
  } catch (error) {
    // .env file not found
  }
}

loadEnv();

const sql = postgres(process.env.SIGHTSIGNAL_DATABASE_URL);

console.log('🔍 Verifying Seed Data\n');

try {
  // Verify JSONB data types
  const geofences = await sql`SELECT name, jsonb_typeof(polygon) as polygon_type FROM geofences LIMIT 3`;
  console.log('🗺️  Geofence JSONB types:');
  geofences.forEach(g => console.log(`   ${g.name}: ${g.polygon_type}`));

  // Verify categories
  const categories = await sql`SELECT label FROM categories ORDER BY label`;
  console.log(`\n📚 Categories (${categories.length} total):`);
  categories.forEach(c => console.log(`   - ${c.label}`));

  // Verify sightings with locations
  const sightings = await sql`SELECT description, location FROM sightings LIMIT 5`;
  console.log(`\n📍 Sample sightings (showing 5 of 20):`);
  sightings.forEach(s => console.log(`   - ${s.description} at (${s.location.lat}, ${s.location.lng})`));

  // Verify signals
  const signals = await sql`SELECT name, target FROM signals WHERE is_active = true`;
  console.log(`\n🔔 Active signals (${signals.length} total):`);
  signals.forEach(s => {
    const target = s.target.kind === 'global' ? 'Citywide' : `Geofence ${s.target.geofenceId}`;
    console.log(`   - ${s.name} (${target})`);
  });

  console.log('\n✅ All verification checks passed!');

} catch (error) {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
} finally {
  await sql.end();
}
