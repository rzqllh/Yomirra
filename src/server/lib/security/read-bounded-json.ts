type JsonBody = { ok: true; data: unknown } | { ok: false; status: 400 | 413 };

export async function readBoundedJson(request: Request, maxBytes: number): Promise<JsonBody> {
  const invalid = { ok: false, status: 400 } as const;
  const oversized = { ok: false, status: 413 } as const;
  if (Number(request.headers.get("content-length")) > maxBytes) {
    void request.body?.cancel().catch(() => {});
    return oversized;
  }

  const reader = request.body?.getReader();
  if (!reader) return invalid;
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        void reader.cancel().catch(() => {});
        return oversized;
      }
      text += decoder.decode(value, { stream: true });
    }
    return { ok: true, data: JSON.parse(text + decoder.decode()) };
  } catch {
    return invalid;
  } finally {
    reader.releaseLock();
  }
}
