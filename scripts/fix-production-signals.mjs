#!/usr/bin/env node

/**
 * Production Database Fix Script
 *
 * Fixes signal ordering and data issues in the production database
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
function loadEnv() {
  // Try .env.production.local first for production credentials
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

          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          // Remove escape sequences
          value = value.replace(/\\r/g, '').replace(/\\n/g, '').replace(/\\\$/g, '$');

          process.env[key] = value;
        }
      });

      console.log(`✅ Loaded environment from ${envFile}`);
      return;
    } catch (error) {
      // Try next file
      continue;
    }
  }

  console.log('⚠️  No .env file found, using existing environment variables');
}

loadEnv();

// Get database URL from environment
const databaseUrl =
  process.env.POSTGRES_URL ||
  process.env.SIGNALFEED_DATABASE_URL ||
  process.env.SIGHTSIGNAL_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: Database URL environment variable is not set');
  console.error('Please set POSTGRES_URL, SIGNALFEED_DATABASE_URL, or SIGHTSIGNAL_DATABASE_URL');
  process.exit(1);
}

console.log('🔧 Production Database Fix');
console.log('==========================\n');
console.log(`Database: ${databaseUrl.split('@')[1]?.split('/')[0] || 'connected'}\n`);

const sql = postgres(databaseUrl);

async function runFix() {
  try {
    console.log('📋 Reading fix script...');
    const fixPath = join(__dirname, '../db/fix-signal-ordering.sql');
    const fixSql = readFileSync(fixPath, 'utf-8');

    console.log('🔄 Executing database fixes...\n');

    // Execute the fix script
    await sql.unsafe(fixSql);

    console.log('\n✅ Database fix completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during fix:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runFix();
