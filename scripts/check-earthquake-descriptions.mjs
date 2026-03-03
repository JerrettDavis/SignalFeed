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

async function checkDescriptions() {
  console.log("Checking earthquake sighting descriptions for HTML...\n");

  try {
    const earthquakes = await sql`
      SELECT id, description, details
      FROM sightings
      WHERE fields->>'feedSource' = 'usgs-earthquakes'
      LIMIT 5
    `;

    earthquakes.forEach(eq => {
      console.log(`ID: ${eq.id}`);
      console.log(`Description: ${eq.description}`);
      console.log(`Details: ${eq.details?.substring(0, 200)}...`);
      console.log(`Has HTML tags: ${/<[^>]+>/.test(eq.description + (eq.details || ''))}`);
      console.log(`Has emojis: ${/[\u{1F300}-\u{1F9FF}]/u.test(eq.description + (eq.details || ''))}`);
      console.log();
    });

  } catch (error) {
    console.error("Error checking descriptions:", error.message);
  } finally {
    await sql.end();
  }
}

checkDescriptions();
