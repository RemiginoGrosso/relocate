'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import type { CountryScores } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';
import { Input } from '@/components/ui/input';

interface CountrySearchProps {
  countries: CountryScores[];
}

const MAX_RESULTS = 8;

export function CountrySearch({ countries }: CountrySearchProps) {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return countries
      .filter((c) => c.name.toLowerCase().includes(q) || c.iso.toLowerCase() === q)
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.name.localeCompare(b.name);
      })
      .slice(0, MAX_RESULTS);
  }, [countries, query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function selectCountry(country: CountryScores) {
    trackEvent('country_search_selected', { country: country.iso, query });
    setOpen(false);
    setQuery('');
    router.push(`/country/${country.iso.toLowerCase()}`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) setOpen(true);
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
        selectCountry(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <Input
          type="text"
          role="combobox"
          aria-label="Search countries"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          placeholder="Search countries..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className="h-10 border-zinc-200 bg-white pl-8 pr-8 text-sm text-zinc-900 placeholder:text-zinc-400"
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery('');
              setActiveIndex(-1);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Country search results"
          className="absolute z-20 mt-1.5 max-h-80 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1.5 shadow-md"
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
                onClick={() => selectCountry(country)}
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
  );
}
