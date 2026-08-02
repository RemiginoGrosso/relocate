import type { MetadataRoute } from 'next';
import { fetchAllCountryScores, fetchLatestDataDate } from '@/lib/supabase';
import { DIMENSION_SLUGS, REGION_SLUGS } from '@/lib/constants';
import { generateComparisonPairs } from '@/lib/comparison-pairs';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [countries, dataUpdated] = await Promise.all([
    fetchAllCountryScores(),
    fetchLatestDataDate(),
  ]);

  const countryUrls = countries.map((c) => ({
    url: `${BASE_URL}/country/${c.iso.toLowerCase()}`,
    lastModified: dataUpdated,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const dimensionUrls = Object.values(DIMENSION_SLUGS).map((slug) => ({
    url: `${BASE_URL}/best-countries-for/${slug}`,
    lastModified: dataUpdated,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const regionUrls = Object.values(REGION_SLUGS).map((slug) => ({
    url: `${BASE_URL}/region/${slug}`,
    lastModified: dataUpdated,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const comparisonUrls = generateComparisonPairs(countries).map((p) => ({
    url: `${BASE_URL}/compare/${p.slug}`,
    lastModified: dataUpdated,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: dataUpdated,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/ranking`,
      lastModified: dataUpdated,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/methodology`,
      lastModified: dataUpdated,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...dimensionUrls,
    ...regionUrls,
    {
      url: `${BASE_URL}/faq`,
      lastModified: dataUpdated,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/glossary`,
      lastModified: dataUpdated,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...countryUrls,
    ...comparisonUrls,
  ];
}
