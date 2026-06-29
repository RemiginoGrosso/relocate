'use client';

import type { ClimatePreference } from '@/lib/types';
import { CLIMATE_PROFILES } from '@/lib/constants';

interface ClimateTypeSelectorProps {
  value: ClimatePreference;
  onChange: (type: ClimatePreference) => void;
}

const CLIMATE_KEYS: ClimatePreference[] = [
  'warm_sunny',
  'hot_tropical',
  'mild_green',
  'cold_crisp',
  'no_preference',
];

export function ClimateTypeSelector({ value, onChange }: ClimateTypeSelectorProps) {
  return (
    <div className="mt-6 border-t border-zinc-200 pt-6">
      <p className="mb-1 text-sm font-medium text-zinc-900">Weather preference</p>
      <p className="mb-3 text-xs text-zinc-500">
        Adjusts how climate scores are calculated
      </p>
      <div className="flex flex-col gap-1.5">
        {CLIMATE_KEYS.map((key) => {
          const profile = CLIMATE_PROFILES[key];
          const active = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? 'bg-teal-700 text-white'
                  : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <span className="font-medium">{profile.label}</span>
              {key !== 'no_preference' && (
                <span className={`ml-1.5 text-xs ${active ? 'text-teal-200' : 'text-zinc-400'}`}>
                  {profile.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
