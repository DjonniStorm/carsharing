/** Нормализованный поиск подстроки (регистронезависимо). */
export function normalizeSearchQuery(q: string): string {
  return q.trim().toLowerCase();
}

export function matchesSearchHaystack(haystack: string, q: string): boolean {
  const needle = normalizeSearchQuery(q);
  if (!needle) {
    return true;
  }
  return haystack.toLowerCase().includes(needle);
}
