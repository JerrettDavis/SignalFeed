import postgres from "postgres";

type SqlClient = ReturnType<typeof postgres>;

const getConnectionString = () =>
  process.env.SIGHTSIGNAL_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL;

export const getSql = (): SqlClient => {
  const globalAny = globalThis as { __sightsignal_sql?: SqlClient };
  if (globalAny.__sightsignal_sql) {
    return globalAny.__sightsignal_sql;
  }

  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("Missing database connection string.");
  }

  const sql = postgres(connectionString, { max: 2 });
  globalAny.__sightsignal_sql = sql;
  return sql;
};
