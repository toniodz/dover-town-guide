# Dover Town & District Guide

Astro rebuild of the old PHP directory. Fully static; the old MySQL data is baked into JSON.

    npm install
    npm run dev       # http://localhost:4321
    npm run build     # -> dist/

## Data
- `data/source/Dump20251123.sql` is the legacy export. `npm run data` regenerates
  `src/data/businesses.json` and `src/assets/businesses/*.jpg` from it plus `old-site/`.
- Category fixes live in `OVERRIDES` in `scripts/build-data.mjs`. Guesses are listed in `data/needs-review.json`.
- All closed businesses sit in the **History** category and are still searchable and in A–Z.
- Category names and blurbs: `src/data/categories.ts`. Event sources: `src/data/events.ts`.
- Old URLs (`/businesses/details/ID/`, `/businesses/category/...`, `/events.php`...) redirect; see `astro.config.mjs`.

## TODO before launch
- `src/data/site.ts`: set `contactEmail`; set `PUBLIC_FORM_ENDPOINT` in `.env` so the Add form works.
- Replace `public/img/hero-dover-castle.jpg` (353px wide, soft at full size).
