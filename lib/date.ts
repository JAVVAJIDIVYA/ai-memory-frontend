export function parseUtcDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const isoStr = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
  const parsed = new Date(isoStr);
  return isNaN(parsed.getTime()) ? new Date(dateStr) : parsed;
}

export function formatDateTime(dateStr: string | null | undefined): string {
  const d = parseUtcDate(dateStr);
  return d ? d.toLocaleString() : '';
}

export function formatDate(dateStr: string | null | undefined): string {
  const d = parseUtcDate(dateStr);
  return d ? d.toLocaleDateString() : '';
}
