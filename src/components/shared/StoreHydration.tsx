'use client';

import { useEffect, useState } from 'react';
import { hydrateWeightStore } from '@/stores/useWeightStore';

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateWeightStore();
    setHydrated(true);
  }, []);

  return hydrated;
}
