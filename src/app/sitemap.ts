import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://laguiadelstreaming.com',
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: 'https://laguiadelstreaming.com/streamers',
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: 'https://laguiadelstreaming.com/legal/politica-de-privacidad',
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://laguiadelstreaming.com/terminos-y-condiciones',
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
