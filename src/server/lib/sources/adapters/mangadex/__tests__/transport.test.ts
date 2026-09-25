import { afterEach, describe, expect, it, vi } from "vitest";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import type { request as httpsRequest, RequestOptions } from "node:https";
import {
  buildPinnedMangaDexRequestOptions,
  classifyMangaDexFallback,
  createMangaDexTransport,
  isPublicMangaDexAddress,
  parseMangaDexDohResponse,
  requestPinnedMangaDex,
} from "../transport";

function codedError(code: string): Error {
  return new TypeError("fetch failed", {
    cause: Object.assign(new Error("network failure"), { code }),
  });
}

function dohResponse(answer: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    Status: 0,
    TC: false,
    AD: true,
    Question: [{ name: "api.mangadex.org.", type: 1 }],
    Answer: answer,
    ...overrides,
  };
}

const trustedDohFetch: typeof fetch = async () => Response.json(
  dohResponse([
    {
      name: "api.mangadex.org.",
      type: 1,
      TTL: 60,
      data: "104.17.161.14",
    },
  ])
);

afterEach(() => {
  vi.useRealTimers();
});

describe("MangaDex fallback classification", () => {
  it.each(["ENOTFOUND", "EAI_AGAIN"])("allows %s directly", (code) => {
    expect(classifyMangaDexFallback(codedError(code))).toBe("direct");
  });

  it.each([
    "ETIMEDOUT",
    "ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE",
    "ECONNREFUSED",
    "EHOSTUNREACH",
    "ENETUNREACH",
  ])("requires DNS divergence proof for %s", (code) => {
    expect(classifyMangaDexFallback(codedError(code))).toBe("divergence");
  });

  it.each([
    "CERT_HAS_EXPIRED",
    "ERR_TLS_CERT_ALTNAME_INVALID",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    "EPROTO",
  ])("rejects fallback for certificate or generic TLS error %s", (code) => {
    expect(classifyMangaDexFallback(codedError(code))).toBe("none");
  });
});

describe("MangaDex DoH response parsing", () => {
  it("follows a bounded CNAME chain to public A records", () => {
    expect(
      parseMangaDexDohResponse(
        dohResponse([
          {
            name: "api.mangadex.org.",
            type: 5,
            TTL: 60,
            data: "edge.mangadex.network.",
          },
          {
            name: "edge.mangadex.network.",
            type: 1,
            TTL: 60,
            data: "104.17.161.14",
          },
        ])
      )
    ).toEqual(["104.17.161.14"]);
  });

  it.each([
    ["private", "10.0.0.1"],
    ["loopback", "127.0.0.1"],
    ["link-local", "169.254.169.254"],
    ["carrier-grade NAT", "100.64.0.1"],
    ["benchmark", "198.18.0.1"],
    ["documentation", "203.0.113.10"],
    ["multicast", "224.0.0.1"],
  ])("rejects %s IPv4 address", (_label, address) => {
    expect(() =>
      parseMangaDexDohResponse(
        dohResponse([
          { name: "api.mangadex.org.", type: 1, TTL: 60, data: address },
        ])
      )
    ).toThrow();
  });

  it("rejects a mismatched question", () => {
    expect(() =>
      parseMangaDexDohResponse(
        dohResponse([], {
          Question: [{ name: "attacker.example.", type: 1 }],
        })
      )
    ).toThrow();
  });

  it("rejects more than 32 answers", () => {
    const answers = Array.from({ length: 33 }, () => ({
      name: "api.mangadex.org.",
      type: 1,
      TTL: 60,
      data: "104.17.161.14",
    }));
    expect(() => parseMangaDexDohResponse(dohResponse(answers))).toThrow();
  });

  it("rejects CNAME loops", () => {
    expect(() =>
      parseMangaDexDohResponse(
        dohResponse([
          { name: "api.mangadex.org.", type: 5, TTL: 60, data: "edge.example." },
          { name: "edge.example.", type: 5, TTL: 60, data: "api.mangadex.org." },
        ])
      )
    ).toThrow();
  });
});

describe("MangaDex public address policy", () => {
  it.each(["104.17.161.14", "2606:4700:4700::1111"])("accepts public address %s", (address) => {
    expect(isPublicMangaDexAddress(address)).toBe(true);
  });

  it.each([
    "::",
    "::1",
    "::ffff:104.17.161.14",
    "64:ff9b::1",
    "100::1",
    "2001:db8::1",
    "3fff::1",
    "fc00::1",
    "fe80::1",
    "ff02::1",
  ])("rejects unsafe IPv6 address %s", (address) => {
    expect(isPublicMangaDexAddress(address)).toBe(false);
  });
});

describe("MangaDex pinned HTTPS options", () => {
  it("binds the official hostname, SNI, certificate checks, and vetted lookup", () => {
    const options = buildPinnedMangaDexRequestOptions(
      new URL("https://api.mangadex.org/manga?limit=1"),
      ["104.17.161.14"],
      { Accept: "application/json", Host: "attacker.example" }
    );

    expect(options).toMatchObject({
      hostname: "api.mangadex.org",
      servername: "api.mangadex.org",
      rejectUnauthorized: true,
      agent: false,
      path: "/manga?limit=1",
      method: "GET",
    });
    expect(new Headers(options.headers as HeadersInit).has("host")).toBe(false);
    expect(options.lookup).toBeTypeOf("function");
  });

  it("rejects non-official authorities and unsafe pinned addresses", () => {
    expect(() =>
      buildPinnedMangaDexRequestOptions(
        new URL("https://attacker.example/manga"),
        ["104.17.161.14"]
      )
    ).toThrow();
    expect(() =>
      buildPinnedMangaDexRequestOptions(
        new URL("https://api.mangadex.org/manga"),
        ["127.0.0.1"]
      )
    ).toThrow();
  });

  it("rejects redirects from the raw HTTPS response", async () => {
    let capturedOptions: RequestOptions | undefined;
    const requestImpl = ((options: RequestOptions, callback: (response: Readable) => void) => {
      capturedOptions = options;
      const request = new EventEmitter() as EventEmitter & { end: () => void };
      request.end = () => {
        const response = Readable.from([]) as Readable & {
          statusCode: number;
          statusMessage: string;
          headers: Record<string, string>;
        };
        response.statusCode = 302;
        response.statusMessage = "Found";
        response.headers = { location: "https://attacker.example/" };
        callback(response);
      };
      return request;
    }) as unknown as typeof httpsRequest;

    await expect(requestPinnedMangaDex(
      new URL("https://api.mangadex.org/manga"),
      { headers: { Accept: "application/json" } },
      ["104.17.161.14"],
      new AbortController().signal,
      requestImpl
    )).rejects.toThrow("MANGADEX_PINNED_REDIRECT");
    expect(capturedOptions).toMatchObject({
      hostname: "api.mangadex.org",
      servername: "api.mangadex.org",
      rejectUnauthorized: true,
      agent: false,
    });
  });
});

describe("MangaDex secure transport", () => {
  it("caps the normal stage at the budget reserved before fallback", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const caller = new AbortController();
    let normalSignal: AbortSignal | undefined;
    const transport = createMangaDexTransport({
      normalFetch: async (_input, init) => {
        normalSignal = init?.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          normalSignal?.addEventListener(
            "abort",
            () => reject(normalSignal?.reason ?? new DOMException("Aborted", "AbortError")),
            { once: true }
          );
        });
      },
      dohFetch: trustedDohFetch,
      systemLookup: async () => ["198.18.0.1"],
      pinnedRequest: async () => Response.json({ result: "ok" }),
      now: () => Date.now(),
    });

    const request = transport.request(
      new URL("https://api.mangadex.org/manga"),
      {},
      transport.createContext(15000, caller.signal)
    );
    await vi.advanceTimersByTimeAsync(8500);

    expect(normalSignal?.aborted).toBe(true);
    await expect(request).resolves.toMatchObject({ route: { kind: "pinned" } });
  });

  it("uses a pinned route only after exact two-provider consensus", async () => {
    const normalError = new TypeError("fetch failed", {
      cause: Object.assign(new Error("lookup failed"), { code: "ENOTFOUND" }),
    });
    const transport = createMangaDexTransport({
      normalFetch: async () => { throw normalError; },
      dohFetch: trustedDohFetch,
      systemLookup: async () => { throw new Error("system lookup must not run"); },
      pinnedRequest: async () => Response.json({ result: "ok" }),
      now: () => 0,
    });

    const result = await transport.request(
      new URL("https://api.mangadex.org/manga"),
      {},
      transport.createContext(15000)
    );

    expect(result.route).toEqual({ kind: "pinned", addresses: ["104.17.161.14"] });
    await expect(result.response.json()).resolves.toEqual({ result: "ok" });
  });

  it("requires system DNS divergence for conditional network errors", async () => {
    const conditionalError = codedError("ECONNREFUSED");
    const transport = createMangaDexTransport({
      normalFetch: async () => { throw conditionalError; },
      dohFetch: trustedDohFetch,
      systemLookup: async () => ["198.18.0.1"],
      pinnedRequest: async () => Response.json({ result: "ok" }),
      now: () => 0,
    });

    const result = await transport.request(
      new URL("https://api.mangadex.org/manga"),
      {},
      transport.createContext(15000)
    );

    expect(result.route.kind).toBe("pinned");
  });

  it("fails closed when system DNS agrees with the DoH consensus", async () => {
    let pinnedCalled = false;
    const transport = createMangaDexTransport({
      normalFetch: async () => { throw codedError("ECONNREFUSED"); },
      dohFetch: trustedDohFetch,
      systemLookup: async () => ["104.17.161.14"],
      pinnedRequest: async () => {
        pinnedCalled = true;
        return Response.json({ result: "unexpected" });
      },
      now: () => 0,
    });

    await expect(transport.request(
      new URL("https://api.mangadex.org/manga"),
      {},
      transport.createContext(15000)
    )).rejects.toThrow();
    expect(pinnedCalled).toBe(false);
  });

  it("caller abort cancels the normal stage without invoking DoH", async () => {
    const caller = new AbortController();
    let dohCalled = false;
    const transport = createMangaDexTransport({
      normalFetch: async (_input, init) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(init.signal?.reason ?? new DOMException("Aborted", "AbortError")),
          { once: true }
        );
      }),
      dohFetch: async () => {
        dohCalled = true;
        return trustedDohFetch("");
      },
      now: () => 0,
    });

    const request = transport.request(
      new URL("https://api.mangadex.org/manga"),
      {},
      transport.createContext(15000, caller.signal)
    );
    caller.abort();

    await expect(request).rejects.toThrow();
    expect(dohCalled).toBe(false);
  });

  it("does not start fallback with less than 6500ms remaining", async () => {
    let now = 0;
    let dohCalled = false;
    const transport = createMangaDexTransport({
      normalFetch: async () => {
        now = 8501;
        throw codedError("ENOTFOUND");
      },
      dohFetch: async () => {
        dohCalled = true;
        return trustedDohFetch("");
      },
      now: () => now,
    });

    await expect(transport.request(
      new URL("https://api.mangadex.org/manga"),
      {},
      transport.createContext(15000)
    )).rejects.toThrow();
    expect(dohCalled).toBe(false);
  });

  it("caps the DoH consensus stage at 2000ms", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    let pinnedCalled = false;
    const transport = createMangaDexTransport({
      normalFetch: async () => { throw codedError("ENOTFOUND"); },
      dohFetch: async (_input, init) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(init.signal?.reason ?? new DOMException("Aborted", "AbortError")),
          { once: true }
        );
      }),
      pinnedRequest: async () => {
        pinnedCalled = true;
        return Response.json({ result: "unexpected" });
      },
      now: () => Date.now(),
    });

    const request = transport.request(
      new URL("https://api.mangadex.org/manga"),
      {},
      transport.createContext(15000)
    );
    const settled = request.catch((error) => error);
    await vi.advanceTimersByTimeAsync(2000);

    await expect(settled).resolves.toBeInstanceOf(Error);
    expect(pinnedCalled).toBe(false);
  });

  it("cancels a DoH response body as soon as it exceeds 64 KiB", async () => {
    let cancelledBodies = 0;
    const transport = createMangaDexTransport({
      normalFetch: async () => { throw codedError("ENOTFOUND"); },
      dohFetch: async () => {
        let pulls = 0;
        return new Response(new ReadableStream<Uint8Array>({
          pull(controller) {
            pulls += 1;
            controller.enqueue(new Uint8Array(40 * 1024));
            if (pulls === 3) controller.close();
          },
          cancel() {
            cancelledBodies += 1;
          },
        }));
      },
      now: () => 0,
    });

    await expect(transport.request(
      new URL("https://api.mangadex.org/manga"),
      {},
      transport.createContext(15000)
    )).rejects.toThrow();
    expect(cancelledBodies).toBe(2);
  });

  it("caps the pinned HTTPS stage at 4000ms", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    let pinnedSignal: AbortSignal | undefined;
    const transport = createMangaDexTransport({
      normalFetch: async () => { throw codedError("ENOTFOUND"); },
      dohFetch: trustedDohFetch,
      pinnedRequest: async (_url, _init, _addresses, signal) => {
        pinnedSignal = signal;
        return new Promise<Response>((_resolve, reject) => {
          signal.addEventListener(
            "abort",
            () => reject(signal.reason ?? new DOMException("Aborted", "AbortError")),
            { once: true }
          );
        });
      },
      now: () => Date.now(),
    });

    const request = transport.request(
      new URL("https://api.mangadex.org/manga"),
      {},
      transport.createContext(15000)
    );
    const settled = request.catch((error) => error);
    await vi.advanceTimersByTimeAsync(4000);

    expect(pinnedSignal?.aborted).toBe(true);
    await expect(settled).resolves.toBeInstanceOf(Error);
  });

  it("rejects pinned redirects", async () => {
    const transport = createMangaDexTransport({
      normalFetch: async () => { throw codedError("ENOTFOUND"); },
      dohFetch: trustedDohFetch,
      pinnedRequest: async () => new Response(null, {
        status: 302,
        headers: { Location: "https://attacker.example/" },
      }),
      now: () => 0,
    });

    await expect(transport.request(
      new URL("https://api.mangadex.org/manga"),
      {},
      transport.createContext(15000)
    )).rejects.toThrow("MANGADEX_PINNED_REDIRECT");
  });

  it("reuses an existing pinned route without resolving DNS again", async () => {
    let pinnedCalls = 0;
    const route = { kind: "pinned" as const, addresses: ["104.17.161.14"] };
    const transport = createMangaDexTransport({
      normalFetch: async () => { throw new Error("normal fetch must not run"); },
      dohFetch: async () => { throw new Error("DoH must not run"); },
      pinnedRequest: async () => {
        pinnedCalls += 1;
        return Response.json({ result: "ok" });
      },
      now: () => 0,
    });

    const result = await transport.request(
      new URL("https://api.mangadex.org/manga"),
      {},
      transport.createContext(15000),
      route
    );

    expect(result.route).toBe(route);
    expect(pinnedCalls).toBe(1);
  });

  it("emits structured diagnostics without URLs, payloads, or selected IPs", async () => {
    const diagnostics: unknown[] = [];
    const transport = createMangaDexTransport({
      normalFetch: async () => { throw codedError("ENOTFOUND"); },
      dohFetch: trustedDohFetch,
      pinnedRequest: async () => Response.json({ result: "ok" }),
      onDiagnostic: (event) => diagnostics.push(event),
      now: () => 0,
    });

    await transport.request(
      new URL("https://api.mangadex.org/manga?title=private-query"),
      {},
      transport.createContext(15000)
    );

    expect(diagnostics).toEqual([
      expect.objectContaining({
        stage: "normal",
        outcome: "fallback_candidate",
        classification: "direct",
      }),
      expect.objectContaining({
        stage: "doh",
        outcome: "success",
        authenticatedData: { cloudflare: true, google: true },
      }),
      { stage: "pinned", outcome: "success" },
    ]);
    expect(JSON.stringify(diagnostics)).not.toContain("104.17.161.14");
    expect(JSON.stringify(diagnostics)).not.toContain("private-query");
  });
});
