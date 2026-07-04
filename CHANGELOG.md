# Changelog

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
- Methodology page: "60-country panel" → "59-country panel"
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
