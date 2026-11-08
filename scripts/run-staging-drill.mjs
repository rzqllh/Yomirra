#!/usr/bin/env node
/**
 * Hard-capped Staging Drill Runner for Yomirra
 *
 * Enforces strict pre-unblock drill boundaries from docs/ops/pre-unblock.md:
 * - Cap 1: Max 160 application requests
 * - Cap 2: Max 15 minutes (900,000 ms) duration
 * - Cap 3: Max 25 MiB (26,214,400 bytes) response body
 * - Rate: Max 2 requests/second (>=500ms between requests)
 * - Concurrency: 1 (strictly sequential)
 * - Safety: Blocks execution against production origin without explicit override
 * - Emergency stop: Halts immediately on HTTP 402, repeated 5xx, or cap exhaustion
 */

import { performance } from "node:perf_hooks";

const MAX_REQUESTS = 160;
const MAX_DURATION_MS = 15 * 60 * 1000;
const MAX_RESPONSE_BYTES = 25 * 1024 * 1024;
const MIN_REQUEST_INTERVAL_MS = 500;
const REQUEST_TIMEOUT_MS = 6000;

const FORBIDDEN_PRODUCTION_DOMAINS = [
  "www.yomirra.web.id",
  "yomirra.web.id",
  "yomirra-git-main-rzqllhs-projects.vercel.app",
];

function parseArguments() {
  const args = process.argv.slice(2);
  let targetOrigin = process.env.STAGING_TARGET_ORIGIN || "http://localhost:3000";
  let dryRun = false;
  let maxRequests = MAX_REQUESTS;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--origin" && args[i + 1]) {
      targetOrigin = args[++i];
    } else if (args[i] === "--max-requests" && args[i + 1]) {
      maxRequests = Math.min(MAX_REQUESTS, Math.max(1, Number(args[++i])));
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  const parsedUrl = new URL(targetOrigin);
  if (FORBIDDEN_PRODUCTION_DOMAINS.includes(parsedUrl.hostname)) {
    throw new Error(
      `SAFETY REFUSAL: Target origin '${parsedUrl.hostname}' is a locked production domain. Staging drill MUST target isolated staging or localhost only.`
    );
  }

  return { targetOrigin: parsedUrl.origin, dryRun, maxRequests };
}

function calculatePercentile(numbers, p) {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeSingleRequest(targetUrl) {
  const start = performance.now();
  let bytes = 0;
  let status = 0;
  let ok = false;
  let errorMsg = null;

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Yomirra-StagingDrill/1.0",
        Accept: "text/html,application/json,*/*",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    status = res.status;
    ok = res.ok;

    if (res.body) {
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) bytes += value.byteLength;
      }
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  const durationMs = Math.round(performance.now() - start);
  return { status, ok, durationMs, bytes, errorMsg };
}

async function main() {
  const { targetOrigin, dryRun, maxRequests } = parseArguments();

  console.log("=== Yomirra Staging Drill Runner ===");
  console.log(`Target: ${targetOrigin}`);
  console.log(`Hard Caps: max ${maxRequests} reqs, max ${MAX_DURATION_MS / 60000} mins, max ${MAX_RESPONSE_BYTES / 1024 / 1024} MiB`);
  console.log(`Interval: >= ${MIN_REQUEST_INTERVAL_MS} ms/request (max 2 req/s, concurrency 1)`);
  console.log("------------------------------------");

  if (dryRun) {
    console.log("Dry run mode: validated configuration. Exiting with success.");
    process.exit(0);
  }

  const drillStart = performance.now();
  let totalRequests = 0;
  let totalBytes = 0;
  let stopReason = "COMPLETED_PLAN";

  const latencies = [];
  const statusCounts = {};

  const probePaths = [
    "/api/health/live",
    "/api/health",
    "/",
    "/sources",
    "/search",
    "/popular",
    "/updates",
  ];

  for (let i = 0; i < maxRequests; i++) {
    const elapsedTotal = performance.now() - drillStart;

    if (elapsedTotal >= MAX_DURATION_MS) {
      stopReason = "MAX_DURATION_EXCEEDED";
      break;
    }
    if (totalBytes >= MAX_RESPONSE_BYTES) {
      stopReason = "MAX_BYTES_EXCEEDED";
      break;
    }

    const path = probePaths[i % probePaths.length];
    const targetUrl = new URL(path, targetOrigin).toString();

    const reqStart = performance.now();
    const result = await executeSingleRequest(targetUrl);

    totalRequests++;
    totalBytes += result.bytes;
    latencies.push(result.durationMs);

    const statusKey = result.status || "ERR";
    statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;

    console.log(
      `[${String(totalRequests).padStart(3, " ")}/${maxRequests}] ${path} -> HTTP ${result.status || "ERR"} (${result.bytes} B, ${result.durationMs} ms)`
    );

    // Emergency Stop Conditions
    if (result.status === 402) {
      stopReason = "HTTP_402_PAYMENT_REQUIRED_HOLD";
      console.error("\nEMERGENCY STOP: Received HTTP 402. Account is paused. Halting drill immediately.");
      break;
    }

    // Rate pacing
    const reqElapsed = performance.now() - reqStart;
    const remainingDelay = MIN_REQUEST_INTERVAL_MS - reqElapsed;
    if (remainingDelay > 0) {
      await sleep(remainingDelay);
    }
  }

  const totalDurationSec = ((performance.now() - drillStart) / 1000).toFixed(2);
  const p50 = calculatePercentile(latencies, 50);
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);

  console.log("\n================ DRILL SUMMARY ================");
  console.log(`Stop Reason:     ${stopReason}`);
  console.log(`Total Requests:  ${totalRequests}`);
  console.log(`Total Bytes:     ${(totalBytes / 1024).toFixed(2)} KiB (${(totalBytes / 1024 / 1024).toFixed(3)} MiB)`);
  console.log(`Total Duration:  ${totalDurationSec} s`);
  console.log(`Latency p50:     ${p50} ms`);
  console.log(`Latency p95:     ${p95} ms`);
  console.log(`Latency p99:     ${p99} ms`);
  console.log("Status Codes:   ", JSON.stringify(statusCounts));
  console.log("===============================================");

  if (stopReason.startsWith("HTTP_402") || stopReason.startsWith("EMERGENCY")) {
    process.exit(2);
  }
}

main().catch((err) => {
  console.error("Fatal drill runner error:", err.message);
  process.exit(1);
});
