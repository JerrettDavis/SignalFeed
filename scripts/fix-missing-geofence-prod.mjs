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

async function fixMissingGeofence() {
  try {
    console.log('🔧 Fixing Missing Geofence Reference');
    console.log('====================================\n');

    // Read and execute the fix script
    const fixPath = join(__dirname, '../db/fix-missing-geofence.sql');
    const fixSql = readFileSync(fixPath, 'utf-8');

    console.log('📋 Executing fix script...\n');
    await sql.unsafe(fixSql);

    console.log('\n✅ Fix completed successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

fixMissingGeofence();
