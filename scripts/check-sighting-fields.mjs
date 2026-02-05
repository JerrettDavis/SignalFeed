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

async function checkFields() {
  console.log("Checking sighting field consistency...\n");

  try {
    const sightings = await sql`
      SELECT
        id,
        time_adjusted_score,
        relevance_score,
        last_score_update,
        flair_count,
        primary_flair_id,
        visibility_state,
        decay_rate
      FROM sightings
      LIMIT 5
    `;

    console.log("Sample of 5 sightings:");
    sightings.forEach(s => {
      console.log(`\nID: ${s.id}`);
      console.log(`  time_adjusted_score: ${s.time_adjusted_score} (${typeof s.time_adjusted_score})`);
      console.log(`  relevance_score: ${s.relevance_score} (${typeof s.relevance_score})`);
      console.log(`  last_score_update: ${s.last_score_update}`);
      console.log(`  flair_count: ${s.flair_count} (${typeof s.flair_count})`);
      console.log(`  primary_flair_id: ${s.primary_flair_id === null ? 'null' : s.primary_flair_id}`);
      console.log(`  visibility_state: ${s.visibility_state}`);
      console.log(`  decay_rate: ${s.decay_rate === null ? 'null' : s.decay_rate}`);
    });

    // Check for any NULL values in required fields
    const nullCheck = await sql`
      SELECT
        COUNT(*) FILTER (WHERE time_adjusted_score IS NULL) as null_time_adjusted,
        COUNT(*) FILTER (WHERE relevance_score IS NULL) as null_relevance,
        COUNT(*) FILTER (WHERE last_score_update IS NULL) as null_last_score,
        COUNT(*) FILTER (WHERE flair_count IS NULL) as null_flair_count,
        COUNT(*) FILTER (WHERE visibility_state IS NULL) as null_visibility
      FROM sightings
    `;

    console.log("\n\nNULL value counts:");
    console.log(nullCheck[0]);

  } catch (error) {
    console.error("Error checking fields:", error.message);
  } finally {
    await sql.end();
  }
}

checkFields();
