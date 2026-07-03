'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

export function MethodologyTracker() {
  useEffect(() => {
    trackEvent('methodology_viewed', {});
  }, []);
  return null;
}
