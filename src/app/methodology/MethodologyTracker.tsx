'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';
import { getCountriesExploredCount } from '@/lib/session-counters';
import { useWeightStore, hydrateWeightStore } from '@/stores/useWeightStore';

function getEntryMethod(): 'footer_link' | 'direct_url' | 'country_detail_link' {
  if (typeof document === 'undefined' || !document.referrer) return 'direct_url';
  try {
    const referrerPath = new URL(document.referrer).pathname;
    if (referrerPath.startsWith('/country/')) return 'country_detail_link';
    if (referrerPath === document.location.pathname) return 'direct_url';
    return 'footer_link';
  } catch {
    return 'direct_url';
  }
}

export function MethodologyTracker() {
  useEffect(() => {
    hydrateWeightStore();
    trackEvent('methodology_viewed', {
      entry_method: getEntryMethod(),
      countries_explored_before: getCountriesExploredCount(),
      onboarding_completed: useWeightStore.getState().fromOnboarding,
    });
  }, []);
  return null;
}
