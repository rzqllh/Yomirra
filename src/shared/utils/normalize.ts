function decodeHtmlEntities(value: string): string {
  let decoded = value;

  // Some providers return HTML that is entity-encoded once or even twice.
  // Decode a few bounded passes before stripping tags so encoded markup never leaks to UI.
  for (let pass = 0; pass < 3; pass++) {
    const next = decoded
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#0*39;/gi, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&nbsp;/gi, " ")
      .replace(/&hellip;/gi, "…")
      .replace(/&rsquo;/gi, "'")
      .replace(/&lsquo;/gi, "'")
      .replace(/&rdquo;/gi, '"')
      .replace(/&ldquo;/gi, '"')
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

    if (next === decoded) break;
    decoded = next;
  }

  return decoded;
}

export function stripHtml(html: string): string {
  if (!html) return "";

  return decodeHtmlEntities(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(?:p|div|li|section|article|h[1-6])>/gi, " ")
    .replace(/<[^>]*>?/gm, "")
    .replace(/\\([\[\]*\_~#\\()+\-.!{}])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSynopsis(value: string): string {
  if (!value) return "";

  let cleaned = stripHtml(value)
    .replace(/^\s*(?:sinopsis|synopsis)\s*:?\s*/i, "")
    // Markdown links/images from providers such as MangaDex should render as readable prose.
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(?:\*\*|__)(.*?)(?:\*\*|__)/g, "$1")
    .replace(/(^|\s)[#>~]+(?=\S)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  // Provider descriptions sometimes append download mirrors or batch-link blocks.
  // Those are not synopsis content and make the expanded detail view unreadable.
  const boilerplateIndex = cleaned.search(
    /\b(?:download\s+batch|batch\s+download|download\s+chapter|download\s+komik)\b/i
  );
  if (boilerplateIndex > 0) {
    cleaned = cleaned.slice(0, boilerplateIndex).trim();
  }

  return cleaned;
}

export function normalizeTitle(title: string): string {
  if (!title) return "";
  return title
    .replace(/\s+/g, " ")
    .trim();
}

export function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  
  // Try parsing as ISO
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }

  // Handle relative times like "2 days ago", "1 hour ago"
  const relativeMatch = dateStr.match(/(\d+)\s+(secs?|mins?|hours?|days?|weeks?|months?|years?)\s+ago/i);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();
    const now = new Date();

    if (unit.startsWith('sec')) now.setSeconds(now.getSeconds() - amount);
    else if (unit.startsWith('min')) now.setMinutes(now.getMinutes() - amount);
    else if (unit.startsWith('hour')) now.setHours(now.getHours() - amount);
    else if (unit.startsWith('day')) now.setDate(now.getDate() - amount);
    else if (unit.startsWith('week')) now.setDate(now.getDate() - amount * 7);
    else if (unit.startsWith('month')) now.setMonth(now.getMonth() - amount);
    else if (unit.startsWith('year')) now.setFullYear(now.getFullYear() - amount);

    return now.toISOString();
  }

  return new Date().toISOString();
}
