'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { GitCompare, X } from 'lucide-react';
import type { CountryScores } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';
import { Input } from '@/components/ui/input';

interface CompareCTAProps {
  currentCountry: CountryScores;
  allCountries: CountryScores[];
}

const MAX_ADDED = 2;
const MAX_RESULTS = 6;
const COLORS = ['text-teal-700', 'text-indigo-600', 'text-amber-600'];

export function CompareCTA({ currentCountry, allCountries }: CompareCTAProps) {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<CountryScores[]>([]);
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const excludedIsos = useMemo(
    () => new Set([currentCountry.iso.toUpperCase(), ...added.map((c) => c.iso.toUpperCase())]),
    [currentCountry.iso, added],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allCountries
      .filter((c) => !excludedIsos.has(c.iso.toUpperCase()))
      .filter((c) => c.name.toLowerCase().includes(q) || c.iso.toLowerCase() === q)
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.name.localeCompare(b.name);
      })
      .slice(0, MAX_RESULTS);
  }, [allCountries, query, excludedIsos]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function reset() {
    setAdded([]);
    setQuery('');
    setDropdownOpen(false);
    setActiveIndex(-1);
  }

  function toggleOpen() {
    if (open) reset();
    setOpen((o) => !o);
  }

  function addCountry(country: CountryScores) {
    setAdded((prev) => (prev.length >= MAX_ADDED ? prev : [...prev, country]));
    setQuery('');
    setDropdownOpen(false);
    setActiveIndex(-1);
  }

  function removeCountry(iso: string) {
    setAdded((prev) => prev.filter((c) => c.iso.toUpperCase() !== iso.toUpperCase()));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) setDropdownOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < results.length) {
        e.preventDefault();
        addCountry(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  }

  function handleCompare() {
    const targets = added.map((c) => c.iso);
    trackEvent('compare_cta_used', { from_country: currentCountry.iso, target_countries: targets });
    const params = [currentCountry.iso, ...targets].map((iso) => iso.toLowerCase()).join(',');
    router.push(`/compare?countries=${params}`);
  }

  const showDropdown = dropdownOpen && query.trim().length > 0;
  const atMax = added.length >= MAX_ADDED;

  return (
    <div ref={containerRef} className="mb-8">
      <button
        type="button"
        onClick={toggleOpen}
        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-teal-700 hover:text-teal-700"
      >
        <GitCompare size={15} />
        Compare with...
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium ${COLORS[0]}`}>
              <span>{currentCountry.flagEmoji}</span>
              <span>{currentCountry.name}</span>
            </span>
            {added.map((c, i) => (
              <span
                key={c.iso}
                className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium ${COLORS[i + 1]}`}
              >
                <span>{c.flagEmoji}</span>
                <span>{c.name}</span>
                <button
                  onClick={() => removeCountry(c.iso)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-zinc-200"
                  aria-label={`Remove ${c.name}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {atMax ? (
            <p className="mt-3 text-xs text-zinc-400">Max 3 countries — remove one to add another.</p>
          ) : (
            <div className="relative mt-3">
              <Input
                type="text"
                role="combobox"
                aria-label="Search countries to compare"
                aria-expanded={showDropdown}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
                placeholder="Search countries..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                  setDropdownOpen(true);
                }}
                onFocus={() => {
                  if (query.trim()) setDropdownOpen(true);
                }}
                onKeyDown={handleKeyDown}
                className="h-9 border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400"
              />
              {showDropdown && (
                <div
                  id={listboxId}
                  role="listbox"
                  aria-label="Country results"
                  className="absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1.5 shadow-md"
                >
                  {results.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-zinc-400">No countries found</p>
                  ) : (
                    results.map((country, i) => (
                      <button
                        key={country.iso}
                        id={`${listboxId}-${i}`}
                        role="option"
                        aria-selected={i === activeIndex}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addCountry(country)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                          i === activeIndex ? 'bg-zinc-50' : ''
                        }`}
                      >
                        <span className="shrink-0 text-lg" aria-hidden>
                          {country.flagEmoji}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium text-zinc-900">
                          {country.name}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-3">
            <button type="button" onClick={toggleOpen} className="text-xs text-zinc-500 hover:text-zinc-700">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCompare}
              disabled={added.length === 0}
              className="rounded-md bg-teal-700 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Compare ({1 + added.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
