'use client';

import { REGION_FILTER_GROUPS } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';

interface RegionFilterProps {
  activeGroup: string;
  onChange: (group: string) => void;
}

export function RegionFilter({ activeGroup, onChange }: RegionFilterProps) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {REGION_FILTER_GROUPS.map((group) => (
        <button
          key={group.label}
          onClick={() => { trackEvent('region_filter', { region: group.label }); onChange(group.label); }}
          className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activeGroup === group.label
              ? 'bg-teal-700 text-white'
              : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
          }`}
        >
          {group.label}
        </button>
      ))}
    </div>
  );
}
