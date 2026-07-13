'use client';

import { useEffect, useState } from 'react';
import { initAnalytics } from '@/lib/analytics';
import { usePageTracking } from '@/hooks/usePageTracking';

export function AnalyticsProvider() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initAnalytics();
    setReady(true);
  }, []);

  // Page tracking must not fire before amplitude.init() has run, otherwise the first
  // page_viewed event (landing) is silently dropped by trackEvent()'s initialized guard.
  usePageTracking({ enabled: ready });

  return null;
}
