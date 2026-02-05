#!/usr/bin/env node

/**
 * Run Single Migration Script
 *
 * Runs a specific migration file against the database.
 * Usage: node scripts/run-migration.mjs <migration-file>
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
function loadEnv(envFile = '.env.production') {
  try {
    const envPath = join(__dirname, '..', envFile);
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

        // Unescape dollar signs
        value = value.replace(/\\\$/g, '$');

        process.env[key] = value;
      }
    });
  } catch {
    // .env file not found, continue with existing env vars
  }
}

loadEnv();

// Get database URL from environment
const databaseUrl =
  process.env.SIGNALFEED_DATABASE_URL ??
  process.env.SIGHTSIGNAL_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found');
  console.error('   Please set POSTGRES_URL or DATABASE_URL');
  process.exit(1);
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Migration file not specified');
  console.error('   Usage: node scripts/run-migration.mjs <migration-file>');
  console.error('   Example: node scripts/run-migration.mjs 018_add_feed_system_users_and_types.sql');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function runMigration() {
  console.log(`🚀 Running migration: ${migrationFile}\n`);

  try {
    const migrationPath = join(__dirname, '../db/migrations', migrationFile);
    const migrationSql = readFileSync(migrationPath, 'utf-8');

    console.log(`📦 Executing ${migrationFile}...`);

    // Execute with error handling for "already exists" errors
    try {
      await sql.unsafe(migrationSql);
      console.log(`✅ ${migrationFile} completed successfully\n`);
    } catch (error) {
      // Check if it's a "column already exists" or "already exists" error
      if (error.code === '42701' || error.code === '42710' || error.code === '42P07') {
        console.log(`⚠️  Some objects already exist (this is normal), continuing...\n`);
      } else {
        throw error;
      }
    }

    console.log('✨ Migration complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError code:', error.code);
    console.error('Error message:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
