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

async function checkFeedTypes() {
  console.log("Checking feed-related types...\n");

  try {
    const feedTypes = await sql`
      SELECT id, label, category_id
      FROM sighting_types
      WHERE id IN ('type-tornado', 'type-flood', 'type-hurricane', 'type-winter-storm',
                   'type-earthquake', 'type-tsunami', 'type-volcano', 'type-landslide')
      ORDER BY id
    `;

    console.log(`Found ${feedTypes.length} feed types:`);
    feedTypes.forEach(t => {
      console.log(`  - ${t.id}: ${t.label} (${t.category_id})`);
    });

    const systemUsers = await sql`
      SELECT id, username, email
      FROM users
      WHERE id IN ('system-noaa', 'system-usgs')
    `;

    console.log(`\nFound ${systemUsers.length} system users:`);
    systemUsers.forEach(u => {
      console.log(`  - ${u.id}: ${u.username} (${u.email})`);
    });

  } catch (error) {
    console.error("Error checking feed types:", error.message);
  } finally {
    await sql.end();
  }
}

checkFeedTypes();
