'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Option {
  label: string;
  value: string;
  description?: string;
}

interface QuestionStepProps {
  question: string;
  options: Option[];
  selected: string | undefined;
  onSelect: (value: string) => void;
  onSkip: () => void;
}

export function QuestionStep({
  question,
  options,
  selected,
  onSelect,
  onSkip,
}: QuestionStepProps) {
  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-2xl font-medium tracking-tight text-zinc-900 text-center max-w-lg">
        {question}
      </h2>
      <TooltipProvider>
        <div className="flex w-full max-w-md flex-col gap-3">
          {options.map((opt) => (
            <div key={opt.value} className="relative">
              <button
                onClick={() => onSelect(opt.value)}
                className={`w-full rounded-lg border px-5 py-3.5 text-sm font-medium text-left transition-colors ${
                  opt.description ? 'pr-11' : ''
                } ${
                  selected === opt.value
                    ? 'border-teal-700 bg-teal-50 text-teal-900'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {opt.label}
              </button>
              {opt.description && (
                <Tooltip>
                  <TooltipTrigger
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <Info className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-56">
                    {opt.description}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      </TooltipProvider>
      <button
        onClick={onSkip}
        className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        Skip
      </button>
    </div>
  );
}
