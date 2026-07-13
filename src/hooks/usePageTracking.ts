'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

const PAGE_NAMES: Record<string, string> = {
  '/': 'landing',
  '/onboarding': 'onboarding',
  '/ranking': 'ranking',
  '/methodology': 'methodology',
  '/compare': 'compare',
};

function getPageName(path: string): string {
  if (path.startsWith('/country/')) return 'country_detail';
  return PAGE_NAMES[path] ?? 'unknown';
}

function getCountrySlug(path: string): string | null {
  if (!path.startsWith('/country/')) return null;
  return path.split('/')[2] ?? null;
}

/**
 * page_viewed — fires once per route change per TRACKING_PLAN.md §2.
 *
 * SDK-level page view autocapture (config.defaultTracking.pageViews) is explicitly
 * disabled in initAnalytics() so this is the sole source of page view events — see the
 * comment in src/lib/analytics.ts for the reconciliation rationale.
 *
 * `enabled` gates firing until amplitude.init() has completed, so the first (landing)
 * page_viewed isn't silently dropped by trackEvent()'s pre-init guard.
 */
export function usePageTracking({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const previousPage = useRef<string>('');
  const sessionStart = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;
    const pageName = getPageName(pathname);
    trackEvent('page_viewed', {
      page_name: pageName,
      page_path: pathname,
      referrer_page: previousPage.current,
      country_slug: getCountrySlug(pathname),
      session_elapsed_ms: Date.now() - sessionStart.current,
    });
    previousPage.current = pageName;
  }, [pathname, enabled]);
}
