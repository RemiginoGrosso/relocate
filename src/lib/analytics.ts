'use client';

import * as amplitude from '@amplitude/analytics-browser';

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey) return;
  amplitude.init(apiKey, {
    autocapture: { elementInteractions: false },
  });
  initialized = true;
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  amplitude.track(name, properties);
}
