import { defineConfig } from 'astro/config';
import fs from 'node:fs';

// Keep every old PHP URL working: /businesses/details/123/ etc. -> new pages.
const businesses = JSON.parse(fs.readFileSync(new URL('./src/data/businesses.json', import.meta.url), 'utf8'));
const OLD_CATEGORIES = {
  'Accommodation': 'stay', 'Clubs, Groups and Societies': 'clubs', 'Education': 'learn', 'Events': 'events',
  'Financial Services': 'finance', 'Food and Drink': 'eat', 'History of properties': 'history',
  'Industry': 'industry', 'Port Related': 'port', 'Recreation and Entertainment': 'things', 'Services': 'services',
  'Shops': 'shops', 'Tourism and Travel': 'visit',
};
const redirects = {
  '/index.php': '/', '/events.php': '/events/', '/attractions.php': '/places/', '/map.php': '/places/', '/search.php': '/search/',
};
for (const b of businesses) redirects[`/businesses/details/${b.id}/`] = `/business/${b.slug}/`;
for (const [old, id] of Object.entries(OLD_CATEGORIES)) redirects[`/businesses/category/${old}/`] = `/directory/${id}/`;
for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') redirects[`/businesses/${L}/`] = `/a-z/#${L}`;

export default defineConfig({
  site: 'https://www.dovertownguide.org.uk',
  trailingSlash: 'always',
  build: { format: 'directory' },
  redirects,
});
