import type { MetadataRoute } from 'next';
import { fetchAllCountryScores } from '@/lib/supabase';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocator.netlify.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const countries = await fetchAllCountryScores();

  const countryUrls = countries.map((c) => ({
    url: `${BASE_URL}/country/${c.iso}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/ranking`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/methodology`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...countryUrls,
  ];
}
