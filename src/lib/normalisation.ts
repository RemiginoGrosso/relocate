export function minMaxNormalise(
  value: number | null | undefined,
  min: number,
  max: number,
  invert = false,
): number | null {
  if (value == null || min === max) return null;
  const clamped = Math.max(min, Math.min(max, value));
  const normalised = ((clamped - min) / (max - min)) * 100;
  return invert ? 100 - normalised : normalised;
}

export function rankToScore(
  rank: number | null | undefined,
  totalCountries: number,
): number | null {
  if (rank == null || totalCountries <= 1) return null;
  return ((totalCountries - rank) / (totalCountries - 1)) * 100;
}

export function pisaAcademicNormalise(
  reading: number | null | undefined,
  maths: number | null | undefined,
  science: number | null | undefined,
): number | null {
  const scores = [reading, maths, science].filter(
    (s): s is number => s != null,
  );
  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return minMaxNormalise(avg, 300, 600);
}

export function gpiNormalise(
  gpiScore: number | null | undefined,
): number | null {
  if (gpiScore == null) return null;
  return minMaxNormalise(gpiScore, 1.00, 3.50, true);
}

export function pewNormalise(
  rawScore: number | null | undefined,
): number | null {
  if (rawScore == null) return null;
  const scaled = (rawScore / 10) * 100;
  return 100 - scaled;
}

export function efEpiNormalise(
  rawScore: number | null | undefined,
  min = 400,
  max = 650,
): number | null {
  return minMaxNormalise(rawScore, min, max);
}
