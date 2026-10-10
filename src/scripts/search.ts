// Client-side directory search over /search-index.json
type Row = [slug: string, name: string, cat: string, sub: string, closed: number, text: string];
let cache: Promise<Row[]> | null = null;
export const loadIndex = () => (cache ??= fetch('/search-index.json').then((r) => r.json()));

export async function search(q: string): Promise<Row[]> {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const rows = await loadIndex();
  const scored = rows
    .filter((r) => terms.every((t) => r[5].includes(t)))
    .map((r) => {
      const name = r[1].toLowerCase();
      const score = terms.reduce((s, t) => s + (name.startsWith(t) ? 3 : name.includes(t) ? 2 : 0), 0) - r[4] * 2;
      return { r, score };
    });
  scored.sort((a, b) => b.score - a.score || a.r[1].localeCompare(b.r[1]));
  return scored.map((s) => s.r);
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
