export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]*>?/gm, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\\([\[\]*\_~#`\\()+-.!{}])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
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
