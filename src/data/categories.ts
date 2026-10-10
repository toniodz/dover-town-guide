export interface Category { id: string; name: string; short: string; blurb: string }

// Order here is the order of the tiles on the home page.
export const categories: Category[] = [
  { id: 'eat', name: 'Eat & Drink', short: 'Eat & Drink', blurb: 'Restaurants, pubs, cafés, takeaways and bakers.' },
  { id: 'stay', name: 'Stay', short: 'Stay', blurb: 'Guest houses, hotels and inns in and around Dover.' },
  { id: 'shops', name: 'Shops', short: 'Shops', blurb: 'High street names and independents.' },
  { id: 'services', name: 'Services', short: 'Services', blurb: 'Trades, professionals, health and everyday services.' },
  { id: 'things', name: 'Things to do', short: 'Things to do', blurb: 'Cinema, fitness, leisure and entertainment.' },
  { id: 'visit', name: 'Visit', short: 'Visit', blurb: 'Museums, the castle and boat trips.' },
  { id: 'finance', name: 'Finance', short: 'Finance', blurb: 'Banks, accountants and financial advisers.' },
  { id: 'clubs', name: 'Clubs', short: 'Clubs', blurb: 'Clubs, societies, charities and community groups.' },
  { id: 'learn', name: 'Learn', short: 'Learn', blurb: 'Schools, colleges and creative classes.' },
  { id: 'port', name: 'Port', short: 'Port', blurb: 'Ferries, the harbour board and freight.' },
  { id: 'industry', name: 'Industry', short: 'Industry', blurb: 'Manufacturers and industrial businesses.' },
  { id: 'events', name: 'Events', short: 'Events', blurb: 'Festivals, bands and event organisers.' },
  {
    id: 'history', name: 'History', short: 'History',
    blurb: 'Businesses that have closed or moved on. Follow the trail to see who traded on each site before and after.',
  },
];

// Tile colours cycle through the design palette.
const PAL = [
  { bg: 'var(--yellow)', fg: 'var(--ink)' },
  { bg: 'var(--ink)', fg: 'var(--paper)' },
  { bg: 'var(--green)', fg: '#fff' },
  { bg: '#fff', fg: 'var(--ink)' },
  { bg: 'var(--blue)', fg: '#fff' },
];
export const colourFor = (i: number) => PAL[i % PAL.length];
