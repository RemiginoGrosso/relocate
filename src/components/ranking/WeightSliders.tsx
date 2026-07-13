'use client';

import { Info } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DIMENSIONS, CLIMATE_PROFILES } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import type { ClimatePreference, DimensionKey, UserWeights } from '@/lib/types';

const CLIMATE_TAGLINES: Record<ClimatePreference, string> = {
  tropical_heat: 'Warm and humid weather all year round, perfect for beach and jungle climates.',
  desert_dry: 'Hot, arid days with maximum sunshine and virtually zero humidity or rain.',
  sunny_warm: 'Long, hot summers and pleasant, mild winters that rarely see frost or snow.',
  mild_scenic: 'Lush, green nature and comfortable temperatures, featuring gorgeous, dry, and sunny summers.',
  green_rainy: 'Cozy, overcast weather with consistent rainfall and misty landscapes throughout the year.',
  four_seasons: 'A predictable yearly cycle of hot summers, crisp autumn leaves, spring blooms, and snowy winters.',
  freezing_cold: 'Long, snowy winters and brief, cool summers tailored for winter sports and glacial landscapes.',
  no_preference: 'No climate scoring adjustment — all climates weighted equally.',
};

const CLIMATE_KEYS: ClimatePreference[] = [
  'tropical_heat',
  'desert_dry',
  'sunny_warm',
  'mild_scenic',
  'green_rainy',
  'four_seasons',
  'freezing_cold',
  'no_preference',
];

interface WeightSlidersProps {
  weights: UserWeights;
  onWeightChange: (key: DimensionKey, value: number) => void;
  onReset: () => void;
  climateType: ClimatePreference;
  onClimateTypeChange: (type: ClimatePreference) => void;
}

export function WeightSliders({ weights, onWeightChange, onReset, climateType, onClimateTypeChange }: WeightSlidersProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-900">Your priorities</h2>
          <button
            onClick={() => {
              trackEvent('weights_reset', {});
              onReset();
            }}
            className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Reset
          </button>
        </div>
        {DIMENSIONS.map((dim) => (
          <div key={dim.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <label className="text-sm text-zinc-700">{dim.name}</label>
                <Tooltip>
                  <TooltipTrigger className="text-zinc-400 hover:text-zinc-600 transition-colors">
                    <Info className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" align="start" className="max-w-56">
                    {dim.description}
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs tabular-nums text-zinc-400 w-6 text-right">
                {weights[dim.key]}
              </span>
            </div>
            <Slider
              value={[weights[dim.key]]}
              onValueChange={(val) => onWeightChange(dim.key, Array.isArray(val) ? val[0] : val)}
              onValueCommitted={(val) => {
                const v = Array.isArray(val) ? val[0] : val;
                trackEvent('slider_change', { dimension: dim.key, value: v });
              }}
              max={10}
              step={1}
              className="w-full"
            />
            {dim.key === 'climate' && weights.climate > 0 && (
              <div className="ml-4 mt-2 border-l-2 border-zinc-200 pl-4 transition-all duration-150">
                <p className="mb-1.5 text-xs text-zinc-500">Your climate type</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CLIMATE_KEYS.map((key) => {
                    const profile = CLIMATE_PROFILES[key];
                    const active = climateType === key;
                    return (
                      <Tooltip key={key}>
                        <TooltipTrigger
                          onClick={() => {
                            trackEvent('climate_type_change', { climate_type: key });
                            onClimateTypeChange(key);
                          }}
                          className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? 'bg-teal-700 text-white'
                              : key === 'no_preference'
                                ? 'border border-dashed border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
                                : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          {profile.label}
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-56">
                          {CLIMATE_TAGLINES[key]}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
