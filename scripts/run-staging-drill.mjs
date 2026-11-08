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
 * - Safety: Remote targets fail-closed without verified --staging-proof
 * - Emergency stop: Halts immediately on HTTP 402 (exit 2), 5xx, network errors, or cap exhaustion (exit 1)
 * - Success: Exit 0 ONLY if all mandatory probe contracts pass completely within budget
 */

import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const MAX_REQUESTS = 160;
export const MAX_DURATION_MS = 15 * 60 * 1000;
export const MAX_RESPONSE_BYTES = 25 * 1024 * 1024;
export const MIN_REQUEST_INTERVAL_MS = 500;
export const REQUEST_TIMEOUT_MS = 6000;

export const KNOWN_PRODUCTION_ALIASES = [
  "www.yomirra.web.id",
  "yomirra.web.id",
  "yomirra-65ijtmb78-rzqllhs-projects.vercel.app",
];

export const MANDATORY_PROBE_PATHS = [
  "/api/health/live",
  "/api/health",
  "/",
  "/sources",
  "/search",
  "/popular",
  "/updates",
];

export function isProductionDomain(hostname) {
  if (!hostname || typeof hostname !== "string") return false;
  const lower = hostname.toLowerCase();
  if (lower === "yomirra.web.id" || lower.endsWith(".yomirra.web.id")) return true;
  if (lower.includes("-git-main-")) return true;
  if (KNOWN_PRODUCTION_ALIASES.includes(lower)) return true;
  return false;
}

export function isLoopbackHost(hostname) {
  if (!hostname || typeof hostname !== "string") return false;
  const lower = hostname.toLowerCase();
  return lower === "localhost" || lower === "127.0.0.1" || lower === "::1" || lower === "[::1]";
}

export function validateTargetOrigin(targetUrlString, stagingProof = null) {
  let parsed;
  try {
    parsed = new URL(targetUrlString);
  } catch {
    throw new Error(`VALIDATION ERROR: Invalid target URL string: '${targetUrlString}'.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`VALIDATION ERROR: Unsupported protocol '${parsed.protocol}'. Only http: and https: are allowed.`);
  }

  if (isProductionDomain(parsed.hostname)) {
    throw new Error(
      `SAFETY REFUSAL: Target origin '${parsed.hostname}' is a locked production domain or alias. Staging drill MUST NOT target production.`
    );
  }

  const isLocal = isLoopbackHost(parsed.hostname);

  if (!isLocal) {
    if (parsed.protocol !== "https:") {
      throw new Error(`SAFETY REFUSAL: Remote target '${parsed.hostname}' must use HTTPS.`);
    }
    if (!stagingProof || typeof stagingProof !== "string" || stagingProof.trim().length === 0) {
      throw new Error(
        `SAFETY REFUSAL: Remote target '${parsed.hostname}' is strictly FAIL-CLOSED. Remote execution requires explicit authoritative --staging-proof <ref>. Without proof, remote targets remain BLOCKED_EXTERNAL.`
      );
    }
  }

  return {
    origin: parsed.origin,
    hostname: parsed.hostname,
    isLocal,
    stagingProof: isLocal ? null : stagingProof.trim(),
  };
}

export function parseArguments(argv = process.argv.slice(2), env = process.env) {
  let targetOrigin = env.STAGING_TARGET_ORIGIN || "http://localhost:3000";
  let dryRun = false;
  let maxRequests = MAX_REQUESTS;
  let stagingProof = env.STAGING_PROOF_REF || null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      return { showHelp: true };
    } else if (arg === "--origin") {
      if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) {
        throw new Error("VALIDATION ERROR: --origin flag requires a valid URL argument.");
      }
      targetOrigin = argv[++i];
    } else if (arg === "--max-requests") {
      if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) {
        throw new Error("VALIDATION ERROR: --max-requests flag requires an integer argument.");
      }
      const parsedNum = Number(argv[++i]);
      if (!Number.isInteger(parsedNum) || parsedNum <= 0) {
        throw new Error(`VALIDATION ERROR: --max-requests must be a positive integer, received: '${argv[i]}'.`);
      }
      maxRequests = Math.min(MAX_REQUESTS, parsedNum);
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--staging-proof") {
      if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) {
        throw new Error("VALIDATION ERROR: --staging-proof flag requires a proof reference string.");
      }
      stagingProof = argv[++i];
    } else {
      throw new Error(`VALIDATION ERROR: Unrecognized or positional argument: '${arg}'.`);
    }
  }

  const validatedTarget = validateTargetOrigin(targetOrigin, stagingProof);

  return {
    showHelp: false,
    targetOrigin: validatedTarget.origin,
    isLocal: validatedTarget.isLocal,
    stagingProof: validatedTarget.stagingProof,
    dryRun,
    maxRequests,
  };
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeSingleRequest(targetUrl, options = {}) {
  const {
    fetchImpl = fetch,
    remainingSessionBytes = MAX_RESPONSE_BYTES,
    remainingSessionMs = REQUEST_TIMEOUT_MS,
  } = options;

  const start = performance.now();
  let bytes = 0;
  let status = 0;
  let ok = false;
  let errorMsg = null;
  let budgetExceeded = false;

  if (remainingSessionBytes <= 0) {
    return {
      status: 0,
      ok: false,
      durationMs: 0,
      bytes: 0,
      errorMsg: "SESSION_BYTE_BUDGET_EXCEEDED_BEFORE_REQUEST",
      budgetExceeded: true,
    };
  }

  const effectiveTimeout = Math.min(REQUEST_TIMEOUT_MS, remainingSessionMs);
  if (effectiveTimeout <= 0) {
    return {
      status: 0,
      ok: false,
      durationMs: 0,
      bytes: 0,
      errorMsg: "SESSION_DEADLINE_EXCEEDED_BEFORE_REQUEST",
      budgetExceeded: false,
    };
  }

  try {
    const res = await fetchImpl(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Yomirra-StagingDrill/1.0",
        Accept: "text/html,application/json,*/*",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(effectiveTimeout),
    });

    status = res.status;
    ok = res.ok;

    if (res.body) {
      const reader = res.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            bytes += value.byteLength;
            if (bytes > remainingSessionBytes) {
              budgetExceeded = true;
              await reader.cancel("SESSION_BYTE_BUDGET_EXCEEDED");
              break;
            }
          }
        }
      } catch (streamErr) {
        if (!budgetExceeded) {
          errorMsg = streamErr instanceof Error ? streamErr.message : String(streamErr);
        }
      }
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  const durationMs = Math.round(performance.now() - start);
  return { status, ok, durationMs, bytes, errorMsg, budgetExceeded };
}

export function calculatePercentile(numbers, p) {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export async function runDrill(config, dependencies = {}) {
  const {
    targetOrigin,
    isLocal,
    stagingProof,
    dryRun,
    maxRequests,
  } = config;

  const {
    fetchImpl = fetch,
    nowImpl = () => performance.now(),
    sleepImpl = sleep,
    log = console.log,
    errorLog = console.error,
  } = dependencies;

  log("=== Yomirra Hard-Capped Staging Drill Runner ===");
  log(`Target Origin:   ${targetOrigin} (${isLocal ? "Local Loopback" : "Remote Staging"})`);
  if (!isLocal) {
    log(`Staging Proof:   ${stagingProof}`);
  }
  log(`Hard Caps:       max ${maxRequests} reqs, max ${MAX_DURATION_MS / 60000} mins, max ${MAX_RESPONSE_BYTES / 1024 / 1024} MiB`);
  log(`Pacing Interval: >= ${MIN_REQUEST_INTERVAL_MS} ms/req (max 2 req/s, concurrency 1, zero auto-retry)`);
  log("-------------------------------------------------");

  if (dryRun) {
    log("Dry run mode: configuration validated. Zero network calls made. Exiting with success.");
    return {
      exitCode: 0,
      stopReason: "DRY_RUN_COMPLETED",
      totalRequests: 0,
      totalBytes: 0,
      failedRequests: 0,
    };
  }

  const drillStart = nowImpl();
  let totalRequests = 0;
  let totalBytes = 0;
  let failedRequests = 0;
  let stopReason = "COMPLETED_PLAN";

  const latencies = [];
  const statusCounts = {};

  for (let i = 0; i < maxRequests; i++) {
    const elapsedSessionMs = nowImpl() - drillStart;

    if (elapsedSessionMs >= MAX_DURATION_MS) {
      stopReason = "MAX_DURATION_EXCEEDED";
      break;
    }

    const remainingSessionBytes = MAX_RESPONSE_BYTES - totalBytes;
    if (remainingSessionBytes <= 0) {
      stopReason = "MAX_BYTES_EXCEEDED";
      break;
    }

    const remainingSessionMs = MAX_DURATION_MS - elapsedSessionMs;
    const path = MANDATORY_PROBE_PATHS[i % MANDATORY_PROBE_PATHS.length];
    const targetUrl = new URL(path, targetOrigin).toString();

    const reqStart = nowImpl();
    const result = await executeSingleRequest(targetUrl, {
      fetchImpl,
      remainingSessionBytes,
      remainingSessionMs,
    });

    totalRequests++;
    totalBytes += result.bytes;
    latencies.push(result.durationMs);

    const statusKey = result.status ? String(result.status) : "ERR";
    statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;

    const isSuccessStatus = result.status >= 200 && result.status < 400 && !result.errorMsg;
    if (!isSuccessStatus) {
      failedRequests++;
    }

    log(
      `[${String(totalRequests).padStart(3, " ")}/${maxRequests}] ${path} -> HTTP ${result.status || "ERR"} (${result.bytes} B, ${result.durationMs} ms)${result.errorMsg ? ` [ERROR: ${result.errorMsg}]` : ""}`
    );

    if (result.status === 402) {
      stopReason = "HTTP_402_PAYMENT_REQUIRED_HOLD";
      errorLog("\nEMERGENCY STOP: Received HTTP 402. Account is paused/held. Halting drill immediately.");
      break;
    }

    if (result.budgetExceeded || totalBytes >= MAX_RESPONSE_BYTES) {
      stopReason = "MAX_BYTES_EXCEEDED";
      errorLog(`\nHARD CAP REACHED: Total response bytes exceeded limit (${(totalBytes / 1024 / 1024).toFixed(3)} MiB >= 25 MiB). Halting.`);
      break;
    }

    if (result.errorMsg || result.status >= 500) {
      stopReason = `FATAL_PROBE_FAILURE_${result.status || "NETWORK_ERROR"}`;
      errorLog(`\nPROBE FAILURE: Unexplained failure on mandatory probe path ${path}: status=${result.status}, err=${result.errorMsg}. Halting.`);
      break;
    }

    // Rate pacing
    const reqElapsed = nowImpl() - reqStart;
    const remainingDelay = MIN_REQUEST_INTERVAL_MS - reqElapsed;
    if (remainingDelay > 0) {
      await sleepImpl(remainingDelay);
    }
  }

  const totalDurationSec = ((nowImpl() - drillStart) / 1000).toFixed(2);
  const p50 = calculatePercentile(latencies, 50);
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);

  log("\n================ DRILL SUMMARY ================");
  log(`Stop Reason:     ${stopReason}`);
  log(`Total Requests:  ${totalRequests} of ${maxRequests} planned`);
  log(`Failed Requests: ${failedRequests}`);
  log(`Total Bytes:     ${(totalBytes / 1024).toFixed(2)} KiB (${(totalBytes / 1024 / 1024).toFixed(3)} MiB)`);
  log(`[NOTE] Local body bytes measured (${totalBytes} B) represents client stream consumption, not guaranteed provider billing transfer (FOT/FDT).`);
  log(`Total Duration:  ${totalDurationSec} s`);
  log(`Latency p50:     ${p50} ms`);
  log(`Latency p95:     ${p95} ms`);
  log(`Latency p99:     ${p99} ms`);
  log("Status Codes:   ", JSON.stringify(statusCounts));
  log("===============================================");

  // Determine Exit Code strictly:
  // Exit 2: HTTP 402 Account Hold
  // Exit 1: Network error, timeout, 5xx, unexpected failure, or stopped prematurely by budget cap before completion
  // Exit 0: ONLY if all mandatory probe contracts succeeded within budget
  let exitCode = 0;
  if (stopReason.startsWith("HTTP_402")) {
    exitCode = 2;
  } else if (failedRequests > 0 || stopReason !== "COMPLETED_PLAN") {
    exitCode = 1;
  }

  return {
    exitCode,
    stopReason,
    totalRequests,
    totalBytes,
    failedRequests,
    latencies,
    statusCounts,
  };
}

export async function main() {
  let parsedConfig;
  try {
    parsedConfig = parseArguments();
  } catch (err) {
    console.error(`Execution error: ${err.message}`);
    process.exit(1);
  }

  if (parsedConfig.showHelp) {
    console.log(`
Usage: node scripts/run-staging-drill.mjs [options]

Options:
  --origin <url>            Target origin (default: http://localhost:3000). Remote targets require --staging-proof.
  --max-requests <number>   Max requests to execute (1..160, default: 160).
  --staging-proof <ref>     Required proof reference for remote staging targets.
  --dry-run                 Validate configuration without executing network calls.
  --help, -h                Show this help message.
`);
    process.exit(0);
  }

  try {
    const result = await runDrill(parsedConfig);
    process.exit(result.exitCode);
  } catch (err) {
    console.error("Fatal unhandled drill runner error:", err.message);
    process.exit(1);
  }
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedFile === currentFile) {
  main();
}
