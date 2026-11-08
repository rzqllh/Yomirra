import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import { Readable } from "node:stream";

export function isSafeIp(ip: string): boolean {
  // WHATWG URL hostnames wrap IPv6 literals in brackets.
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
  if (!isIP(ip)) return false;
  ip = ip.toLowerCase();

  // IPv4 mapping in IPv6 (e.g. ::ffff:192.168.1.1)
  if (ip.startsWith("::ffff:")) {
    const mapped = ip.substring(7);
    // Reject hexadecimal IPv4-mapped forms as well; they can hide private IPv4.
    if (isIP(mapped) !== 4) return false;
    ip = mapped;
  }

  if (isIP(ip) === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    
    // 0.0.0.0/8 (Current network)
    if (a === 0) return false;
    // 10.0.0.0/8 (Private)
    if (a === 10) return false;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return false;
    // 169.254.0.0/16 (Link-local)
    if (a === 169 && b === 254) return false;
    // 172.16.0.0/12 (Private)
    if (a === 172 && b >= 16 && b <= 31) return false;
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return false;
    // 100.64.0.0/10 (CGNAT)
    if (a === 100 && b >= 64 && b <= 127) return false;
    // 198.18.0.0/15 (Network benchmark)
    if (a === 198 && (b === 18 || b === 19)) return false;
    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return false;
    // 240.0.0.0/4 (Reserved)
    if (a >= 240) return false;
    // 255.255.255.255/32 (Broadcast)
    if (a === 255 && b === 255 && parts[2] === 255 && parts[3] === 255) return false;
    
    return true;
  }

  if (isIP(ip) === 6) {
    // Permit global unicast and exclude transition ranges that embed an IPv4 destination.
    const [prefix, second] = ip.split(":");
    const first = Number.parseInt(prefix, 16);
    return first >= 0x2000 && first <= 0x3fff &&
      first !== 0x2002 && !(first === 0x2001 && (!second || Number.parseInt(second, 16) === 0));
  }

  return false;
}

const safeLookup = (
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[] | any, family?: number) => void
) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, []);
    
    for (const addr of addresses) {
      if (!isSafeIp(addr.address)) {
        return callback(new Error(`SECURITY_REJECTED: Unsafe IP address resolved for ${hostname}`), []);
      }
    }
    
    if (options.all) {
      return callback(null, addresses);
    }
    return callback(null, addresses[0].address, addresses[0].family);
  });
};

const safeHttpAgent = new http.Agent({ lookup: safeLookup as any, keepAlive: false });
const safeHttpsAgent = new https.Agent({ lookup: safeLookup as any, keepAlive: false });

export interface SafeFetchOptions extends Omit<RequestInit, "window"> {
  maxRedirects?: number;
  maxSize?: number;
}

export async function safeFetch(url: string, options: SafeFetchOptions = {}): Promise<Response> {
  const maxRedirects = options.maxRedirects ?? 5;
  const maxSize = options.maxSize;
  let currentUrl = url;
  let redirects = 0;

  while (redirects <= maxRedirects) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(currentUrl);
    } catch {
      throw new Error(`SECURITY_REJECTED: Invalid URL ${currentUrl}`);
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error(`SECURITY_REJECTED: Unsupported protocol ${parsedUrl.protocol}`);
    }
    
    if (parsedUrl.username || parsedUrl.password) {
      throw new Error(`SECURITY_REJECTED: URL credentials are not allowed`);
    }

    // If hostname is already an IP literal (or normalized numeric IP e.g. 2130706433 -> 127.0.0.1),
    // validate it immediately because http.Agent lookup is skipped by net.connect for IP literals.
    const literalHost = parsedUrl.hostname.replace(/^\[|\]$/g, "");
    if (isIP(literalHost) && !isSafeIp(literalHost)) {
      throw new Error(`SECURITY_REJECTED: Unsafe IP address ${parsedUrl.hostname}`);
    }

    // Block any non-standard numeric IP representations that were not normalized
    if (/^(\d+|0x[0-9a-fA-F]+)(\.(\d+|0x[0-9a-fA-F]+))*$/.test(parsedUrl.hostname) && !isIP(parsedUrl.hostname)) {
      throw new Error(`SECURITY_REJECTED: Non-standard numeric IP representation not allowed`);
    }

    const isHttps = parsedUrl.protocol === "https:";
    const agent = isHttps ? safeHttpsAgent : safeHttpAgent;
    const requestFn = isHttps ? https.request : http.request;

    const reqHeaders: http.OutgoingHttpHeaders = {};
    if (options.headers) {
      const h = new Headers(options.headers);
      h.forEach((value, key) => {
        reqHeaders[key] = value;
      });
    }

    const requestOptions: http.RequestOptions = {
      protocol: parsedUrl.protocol,
      hostname: literalHost,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: reqHeaders,
      agent,
      signal: options.signal as AbortSignal,
    };

    const response = await new Promise<{ res: http.IncomingMessage, req: http.ClientRequest }>((resolve, reject) => {
      const req = requestFn(requestOptions, (res) => {
        resolve({ res, req });
      });
      req.on("error", (err) => {
        if (err.message.includes("SECURITY_REJECTED")) {
          reject(new Error(err.message));
        } else if (options.signal?.aborted || err.name === "AbortError" || err.message.includes("aborted")) {
          reject(new Error("Request timeout: Permintaan ke server sumber melebihi batas waktu (timeout)."));
        } else {
          reject(new Error(`Fetch error: ${err.message}`));
        }
      });
      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });

    const res = response.res;
    
    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.destroy();
      let redirectUrl = res.headers.location;
      if (!redirectUrl.startsWith("http")) {
        redirectUrl = new URL(redirectUrl, currentUrl).toString();
      }
      currentUrl = redirectUrl;
      redirects++;
      continue;
    }

    const headers = new Headers();
    Object.entries(res.headers).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else if (value !== undefined) {
        headers.set(key, value);
      }
    });

    const status = res.statusCode || 200;
    const hasBody = options.method?.toUpperCase() !== "HEAD" && ![204, 205, 304].includes(status);
    let stream: ReadableStream<Uint8Array> | null = null;

    if (hasBody) {
      const upstream = Readable.toWeb(res) as ReadableStream<Uint8Array>;
      if (maxSize) {
        let totalSize = 0;
        stream = upstream.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
          transform(chunk, controller) {
            totalSize += chunk.byteLength;
            if (totalSize > maxSize) {
              throw new Error(`SECURITY_REJECTED: Payload exceeded maximum size of ${maxSize} bytes`);
            }
            controller.enqueue(chunk);
          },
        }));
      } else {
        stream = upstream;
      }
    } else {
      res.resume();
    }

    const standardResponse = new Response(stream, {
      status,
      statusText: res.statusMessage || "OK",
      headers
    });
    
    Object.defineProperty(standardResponse, "url", { get: () => currentUrl });
    Object.defineProperty(standardResponse, "redirected", { get: () => redirects > 0 });

    return standardResponse;
  }

  throw new Error(`SECURITY_REJECTED: Too many redirects`);
}
