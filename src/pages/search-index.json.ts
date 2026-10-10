import { businesses, catById, addressLine } from '../lib/data';

// [slug, name, category short name, subcategory, closed?, searchable text]
export function GET() {
  const rows = businesses.map((b) => [
    b.slug, b.name, catById.get(b.category)?.short ?? '', b.subcategory, b.status === 'closed' ? 1 : 0,
    [b.name, b.services, b.subcategory, catById.get(b.category)?.short, addressLine(b), b.phone, b.websiteLabel, b.info].join(' ').toLowerCase(),
  ]);
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
}
