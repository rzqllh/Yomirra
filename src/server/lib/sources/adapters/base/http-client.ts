import { safeFetch } from "../../../security/outbound-policy";

export interface HttpClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  allowedHosts?: string[];
  maxRedirects?: number;
  maxResponseSize?: number;
}

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeoutMs: number;
  private allowedHosts?: string[];
  private maxRedirects?: number;
  private maxResponseSize?: number;

  constructor(
    baseUrlOrConfig: string | HttpClientConfig,
    defaultHeaders: Record<string, string> = {}
  ) {
    if (typeof baseUrlOrConfig === "string") {
      this.baseUrl = baseUrlOrConfig;
      this.defaultHeaders = defaultHeaders;
      this.timeoutMs = 10000;
    } else {
      this.baseUrl = baseUrlOrConfig.baseUrl;
      this.defaultHeaders = baseUrlOrConfig.defaultHeaders || {};
      this.timeoutMs = baseUrlOrConfig.timeoutMs ?? 10000;
      this.allowedHosts = baseUrlOrConfig.allowedHosts;
      this.maxRedirects = baseUrlOrConfig.maxRedirects;
      this.maxResponseSize = baseUrlOrConfig.maxResponseSize;
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getConfig(): Readonly<HttpClientConfig> {
    return Object.freeze({
      baseUrl: this.baseUrl,
      defaultHeaders: { ...this.defaultHeaders },
      timeoutMs: this.timeoutMs,
      allowedHosts: this.allowedHosts ? [...this.allowedHosts] : undefined,
      maxRedirects: this.maxRedirects,
      maxResponseSize: this.maxResponseSize,
    });
  }

  private validateUrl(urlStr: string): string {
    let parsed: URL;
    try {
      parsed = new URL(urlStr);
    } catch {
      throw new Error(`SECURITY_REJECTED: Invalid URL ${urlStr}`);
    }

    if (this.allowedHosts && this.allowedHosts.length > 0) {
      const hostname = parsed.hostname.toLowerCase();
      const isAllowed = this.allowedHosts.some((allowed) => {
        const lowerAllowed = allowed.toLowerCase();
        return hostname === lowerAllowed || hostname.endsWith(`.${lowerAllowed}`);
      });
      if (!isAllowed) {
        throw new Error(`SECURITY_REJECTED: Host "${parsed.hostname}" is not in allowedHosts list`);
      }
    }

    return urlStr;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | string[]>): string {
    let url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach((val) => searchParams.append(k, String(val)));
        } else {
          searchParams.set(k, String(v));
        }
      });
      const queryStr = searchParams.toString();
      if (queryStr) {
        const separator = url.includes("?") ? "&" : "?";
        url += `${separator}${queryStr}`;
      }
    }
    return this.validateUrl(url);
  }

  private getRequestSignal(init?: RequestInit): AbortSignal {
    return init?.signal
      ? AbortSignal.any([AbortSignal.timeout(this.timeoutMs), init.signal])
      : AbortSignal.timeout(this.timeoutMs);
  }

  private async fetchWithRetry(url: string, fetchOptions: Parameters<typeof safeFetch>[1]): Promise<Response> {
    try {
      return await safeFetch(url, fetchOptions);
    } catch (err: any) {
      const msg = err?.message || "";
      const isTransient =
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("EPIPE") ||
        msg.includes("socket hang up");

      if (isTransient && (!fetchOptions?.signal || !fetchOptions.signal.aborted)) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        return await safeFetch(url, fetchOptions);
      }
      throw err;
    }
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | string[]>, init?: RequestInit): Promise<T> {
    const url = this.buildUrl(path, params);
    const requestSignal = this.getRequestSignal(init);

    const res = await this.fetchWithRetry(url, {
      cache: "no-store",
      maxRedirects: this.maxRedirects,
      maxSize: this.maxResponseSize,
      ...init,
      signal: requestSignal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Connection: "close",
        ...this.defaultHeaders,
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  async getHtml(path: string, params?: Record<string, string | number | boolean | string[]>, init?: RequestInit): Promise<string> {
    const url = this.buildUrl(path, params);
    const requestSignal = this.getRequestSignal(init);

    const res = await this.fetchWithRetry(url, {
      cache: "no-store",
      maxRedirects: this.maxRedirects,
      maxSize: this.maxResponseSize,
      ...init,
      signal: requestSignal,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Connection: "close",
        ...this.defaultHeaders,
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    return res.text();
  }

  async getText(path: string, params?: Record<string, string | number | boolean | string[]>, init?: RequestInit): Promise<string> {
    const url = this.buildUrl(path, params);
    const requestSignal = this.getRequestSignal(init);

    const res = await this.fetchWithRetry(url, {
      cache: "no-store",
      maxRedirects: this.maxRedirects,
      maxSize: this.maxResponseSize,
      ...init,
      signal: requestSignal,
      headers: {
        Accept: "*/*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Connection: "close",
        ...this.defaultHeaders,
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    return res.text();
  }

  async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const url = this.buildUrl(path);
    const requestSignal = this.getRequestSignal(init);

    let formattedBody: string | undefined;
    const extraHeaders: Record<string, string> = {};

    if (body !== undefined) {
      if (typeof body === "string") {
        formattedBody = body;
      } else {
        formattedBody = JSON.stringify(body);
        extraHeaders["Content-Type"] = "application/json";
      }
    }

    const res = await this.fetchWithRetry(url, {
      cache: "no-store",
      method: "POST",
      body: formattedBody,
      maxRedirects: this.maxRedirects,
      maxSize: this.maxResponseSize,
      ...init,
      signal: requestSignal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Connection: "close",
        ...this.defaultHeaders,
        ...extraHeaders,
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }
}
