'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export function CtaButtons() {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Link
        href="/onboarding"
        onClick={() => trackEvent('cta_click', { label: 'find_ideal_country' })}
        className="rounded-lg bg-teal-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-800"
      >
        Find my ideal country
      </Link>
      <Link
        href="/ranking"
        onClick={() => trackEvent('cta_click', { label: 'skip_to_ranking' })}
        className="rounded-lg border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        Skip to ranking
      </Link>
    </div>
  );
}
