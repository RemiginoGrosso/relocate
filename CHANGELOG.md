# Changelog

## 0.1.18 — 2026-07-12

### Fixed
- **v0.1.17 build failure** — `TooltipTrigger asChild` in `WeightSliders.tsx` didn't match base-ui's `Props` type, breaking `next build` type-check in CI (Turbopack dev mode didn't catch it). v0.1.17 never reached production as a result; this release supersedes it.
- **Mobile horizontal overflow on `/ranking` and `/compare`** — `<main>` was a flex item without `min-w-0`, so it refused to shrink below its subtree's min-content width, pushing content past the viewport edge and hiding the "Adjust priorities" CTA below the fold. Added `min-w-0` to `RankingView.tsx`, `CompareView.tsx`, and `ranking/loading.tsx`.
- **Tooltip taps on mobile** — base-ui tooltips only opened on hover/focus, which don't fire reliably on touch. Tooltips now also toggle open on click/tap.

### Changed
- **Mobile country card redesign** — restructured `CountryRow.tsx` header into a two-row layout: country name + score on row 1, region/city selector/status badges grouped on row 2. Fixes truncated country names and cluttered single-row layout reported on mobile.
- **Compare feature hidden on mobile** — compare checkboxes and the floating compare bar are now desktop-only (`lg:` and up). Mobile card real estate was dominated by the checkbox; comparison is a secondary desktop workflow.
- Climate-city tooltip on country detail replaced the trailing "· only affects climate score" text fragment with an info-icon tooltip, consistent with other indicator tooltips.

## 0.1.17 — 2026-07-11

### Added
- **Climate V2** — expanded climate preferences from 4 to 7+1 categories: Tropical Heat, Desert Dry, Sunny & Warm, Mild & Scenic, Green & Rainy, 4 Clear Seasons, Freezing Cold, I don't mind
- **City data expansion** — city-level climate data for ~35 countries (up from 8), covering all countries with non-uniform climate zones
- **Winter temperature scoring** — new `winterTempThreshold` and `winterTempPenalty` parameters on climate profiles that penalize frost/cold where relevant
- **Climate tooltip taglines** — hover tooltips on all 8 climate type buttons explaining what each profile means
- **"I don't mind" visual differentiator** — dashed border + muted styling distinguishes the opt-out option from active preferences

### Changed
- Climate type buttons use 2-column grid layout (4 rows of 2) with equal-width buttons
- `isLargeCountry()` renamed to `hasCityData()` throughout codebase
- Climate boost simplified to flat +2 for any non-`no_preference` selection
- localStorage version bumped to v4 with auto-migration (warm_sunny→sunny_warm, hot_tropical→tropical_heat, mild_green→green_rainy, cold_crisp→four_seasons)

## 0.1.16 — 2026-07-11

### Fixed
- **Confidence inversion** — civic_culture and religious_freedom had swapped confidence labels (complete case was `medium`, partial was `high`). Fixed in both `compute-normalised.ts` and `recompute-scores` Edge Function
- **CountryRow score display** — null dimension scores now show "—" placeholder instead of rendering ScoreBadge with 0

### Added
- **Weight-aware "Limited data" badges** on ranking rows — amber when any missing dimension has weight >= 6, zinc otherwise. Tooltip bolds high-weight gaps
- **Back-to-top button** on ranking view — appears after 600px scroll (ArrowUp icon, fixed bottom-right)
- **Unranked section** in single-dimension sort — countries without data for the selected dimension are separated below with "Not ranked for [dimension]" header. Count shown as teal scroll-link
- **"No data" bars** in DimensionBars — null dimension scores show empty bar track + "no data" text instead of hiding the row
- **Source provenance** in country detail — dimension accordions now show per-source availability badges (solid for present, dashed outline for missing). Key vs directional source tiers
- **Indicator tooltips** — 27 plain-language tooltips on indicator labels in dimension breakdowns (dotted underline, hover for explanation)
- **Partial data warnings** in dimension breakdown — "(partial)" label and amber callout when a dimension has a score but is missing key sources
- **Seed data gap fills** — Luxembourg GPI (1.38), IMD Infrastructure for CO/CR/UY/VN/TH, Taiwan WGI Rule of Law + Corruption Control
- `src/lib/source-provenance.ts` — source status utility for per-dimension data availability
- `src/lib/seed/numbeo-crime.json` — Numbeo crime index data for seed pipeline
- `src/lib/seed/external-indices-real.json` — World Bank API-sourced data for merge pipeline

### Changed
- **Warmth formula** — removed single-source fallback and Gallup MAI fallback branches from `compute-normalised.ts` and `recompute-scores` Edge Function. Both IVR + InterNations now required (decided in Iteration 22)
- `compute-normalised.ts` — delete-before-insert on normalised_scores to clean stale rows from removed formula branches
- PISA seed types updated to allow null wellbeing fields + optional `data_year`
- Warmth dimension metadata: sources list no longer includes "Gallup MAI (fallback)", methodology text updated

### Removed
- `decisions/2026-07-06-country-count-59.md` — superseded

## 0.1.15 — 2026-07-07

### Fixed
- **Critical:** Edge function `recompute-scores` now matches `compute-normalised.ts` — civic culture (added Numbeo street safety), warmth MAI fallback (minMax 1-9), purchasing power confidence logic
- Zero-row API responses now recorded as failures in `refresh-world-bank`
- Seed freshness timestamps: seeded data now carries real vintage dates instead of `NOW()`

### Added
- Refresh gate: `recompute-scores` checks `data_refresh_log` before running; logs warning if refreshers failed/missing
- `comparison_started` analytics event on compare view
- Store migration tests (9 tests: v1→v3, v2→v3, corrupted JSON, round-trip)
- `scripts/tsconfig.json` + `typecheck:scripts` command for script type-checking
- Country count decision: `decisions/2026-07-06-country-count-59.md`

### Removed
- `seedWvs` and `wvs.json` (WVS removed in v0.1.7, seed was reintroducing deleted data)
- `normalisation_params.json` and `seedNormalisationParams` (dead layer — never read by any compute path)
- Debug scripts `check_missing_data.mjs`, `test-usa.mjs`
- `external-indices-fabricated-backup.json` (fabricated data artifact)

### Changed
- README rewritten: correct stack (Netlify, Edge Functions), 60 countries, comparison view shipped
- `.gitignore`: added `.claude/`
- `fix-b5-wvs-cleanup.sql` archived with "do not re-run" header
- `pew_appendix_e.txt` moved from `_TEMP/` to `scripts/data/`

## 0.1.14 — 2026-07-05

### Added
- Healthcare V2: three-pillar scoring (UHC 35% + HAQ 35% + capacity 30%) replaces UHC-only formula
- HAQ Index seed data (IHME GBD) and health capacity seed data (OECD/WHO: physicians, beds, nurses)
- Country comparison view (`/compare`) with overlaid radar chart and delta scoring table
- Compare checkboxes on ranking page with floating compare bar (up to 3 countries)
- Weight sliders sidebar on compare view for real-time dimension adjustment
- City selector dropdowns on compare view for large countries (US, AU, CA, BR, AR, CN, IN, MX)
- Healthcare system type badges on ranking page when filtering by healthcare dimension

### Changed
- Healthcare scores reflect outcomes and capacity, not just coverage — US drops from ~90 to ~74
- Radar chart fill opacity increased to 0.12 for better visibility
- Cross-page state persistence: city selections and weights sync between ranking and compare views

## 0.1.13 — 2026-07-04

### Changed
- Favicon replaced with logo-based ICO (32×32 resized from brand logo)
- Header logo: switched from `next/image` to `<img>` to fix broken logo display — local 24px icon gains nothing from Next.js image optimization

## 0.1.12 — 2026-07-04

### Added
- `public/logo.png` — brand logo asset
- `src/app/icon.png` — app icon

## 0.1.11 — 2026-07-04

### Added
- JSON-LD structured data: WebSite, Organization, BreadcrumbList (all pages), Dataset (ranking), FAQPage (methodology) — targets Google rich snippets, AI Overviews, and Perplexity/ChatGPT citation
- `robots.ts` — crawling directives, sitemap reference, disallows /onboarding
- `manifest.ts` — PWA metadata with theme color and icon references
- `opengraph-image.tsx` — dynamic OG image (1200×630 teal gradient with site name and tagline)
- `apple-touch-icon.png` (180×180) for iOS bookmarks
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy (in both next.config.ts and netlify.toml)
- Static asset cache headers (`immutable, max-age=31536000`) for `/_next/static/*`
- `sr-only` text inside CountryRow overlay link for crawler link-text signals

### Changed
- **Canonical URL fix (CRITICAL)**: removed inherited `alternates: { canonical: '/' }` from root layout — was telling Google every page is a duplicate of the homepage. Each page now sets its own canonical.
- Title metadata uses `template: '%s — Relocate Index'` in root layout; child pages set only their own segment
- Twitter card metadata (`summary_large_image`) added globally
- Ranking + country pages: `force-dynamic` → ISR with `revalidate = 86400` (24h). Country pages pre-rendered at build time via `generateStaticParams` (60 static pages)
- Sitemap `lastModified` now uses actual data refresh date (2026-07-01) instead of `new Date()` which always reported today
- Onboarding page refactored: server wrapper exports metadata (`noindex, follow`) + renders client component
- `poweredByHeader: false` in next.config.ts

### Removed
- Dead template files from public/ (file.svg, globe.svg, next.svg, vercel.svg, window.svg)
- `force-dynamic` exports from ranking and country pages

## 0.1.10 — 2026-07-04

### Fixed
- `compute-normalised.ts`: civic culture formula updated to WGI-only (was still using 3-factor formula with WVS despite v0.1.7 removal)
- `compute-normalised.ts`: warmth scoring now includes Gallup MAI as fallback when both IVR and InterNations are missing
- Luxembourg warmth: confidence upgraded from 'low' to 'high' (raw data was present, normalised score was stale). Score: 39.71
- Deleted stale WVS rows from `raw_indices` table in Supabase

## 0.1.9 — 2026-07-04

### Added
- Winter temperature penalty for climate scoring: profiles with `winterTempThreshold` now penalise cities below threshold (e.g., Chicago "Mild & green" drops from 91 → 58). Winter temp data for all 28 cities across 8 large countries
- Climate preference selector nested below Climate slider in sidebar (Surface 2): 2-column grid with left-border indentation, only visible when climate weight > 0
- Missing-data alert icon (`AlertTriangle` + tooltip) on single-dimension ranking when a country has no score for that dimension
- SEO metadata for methodology page (description + OpenGraph)
- Open-Meteo added to landing page source list

### Changed
- Warmth mismatch icon changed from `AlertTriangle` to `ArrowLeftRight` — distinguishes "sources disagree" from "data missing"
- Warmth mismatch message now interprets the direction of divergence (IVR vs InterNations) instead of generic "mixed signals"
- City selector on ranking page hidden when viewing non-climate single-dimension rankings
- Landing page: "Backed by 10 validated data sources" → "Built on public institutional data"
- Methodology page: "60-country panel" → "60-country panel"
- Healthcare context copy: "covered through employment" → "covered through the public system"
- Climate context copy updated for city-level data availability
- PISA next release date corrected: "expected 2025" → "expected late 2026 or early 2027"
- "purchasing parity" → "purchasing power parity (PPP)"
- DataFreshness: removed WVS label, added Gallup MAI label

### Removed
- `ClimateTypeSelector` standalone component (inlined into `WeightSliders`)
- Dead WVS indicator label and interpretation ranges from constants

## 0.1.8 — 2026-07-03

### Changed
- Healthcare badges redesigned with budget-oriented labels: "Covered", "Must buy insurance", "Tied to employer", "Budget for private" (previously used system-architecture terms)
- Healthcare dimension description and context rewritten to answer "what does this mean for my healthcare budget?" rather than describing system architecture
- Healthcare score simplified to WHO UHC index only (dropped WHO OOP component); badge now communicates financial implication per country
- Colombia reclassified from `regulated_buyin` to `budget_private` (EPS auto-enrolls but prepagada is the practical norm for relocating professionals)
- Tooltips rewritten with practical relocation framing (e.g., "Working legally means you're covered")
- `HealthcareSystemBadge` component added to country detail accordion (DimensionBreakdown)
- Healthcare badge with tooltip added to ranking view CountryRow in single-dimension mode
- `HealthcareSystemType` type added to types.ts; `HEALTHCARE_SYSTEM_LABELS` and `HEALTHCARE_SYSTEM_MAP` added to constants.ts
- HEALTHCARE_SYSTEM_CLASSIFICATION.md and SCORING_ENGINE.md updated to reflect new category names and Colombia reclassification

## 0.1.7 — 2026-07-03

### Changed
- Civic Culture dimension: removed WVS Social Trust from formula. Now WGI-only (Rule of Law × 0.55 + Corruption Control × 0.45). WVS trust measured a different construct (interpersonal social capital) than institutional governance quality, causing countries like Japan to score misleadingly low. Social Trust parked as potential standalone dimension for Phase 2
- Civic Culture description, context, and methodology copy updated to reflect governance-only scope
- Onboarding Q3 reworded: "social trust, respect for public space" → "corruption control, institutional fairness"

### Fixed
- US English proficiency: added US to English-native countries list (was showing 0.0, now 100)

## 0.1.6 — 2026-07-03

### Added
- Climate city selector on country detail page: header-level dropdown for 8 large countries (CA, AU, BR, AR, CN, IN, MX, US) with "only affects climate score" disclaimer. Updates climate score, radar chart, and composite in real-time
- USA added as country with 5 cities for climate selection (New York, Los Angeles, Miami, Chicago, San Francisco)
- Gallup MAI seed data (`gallup-mai.json`): 47 countries with Migrant Acceptance Index scores from WHR 2018
- Partial data handling: multi-source dimensions now reweight available components when some sources are missing, with confidence: "low" marker

### Changed
- Warmth dimension: added Gallup MAI as fallback when neither Hofstede IVR nor InterNations is available. Primary formula unchanged: `IVR × 0.40 + InterNations × 0.60`
- Methodology page updated with partial data explanation

### Fixed
- Warmth scores for Cyprus, Costa Rica, Panama, Qatar: previously NULL due to missing IVR gate, now computed from InterNations data alone (confidence: low)
- Removed stale `onCityChange` prop from CountryDetailView and unused imports from DimensionBreakdown

## 0.1.5 — 2026-07-02

### Added
- Missing data visual cue on ranking view: amber AlertTriangle icon (14px) next to score badge for countries missing 1-3 dimensions, with tooltip listing which dimensions are missing. "Limited data" outline badge for >3 missing dimensions
- Dimension context paragraphs: each dimension now has a `context` field explaining why it matters for relocation, shown in country detail accordion below the description
- Indicator interpretation labels: qualitative labels (e.g., "Moderate", "Low trust", "Peaceful") shown below raw indicator values in accordion panels. Covers all 20 indicators across 10 dimensions
- "Your top priorities" label and "+N more" indicator on DimensionBars in ranking view
- Slider scale changed from 0-100 to 0-10 to eliminate false precision. localStorage migration (v1→v2) auto-converts saved weights

### Changed
- Civic Culture description rewritten to cover social behaviour (queuing, driving, respecting shared spaces, normalisation of rule-breaking) alongside institutional quality
- Onboarding weight increments scaled to 0-10 range (e.g., +4 instead of +40)
- Default weights changed from 10 to 5 per dimension

### Fixed
- Indicator text overflow in country detail accordion: values and interpretation labels no longer extend past card boundary (items-baseline + justify-between layout)
- Accordion content padding: added horizontal padding (px-2) so indicator text doesn't collide with card edges
- WGI interpretation ranges corrected from -2.5/+2.5 to 0-100 scale (matching stored data format per SCORING_ENGINE.md)

## 0.1.4 — 2026-07-02

### Added
- Persist onboarding state: weights, climate type, and onboarding flag saved to localStorage with versioned schema. Resume banner on onboarding page ("Continue with saved priorities" / "Start fresh")
- FE version displayed in footer (`v0.1.x` from package.json via NEXT_PUBLIC_APP_VERSION)
- Contact email in footer (info@relocateindex.com, JS-assembled anti-scrape)
- "Ranked by" dropdown on ranking page: sort by individual dimension or overall composite score. Hides DimensionBars in single-dimension mode
- 5 new analytics events: csv_downloaded, methodology_viewed, weights_reset, cta_click, climate_type_change (total: 12 instrumented events)

### Changed
- CTA buttons on landing page extracted to client component (CtaButtons.tsx) for analytics tracking
- MethodologyTracker client component added to methodology page for page-view event

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
