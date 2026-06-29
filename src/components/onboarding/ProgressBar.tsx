interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = (current / total) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="h-1 w-full rounded-full bg-zinc-200">
        <div
          className="h-1 rounded-full bg-teal-700 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-zinc-400">
        Step {current} of {total}
      </p>
    </div>
  );
}
