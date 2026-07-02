# Changelog

## 0.1.3 — 2026-07-01

### Changed
- Default dimension weights: now equal (10 per dimension) instead of opinionated priors. Aligns with "user weights drive the ranking, not editorial choices" (Vision & Mission).
- Country detail header: removed capital city display to reduce confusion about score scope. Scores are country-level except climate (uses capital weather as proxy).

## 0.1.2 — 2026-07-01

### Added
- Data refresh pipeline: 4 Supabase Edge Functions (refresh-world-bank, refresh-who, refresh-climate, recompute-scores)
- pg_cron scheduling (monthly on 1st at 06:00–06:45 UTC, staggered)
- `invoke_edge_function()` SQL helper reads service role key from Supabase Vault
- Netlify `SECRETS_SCAN_OMIT_KEYS` for NEXT_PUBLIC_* env vars
- 6 feature context documents in Features/ folder

### Fixed
- Netlify deploy failure: secrets scanner false-positive on NEXT_PUBLIC_* vars in client bundle
- Replaced real Supabase URLs with placeholders in .env.example and docs
- World Bank API 2025 indicator IDs (GOV_WGI_RL.SC, GOV_WGI_CC.SC with source=3)
- WHO UHC indicator requires source=16
- Normalisation boundaries widened (GDP/PPP 8k–160k, price level 0.10–1.50, GPI 1.00–3.50)

## 0.1.1 — 2026-06-30

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
