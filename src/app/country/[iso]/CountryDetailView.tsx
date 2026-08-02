'use client';

import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { CountryDetail, CountryScores } from '@/lib/types';
import type { CountryProse } from '@/lib/country-prose';
import type { FaqItem } from '@/lib/country-faq';
import { trackEvent } from '@/lib/analytics';
import { incrementCountriesExploredCount } from '@/lib/session-counters';
import { hasCityData, getCitiesForCountry, getDefaultCity } from '@/lib/large-countries';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { CountryRadarChart } from '@/components/country/CountryRadarChart';
import { DimensionBreakdown } from '@/components/country/DimensionBreakdown';
import { DataFreshness } from '@/components/country/DataFreshness';
import { CompareCTA } from '@/components/country/CompareCTA';
import { FooterLinks } from '@/components/seo/FooterLinks';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useWeightStore, hydrateWeightStore } from '@/stores/useWeightStore';
import { applyClimatePreference, computeComposite, normaliseWeights } from '@/lib/scoring';
import { DEFAULT_WEIGHTS } from '@/lib/constants';

interface CountryDetailViewProps {
  detail: CountryDetail;
  allCountries: CountryScores[];
  prose: CountryProse;
  faqs: FaqItem[];
}

export function CountryDetailView({ detail, allCountries, prose, faqs }: CountryDetailViewProps) {
  const { country, rawIndices, climate } = detail;
  const { weights, climateType, selectedCities, setSelectedCity } = useWeightStore();

  useEffect(() => {
    hydrateWeightStore();
  }, []);

  const adjustedCountry = useMemo(
    () => applyClimatePreference([country], climateType, selectedCities)[0],
    [country, climateType, selectedCities],
  );

  const normWeights = normaliseWeights(weights);
  const { score } = computeComposite(adjustedCountry, normWeights);

  const relatedCountries = useMemo(() => {
    const defaultNorm = normaliseWeights(DEFAULT_WEIGHTS);
    return allCountries
      .filter((c) => c.region === country.region && c.iso !== country.iso)
      .map((c) => ({ ...c, defaultScore: computeComposite(c, defaultNorm).score }))
      .sort((a, b) => b.defaultScore - a.defaultScore)
      .slice(0, 5);
  }, [allCountries, country.region, country.iso]);

  useEffect(() => {
    trackEvent('country_detail_view', { country: country.iso, name: country.name });
    incrementCountriesExploredCount();
  }, [country.iso, country.name]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
      <Link
        href="/ranking"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to ranking
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <span className="text-4xl">{country.flagEmoji}</span>
        <div className="flex-1">
          <h1 className="text-3xl font-medium tracking-tight text-zinc-900">
            {country.name}
          </h1>
          <p className="text-sm text-zinc-500">
            {country.region}
          </p>
          {hasCityData(country.iso) && (() => {
            const cities = getCitiesForCountry(country.iso);
            const currentCity = selectedCities[country.iso.toUpperCase()] ?? getDefaultCity(country.iso) ?? undefined;
            return cities ? (
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-xs text-zinc-400">Climate city:</span>
                <select
                  value={currentCity}
                  onChange={(e) => setSelectedCity(country.iso.toUpperCase(), e.target.value)}
                  className="text-xs text-teal-700 bg-transparent border-none cursor-pointer p-0 focus:outline-none focus:ring-0"
                  aria-label={`Select climate city for ${country.name}`}
                >
                  {cities.map((city) => (
                    <option key={city.name} value={city.name}>{city.name}</option>
                  ))}
                </select>
                <Tooltip>
                  <TooltipTrigger className="text-zinc-400 hover:text-zinc-600 transition-colors" aria-label="About climate city selection">
                    <Info className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" align="start" className="max-w-56 text-xs">
                    Only affects the climate score — the rest of the ranking uses country-level data.
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : null;
          })()}
        </div>
        <ScoreBadge score={score} size="lg" />
      </div>

      <p className="mb-6 text-sm leading-relaxed text-zinc-600">
        {prose.summary}
      </p>

      <CompareCTA currentCountry={country} allCountries={allCountries} />

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-sm font-medium text-zinc-900">Overview</h2>
          <div className="rounded-lg border border-zinc-200 p-4">
            <CountryRadarChart country={adjustedCountry} />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-medium text-zinc-900">
            Dimension breakdown
          </h2>
          <div className="rounded-lg border border-zinc-200">
            <DimensionBreakdown
              country={adjustedCountry}
              rawIndices={rawIndices}
              climate={climate}
              selectedCity={selectedCities[country.iso.toUpperCase()]}
            />
          </div>
        </div>
      </div>

      {prose.dimensions.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-sm font-medium text-zinc-900">
            {country.name} at a glance
          </h2>
          <div className="space-y-4">
            {prose.dimensions.map((dim) => (
              <div key={dim.key} className="rounded-lg border border-zinc-200 p-4">
                <h3 className="text-sm font-medium text-zinc-900">{dim.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                  {dim.sentences.join(' ')}
                </p>
                {dim.sources.length > 0 && (
                  <p className="mt-2 text-xs text-zinc-400">
                    Sources: {dim.sources.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {faqs.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-medium text-zinc-900">
            Frequently asked questions about {country.name}
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-lg border border-zinc-200">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors">
                  {faq.question}
                </summary>
                <p className="px-4 pb-4 text-sm leading-relaxed text-zinc-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 rounded-lg border border-zinc-200 p-5">
        <DataFreshness rawIndices={rawIndices} climate={climate} />
      </div>

      {relatedCountries.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-sm font-medium text-zinc-900">
            More countries in {country.region}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCountries.map((rc) => (
              <Link
                key={rc.iso}
                href={`/country/${rc.iso.toLowerCase()}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50"
              >
                <span className="text-2xl" aria-hidden>{rc.flagEmoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{rc.name}</p>
                  <p className="text-xs text-zinc-500">Score: {rc.defaultScore.toFixed(1)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <FooterLinks />
    </main>
  );
}
