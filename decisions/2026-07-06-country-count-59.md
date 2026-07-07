## Decision: 60 countries. Israel excluded.

## Context

Multiple documents disagreed on the country count: 40 (stale), 59 (older docs), 60 (current seed and app). The July 2026 audit flagged this as finding H3. Israel was never added to `countries.json` — the 60 countries in the seed are all non-Israel. Some data templates and the GPI merge script contain IL entries, but these are dead data (no matching country_id).

## Alternatives considered

1. Add Israel to reach 61 — rejected on values grounds. The product will not list genocidal states.
2. Remove a country to reach 59 — no reason to. The current 60 all have sufficient data.

## Reasoning

Values-based product decision on Israel. The count of 60 is a factual statement about what ships. All "40 countries" references are stale from early development. The few "59 countries" references predate the addition of the 60th country.

## Trade-offs accepted

- IL entries in data templates (`scripts/data-templates/`) and `merge-scraped-data.ts` are harmless dead data but should be cleaned eventually.
- Some documents said "59" from before the 60th country was added — these have been updated.
