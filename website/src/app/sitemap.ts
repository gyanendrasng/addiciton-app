import type { MetadataRoute } from 'next';

const routes = ['', '/privacy', '/terms', '/support', '/crisis', '/delete-data'];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((r) => ({
    url: `https://joincurb.app${r}`,
    lastModified: new Date(),
    changeFrequency: r === '' ? 'weekly' : 'yearly',
    priority: r === '' ? 1 : 0.6,
  }));
}
