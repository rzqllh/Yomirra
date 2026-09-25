import { request as httpsRequest, type RequestOptions } from "node:https";
import { lookup as dnsLookup } from "node:dns";
import { BlockList, isIP, type LookupFunction } from "node:net";

const MANGADEX_HOST = "api.mangadex.org";
const MAX_DOH_BODY_BYTES = 64 * 1024;
const MAX_DOH_ANSWERS = 32;

const DOH_ENDPOINTS = [
  "https://cloudflare-dns.com/dns-query",
  "https://dns.google/resolve",
] as const;

export function buildPinnedMangaDexRequestOptions(
  url: URL,
  addresses: readonly string[],
  headers?: HeadersInit
): RequestOptions {
  if (
    url.protocol !== "https:" ||
    url.hostname !== MANGADEX_HOST ||
    (url.port !== "" && url.port !== "443") ||
    url.username !== "" ||
    url.password !== ""
  ) {
    throw new Error("MANGADEX_PINNED_INVALID_AUTHORITY");
  }

  const pinned = [...new Set(addresses)].sort();
  if (
    pinned.length === 0 ||
    pinned.some((address) => isIP(address) !== 4 || !isPublicMangaDexAddress(address))
  ) {
    throw new Error("MANGADEX_PINNED_UNSAFE_ADDRESS");
  }

  const safeHeaders = new Headers(headers);
  safeHeaders.delete("host");
  const lookup: LookupFunction = (hostname, options, callback) => {
    if (hostname !== MANGADEX_HOST) {
      const error = Object.assign(new Error("Unexpected pinned lookup hostname"), {
        code: "MANGADEX_PINNED_HOSTNAME_MISMATCH",
      });
      callback(error, options.all ? [] : "");
      return;
    }
    callback(
      null,
      options.all
        ? pinned.map((address) => ({ address, family: 4 }))
        : pinned[0],
      options.all ? undefined : 4
    );
  };

  return {
    hostname: MANGADEX_HOST,
    port: 443,
    path: `${url.pathname}${url.search}`,
    method: "GET",
    headers: Object.fromEntries(safeHeaders.entries()),
    lookup,
    servername: MANGADEX_HOST,
    rejectUnauthorized: true,
    agent: false,
  };
}

function errorCode(error: unknown): string | undefined {
  let current = error;
  for (let depth = 0; depth < 4; depth++) {
    if (typeof current !== "object" || current === null) return undefined;
    const record = current as { code?: unknown; cause?: unknown };
    if (typeof record.code === "string") return record.code;
    current = record.cause;
  }
  return undefined;
}

export type MangaDexFallbackRequirement = "direct" | "divergence" | "none";

export function classifyMangaDexFallback(error: unknown): MangaDexFallbackRequirement {
  const code = errorCode(error);
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "direct";
  if (
    code === "ETIMEDOUT" ||
    code === "ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE" ||
    code === "ECONNREFUSED" ||
    code === "EHOSTUNREACH" ||
    code === "ENETUNREACH"
  ) {
    return "divergence";
  }
  return "none";
}

export function isDirectMangaDexFallbackError(error: unknown): boolean {
  return classifyMangaDexFallback(error) === "direct";
}

function normalizeDnsName(value: string): string {
  return value.toLowerCase().replace(/\.$/, "");
}

function isDnsName(value: string): boolean {
  const normalized = normalizeDnsName(value);
  return normalized.length > 0 &&
    normalized.length <= 253 &&
    normalized.split(".").every((label) =>
      label.length > 0 && label.length <= 63 && /^[a-z0-9_-]+$/i.test(label)
    );
}

const unsafeIpv4Addresses = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.31.196.0", 24],
  ["192.52.193.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["192.175.48.0", 24],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  unsafeIpv4Addresses.addSubnet(address, prefix, "ipv4");
}

const unsafeIpv6Addresses = new BlockList();
for (const [address, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["::ffff:0:0", 96],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
  ["5f00::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  unsafeIpv6Addresses.addSubnet(address, prefix, "ipv6");
}

export function isPublicMangaDexAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !unsafeIpv4Addresses.check(address, "ipv4");
  if (family === 6) return !unsafeIpv6Addresses.check(address, "ipv6");
  return false;
}

function invalidDoh(reason: string): never {
  throw new Error(`MANGADEX_DOH_INVALID: ${reason}`);
}

export function parseMangaDexDohResponse(raw: unknown): string[] {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return invalidDoh("root");
  }
  const response = raw as {
    Status?: unknown;
    TC?: unknown;
    Question?: unknown;
    Answer?: unknown;
  };
  if (
    response.Status !== 0 ||
    response.TC !== false ||
    !Array.isArray(response.Question) ||
    response.Question.length !== 1
  ) {
    return invalidDoh("status or question");
  }

  const question = response.Question[0];
  if (typeof question !== "object" || question === null) return invalidDoh("question");
  const questionRecord = question as { name?: unknown; type?: unknown };
  if (
    typeof questionRecord.name !== "string" ||
    normalizeDnsName(questionRecord.name) !== MANGADEX_HOST ||
    questionRecord.type !== 1
  ) {
    return invalidDoh("question mismatch");
  }

  if (
    !Array.isArray(response.Answer) ||
    response.Answer.length === 0 ||
    response.Answer.length > MAX_DOH_ANSWERS
  ) {
    return invalidDoh("answer count");
  }

  const addresses = new Map<string, string[]>();
  const aliases = new Map<string, string>();
  const owners = new Set<string>();
  for (const answer of response.Answer) {
    if (typeof answer !== "object" || answer === null) return invalidDoh("answer record");
    const record = answer as { name?: unknown; type?: unknown; TTL?: unknown; data?: unknown };
    if (
      typeof record.name !== "string" ||
      !isDnsName(record.name) ||
      typeof record.data !== "string" ||
      typeof record.TTL !== "number" ||
      !Number.isFinite(record.TTL) ||
      record.TTL < 0
    ) {
      return invalidDoh("answer fields");
    }

    const owner = normalizeDnsName(record.name);
    owners.add(owner);
    if (record.type === 1) {
      if (isIP(record.data) !== 4 || !isPublicMangaDexAddress(record.data)) {
        return invalidDoh("unsafe address");
      }
      addresses.set(owner, [...(addresses.get(owner) ?? []), record.data]);
    } else if (record.type === 5) {
      if (!isDnsName(record.data)) return invalidDoh("CNAME target");
      const target = normalizeDnsName(record.data);
      const existing = aliases.get(owner);
      if (existing && existing !== target) return invalidDoh("multiple CNAME targets");
      aliases.set(owner, target);
    } else {
      return invalidDoh("answer type");
    }
  }

  const visited = new Set<string>();
  let current = MANGADEX_HOST;
  for (let depth = 0; depth <= 8; depth++) {
    if (visited.has(current)) return invalidDoh("CNAME loop");
    visited.add(current);
    const currentAddresses = addresses.get(current);
    const alias = aliases.get(current);
    if (currentAddresses && alias) return invalidDoh("CNAME with A record");
    if (currentAddresses?.length) {
      if ([...owners].some((owner) => !visited.has(owner))) return invalidDoh("unrelated answer");
      return [...new Set(currentAddresses)].sort();
    }
    if (!alias) return invalidDoh("missing terminal A record");
    current = alias;
  }

  return invalidDoh("CNAME depth");
}

async function queryDoh(
  endpoint: string,
  fetchImpl: typeof fetch,
  signal?: AbortSignal
): Promise<{ addresses: string[]; authenticatedData: boolean }> {
  const url = new URL(endpoint);
  url.searchParams.set("name", MANGADEX_HOST);
  url.searchParams.set("type", "A");
  const response = await fetchImpl(url, {
    headers: { Accept: "application/dns-json" },
    signal,
  });
  if (!response.ok) return { addresses: [], authenticatedData: false };
  const body = await response.text();
  if (Buffer.byteLength(body) > MAX_DOH_BODY_BYTES) {
    return { addresses: [], authenticatedData: false };
  }
  const raw = JSON.parse(body) as unknown;
  const authenticatedData = typeof raw === "object" && raw !== null &&
    !Array.isArray(raw) && (raw as { AD?: unknown }).AD === true;
  return {
    addresses: parseMangaDexDohResponse(raw),
    authenticatedData,
  };
}

async function resolveDohConsensus(
  fetchImpl: typeof fetch,
  signal?: AbortSignal
): Promise<{
  addresses: string[];
  authenticatedData: { cloudflare: boolean; google: boolean };
}> {
  const [cloudflare, google] = await Promise.all(
    DOH_ENDPOINTS.map((endpoint) => queryDoh(endpoint, fetchImpl, signal))
  );
  const googleSet = new Set(google.addresses);
  return {
    addresses: [...new Set(cloudflare.addresses)]
      .filter((address) => googleSet.has(address))
      .sort(),
    authenticatedData: {
      cloudflare: cloudflare.authenticatedData,
      google: google.authenticatedData,
    },
  };
}

export async function resolveMangaDexDohConsensus(signal?: AbortSignal): Promise<string[]> {
  return (await resolveDohConsensus((input, init) => fetch(input, init), signal)).addresses;
}

export interface MangaDexTransportContext {
  deadlineMs: number;
  callerSignal?: AbortSignal;
}

export type MangaDexRoute =
  | { kind: "normal" }
  | { kind: "pinned"; addresses: readonly string[] };

export interface MangaDexTransportResult {
  response: Response;
  route: MangaDexRoute;
}

export interface MangaDexTransportDependencies {
  normalFetch?: typeof fetch;
  dohFetch?: typeof fetch;
  systemLookup?: (hostname: string, signal: AbortSignal) => Promise<string[]>;
  pinnedRequest?: (
    url: URL,
    init: RequestInit,
    addresses: readonly string[],
    signal: AbortSignal
  ) => Promise<Response>;
  now?: () => number;
  onDiagnostic?: (event: MangaDexTransportDiagnostic) => void;
}

export interface MangaDexTransportDiagnostic {
  stage: "normal" | "doh" | "pinned" | "retry-wait";
  outcome: "fallback_candidate" | "success" | "rejected" | "timeout";
  classification?: MangaDexFallbackRequirement;
  authenticatedData?: { cloudflare: boolean; google: boolean };
  deadlineExhausted?: boolean;
  reason?: string;
}

class MangaDexStageTimeoutError extends Error {
  constructor(stage: string) {
    super(`MANGADEX_STAGE_TIMEOUT: ${stage}`);
    this.name = "MangaDexStageTimeoutError";
  }
}

function deadlineError(): Error {
  return new Error("MANGADEX_TOTAL_DEADLINE_EXCEEDED");
}

function lookupSystemIpv4(hostname: string, signal: AbortSignal): Promise<string[]> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    let settled = false;
    const onAbort = () => {
      if (settled) return;
      settled = true;
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    dnsLookup(hostname, { all: true, family: 4, verbatim: true }, (error, addresses) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      if (error) {
        reject(error);
        return;
      }
      resolve(addresses.map(({ address }) => address));
    });
  });
}

type HttpsRequest = typeof httpsRequest;

export function requestPinnedMangaDex(
  url: URL,
  init: RequestInit,
  addresses: readonly string[],
  signal: AbortSignal,
  requestImpl: HttpsRequest = httpsRequest
): Promise<Response> {
  signal.throwIfAborted();
  const options = buildPinnedMangaDexRequestOptions(url, addresses, init.headers);
  options.signal = signal;

  return new Promise((resolve, reject) => {
    const request = requestImpl(options, (response) => {
      const status = response.statusCode;
      if (!status) {
        response.resume();
        reject(new Error("MANGADEX_PINNED_INVALID_RESPONSE"));
        return;
      }
      if (status >= 300 && status < 400) {
        response.resume();
        reject(new Error("MANGADEX_PINNED_REDIRECT"));
        return;
      }

      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      response.once("aborted", () => reject(new Error("MANGADEX_PINNED_RESPONSE_ABORTED")));
      response.once("error", reject);
      response.once("end", () => {
        const headers = new Headers();
        for (const [name, value] of Object.entries(response.headers)) {
          if (Array.isArray(value)) {
            value.forEach((item) => headers.append(name, item));
          } else if (value !== undefined) {
            headers.set(name, String(value));
          }
        }
        resolve(new Response(Buffer.concat(chunks), {
          status,
          statusText: response.statusMessage,
          headers,
        }));
      });
    });
    request.once("error", reject);
    request.end();
  });
}

export function createMangaDexTransport(dependencies: MangaDexTransportDependencies = {}) {
  const normalFetch = dependencies.normalFetch ?? ((input, init) => fetch(input, init));
  const dohFetch = dependencies.dohFetch ?? ((input, init) => fetch(input, init));
  const systemLookup = dependencies.systemLookup ?? lookupSystemIpv4;
  const pinnedRequest = dependencies.pinnedRequest ?? requestPinnedMangaDex;
  const now = dependencies.now ?? (() => performance.now());
  const emit = dependencies.onDiagnostic ?? (() => undefined);

  function remaining(context: MangaDexTransportContext): number {
    return Math.max(0, context.deadlineMs - now());
  }

  async function runStage<T>(
    stage: string,
    budgetMs: number,
    context: MangaDexTransportContext,
    operation: (signal: AbortSignal) => Promise<T>
  ): Promise<T> {
    context.callerSignal?.throwIfAborted();
    const allowedMs = Math.min(budgetMs, remaining(context));
    if (allowedMs <= 0) throw deadlineError();

    const stageController = new AbortController();
    const signal = context.callerSignal
      ? AbortSignal.any([context.callerSignal, stageController.signal])
      : stageController.signal;
    let stageTimedOut = false;
    const timer = setTimeout(() => {
      stageTimedOut = true;
      stageController.abort(new MangaDexStageTimeoutError(stage));
    }, allowedMs);

    try {
      return await operation(signal);
    } catch (error) {
      if (context.callerSignal?.aborted) {
        throw context.callerSignal.reason ?? new DOMException("Aborted", "AbortError");
      }
      if (stageTimedOut) throw new MangaDexStageTimeoutError(stage);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function rejectPinnedRedirect(response: Response): Response {
    if (response.status >= 300 && response.status < 400) {
      throw new Error("MANGADEX_PINNED_REDIRECT");
    }
    return response;
  }

  return {
    createContext(timeoutMs: number, callerSignal?: AbortSignal): MangaDexTransportContext {
      return { deadlineMs: now() + timeoutMs, callerSignal };
    },
    remaining(context: MangaDexTransportContext): number {
      return remaining(context);
    },
    async sleep(delayMs: number, context: MangaDexTransportContext): Promise<void> {
      if (delayMs <= 0) {
        context.callerSignal?.throwIfAborted();
        return;
      }
      context.callerSignal?.throwIfAborted();
      if (delayMs > remaining(context)) throw deadlineError();
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => {
          clearTimeout(timer);
          reject(context.callerSignal?.reason ?? new DOMException("Aborted", "AbortError"));
        };
        const timer = setTimeout(() => {
          context.callerSignal?.removeEventListener("abort", onAbort);
          resolve();
        }, delayMs);
        context.callerSignal?.addEventListener("abort", onAbort, { once: true });
      });
    },
    async request(
      url: URL,
      init: RequestInit,
      context: MangaDexTransportContext,
      route?: MangaDexRoute
    ): Promise<MangaDexTransportResult> {
      context.callerSignal?.throwIfAborted();

      if (route?.kind === "normal") {
        const response = await runStage("normal-retry", remaining(context), context, (signal) =>
          normalFetch(url, { ...init, signal })
        );
        return { response, route };
      }

      if (route?.kind === "pinned") {
        const response = await runStage(
          "pinned-retry",
          Math.min(4000, remaining(context)),
          context,
          (signal) => pinnedRequest(url, init, route.addresses, signal)
        );
        return { response: rejectPinnedRedirect(response), route };
      }

      const normalBudget = remaining(context) - 6500;
      if (normalBudget <= 0) throw deadlineError();

      let requirement: MangaDexFallbackRequirement;
      let normalError: unknown;
      try {
        const response = await runStage("normal", normalBudget, context, (signal) =>
          normalFetch(url, { ...init, signal })
        );
        return { response, route: { kind: "normal" } };
      } catch (error) {
        normalError = error;
        requirement = error instanceof MangaDexStageTimeoutError
          ? "divergence"
          : classifyMangaDexFallback(error);
        emit({
          stage: "normal",
          outcome: requirement === "none" ? "rejected" : "fallback_candidate",
          classification: requirement,
          reason: error instanceof MangaDexStageTimeoutError ? "stage_timeout" : "network_error",
          deadlineExhausted: remaining(context) <= 0,
        });
        if (requirement === "none") throw error;
      }

      if (remaining(context) < 6500) throw normalError;
      const dohBudget = Math.min(2000, remaining(context) - 4500);
      const [resolution, systemAddresses] = await runStage(
        "doh",
        dohBudget,
        context,
        async (signal) => Promise.all([
          resolveDohConsensus(dohFetch, signal),
          requirement === "divergence"
            ? systemLookup(MANGADEX_HOST, signal)
            : Promise.resolve(undefined),
        ])
      );
      const { addresses } = resolution;
      emit({
        stage: "doh",
        outcome: addresses.length > 0 ? "success" : "rejected",
        authenticatedData: resolution.authenticatedData,
        reason: addresses.length > 0 ? undefined : "no_consensus",
      });
      if (addresses.length === 0) {
        throw new Error("MANGADEX_DOH_NO_CONSENSUS", { cause: normalError });
      }
      if (
        systemAddresses &&
        (
          systemAddresses.length === 0 ||
          systemAddresses.some((address) => isIP(address) !== 4) ||
          systemAddresses.some((address) => addresses.includes(address))
        )
      ) {
        throw new Error("MANGADEX_DNS_DIVERGENCE_NOT_PROVEN", { cause: normalError });
      }

      const pinnedBudget = Math.min(4000, remaining(context) - 500);
      const response = await runStage(
        "pinned",
        pinnedBudget,
        context,
        (signal) => pinnedRequest(url, init, addresses, signal)
      );
      emit({ stage: "pinned", outcome: "success" });
      return {
        response: rejectPinnedRedirect(response),
        route: { kind: "pinned", addresses },
      };
    },
  };
}
