import Link from 'next/link';
import { DIMENSIONS, DIMENSION_SLUGS, REGIONS, REGION_SLUGS } from '@/lib/constants';
import type { DimensionKey } from '@/lib/types';

interface FooterLinksProps {
  currentDimension?: DimensionKey;
}

export function FooterLinks({ currentDimension }: FooterLinksProps = {}) {
  const dims = currentDimension
    ? DIMENSIONS.filter((d) => d.key !== currentDimension)
    : DIMENSIONS;

  return (
    <nav className="mt-12 border-t border-zinc-200 pt-6" aria-label="Explore">
      <h2 className="mb-3 text-sm font-medium text-zinc-900">Explore by dimension</h2>
      <div className="flex flex-wrap gap-2">
        {dims.map((d) => (
          <Link
            key={d.key}
            href={`/best-countries-for/${DIMENSION_SLUGS[d.key]}`}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          >
            {d.name}
          </Link>
        ))}
      </div>
      <h2 className="mb-3 mt-6 text-sm font-medium text-zinc-900">Explore by region</h2>
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((r) => (
          <Link
            key={r}
            href={`/region/${REGION_SLUGS[r]}`}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          >
            {r}
          </Link>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/ranking" className="text-teal-700 hover:text-teal-900 transition-colors">Full ranking</Link>
        <Link href="/methodology" className="text-teal-700 hover:text-teal-900 transition-colors">Methodology</Link>
        <Link href="/faq" className="text-teal-700 hover:text-teal-900 transition-colors">FAQ</Link>
        <Link href="/glossary" className="text-teal-700 hover:text-teal-900 transition-colors">Glossary</Link>
      </div>
    </nav>
  );
}
