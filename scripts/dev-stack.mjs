import { spawn } from "node:child_process";

const connectionString = "postgres://sightsignal:sightsignal@localhost:5432/sightsignal";
const dbService = "db";

const run = (command, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, { stdio: "inherit", shell: true, ...options });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed (${code}): ${command}`));
      }
    });
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDb = async () => {
  const timeoutMs = 30_000;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await run(`docker compose exec -T ${dbService} pg_isready -U sightsignal -d sightsignal`);
      return;
    } catch {
      await sleep(1000);
    }
  }
  throw new Error("Postgres did not become ready in time.");
};

const main = async () => {
  await run(`docker compose up -d ${dbService}`);
  await waitForDb();
  await run(`docker compose exec -T ${dbService} psql -U sightsignal -d sightsignal -f /docker-entrypoint-initdb.d/01-schema.sql`);

  const env = {
    ...process.env,
    SIGHTSIGNAL_DATA_STORE: "postgres",
    SIGHTSIGNAL_DATABASE_URL: connectionString,
    NEXT_DISABLE_TURBOPACK: "1",
  };

  await run("npm run dev -- --webpack", { env });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
