'use client';

interface Option {
  label: string;
  value: string;
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
      <div className="flex w-full max-w-md flex-col gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`w-full rounded-lg border px-5 py-3.5 text-sm font-medium text-left transition-colors ${
              selected === opt.value
                ? 'border-teal-700 bg-teal-50 text-teal-900'
                : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <button
        onClick={onSkip}
        className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        Skip
      </button>
    </div>
  );
}
