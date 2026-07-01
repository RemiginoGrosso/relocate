# Changelog

## 0.1.1 — 2026-07-01

### Added
- Amplitude analytics (7 events: onboarding flow, slider changes, country clicks, region filters)
- Real published data replacing all fabricated seed values (World Bank API, GPI, EF EPI, IMD, InterNations, Pew GRI/SHI)
- Data sourcing scripts (`source-real-data.ts`, `merge-scraped-data.ts`, `extract-pew-data.ts`)

### Changed
- Country count: 60 → 59 (Israel removed)
- Normalisation boundaries recalibrated for real data ranges (GDP/PPP, price level, GPI)
- Amplitude env var prefix: `VITE_` → `NEXT_PUBLIC_`
- Domain set to `relocateindex.com`

### Fixed
- Denmark PISA maths: 494 → 489
- Radar chart "Religious Freedom" label clipping
- World Bank API indicator renames (WGI 2025 update)

## 0.1.0 — 2026-06-28

Initial V1 implementation (Phases 1-5): scoring engine, ranking view, country detail, onboarding, methodology page.
