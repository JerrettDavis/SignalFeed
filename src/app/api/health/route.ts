import { getSightingRepository } from "@/adapters/repositories/repository-factory";
import { getCacheStats } from "@/shared/cache";
import { jsonOk } from "@/shared/http";

export const runtime = "nodejs";

/**
 * Health check endpoint for monitoring and load balancer probes
 *
 * Returns:
 * - 200 OK: Service is healthy
 * - 503 Service Unavailable: Service has issues
 */
export const GET = async () => {
  const startTime = Date.now();
  const checks: Record<
    string,
    { status: "ok" | "error"; latencyMs?: number; error?: string }
  > = {};

  // Check database connectivity
  try {
    const dbStart = Date.now();
    const repository = getSightingRepository();
    await repository.list({ status: "active", limit: 1 });
    checks.database = {
      status: "ok",
      latencyMs: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check cache health
  try {
    const cacheStats = getCacheStats();
    checks.cache = {
      status: "ok",
      ...cacheStats,
    };
  } catch (error) {
    checks.cache = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  const overallStatus = Object.values(checks).every(
    (check) => check.status === "ok"
  )
    ? "healthy"
    : "unhealthy";

  const responseTime = Date.now() - startTime;

  const health = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTimeMs: responseTime,
    checks,
    version: process.env.npm_package_version || "unknown",
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
  };

  return new Response(JSON.stringify(health), {
    status: overallStatus === "healthy" ? 200 : 503,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
};
