'use client';

import { REGION_FILTER_GROUPS } from '@/lib/constants';

interface RegionFilterProps {
  activeGroup: string;
  onChange: (group: string) => void;
}

export function RegionFilter({ activeGroup, onChange }: RegionFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {REGION_FILTER_GROUPS.map((group) => (
        <button
          key={group.label}
          onClick={() => onChange(group.label)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
