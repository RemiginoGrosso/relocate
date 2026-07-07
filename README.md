# Relocator

A transparent, user-weighted country ranking tool for people considering international relocation. Ranks 60 countries across 10 data dimensions (purchasing power, civic culture, safety, warmth, school culture, healthcare, infrastructure, climate, religious freedom, English proficiency).

**Live:** [relocateindex.com](https://relocateindex.com)

## Stack

- **Frontend:** Next.js (App Router), Tailwind CSS, shadcn/ui, Zustand, Recharts
- **Backend:** Supabase (PostgreSQL, read-only from frontend)
- **Data pipeline:** Supabase Edge Functions (4 functions) + pg_cron (monthly refresh)
- **Hosting:** Netlify (frontend) + Supabase cloud (backend)
- **Data sources:** World Bank, OECD, WHO, IHME GBD, Open-Meteo, Pew Research, PISA, Hofstede, InterNations, EF EPI, GPI, IMD, Numbeo Crime Index (scraped). All free.

## Development

```bash
npm install
npm run dev
```

Seed data: `npx tsx scripts/seed.ts`
Tests: `npm run test`

## Features

- 6-question onboarding that auto-sets dimension weights
- Real-time weight sliders with instant re-ranking (client-side, < 100ms)
- Country detail with radar chart, dimension breakdown, data freshness
- Country comparison view (up to 3 countries, overlaid radar + delta table)
- 5 climate profiles (warm & sunny, hot & tropical, mild & green, cold & crisp, no preference)
- Healthcare system type badges (covered / must buy insurance / tied to employer / budget for private)
- Methodology page with full formula transparency and CSV download
- Amplitude analytics (7 events)

## Documentation

Project documentation lives in `KNOWLEDGE/` (one level up from this directory). See the root `CLAUDE.md` for the full documentation index including scoring formulas, data sources, database schema, and decision history.
