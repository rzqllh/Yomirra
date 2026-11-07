const PRODUCTION_ORIGIN = "https://www.yomirra.web.id";
const TIMEOUT_MS = 6_000;

async function checkEndpoint(path, targetMs) {
  const start = performance.now();
  const response = await fetch(new URL(path, PRODUCTION_ORIGIN), {
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const elapsedMs = Math.round(performance.now() - start);
  await response.body?.cancel();
  if (!response.ok || elapsedMs > targetMs) {
    throw new Error(`${path} HTTP ${response.status} in ${elapsedMs} ms (target ${targetMs} ms)`);
  }
  console.log(`${path} HTTP ${response.status} in ${elapsedMs} ms`);
}

async function checkRedisBudget() {
  const { UPSTASH_STATS_BASIC, UPSTASH_STATS_DATABASE_ID, UPSTASH_MONTHLY_COMMAND_LIMIT } = process.env;
  if (!UPSTASH_STATS_BASIC || !UPSTASH_STATS_DATABASE_ID || !UPSTASH_MONTHLY_COMMAND_LIMIT) {
    throw new Error("Redis command monitoring is unconfigured");
  }

  const limit = Number(UPSTASH_MONTHLY_COMMAND_LIMIT);
  if (!Number.isSafeInteger(limit) || limit <= 0) throw new Error("Invalid Redis command budget");
  const id = encodeURIComponent(UPSTASH_STATS_DATABASE_ID);
  const response = await fetch(`https://api.upstash.com/v2/redis/stats/${id}`, {
    headers: { Authorization: `Basic ${UPSTASH_STATS_BASIC}` },
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => {
    throw new Error("Upstash stats request failed");
  });
  if (!response.ok) throw new Error(`Upstash stats HTTP ${response.status}`);
  const { total_monthly_requests: monthly, daily_net_commands: daily } = await response.json()
    .catch(() => { throw new Error("Invalid Upstash stats response"); });
  if (![monthly, daily].every((value) => Number.isSafeInteger(value) && value >= 0)) {
    throw new Error("Upstash stats omitted command counts");
  }
  console.log(`Redis requests this month ${monthly}/${limit}. Commands today ${daily}.`);
  if (monthly / limit >= 0.8 || daily / limit >= 0.05) {
    throw new Error("Redis exceeded 80% of monthly budget or 5% of monthly budget today");
  }
}

const checks = await Promise.allSettled([
  checkEndpoint("/api/health/live", 1_000),
  checkEndpoint("/api/health", 2_000),
  checkRedisBudget(),
]);
for (const check of checks) {
  if (check.status === "rejected") {
    console.error(check.reason.message);
    process.exitCode = 1;
  }
}
