// The old site only linked out to these event sources. Add dated events here when you have them.
export interface EventSource { title: string; host: string; url: string; kind: string }

export const eventSources: EventSource[] = [
  { title: 'White Cliffs Country: What’s On', host: 'whitecliffscountry.org.uk', url: 'https://www.whitecliffscountry.org.uk/whats-on', kind: 'Listings' },
  { title: 'Dover Film Festival', host: 'dover-film.com', url: 'http://www.dover-film.com/', kind: 'Festival' },
  { title: 'Dover Operatic & Dramatic Society', host: 'dods.org.uk', url: 'http://www.dods.org.uk/', kind: 'Theatre' },
  { title: 'Blackfish Academy', host: 'blackfishacademy.com', url: 'http://www.blackfishacademy.com/', kind: 'Classes' },
];
