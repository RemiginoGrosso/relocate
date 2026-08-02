interface DataFreshnessNoteProps {
  date: Date;
}

export function DataFreshnessNote({ date }: DataFreshnessNoteProps) {
  const iso = date.toISOString();
  const display = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <p className="mb-8 text-xs text-zinc-400">
      Data last updated: <time dateTime={iso}>{display}</time>
    </p>
  );
}
