import test from "node:test";
import assert from "node:assert/strict";
import {
  parseArguments,
  validateTargetOrigin,
  executeSingleRequest,
  runDrill,
  MAX_REQUESTS,
  MAX_RESPONSE_BYTES,
} from "../run-staging-drill.mjs";

test("Argument Parsing & Target Origin Validation", async (t) => {
  await t.test("rejects unrecognized or positional arguments", () => {
    assert.throws(
      () => parseArguments(["--unknown-flag"]),
      /Unrecognized or positional argument/
    );
    assert.throws(
      () => parseArguments(["some-positional-arg"]),
      /Unrecognized or positional argument/
    );
  });

  await t.test("rejects missing values for flags", () => {
    assert.throws(() => parseArguments(["--origin"]), /--origin flag requires a valid URL/);
    assert.throws(() => parseArguments(["--origin", "--max-requests"]), /--origin flag requires a valid URL/);
    assert.throws(() => parseArguments(["--max-requests"]), /--max-requests flag requires an integer/);
    assert.throws(() => parseArguments(["--staging-proof"]), /--staging-proof flag requires a proof reference/);
  });

  await t.test("rejects invalid numbers for --max-requests", () => {
    assert.throws(() => parseArguments(["--max-requests", "0"]), /must be a positive integer/);
    assert.throws(() => parseArguments(["--max-requests", "-5"]), /must be a positive integer/);
    assert.throws(() => parseArguments(["--max-requests", "abc"]), /must be a positive integer/);
  });

  await t.test("accepts valid arguments and clamps --max-requests", () => {
    const config = parseArguments(["--origin", "http://localhost:3000", "--max-requests", "50", "--dry-run"]);
    assert.equal(config.targetOrigin, "http://localhost:3000");
    assert.equal(config.maxRequests, 50);
    assert.equal(config.dryRun, true);
    assert.equal(config.isLocal, true);

    const clamped = parseArguments(["--origin", "http://localhost:3000", "--max-requests", "999"]);
    assert.equal(clamped.maxRequests, MAX_REQUESTS);
  });
});

test("Target Origin Safety & Fail-Closed Refusal (Zero Network Calls)", async (t) => {
  await t.test("rejects known production alias yomirra-65ijtmb78-rzqllhs-projects.vercel.app", () => {
    assert.throws(
      () => validateTargetOrigin("https://yomirra-65ijtmb78-rzqllhs-projects.vercel.app"),
      /SAFETY REFUSAL: Target origin 'yomirra-65ijtmb78-rzqllhs-projects.vercel.app' is a locked production domain/
    );
  });

  await t.test("rejects production domain yomirra.web.id and www.yomirra.web.id", () => {
    assert.throws(
      () => validateTargetOrigin("https://yomirra.web.id"),
      /SAFETY REFUSAL/
    );
    assert.throws(
      () => validateTargetOrigin("https://www.yomirra.web.id"),
      /SAFETY REFUSAL/
    );
  });

  await t.test("rejects main branch aliases (*-git-main-*)", () => {
    assert.throws(
      () => validateTargetOrigin("https://yomirra-git-main-custom.vercel.app"),
      /SAFETY REFUSAL/
    );
  });

  await t.test("rejects remote staging targets without explicit --staging-proof (Fail-Closed)", () => {
    assert.throws(
      () => validateTargetOrigin("https://yomirra-staging-test.vercel.app"),
      /Remote target 'yomirra-staging-test.vercel.app' is strictly FAIL-CLOSED/
    );
    assert.throws(
      () => validateTargetOrigin("https://yomirra-staging-test.vercel.app", ""),
      /Remote target 'yomirra-staging-test.vercel.app' is strictly FAIL-CLOSED/
    );
  });

  await t.test("accepts remote staging target when valid --staging-proof is provided", () => {
    const validated = validateTargetOrigin(
      "https://yomirra-staging-test.vercel.app",
      "docs/ops/pre-unblock.md:isolated-preview-ref"
    );
    assert.equal(validated.origin, "https://yomirra-staging-test.vercel.app");
    assert.equal(validated.isLocal, false);
    assert.equal(validated.stagingProof, "docs/ops/pre-unblock.md:isolated-preview-ref");
  });

  await t.test("accepts local loopback without staging-proof", () => {
    const validated1 = validateTargetOrigin("http://localhost:3000");
    assert.equal(validated1.isLocal, true);
    const validated2 = validateTargetOrigin("http://127.0.0.1:3000");
    assert.equal(validated2.isLocal, true);
  });
});

test("Dry-Run Guarantees Zero Network Calls", async () => {
  let networkCalls = 0;
  const mockFetch = async () => {
    networkCalls++;
    return new Response("ok", { status: 200 });
  };

  const result = await runDrill(
    {
      targetOrigin: "http://localhost:3000",
      isLocal: true,
      stagingProof: null,
      dryRun: true,
      maxRequests: 10,
    },
    {
      fetchImpl: mockFetch,
      log: () => {},
      errorLog: () => {},
    }
  );

  assert.equal(networkCalls, 0, "Dry run must make ZERO network calls");
  assert.equal(result.exitCode, 0);
  assert.equal(result.stopReason, "DRY_RUN_COMPLETED");
  assert.equal(result.totalRequests, 0);
});

test("Streaming Body Cancellation & Per-Chunk Budget Enforcement", async (t) => {
  await t.test("cancels streaming reader immediately when single chunk exceeds budget", async () => {
    let streamCancelled = false;
    let cancelReason = null;

    // Create a mock stream with 1 MiB chunks
    const chunk1MiB = new Uint8Array(1024 * 1024);
    let chunksPushed = 0;

    const stream = new ReadableStream({
      pull(controller) {
        if (chunksPushed < 30) {
          controller.enqueue(chunk1MiB);
          chunksPushed++;
        } else {
          controller.close();
        }
      },
      cancel(reason) {
        streamCancelled = true;
        cancelReason = reason;
      },
    });

    const mockFetch = async () => {
      return new Response(stream, { status: 200 });
    };

    // Remaining session budget only 5 MiB
    const remainingSessionBytes = 5 * 1024 * 1024;
    const result = await executeSingleRequest("http://localhost:3000/api/health", {
      fetchImpl: mockFetch,
      remainingSessionBytes,
      remainingSessionMs: 6000,
    });

    assert.equal(streamCancelled, true, "Reader stream MUST be cancelled when budget exceeded");
    assert.equal(cancelReason, "SESSION_BYTE_BUDGET_EXCEEDED");
    assert.equal(result.budgetExceeded, true);
    assert.equal(result.bytes, 6 * 1024 * 1024, "Should record chunks received up to and including the overrun chunk");
  });

  await t.test("drill halts and returns exit code 1 when accumulated bytes reach 25 MiB cap", async () => {
    const chunk2MiB = new Uint8Array(2 * 1024 * 1024);
    const mockFetch = async () => {
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(chunk2MiB);
            controller.close();
          },
        }),
        { status: 200 }
      );
    };

    const result = await runDrill(
      {
        targetOrigin: "http://localhost:3000",
        isLocal: true,
        stagingProof: null,
        dryRun: false,
        maxRequests: 20, // 20 * 2 MiB = 40 MiB, should cap at 25 MiB (~13 requests)
      },
      {
        fetchImpl: mockFetch,
        sleepImpl: async () => {},
        log: () => {},
        errorLog: () => {},
      }
    );

    assert.equal(result.stopReason, "MAX_BYTES_EXCEEDED");
    assert.equal(result.exitCode, 1, "Budget cap interruption before completion must exit with code 1");
    assert.ok(result.totalBytes >= MAX_RESPONSE_BYTES);
    assert.ok(result.totalRequests < 20);
  });

  await t.test("infinite stream is cancelled without hanging", async () => {
    let cancelled = false;
    const infiniteStream = new ReadableStream({
      pull(controller) {
        controller.enqueue(new Uint8Array(512 * 1024));
      },
      cancel() {
        cancelled = true;
      },
    });

    const mockFetch = async () => new Response(infiniteStream, { status: 200 });

    const result = await executeSingleRequest("http://localhost:3000/stream", {
      fetchImpl: mockFetch,
      remainingSessionBytes: 1024 * 1024, // 1 MiB
      remainingSessionMs: 6000,
    });

    assert.equal(cancelled, true);
    assert.equal(result.budgetExceeded, true);
  });
});

test("Session Deadline & Pacing Enforcement", async () => {
  let virtualTime = 0;
  const mockNow = () => virtualTime;
  let sleepCalls = [];
  const mockSleep = async (ms) => {
    sleepCalls.push(ms);
    virtualTime += ms;
  };

  const mockFetch = async () => {
    virtualTime += 100; // 100ms per request
    return new Response("ok", { status: 200 });
  };

  const result = await runDrill(
    {
      targetOrigin: "http://localhost:3000",
      isLocal: true,
      stagingProof: null,
      dryRun: false,
      maxRequests: 3,
    },
    {
      fetchImpl: mockFetch,
      nowImpl: mockNow,
      sleepImpl: mockSleep,
      log: () => {},
      errorLog: () => {},
    }
  );

  assert.equal(result.exitCode, 0);
  assert.equal(result.totalRequests, 3);
  assert.equal(sleepCalls.length, 3);
  assert.equal(sleepCalls[0], 400, "Pacing interval should sleep (500 - 100) = 400ms");
});

test("Failure Contracts & Exit Code Policy", async (t) => {
  await t.test("returns exit code 2 immediately on HTTP 402 Account Hold", async () => {
    let calls = 0;
    const mockFetch = async () => {
      calls++;
      return new Response("Deployment Disabled", { status: 402 });
    };

    const result = await runDrill(
      {
        targetOrigin: "http://localhost:3000",
        isLocal: true,
        stagingProof: null,
        dryRun: false,
        maxRequests: 10,
      },
      {
        fetchImpl: mockFetch,
        sleepImpl: async () => {},
        log: () => {},
        errorLog: () => {},
      }
    );

    assert.equal(calls, 1, "Should halt immediately on first 402");
    assert.equal(result.stopReason, "HTTP_402_PAYMENT_REQUIRED_HOLD");
    assert.equal(result.exitCode, 2, "HTTP 402 MUST return exit code 2");
  });

  await t.test("returns exit code 1 immediately on 5xx server error", async () => {
    let calls = 0;
    const mockFetch = async () => {
      calls++;
      return new Response("Internal Server Error", { status: 500 });
    };

    const result = await runDrill(
      {
        targetOrigin: "http://localhost:3000",
        isLocal: true,
        stagingProof: null,
        dryRun: false,
        maxRequests: 10,
      },
      {
        fetchImpl: mockFetch,
        sleepImpl: async () => {},
        log: () => {},
        errorLog: () => {},
      }
    );

    assert.equal(calls, 1, "Should halt immediately on 5xx error");
    assert.equal(result.stopReason, "FATAL_PROBE_FAILURE_500");
    assert.equal(result.exitCode, 1, "5xx MUST return exit code 1");
    assert.equal(result.failedRequests, 1);
  });

  await t.test("returns exit code 1 on network error or connection refused", async () => {
    let calls = 0;
    const mockFetch = async () => {
      calls++;
      throw new Error("ECONNREFUSED");
    };

    const result = await runDrill(
      {
        targetOrigin: "http://localhost:3000",
        isLocal: true,
        stagingProof: null,
        dryRun: false,
        maxRequests: 10,
      },
      {
        fetchImpl: mockFetch,
        sleepImpl: async () => {},
        log: () => {},
        errorLog: () => {},
      }
    );

    assert.equal(calls, 1);
    assert.equal(result.stopReason, "FATAL_PROBE_FAILURE_NETWORK_ERROR");
    assert.equal(result.exitCode, 1, "Network error MUST return exit code 1");
  });

  await t.test("returns exit code 0 ONLY when all mandatory probe contracts succeed", async () => {
    let calls = 0;
    const mockFetch = async () => {
      calls++;
      return new Response("ok", { status: 200 });
    };

    const result = await runDrill(
      {
        targetOrigin: "http://localhost:3000",
        isLocal: true,
        stagingProof: null,
        dryRun: false,
        maxRequests: 7,
      },
      {
        fetchImpl: mockFetch,
        sleepImpl: async () => {},
        log: () => {},
        errorLog: () => {},
      }
    );

    assert.equal(calls, 7);
    assert.equal(result.failedRequests, 0);
    assert.equal(result.stopReason, "COMPLETED_PLAN");
    assert.equal(result.exitCode, 0, "Clean run must return exit code 0");
  });
});
