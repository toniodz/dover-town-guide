import type { ImageMetadata } from 'astro';
import raw from '../data/businesses.json';
import { categories, colourFor } from '../data/categories';

export interface Business {
  id: number; slug: string; name: string; sortName: string; letter: string;
  category: string; subcategory: string; sourceCategory: string; sourceSubcategory: string;
  status: 'open' | 'closed'; services: string; address: string[]; postcode: string;
  phone: string; fax: string; email: string; website: string; websiteLabel: string;
  heading: string; info: string; links: { url: string; label: string }[];
  linkTo: number | null; memberHotelGroup: boolean; memberChamber: boolean; hasImage: boolean; guessed: boolean;
}

export const businesses = raw as Business[];
export const byId = new Map(businesses.map((b) => [b.id, b]));
export const catById = new Map(categories.map((c, i) => [c.id, { ...c, index: i, ...colourFor(i) }]));

const images = import.meta.glob<{ default: ImageMetadata }>('/src/assets/businesses/*.jpg', { eager: true });
export const imageFor = (id: number) => images[`/src/assets/businesses/${id}.jpg`]?.default;

/** Open businesses first, then A–Z. */
export const openFirst = (a: Business, b: Business) =>
  Number(a.status === 'closed') - Number(b.status === 'closed') || a.sortName.localeCompare(b.sortName, 'en');

export const inCategory = (id: string) => businesses.filter((b) => b.category === id).sort(openFirst);

/** The businesses that took over this site: records pointing back at this one. */
export const predecessors = (b: Business) => businesses.filter((x) => x.linkTo === b.id);
export const successor = (b: Business) => (b.linkTo ? byId.get(b.linkTo) : undefined);

export const addressLine = (b: Business) => [...b.address, b.postcode].filter(Boolean).join(', ');
export const shortAddress = (b: Business) => b.address[0] ?? '';
export const mapsUrl = (b: Business) =>
  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([b.name, addressLine(b) || 'Dover'].join(', '));

export const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
