'use client';

import { Info } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DIMENSIONS } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import type { DimensionKey, UserWeights } from '@/lib/types';

interface WeightSlidersProps {
  weights: UserWeights;
  onWeightChange: (key: DimensionKey, value: number) => void;
  onReset: () => void;
}

export function WeightSliders({ weights, onWeightChange, onReset }: WeightSlidersProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-900">Your priorities</h2>
          <button
            onClick={onReset}
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
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
