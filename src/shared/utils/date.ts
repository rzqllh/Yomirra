export function getRelativeTime(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'always', style: 'short' });

  if (diffInMins < 1) return "Baru saja";
  if (diffInMins < 60) return rtf.format(-diffInMins, 'minute');
  if (diffInHours < 24) return rtf.format(-diffInHours, 'hour');
  if (diffInDays < 30) return rtf.format(-diffInDays, 'day');
  
  return date.toLocaleDateString('id-ID');
}
