export class HttpClient {
  constructor(private baseUrl: string, private defaultHeaders: Record<string, string> = {}) {}

  async get<T>(path: string, params?: Record<string, string | number | boolean | string[]>): Promise<T> {
    let url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach(val => searchParams.append(k, String(val)));
        } else {
          searchParams.set(k, String(v));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Connection: "close",
        ...this.defaultHeaders,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  async getHtml(path: string, params?: Record<string, string | number | boolean | string[]>): Promise<string> {
    let url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach(val => searchParams.append(k, String(val)));
        } else {
          searchParams.set(k, String(v));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    const res = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Connection: "close",
        ...this.defaultHeaders,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    return res.text();
  }
}
