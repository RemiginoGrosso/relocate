import type { MetadataRoute } from 'next';
import { fetchAllCountryScores } from '@/lib/supabase';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com';

// Update when data pipeline refreshes scores (monthly on 1st via pg_cron)
const DATA_UPDATED = new Date('2026-07-01');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const countries = await fetchAllCountryScores();

  const countryUrls = countries.map((c) => ({
    url: `${BASE_URL}/country/${c.iso.toLowerCase()}`,
    lastModified: DATA_UPDATED,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: DATA_UPDATED,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/ranking`,
      lastModified: DATA_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/methodology`,
      lastModified: new Date('2026-07-04'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...countryUrls,
  ];
}
