import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/backoffice/', '/api/', '/profile', '/subscriptions'],
      },
    ],
    sitemap: 'https://laguiadelstreaming.com/sitemap.xml',
  };
}
