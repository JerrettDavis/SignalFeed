#!/usr/bin/env node

/**
 * Test Database Setup Script
 * 
 * Sets up the test database with schema and seed data for E2E tests.
 * This script should be run before E2E tests in CI/CD.
 */

import postgres from 'postgres';
import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 
  'postgresql://sightsignal_test:sightsignal_test@localhost:5433/sightsignal_test';

console.log('🧪 Setting up test database...\n');

const sql = postgres(TEST_DATABASE_URL);

async function dropAllTables() {
  console.log('🗑️  Dropping all existing tables...');
  
  // Drop tables in reverse dependency order
  await sql`DROP TABLE IF EXISTS signal_subscriptions CASCADE`;
  await sql`DROP TABLE IF EXISTS signals CASCADE`;
  await sql`DROP TABLE IF EXISTS sighting_reactions CASCADE`;
  await sql`DROP TABLE IF EXISTS reputation_events CASCADE`;
  await sql`DROP TABLE IF EXISTS user_reputation CASCADE`;
  await sql`DROP TABLE IF EXISTS subscriptions CASCADE`;
  await sql`DROP TABLE IF EXISTS geofences CASCADE`;
  await sql`DROP TABLE IF EXISTS sightings CASCADE`;
  await sql`DROP TABLE IF EXISTS sighting_types CASCADE`;
  await sql`DROP TABLE IF EXISTS subcategories CASCADE`;
  await sql`DROP TABLE IF EXISTS categories CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  
  console.log('  ✅ All tables dropped\n');
}

async function runMigrations() {
  console.log('📦 Running migrations...');
  
  const migrationsDir = join(__dirname, '../db/migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  for (const file of files) {
    console.log(`  Running ${file}...`);
    const migrationSql = readFileSync(join(migrationsDir, file), 'utf-8');
    
    try {
      await sql.unsafe(migrationSql);
      console.log(`  ✅ ${file} completed`);
    } catch (error) {
      console.error(`  ❌ ${file} failed:`, error.message);
      throw error;
    }
  }
  
  console.log('✅ All migrations completed\n');
}

async function seedTestData() {
  console.log('🌱 Seeding test data...');
  
  const baseTime = '2026-01-24T09:00:00.000Z';
  
  // Seed categories
  const categories = [
    ['cat-nature', 'Nature', '🌿', 'Wildlife and natural phenomena'],
    ['cat-public-safety', 'Public Safety', '🚨', 'Safety alerts and warnings'],
    ['cat-community', 'Community', '👥', 'Community events and activities'],
  ];
  
  for (const [id, label, icon, description] of categories) {
    await sql`
      INSERT INTO categories (id, label, icon, description)
      VALUES (${id}, ${label}, ${icon}, ${description})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  
  console.log(`  ✅ Inserted ${categories.length} categories`);
  
  // Seed subcategories
  const subcategories = [
    ['subcat-birds', 'Birds', 'cat-nature', 'Bird sightings'],
    ['subcat-wildlife', 'Wildlife', 'cat-nature', 'Wild animal sightings'],
    ['subcat-emergency', 'Emergency', 'cat-public-safety', 'Emergency situations'],
  ];
  
  for (const [id, label, categoryId, description] of subcategories) {
    await sql`
      INSERT INTO subcategories (id, label, category_id, description)
      VALUES (${id}, ${label}, ${categoryId}, ${description})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  
  console.log(`  ✅ Inserted ${subcategories.length} subcategories`);
  
  // Seed sighting types
  const types = [
    ['type-birds', 'Birds', 'cat-nature', 'subcat-birds', ['bird', 'wildlife'], '🐦'],
    ['type-roadwork', 'Road Work', 'cat-public-safety', 'subcat-emergency', ['road', 'construction'], '🚧'],
  ];
  
  for (const [id, label, categoryId, subcategoryId, tags, icon] of types) {
    await sql`
      INSERT INTO sighting_types (id, label, category_id, subcategory_id, tags, icon)
      VALUES (${id}, ${label}, ${categoryId}, ${subcategoryId}, ${tags}, ${icon})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  
  console.log(`  ✅ Inserted ${types.length} sighting types`);
  
  // Seed test users
  const users = [
    ['test-user-admin', 'admin@test.local', 'testadmin', 'admin', 'active'],
    ['test-user-001', 'user1@test.local', 'testuser1', 'user', 'active'],
  ];
  
  for (const [id, email, username, role, status] of users) {
    await sql`
      INSERT INTO users (id, email, username, role, status, created_at, updated_at)
      VALUES (${id}, ${email}, ${username}, ${role}, ${status}, ${baseTime}, ${baseTime})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  
  console.log(`  ✅ Inserted ${users.length} users`);
  
  // Seed test geofences
  const geofences = [
    ['test-geofence-001', 'Test Public Geofence', 'public', [[37.8129, -122.419], [37.8129, -122.401], [37.7985, -122.401], [37.7985, -122.419]]],
    ['test-geofence-002', 'Test Private Geofence', 'private', [[36.1545, -95.9945], [36.1545, -95.9895], [36.1505, -95.9895], [36.1505, -95.9945]]],
  ];
  
  for (const [id, name, visibility, points] of geofences) {
    const polygonObj = { points: points.map(([lat, lng]) => ({ lat, lng })) };
    await sql`
      INSERT INTO geofences (id, name, visibility, polygon, created_at)
      VALUES (${id}, ${name}, ${visibility}, ${sql.json(polygonObj)}, ${baseTime})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  
  console.log(`  ✅ Inserted ${geofences.length} geofences`);
  
  // Seed test signals
  const signals = [
    ['test-signal-001', 'Test Active Signal', 'Test signal for E2E testing', 'test-user-001', 'global', null, ['new_sighting'], {}, true],
    ['test-signal-002', 'Test Inactive Signal', 'Inactive test signal', 'test-user-001', 'geofence', 'test-geofence-001', ['new_sighting'], { categoryIds: ['cat-nature'] }, false],
  ];
  
  for (const [id, name, description, ownerId, targetKind, geofenceId, triggers, conditions, isActive] of signals) {
    const target = geofenceId
      ? { kind: targetKind, geofenceId }
      : { kind: targetKind };
    
    await sql`
      INSERT INTO signals (
        id, name, description, owner_id, target, triggers, conditions, is_active, created_at, updated_at
      )
      VALUES (
        ${id}, ${name}, ${description}, ${ownerId}, ${sql.json(target)}, ${triggers}, ${sql.json(conditions)}, ${isActive}, ${baseTime}, ${baseTime}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
  
  console.log(`  ✅ Inserted ${signals.length} signals`);
  
  console.log('\n✅ Test data seeding completed!\n');
}

async function main() {
  try {
    await dropAllTables();
    await runMigrations();
    await seedTestData();
    
    console.log('✨ Test database setup complete!\n');
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test database setup failed:');
    console.error(error);
    await sql.end();
    process.exit(1);
  }
}

main();
