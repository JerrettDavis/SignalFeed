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

async function checkSchema() {
  console.log("Checking sightings table schema...\n");

  try {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sightings'
      ORDER BY ordinal_position
    `;

    console.log("Columns in sightings table:");
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

  } catch (error) {
    console.error("Error checking schema:", error.message);
  } finally {
    await sql.end();
  }
}

checkSchema();
