// Converts the legacy MySQL dump (data/source/*.sql) into cleaned JSON for the site.
//   node scripts/build-data.mjs
// Outputs: src/data/businesses.json, data/needs-review.json, src/assets/businesses/<id>.jpg
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SQL = path.join(ROOT, 'data/source/Dump20251123.sql');
const OLD_IMG = path.join(ROOT, 'old-site/public_html/assets/images/businesses');
const OUT_IMG = path.join(ROOT, 'src/assets/businesses');

// ---------- 1. parse the INSERT statement ----------
const BS = String.fromCharCode(92);
const sql = fs.readFileSync(SQL, 'latin1');
const marker = 'INSERT INTO `dtg_businesses` VALUES ';
const start = sql.indexOf(marker) + marker.length;
const end = sql.indexOf(';\n/*!40000 ALTER TABLE', start);
const body = sql.slice(start, end);
const esc = { n: '\n', r: '\r', 0: '\0', t: '\t' };
const rows = [];
for (let i = 0; i < body.length; ) {
  if (body[i] !== '(') { i++; continue; }
  i++;
  const row = [];
  for (;;) {
    const c = body[i];
    if (c === "'") {
      i++;
      let v = '';
      for (;;) {
        if (body[i] === BS) { v += esc[body[i + 1]] ?? body[i + 1]; i += 2; }
        else if (body[i] === "'" && body[i + 1] === "'") { v += "'"; i += 2; }
        else if (body[i] === "'") { i++; break; }
        else v += body[i++];
      }
      row.push(v);
    } else if (c === ',') i++;
    else if (c === ')') { i++; break; }
    else {
      let v = '';
      while (body[i] !== ',' && body[i] !== ')') v += body[i++];
      row.push(v === 'NULL' ? null : Number(v));
    }
  }
  rows.push(row);
}
const COLS = ['id','name','address1','address2','town','county','postcode','telephone','fax','email','website','status','services','category','subcategory','linkto','heading','infotext','logo_wcdhghg','logo_ddcc'];
const raw = rows.map((r) => Object.fromEntries(COLS.map((c, k) => [c, r[k]])));

// ---------- 2. helpers ----------
const decodeEntities = (s) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
   .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&pound;/g, '£');
const clean = (s) =>
  decodeEntities(String(s ?? ''))
    .replace(/[‎‏ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const stripTrailing = (s) => s.replace(/[\s,;.]+$/, '').replace(/^[\s,;]+/, '');

// pull <a href> links out of free text
function extractLinks(s) {
  const links = [];
  let text = String(s ?? '');
  text = text.replace(/<a\s+[^>]*href=["']?([^"'\s>]+)["']?[^>]*>(.*?)<\/a>/gis, (_, url, label) => {
    links.push({ url, label: clean(label.replace(/<[^>]+>/g, '')) || 'Link' });
    return ' ';
  });
  // a couple of records have a broken fragment like "www.x.org/page\">History</a>"
  text = text.replace(/((?:https?:\/\/|www\.)[^\s"<>]+)["']?>([^<]+)<\/a>/gi, (_, url, label) => {
    links.push({ url: url.startsWith('http') ? url : 'http://' + url, label: clean(label) });
    return ' ';
  });
  text = text.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ');
  return { text: clean(text), links };
}

function tidyName(n) {
  let s = clean(n);
  s = s.replace(/^(.*?)\s*\(\s*the\s*\)\s*$/i, 'The $1');
  s = s.replace(/\s+,/g, ',').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
  return s;
}
const slugify = (s) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

function tidyWebsite(w) {
  let s = String(w ?? '').replace(/[\r\n]+/g, '').trim();
  if (!s || /\s/.test(s)) return { url: '', label: '' };
  s = s.replace(/^\/+/, '').replace(/^https?:\/\//i, '');
  if (!/\./.test(s)) return { url: '', label: '' };
  return { url: 'http://' + s, label: s.replace(/^www\./i, '').replace(/\/+$/, '') };
}

// ---------- 3. category model ----------
// Old free-text category -> new directory category id (see src/data/categories.ts)
const CAT_MAP = {
  'accommodation': 'stay',
  'clubs, groups and societies': 'clubs',
  'education': 'learn',
  'events': 'events',
  'financial services': 'finance',
  'food and drink': 'eat',
  'history of properties': 'history',
  'industry': 'industry',
  'port related': 'port',
  'recreation and entertainment': 'things',
  'services': 'services',
  'shops': 'shops',
  'tourism and travel': 'visit',
  '': 'services',
};

// Fix typos / merge near-duplicate subcategory names (compared case-insensitively)
const SUB_FIX = {
  'convience store': 'Convenience Stores', 'convience stores': 'Convenience Stores', 'convenience store': 'Convenience Stores',
  'jewelers': 'Jewellers', 'jewellers': 'Jewellers',
  'barbars': 'Barbers', 'barbers shops': 'Barbers', 'barber and beauty salon': 'Barbers',
  'ostepaths': 'Osteopaths', 'super markets': 'Supermarkets', 'supermarket': 'Supermarkets',
  'historioan': 'History', 'ltting agency': 'Letting Agencies', 'acquatics': 'Aquatics',
  'taxis services': 'Taxis', 'taxi': 'Taxis', 'hair salons': 'Hairdressers', 'hair boutique': 'Hairdressers',
  'charity shop': 'Charity Shops', 'charity': 'Charities', 'bakery shop': 'Bakers', 'bakery shops': 'Bakers', 'bakery': 'Bakers',
  'book shop': 'Book Shops', 'card shop': 'Card Shops', 'florist': 'Florists', 'estate agent': 'Estate Agents',
  'pawn shops': 'Pawnbrokers', 'pub': 'Public Houses', 'fast food': 'Fast Food', 'fast food outlets': 'Fast Food',
  'restaurant': 'Restaurants', 'guest house': 'Guest Houses', 'hotel': 'Hotels', 'cafe': 'Cafes', 'coffee shop': 'Coffee Shops',
  'coffee shops': 'Coffee Shops', 'mobile phone': 'Mobile Phones', 'solicitor': 'Solicitors', 'accountant': 'Accountants',
  'chemist': 'Chemists', 'chemist shops': 'Chemists', 'opticians': 'Opticians', 'garage': 'Garage Services',
  'tourism and travel': 'Tourism & Travel', 'societies': 'Societies', 'society': 'Societies', 'clubs': 'Clubs',
};
const titleCase = (s) => s.replace(/\b([a-z])([a-z']*)/g, (m, a, b) => (/^(and|of|the|for|to|in)$/.test(m) ? m : a.toUpperCase() + b));
function tidySub(s) {
  const t = clean(s).replace(/\s*&\s*/g, ' & ');
  if (!t) return 'Other';
  return SUB_FIX[t.toLowerCase()] ?? t;
}

// Hand-checked fixes: the old admin defaulted new records to Accommodation / Guest Houses.
// Format: id: [category, subcategory]. Entries marked ? are best guesses and go to needs-review.json
const OVERRIDES = {
  611: ['eat', 'Restaurants'], 649: ['stay', 'Guest Houses'], 658: ['services', 'Car Hire'],
  671: ['services', 'Barbers'], 714: ['services', 'Other', '?'], 729: ['eat', 'Coffee Shops'],
  734: ['history', 'Amusement Arcades'], 660: ['history', 'Guest Houses'], 629: ['history', 'Hotels'],
  777: ['things', 'Fitness'], 821: ['services', 'Pet Services', '?'], 829: ['shops', 'Other', '?'],
  838: ['services', 'Beauty Care'], 841: ['shops', 'Games Shops'], 848: ['eat', 'Bars', '?'],
  900: ['services', 'Web Design'], 890: ['shops', 'Other', '?'], 893: ['history', 'Empty Shops'],
  897: ['services', 'Hairdressers'], 918: ['eat', 'Coffee Shops'], 920: ['services', 'Funeral Directors'],
  930: ['shops', 'Other', '?'], 932: ['shops', 'Sports Shops'], 939: ['shops', 'Shoe Shops'],
  948: ['shops', 'Other', '?'], 961: ['eat', 'Sandwich Bars'], 962: ['services', 'Property Management'],
  296: ['services', 'Cleaners'], 830: ['shops', 'Second Hand Shops'], 831: ['shops', 'Second Hand Shops'], 847: ['services', 'Recruitment'],
};

// ---------- 4. build records ----------
const ids = new Set(raw.map((r) => r.id));
fs.mkdirSync(OUT_IMG, { recursive: true });
const imgFiles = new Set(fs.readdirSync(OLD_IMG));
const review = [];

const businesses = raw.map((r) => {
  const name = tidyName(r.name);
  const head = extractLinks(r.heading);
  const addr1 = extractLinks(r.address1);
  const addr2 = extractLinks(r.address2);
  const info = extractLinks(r.infotext);
  const links = [...head.links, ...addr1.links, ...addr2.links, ...info.links].map((l) => ({
    ...l, url: /^https?:/i.test(l.url) ? l.url : 'http://' + l.url.replace(/^\/+/, ''),
  }));

  const st = clean(r.status).toLowerCase();
  // Records the old site filed under "History of properties" are historic even if marked open.
  const historic = clean(r.category).toLowerCase() === 'history of properties' && r.id !== 296;
  const closed = st.startsWith('clos') || st === 'repainted' || st === 'refurb' || historic;

  let category = CAT_MAP[clean(r.category).toLowerCase()] ?? 'services';
  let subcategory = tidySub(r.subcategory);
  let guessed = false;
  const ov = OVERRIDES[r.id];
  if (ov) { [category, subcategory] = ov; guessed = ov[2] === '?'; }
  // Closed businesses all live in History (their old subcategory is kept for filtering).
  if (closed) category = 'history';
  if (category !== 'history' && ov === undefined && subcategory === 'Guest Houses' && category !== 'stay') category = 'stay';

  const web = tidyWebsite(r.website);
  let email = clean(r.email).toLowerCase();
  let phone = clean(r.telephone).replace(/[?]+$/, '').trim();
  if (email && !email.includes('@')) { if (!phone && /^[\d\s+()-]+$/.test(email)) phone = email; email = ''; }
  const fax = clean(r.fax);

  const addressParts = [addr1.text, addr2.text, clean(r.town), clean(r.county)]
    .map(stripTrailing).filter(Boolean);
  const dedup = addressParts.filter((p, i) => addressParts.findIndex((q) => q.toLowerCase() === p.toLowerCase()) === i);
  const postcode = stripTrailing(clean(r.postcode)).toUpperCase();

  const sortName = name.replace(/^the\s+/i, '');
  const first = sortName.replace(/[^A-Za-z0-9]/g, '')[0]?.toUpperCase() ?? '#';
  const letter = /[A-Z]/.test(first) ? first : '#';

  const file = ['jpg', 'JPG', 'jpeg'].map((e) => `${r.id}.${e}`).find((f) => imgFiles.has(f));
  if (file) fs.copyFileSync(path.join(OLD_IMG, file), path.join(OUT_IMG, `${r.id}.jpg`));

  if (guessed) review.push({ id: r.id, name, assigned: `${category} / ${subcategory}`, services: clean(r.services) });

  return {
    id: r.id,
    slug: `${slugify(name) || 'business'}-${r.id}`,
    name,
    sortName,
    letter,
    category,
    subcategory,
    sourceCategory: clean(r.category),
    sourceSubcategory: clean(r.subcategory),
    status: closed ? 'closed' : 'open',
    services: clean(r.services),
    address: dedup,
    postcode,
    phone,
    fax,
    email,
    website: web.url,
    websiteLabel: web.label,
    heading: head.text,
    info: info.text ? info.text : '',
    links,
    linkTo: r.linkto && ids.has(r.linkto) ? r.linkto : null,
    memberHotelGroup: r.logo_wcdhghg === 1,
    memberChamber: r.logo_ddcc === 1,
    hasImage: Boolean(file),
    guessed,
  };
});

// strip obvious data typos from address1 (phone number pasted in address2 etc.) -> leave as-is, but never empty-string items
// Merge subcategory spellings that differ only by case / trailing 's' (most common form wins)
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/s$/, '');
const freq = {};
for (const b of businesses) { const k = norm(b.subcategory); (freq[k] ??= {})[b.subcategory] = (freq[k][b.subcategory] ?? 0) + 1; }
for (const b of businesses) {
  const forms = Object.entries(freq[norm(b.subcategory)]).sort((x, y) => y[1] - x[1]);
  b.subcategory = forms[0][0];
}

businesses.sort((a, b) => a.sortName.localeCompare(b.sortName, 'en', { sensitivity: 'base' }));

fs.mkdirSync(path.join(ROOT, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src/data/businesses.json'), JSON.stringify(businesses));
fs.writeFileSync(path.join(ROOT, 'data/needs-review.json'), JSON.stringify(review, null, 2));

const byCat = {};
for (const b of businesses) byCat[b.category] = (byCat[b.category] ?? 0) + 1;
console.log(`${businesses.length} businesses, ${businesses.filter((b) => b.hasImage).length} photos, ${review.length} category guesses to review`);
console.log(byCat);
