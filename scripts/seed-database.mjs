#!/usr/bin/env node

/**
 * Database Seeding Script
 *
 * Populates the database with seed data:
 * - Taxonomy (categories, subcategories, sighting types)
 * - Users
 * - Geofences
 * - Sightings
 * - Subscriptions
 * - Signals
 *
 * Run after migrations with: npm run db:seed
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
function loadEnv() {
  // Try .env.local first, then fall back to .env
  const envFiles = ['.env.local', '.env'];
  
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

          // Unescape dollar signs
          value = value.replace(/\\\$/g, '$');

          process.env[key] = value;
        }
      });
      
      console.log(`✅ Loaded environment from ${envFile}`);
      return;
    } catch {
      // Try next file
      continue;
    }
  }
  
  console.log('⚠️  No .env file found, using existing environment variables');
}

loadEnv();

// Get database URL from environment (support both new and legacy names)
const databaseUrl =
  process.env.SIGNALFEED_DATABASE_URL ||
  process.env.SIGHTSIGNAL_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  // When run as part of the build, skip seeding if no DB is configured
  if (process.env.VERCEL || process.env.CI) {
    console.log('⚠️  No database URL found, skipping seed (memory-only mode)');
    process.exit(0);
  }
  console.error('❌ Error: Database URL environment variable is not set');
  console.error('Please set SIGNALFEED_DATABASE_URL, POSTGRES_URL, or SIGHTSIGNAL_DATABASE_URL');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function seedTaxonomy() {
  console.log('\n📚 Seeding taxonomy data...');

  // Categories
  console.log('  → Inserting categories...');
  const categories = [
    ['cat-community-events', 'Community Events', '🎪', 'Local gatherings, sales, festivals, and community activities'],
    ['cat-public-safety', 'Public Safety', '🚨', 'Emergency response, safety alerts, and urgent situations'],
    ['cat-law-enforcement', 'Law Enforcement', '👮', 'Police, sheriff, and federal agent activity by type'],
    ['cat-lost-found', 'Lost & Found', '🔍', 'Lost and found pets, personal items, and valuables'],
    ['cat-curb-alerts', 'Curb Alerts', '🪑', 'Free furniture, bulk trash, and curbside treasures'],
    ['cat-food-drink', 'Food & Drink', '🍔', 'Food trucks, restaurant deals, and culinary discoveries'],
    ['cat-wildlife', 'Wildlife', '🦌', 'Wild animals, domestic animals, birds, and nature sightings'],
    ['cat-weather', 'Weather', '⛈️', 'Severe weather, atmospheric conditions, and climate events'],
    ['cat-infrastructure', 'Infrastructure', '🏗️', 'Road work, utilities, construction, and service disruptions'],
    ['cat-hazards', 'Hazards', '⚠️', 'Road hazards, environmental dangers, and unsafe conditions'],
    ['cat-transportation', 'Transportation', '🚗', 'Traffic conditions, accidents, parking, and transit updates'],
    ['cat-market-activity', 'Market Activity', '🛒', 'Farmers markets, craft fairs, vendor pop-ups, and local commerce'],
    ['cat-urban-finds', 'Urban Finds', '📸', 'Street art, murals, photo opportunities, and urban discoveries'],
    ['cat-automotive', 'Automotive', '🏎️', 'Car spotting, automotive meetups, and vehicle enthusiast activities'],
    ['cat-civic-engagement', 'Civic Engagement', '🗳️', 'Protests, rallies, town halls, and civic participation'],
  ];

  for (const [id, label, icon, description] of categories) {
    await sql`
      INSERT INTO categories (id, label, icon, description)
      VALUES (${id}, ${label}, ${icon}, ${description})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`  ✅ Inserted ${categories.length} categories`);

  // Subcategories
  console.log('  → Inserting subcategories...');
  const subcategories = [
    ['sub-garage-sales', 'Garage & Yard Sales', 'cat-community-events', 'Private sales at homes and properties'],
    ['sub-festivals', 'Festivals & Fairs', 'cat-community-events', 'Large community celebrations and festivals'],
    ['sub-neighborhood-events', 'Neighborhood Events', 'cat-community-events', 'Block parties, HOA events, and local gatherings'],
    ['sub-emergency-response', 'Emergency Response', 'cat-public-safety', 'Active emergency situations requiring immediate attention'],
    ['sub-fire-response', 'Fire Response', 'cat-public-safety', 'Fire department activity and fire-related emergencies'],
    ['sub-traffic-enforcement', 'Traffic Enforcement', 'cat-law-enforcement', 'Speed traps, DUI checkpoints, and traffic stops'],
    ['sub-police-patrol', 'Police Patrol', 'cat-law-enforcement', 'Regular police presence and patrol activity'],
    ['sub-lost-pets', 'Lost Pets', 'cat-lost-found', 'Missing cats, dogs, and other pets'],
    ['sub-found-pets', 'Found Pets', 'cat-lost-found', 'Located pets seeking owners'],
    ['sub-furniture', 'Free Furniture', 'cat-curb-alerts', 'Couches, chairs, tables, and home furnishings'],
    ['sub-food-trucks', 'Food Trucks', 'cat-food-drink', 'Mobile food vendors and truck locations'],
    ['sub-restaurant-deals', 'Restaurant Deals', 'cat-food-drink', 'Special offers, happy hours, and promotions'],
    ['sub-wild-animals', 'Wild Animals', 'cat-wildlife', 'Native wildlife and undomesticated animals'],
    ['sub-birds', 'Birds', 'cat-wildlife', 'Bird sightings and avian activity'],
    ['sub-severe-weather', 'Severe Weather', 'cat-weather', 'Tornadoes, severe storms, and dangerous conditions'],
    ['sub-road-work', 'Road Work', 'cat-infrastructure', 'Street repairs, paving, and road maintenance'],
    ['sub-road-hazards', 'Road Hazards', 'cat-hazards', 'Potholes, debris, and dangerous road conditions'],
    ['sub-traffic-conditions', 'Traffic Conditions', 'cat-transportation', 'Congestion, delays, and flow information'],
    ['sub-farmers-markets', 'Farmers Markets', 'cat-market-activity', 'Local produce and farmers market locations'],
    ['sub-street-art', 'Street Art', 'cat-urban-finds', 'Graffiti, murals, and urban artwork'],
  ];

  for (const [id, label, categoryId, description] of subcategories) {
    await sql`
      INSERT INTO subcategories (id, label, category_id, description)
      VALUES (${id}, ${label}, ${categoryId}, ${description})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`  ✅ Inserted ${subcategories.length} subcategories`);

  // Sighting Types
  console.log('  → Inserting sighting types...');
  const sightingTypes = [
    ['type-garage-sale', 'Garage Sale', 'cat-community-events', 'sub-garage-sales', ['sale', 'bargains', 'household'], '🏠'],
    ['type-music-festival', 'Music Festival', 'cat-community-events', 'sub-festivals', ['music', 'entertainment', 'large-crowd'], '🎵'],
    ['type-block-party', 'Block Party', 'cat-community-events', 'sub-neighborhood-events', ['neighborhood', 'social', 'street-closure'], '🎉'],
    ['type-structure-fire', 'Structure Fire', 'cat-public-safety', 'sub-fire-response', ['fire', 'emergency', 'evacuate'], '🔥'],
    ['type-medical-emergency', 'Medical Emergency', 'cat-public-safety', 'sub-emergency-response', ['ems', 'ambulance', 'urgent'], '🚑'],
    ['type-speed-trap', 'Speed Trap', 'cat-law-enforcement', 'sub-traffic-enforcement', ['police', 'traffic', 'radar'], '🚔'],
    ['type-police-pursuit', 'Police Pursuit', 'cat-law-enforcement', 'sub-police-patrol', ['police', 'chase', 'emergency'], '🚨'],
    ['type-lost-dog', 'Lost Dog', 'cat-lost-found', 'sub-lost-pets', ['dog', 'lost', 'missing'], '🐕'],
    ['type-found-cat', 'Found Cat', 'cat-lost-found', 'sub-found-pets', ['cat', 'found', 'stray'], '🐈'],
    ['type-free-couch', 'Free Couch', 'cat-curb-alerts', 'sub-furniture', ['furniture', 'free', 'seating'], '🛋️'],
    ['type-taco-truck', 'Taco Truck', 'cat-food-drink', 'sub-food-trucks', ['food-truck', 'mexican', 'tacos'], '🌮'],
    ['type-happy-hour', 'Happy Hour Deal', 'cat-food-drink', 'sub-restaurant-deals', ['discount', 'drinks', 'special'], '🍹'],
    ['type-deer', 'Deer', 'cat-wildlife', 'sub-wild-animals', ['deer', 'wildlife', 'mammal'], '🦌'],
    ['type-hawk', 'Hawk', 'cat-wildlife', 'sub-birds', ['hawk', 'bird', 'raptor'], '🦅'],
    ['type-tornado', 'Tornado', 'cat-weather', 'sub-severe-weather', ['tornado', 'severe', 'dangerous'], '🌪️'],
    ['type-pothole-repair', 'Pothole Repair', 'cat-infrastructure', 'sub-road-work', ['road-work', 'repair', 'maintenance'], '🚧'],
    ['type-pothole', 'Pothole', 'cat-hazards', 'sub-road-hazards', ['pothole', 'road', 'damage'], '🕳️'],
    ['type-heavy-traffic', 'Heavy Traffic', 'cat-transportation', 'sub-traffic-conditions', ['traffic', 'congestion', 'delay'], '🚗'],
    ['type-farmers-market', 'Farmers Market', 'cat-market-activity', 'sub-farmers-markets', ['market', 'produce', 'local'], '🥕'],
    ['type-mural', 'Mural', 'cat-urban-finds', 'sub-street-art', ['mural', 'art', 'street-art'], '🎨'],
  ];

  for (const [id, label, categoryId, subcategoryId, tags, icon] of sightingTypes) {
    await sql`
      INSERT INTO sighting_types (id, label, category_id, subcategory_id, tags, icon)
      VALUES (${id}, ${label}, ${categoryId}, ${subcategoryId}, ${tags}, ${icon})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`  ✅ Inserted ${sightingTypes.length} sighting types`);
}

async function seedUsers() {
  console.log('\n👥 Seeding users...');

  const baseTime = '2026-01-24T09:00:00.000Z';
  // [id, email, username, role, status, membershipTier]
  const users = [
    // Admin users
    ['seed-user-admin', 'admin@sightsignal.local', 'admin', 'admin', 'active', 'admin'],
    ['seed-user-admin-2', 'city-admin@sightsignal.local', 'city_admin', 'admin', 'active', 'admin'],
    // Moderator - paid tier
    ['seed-user-001', 'moderator@sightsignal.local', 'mod_sarah', 'moderator', 'active', 'paid'],
    // Paid tier users
    ['seed-user-002', 'john.doe@example.com', 'john_downtown', 'user', 'active', 'paid'],
    ['seed-user-006', 'maria.garcia@example.com', 'maria_tulsa', 'user', 'active', 'paid'],
    // Free tier users
    ['seed-user-003', 'jane.smith@example.com', 'jane_parks', 'user', 'active', 'free'],
    ['seed-user-004', 'bob.wilson@example.com', 'bob_commuter', 'user', 'active', 'free'],
    ['seed-user-007', 'alex.jones@example.com', 'alex_explorer', 'user', 'active', 'free'],
    ['seed-user-008', 'lisa.brown@example.com', 'lisa_brookside', 'user', 'active', 'free'],
    ['seed-user-009', 'chris.taylor@example.com', 'chris_local', 'user', 'active', 'free'],
    ['seed-user-010', 'sam.nguyen@example.com', 'sam_observer', 'user', 'active', 'free'],
    // Suspended user
    ['seed-user-005', 'suspended@example.com', 'suspended_user', 'user', 'suspended', 'free'],
  ];

  for (const [id, email, username, role, status, membershipTier] of users) {
    await sql`
      INSERT INTO users (id, email, username, role, status, membership_tier, created_at, updated_at)
      VALUES (${id}, ${email}, ${username}, ${role}, ${status}, ${membershipTier}, ${baseTime}, ${baseTime})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log(`  ✅ Inserted ${users.length} users`);
}

async function seedGeofences() {
  console.log('\n🗺️  Seeding geofences...');

  const baseTime = '2026-01-24T09:00:00.000Z';
  
  // Accurate Tulsa, OK geofence coordinates with descriptive names including location
  const geofences = [
    // Cherry Street District (around 15th & Peoria)
    ['seed-geofence-003', 'Cherry Street District, Tulsa, OK', 'public', [
      [36.1547, -95.9810],
      [36.1547, -95.9770],
      [36.1507, -95.9770],
      [36.1507, -95.9810]
    ]],

    // Gathering Place Park (riverside park)
    ['seed-geofence-004', 'Gathering Place Park, Tulsa, OK', 'public', [
      [36.1410, -95.9785],
      [36.1410, -95.9735],
      [36.1340, -95.9735],
      [36.1340, -95.9785]
    ]],

    // University District
    ['seed-geofence-005', 'University District, Tulsa, OK', 'public', [
      [36.152, -95.945],
      [36.152, -95.938],
      [36.146, -95.938],
      [36.146, -95.945]
    ]],

    // Brady Arts District (downtown arts area)
    ['seed-geofence-006', 'Brady Arts District, Tulsa, OK', 'public', [
      [36.1610, -95.9910],
      [36.1610, -95.9860],
      [36.1560, -95.9860],
      [36.1560, -95.9910]
    ]],

    // Brookside neighborhood (private)
    ['seed-geofence-007', 'Brookside neighborhood, Tulsa, OK', 'private', [
      [36.124, -95.985],
      [36.124, -95.979],
      [36.119, -95.979],
      [36.119, -95.985]
    ]],

    // Edison High School area (31st & Lewis)
    ['seed-geofence-008', 'Edison High School Zone, Tulsa, OK', 'public', [
      [36.1450, -95.9560],
      [36.1450, -95.9510],
      [36.1410, -95.9510],
      [36.1410, -95.9560]
    ]],

    // River Parks Trail (along Arkansas River)
    ['seed-geofence-009', 'River Parks Trail, Tulsa, OK', 'public', [
      [36.1590, -95.9790],
      [36.1590, -95.9740],
      [36.1320, -95.9740],
      [36.1320, -95.9790]
    ]],

    // Pearl District
    ['seed-geofence-010', 'Pearl District, Tulsa, OK', 'public', [
      [36.164, -95.983],
      [36.164, -95.977],
      [36.16, -95.977],
      [36.16, -95.983]
    ]],

    // Blue Dome District
    ['seed-geofence-011', 'Blue Dome District, Tulsa, OK', 'public', [
      [36.1565, -95.991],
      [36.1565, -95.986],
      [36.1535, -95.986],
      [36.1535, -95.991]
    ]],

    // Tulsa Zoo area
    ['seed-geofence-012', 'Tulsa Zoo area, Tulsa, OK', 'public', [
      [36.067, -95.898],
      [36.067, -95.892],
      [36.063, -95.892],
      [36.063, -95.898]
    ]],

    // Midtown corridor (private - around 21st & Utica)
    ['seed-geofence-013', 'Midtown Corridor, Tulsa, OK', 'private', [
      [36.1400, -95.9740],
      [36.1400, -95.9690],
      [36.1340, -95.9690],
      [36.1340, -95.9740]
    ]],

    // Turkey Mountain trails
    ['seed-geofence-014', 'Turkey Mountain trails, Tulsa, OK', 'public', [
      [36.072, -96.045],
      [36.072, -96.038],
      [36.065, -96.038],
      [36.065, -96.045]
    ]],

    // Industrial warehouse district (private)
    ['seed-geofence-015', 'Industrial warehouse district, Tulsa, OK', 'private', [
      [36.17, -95.955],
      [36.17, -95.945],
      [36.165, -95.945],
      [36.165, -95.955]
    ]],
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
}

async function seedSightings() {
  console.log('\n📍 Seeding sightings...');

  const baseTime = '2026-01-24T09:00:00.000Z';
  
  // Sample sightings placed WITHIN Tulsa geofences
  const sightings = [
    // Cherry Street District sightings
    ['seed-sighting-001', 'type-taco-truck', 'cat-food-drink', 36.1530, -95.9790, 'Taco truck serving lunch on Cherry Street', 'Great fish tacos, cash only. Open until 2pm.', 'normal', 'active', baseTime],
    ['seed-sighting-002', 'type-garage-sale', 'cat-community-events', 36.1520, -95.9785, 'Multi-family garage sale this Saturday', 'Furniture, toys, electronics. 8am-2pm at 15th & Peoria.', 'low', 'active', '2026-01-24T08:30:00.000Z'],
    ['seed-sighting-003', 'type-mural', 'cat-urban-finds', 36.1525, -95.9795, 'New mural on Cherry Street building', 'Beautiful local artist work, worth a photo stop.', 'low', 'active', '2026-01-23T16:00:00.000Z'],
    
    // Gathering Place Park sightings
    ['seed-sighting-004', 'type-deer', 'cat-wildlife', 36.1380, -95.9760, 'Family of deer near the playground', 'Three deer grazing peacefully. Please keep distance.', 'normal', 'active', '2026-01-24T07:15:00.000Z'],
    ['seed-sighting-005', 'type-music-festival', 'cat-community-events', 36.1370, -95.9755, 'Live music at Gathering Place amphitheater', 'Local band performing, free event. Starts at 6pm today.', 'normal', 'active', '2026-01-24T09:30:00.000Z'],
    ['seed-sighting-006', 'type-lost-dog', 'cat-lost-found', 36.1390, -95.9770, 'Lost golden retriever near skate park', 'Friendly male, red collar with tags. Last seen this morning.', 'high', 'active', '2026-01-24T10:00:00.000Z'],
    
    // Brady Arts District sightings
    ['seed-sighting-007', 'type-music-festival', 'cat-community-events', 36.1585, -95.9885, 'First Friday Art Crawl tonight', 'Galleries open late, food trucks, live music downtown.', 'normal', 'active', '2026-01-24T11:00:00.000Z'],
    ['seed-sighting-008', 'type-mural', 'cat-urban-finds', 36.1590, -95.9875, 'New street art installation on Brady', 'Interactive sculpture, great for photos.', 'low', 'active', '2026-01-23T14:00:00.000Z'],
    ['seed-sighting-009', 'type-happy-hour', 'cat-food-drink', 36.1575, -95.9890, 'Happy hour at Brady Tavern', '50% off appetizers, 4-6pm weekdays.', 'low', 'active', baseTime],
    
    // Edison High School Zone sightings
    ['seed-sighting-010', 'type-speed-trap', 'cat-law-enforcement', 36.1435, -95.9540, 'Speed trap on 31st Street', 'Police monitoring school zone, 25mph strictly enforced.', 'normal', 'active', '2026-01-24T07:45:00.000Z'],
    ['seed-sighting-011', 'type-pothole', 'cat-hazards', 36.1425, -95.9535, 'Large pothole near school entrance', 'Deep hole in right lane, causing traffic to swerve.', 'high', 'active', '2026-01-24T08:00:00.000Z'],
    
    // River Parks Trail sightings
    ['seed-sighting-012', 'type-hawk', 'cat-wildlife', 36.1450, -95.9765, 'Bald eagle spotted along the trail', 'Adult bald eagle fishing near the dam. Amazing sight!', 'low', 'active', '2026-01-24T06:30:00.000Z'],
    ['seed-sighting-013', 'type-tornado', 'cat-weather', 36.1500, -95.9760, 'Trail flooding warning', 'Recent rain causing puddles, some sections muddy. Use caution.', 'normal', 'active', '2026-01-24T09:00:00.000Z'],
    ['seed-sighting-014', 'type-found-cat', 'cat-lost-found', 36.1420, -95.9755, 'Found cat near River Parks', 'Friendly gray tabby, no collar. Being held at nearby vet.', 'normal', 'active', '2026-01-23T17:00:00.000Z'],
    
    // Brookside District sightings
    ['seed-sighting-015', 'type-farmers-market', 'cat-market-activity', 36.1250, -95.9785, 'Brookside Farmers Market open', 'Fresh produce, baked goods, crafts. Saturdays 8am-noon.', 'normal', 'active', '2026-01-24T08:45:00.000Z'],
    ['seed-sighting-016', 'type-free-couch', 'cat-curb-alerts', 36.1230, -95.9790, 'Free couch on curb', 'Clean beige sectional sofa, good condition. 36th & Peoria.', 'low', 'active', '2026-01-24T10:30:00.000Z'],
    
    // Downtown Tulsa sightings
    ['seed-sighting-017', 'type-pothole-repair', 'cat-infrastructure', 36.1540, -95.9920, 'Main Street construction zone', 'Two lanes closed for utility work. Expect delays through Friday.', 'high', 'active', baseTime],
    ['seed-sighting-018', 'type-heavy-traffic', 'cat-transportation', 36.1550, -95.9905, 'Heavy traffic on 5th Street', 'Accident cleared but backup remains. Use alternate route.', 'normal', 'resolved', '2026-01-24T08:15:00.000Z'],
    ['seed-sighting-019', 'type-police-pursuit', 'cat-law-enforcement', 36.1520, -95.9915, 'Increased police presence downtown', 'Multiple units patrolling after recent break-ins.', 'normal', 'active', '2026-01-24T09:15:00.000Z'],
    ['seed-sighting-020', 'type-structure-fire', 'cat-public-safety', 36.1565, -95.9895, 'Fire trucks at office building', 'False alarm, situation cleared. No emergency.', 'normal', 'resolved', '2026-01-24T10:45:00.000Z'],
  ];

  for (const [id, typeId, categoryId, lat, lng, description, details, importance, status, observedAt] of sightings) {
    const locationObj = { lat, lng };
    await sql`
      INSERT INTO sightings (
        id, type_id, category_id, location, description, details,
        importance, status, observed_at, created_at, fields,
        upvotes, downvotes, confirmations, disputes, spam_reports, score, hot_score
      )
      VALUES (
        ${id}, ${typeId}, ${categoryId}, ${sql.json(locationObj)}, ${description}, ${details},
        ${importance}, ${status}, ${observedAt}, ${baseTime}, ${sql.json({})},
        0, 0, 0, 0, 0, 0, 0
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log(`  ✅ Inserted ${sightings.length} sightings`);
}

async function seedSubscriptions() {
  console.log('\n📧 Seeding subscriptions...');

  const baseTime = '2026-01-24T09:00:00.000Z';
  const subscriptions = [
    ['seed-subscription-001', 'alerts@example.com', 'geofence', 'seed-geofence-003', ['cat-wildlife'], ['type-birds'], 'all'],
    ['seed-subscription-002', 'safety@tulsa.local', 'geofence', 'seed-geofence-008', ['cat-public-safety', 'cat-hazards'], ['type-road-hazards', 'type-suspicious-activity'], 'vetted'],
    ['seed-subscription-003', 'downtown@resident.com', 'geofence', 'seed-geofence-011', ['cat-hazards', 'cat-transportation'], ['type-roadwork', 'type-road-hazards'], 'all'],
    ['seed-subscription-004', 'parks@naturelover.org', 'geofence', 'seed-geofence-004', ['cat-wildlife', 'cat-community-events'], ['type-birds', 'type-music-festival'], 'vetted'],
    ['seed-subscription-005', 'commuter@example.net', 'geofence', 'seed-geofence-013', ['cat-transportation', 'cat-hazards'], ['type-pothole-repair', 'type-heavy-traffic'], 'raw'],
  ];

  for (const [id, email, targetKind, geofenceId, categoryIds, typeIds, trustLevel] of subscriptions) {
    const targetObj = { kind: targetKind, geofenceId };
    await sql`
      INSERT INTO subscriptions (
        id, email, target, category_ids, type_ids, trust_level, created_at
      )
      VALUES (
        ${id}, ${email}, ${sql.json(targetObj)}, ${categoryIds}, ${typeIds}, ${trustLevel}, ${baseTime}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log(`  ✅ Inserted ${subscriptions.length} subscriptions`);
}

async function seedSignals() {
  console.log('\n🔔 Seeding signals...');

  const baseTime = '2026-01-24T09:00:00.000Z';
  // [id, name, description, ownerId, targetKind, geofenceId, triggers, conditions, isActive, classification, analytics]
  const signals = [
    ['signal-all', 'All Sightings', 'All sightings across all areas', 'seed-user-admin', 'global', null, ['new_sighting'], {}, true, 'official',
      { viewCount: 12456, uniqueViewers: 5234, activeViewers: 234, lastViewedAt: '2026-01-24T11:10:00.000Z', subscriberCount: 4200, sightingCount: 20 }],
    ['seed-signal-001', 'School Zone Safety Alerts', 'Critical safety alerts near Edison High School', 'seed-user-001', 'geofence', 'seed-geofence-008', ['new_sighting'], { categoryIds: ['cat-public-safety', 'cat-hazards'], importance: ['high'] }, true, 'community',
      { viewCount: 342, uniqueViewers: 156, activeViewers: 12, lastViewedAt: '2026-01-24T10:45:00.000Z', subscriberCount: 89, sightingCount: 23 }],
    ['seed-signal-002', 'Downtown Traffic Monitoring', 'Traffic and road hazard alerts for downtown commuters', 'seed-user-002', 'geofence', 'seed-geofence-011', ['new_sighting', 'score_threshold'], { categoryIds: ['cat-transportation', 'cat-infrastructure'], minScore: 3 }, true, 'community',
      { viewCount: 1247, uniqueViewers: 523, activeViewers: 45, lastViewedAt: '2026-01-24T11:00:00.000Z', subscriberCount: 312, sightingCount: 67 }],
    ['seed-signal-003', 'Wildlife in Gathering Place', 'Wildlife sightings in Gathering Place Park', 'seed-user-003', 'geofence', 'seed-geofence-004', ['new_sighting', 'sighting_confirmed'], { categoryIds: ['cat-wildlife'] }, true, 'personal',
      { viewCount: 87, uniqueViewers: 34, activeViewers: 3, lastViewedAt: '2026-01-24T09:30:00.000Z', subscriberCount: 28, sightingCount: 12 }],
    ['seed-signal-004', 'Arts District Events', 'Community events and activities in the Arts District', 'seed-user-001', 'geofence', 'seed-geofence-006', ['new_sighting'], { categoryIds: ['cat-community-events', 'cat-market-activity'] }, true, 'community',
      { viewCount: 678, uniqueViewers: 289, activeViewers: 23, lastViewedAt: '2026-01-24T10:15:00.000Z', subscriberCount: 201, sightingCount: 45 }],
    ['seed-signal-005', 'Emergency Alerts - Citywide', 'High-priority emergency alerts across all of Tulsa', 'seed-user-admin', 'global', null, ['new_sighting'], { categoryIds: ['cat-public-safety'], importance: ['high'] }, true, 'official',
      { viewCount: 5623, uniqueViewers: 2341, activeViewers: 178, lastViewedAt: '2026-01-24T11:05:00.000Z', subscriberCount: 1834, sightingCount: 156 }],
    ['seed-signal-006', 'River Parks Trail Updates', 'Trail conditions and wildlife along River Parks', 'seed-user-002', 'geofence', 'seed-geofence-009', ['new_sighting'], { categoryIds: ['cat-wildlife', 'cat-hazards'] }, true, 'community',
      { viewCount: 456, uniqueViewers: 178, activeViewers: 15, lastViewedAt: '2026-01-24T10:00:00.000Z', subscriberCount: 134, sightingCount: 31 }],
    ['seed-signal-007', 'Cherry Street Food Scene', 'Food trucks and restaurant deals in Cherry Street', 'seed-user-003', 'geofence', 'seed-geofence-003', ['new_sighting', 'sighting_confirmed'], { categoryIds: ['cat-food-drink'] }, true, 'personal',
      { viewCount: 123, uniqueViewers: 67, activeViewers: 5, lastViewedAt: '2026-01-24T08:45:00.000Z', subscriberCount: 42, sightingCount: 18 }],
    ['seed-signal-008', 'Inactive Test Signal', 'Test signal for inactive status', 'seed-user-001', 'global', null, ['new_sighting'], {}, false, 'personal',
      { viewCount: 0, uniqueViewers: 0, activeViewers: 0, lastViewedAt: null, subscriberCount: 0, sightingCount: 0 }],
    ['seed-signal-009', 'Tulsa Weather Alerts', 'Official severe weather and emergency weather notifications', 'seed-user-admin-2', 'global', null, ['new_sighting'], { categoryIds: ['cat-weather'], importance: ['high'] }, true, 'official',
      { viewCount: 8934, uniqueViewers: 4521, activeViewers: 267, lastViewedAt: '2026-01-24T11:10:00.000Z', subscriberCount: 3245, sightingCount: 234 }],
    ['seed-signal-010', 'Brookside Neighborhood Watch', 'Community safety and events in Brookside', 'seed-user-008', 'geofence', 'seed-geofence-007', ['new_sighting', 'sighting_confirmed'], { categoryIds: ['cat-public-safety', 'cat-community-events'] }, true, 'personal',
      { viewCount: 234, uniqueViewers: 89, activeViewers: 7, lastViewedAt: '2026-01-24T09:15:00.000Z', subscriberCount: 56, sightingCount: 19 }],
    ['seed-signal-011', 'Lost & Found Pets - Tulsa', 'Community signal for lost and found pets citywide', 'seed-user-006', 'global', null, ['new_sighting'], { categoryIds: ['cat-lost-found'] }, true, 'community',
      { viewCount: 2341, uniqueViewers: 987, activeViewers: 56, lastViewedAt: '2026-01-24T10:50:00.000Z', subscriberCount: 678, sightingCount: 89 }],
    ['seed-signal-012', 'Turkey Mountain Trail Conditions', 'Trail alerts and wildlife sightings at Turkey Mountain', 'seed-user-007', 'geofence', 'seed-geofence-014', ['new_sighting'], { categoryIds: ['cat-wildlife', 'cat-hazards'] }, true, 'personal',
      { viewCount: 156, uniqueViewers: 78, activeViewers: 4, lastViewedAt: '2026-01-24T07:30:00.000Z', subscriberCount: 45, sightingCount: 14 }],
    ['seed-signal-013', 'Official Road Closures & Construction', 'City-maintained alerts for road work and infrastructure projects', 'seed-user-admin', 'global', null, ['new_sighting'], { categoryIds: ['cat-infrastructure', 'cat-transportation'] }, true, 'official',
      { viewCount: 6782, uniqueViewers: 3421, activeViewers: 189, lastViewedAt: '2026-01-24T11:02:00.000Z', subscriberCount: 2567, sightingCount: 178 }],
    ['seed-signal-014', 'Blue Dome District Nightlife', 'Events and happenings in the Blue Dome entertainment district', 'seed-user-009', 'geofence', 'seed-geofence-011', ['new_sighting'], { categoryIds: ['cat-community-events', 'cat-food-drink'] }, true, 'personal',
      { viewCount: 67, uniqueViewers: 34, activeViewers: 2, lastViewedAt: '2026-01-23T22:15:00.000Z', subscriberCount: 23, sightingCount: 8 }],
    ['seed-signal-015', 'Tulsa Farmers Markets', 'Community signal tracking all farmers markets across Tulsa', 'seed-user-002', 'global', null, ['new_sighting', 'sighting_confirmed'], { categoryIds: ['cat-market-activity'] }, true, 'community',
      { viewCount: 1567, uniqueViewers: 723, activeViewers: 34, lastViewedAt: '2026-01-24T09:45:00.000Z', subscriberCount: 456, sightingCount: 52 }],
  ];

  for (const [id, name, description, ownerId, targetKind, geofenceId, triggers, conditions, isActive, classification, analytics] of signals) {
    const target = geofenceId
      ? { kind: targetKind, geofenceId }
      : { kind: targetKind };

    await sql`
      INSERT INTO signals (
        id, name, description, owner_id, target, triggers, conditions, is_active,
        classification, view_count, unique_viewers, active_viewers, last_viewed_at,
        subscriber_count, sighting_count, created_at, updated_at
      )
      VALUES (
        ${id}, ${name}, ${description}, ${ownerId}, ${sql.json(target)}, ${triggers}, ${sql.json(conditions)}, ${isActive},
        ${classification}, ${analytics.viewCount}, ${analytics.uniqueViewers}, ${analytics.activeViewers}, ${analytics.lastViewedAt ?? null},
        ${analytics.subscriberCount}, ${analytics.sightingCount}, ${baseTime}, ${baseTime}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        classification = EXCLUDED.classification,
        view_count = EXCLUDED.view_count,
        unique_viewers = EXCLUDED.unique_viewers,
        active_viewers = EXCLUDED.active_viewers,
        last_viewed_at = EXCLUDED.last_viewed_at,
        subscriber_count = EXCLUDED.subscriber_count,
        sighting_count = EXCLUDED.sighting_count,
        updated_at = EXCLUDED.updated_at
    `;
  }

  console.log(`  ✅ Inserted ${signals.length} signals`);
}

async function main() {
  console.log('🌱 SightSignal Database Seeding');
  console.log('================================\n');

  try {
    await seedTaxonomy();
    await seedUsers();
    await seedGeofences();
    await seedSightings();
    await seedSubscriptions();
    await seedSignals();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nSeeded data:');
    console.log('  - 15 categories');
    console.log('  - 20 subcategories');
    console.log('  - 20 sighting types');
    console.log('  - 12 users');
    console.log('  - 13 geofences');
    console.log('  - 20 sightings');
    console.log('  - 5 subscriptions');
    console.log('  - 16 signals (including All Sightings)');
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
