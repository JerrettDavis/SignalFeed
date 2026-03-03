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

        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        value = value.replace(/\\\$/g, '$');
        process.env[key] = value;
      }
    });
  } catch {
    // .env file not found, continue with existing env vars
  }
}

loadEnv();

const databaseUrl =
  process.env.SIGNALFEED_DATABASE_URL ??
  process.env.SIGHTSIGNAL_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;

const sql = postgres(databaseUrl);

async function checkDatabase() {
  console.log("Checking database contents...\n");

  try {
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`Users: ${users[0].count}`);

    const sightings = await sql`SELECT COUNT(*) as count FROM sightings`;
    console.log(`Sightings: ${sightings[0].count}`);

    const signals = await sql`SELECT COUNT(*) as count FROM signals`;
    console.log(`Signals: ${signals[0].count}`);

    const geofences = await sql`SELECT COUNT(*) as count FROM geofences`;
    console.log(`Geofences: ${geofences[0].count}`);

    console.log("\nRecent sightings:");
    const recentSightings = await sql`
      SELECT id, description, status, created_at
      FROM sightings
      ORDER BY created_at DESC
      LIMIT 5
    `;
    recentSightings.forEach(s => {
      console.log(`  - ${s.id}: ${s.description} (${s.status})`);
    });

    console.log("\nRecent signals:");
    const recentSignals = await sql`
      SELECT id, name, is_active, created_at
      FROM signals
      ORDER BY created_at DESC
      LIMIT 5
    `;
    recentSignals.forEach(s => {
      console.log(`  - ${s.id}: ${s.name} (${s.is_active ? 'active' : 'inactive'})`);
    });

  } catch (error) {
    console.error("Error checking database:", error.message);
  } finally {
    await sql.end();
  }
}

checkDatabase();
