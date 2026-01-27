#!/usr/bin/env node

/**
 * Database Environment Check
 *
 * Verifies that the database environment is properly configured
 * before running migrations or seeding.
 */

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
  } catch (error) {
    // .env file not found, continue with existing env vars
  }
}

loadEnv();

const databaseUrl = process.env.SIGHTSIGNAL_DATABASE_URL;

console.log('🔍 Checking database environment...\n');

// Check 1: Environment variable
if (!databaseUrl) {
  console.error('❌ SIGHTSIGNAL_DATABASE_URL is not set');
  console.error('   Set it in your .env file:');
  console.error('   SIGHTSIGNAL_DATABASE_URL=postgresql://user:pass@localhost:5432/dbname\n');
  process.exit(1);
}

console.log('✅ SIGHTSIGNAL_DATABASE_URL is set');

// Check 2: Connection test
try {
  console.log('   Testing database connection...');
  const sql = postgres(databaseUrl);

  // Try a simple query
  const result = await sql`SELECT version()`;

  console.log('✅ Database connection successful');
  console.log(`   PostgreSQL version: ${result[0].version.split(' ')[1]}`);

  await sql.end();

  console.log('\n✨ Environment check passed!');
  console.log('   You can now run:');
  console.log('   - npm run db:reset   (drop tables and run migrations)');
  console.log('   - npm run db:seed    (insert seed data)');
  console.log('   - npm run db:refresh (reset + seed in one command)');

} catch (error) {
  console.error('\n❌ Database connection failed');
  console.error('   Error:', error.message);
  console.error('\n   Make sure PostgreSQL is running:');
  console.error('   - npm run db:up      (start Docker container)');
  console.error('   - npm run db:ps      (check container status)');
  process.exit(1);
}
