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
  } catch {
    // .env file not found
  }
}

loadEnv();

const sql = postgres(process.env.SIGHTSIGNAL_DATABASE_URL);

console.log('🔍 Checking Signals\n');

try {
  const signals = await sql`SELECT id, name, is_active, target FROM signals`;
  console.log(`Total signals in DB: ${signals.length}\n`);

  signals.forEach(s => {
    console.log(`- ${s.name}`);
    console.log(`  ID: ${s.id}`);
    console.log(`  Active: ${s.is_active}`);
    console.log(`  Target: ${JSON.stringify(s.target)}`);
    console.log();
  });

  const sightings = await sql`SELECT id, description, location FROM sightings LIMIT 3`;
  console.log(`\nSightings in DB: ${sightings.length}`);
  sightings.forEach(s => {
    console.log(`- ${s.description}`);
    console.log(`  Location: ${JSON.stringify(s.location)}`);
  });

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  await sql.end();
}
