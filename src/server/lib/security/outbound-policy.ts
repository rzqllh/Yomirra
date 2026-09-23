import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";

export function isSafeIp(ip: string): boolean {
  if (!isIP(ip)) return false;

  // IPv4 mapping in IPv6 (e.g. ::ffff:192.168.1.1)
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
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
    const lowerIp = ip.toLowerCase();
    
    // Loopback
    if (lowerIp === "::1") return false;
    // Unspecified
    if (lowerIp === "::") return false;
    
    // Unique local (fc00::/7) - starts with fc or fd
    if (lowerIp.startsWith("fc") || lowerIp.startsWith("fd")) return false;
    
    // Link local (fe80::/10) - starts with fe8, fe9, fea, feb
    if (lowerIp.startsWith("fe8") || lowerIp.startsWith("fe9") || lowerIp.startsWith("fea") || lowerIp.startsWith("feb")) return false;
    
    // Multicast (ff00::/8)
    if (lowerIp.startsWith("ff")) return false;
    
    return true;
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
    if (isIP(parsedUrl.hostname) && !isSafeIp(parsedUrl.hostname)) {
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
      hostname: parsedUrl.hostname,
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
      res.resume();
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

    const stream = new ReadableStream({
      start(controller) {
        let totalSize = 0;
        res.on("data", (chunk) => {
          totalSize += chunk.length;
          if (maxSize && totalSize > maxSize) {
            res.destroy();
            controller.error(new Error(`SECURITY_REJECTED: Payload exceeded maximum size of ${maxSize} bytes`));
            return;
          }
          controller.enqueue(chunk);
        });
        res.on("end", () => {
          controller.close();
        });
        res.on("error", (err) => {
          controller.error(err);
        });
      },
      cancel() {
        res.destroy();
      }
    });

    const standardResponse = new Response(stream, {
      status: res.statusCode || 200,
      statusText: res.statusMessage || "OK",
      headers
    });
    
    Object.defineProperty(standardResponse, "url", { get: () => currentUrl });
    Object.defineProperty(standardResponse, "redirected", { get: () => redirects > 0 });

    return standardResponse;
  }

  throw new Error(`SECURITY_REJECTED: Too many redirects`);
}
