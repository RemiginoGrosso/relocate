'use client';

import * as amplitude from '@amplitude/analytics-browser';

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey) return;
  amplitude.init(apiKey, {
    autocapture: { elementInteractions: false },
    // SDK-level page view autocapture is ON by default (config.defaultTracking.pageViews
    // defaults to true when `defaultTracking` is unset). We track page views manually via
    // usePageTracking() with our own page taxonomy (page_name, referrer_page, etc. per
    // TRACKING_PLAN.md), so default page view tracking is explicitly disabled here to avoid
    // firing both an Amplitude-native "[Amplitude] Page Viewed" event and our custom
    // `page_viewed` event for the same navigation.
    defaultTracking: { pageViews: false },
  });
  initialized = true;
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  amplitude.track(name, properties);
}

/**
 * civic_norms_context_expanded
 *
 * Fires when a user expands/engages the planned "civic norms context" display block
 * inside the Rule of Law dimension section of country detail (see
 * Projects/Civic-Norms-Context/IMPLEMENTATION_PLAN.md, Phase 5).
 *
 * Definition only — no call site exists yet. The Civic-Norms-Context project wires the
 * actual call in DimensionBreakdown.tsx once that block ships. Registered now so the
 * event is available in TRACKING_PLAN.md and Amplitude ahead of the 2026-08-15 gate.
 */
export function trackCivicNormsContextExpanded(properties: {
  country_code: string;
  country_name: string;
  rows_shown: number;
  time_to_expand_ms?: number;
}) {
  trackEvent('civic_norms_context_expanded', properties);
}
