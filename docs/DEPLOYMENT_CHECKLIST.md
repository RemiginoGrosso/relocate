# Deployment Checklist

## Done

- [x] V1 code complete (all 5 phases), 39/39 tests pass, clean build
- [x] Pushed to GitHub (`2762a3c`)
- [x] Netlify project "RelocateIndex" created and connected to GitHub
- [x] Env vars set in Netlify (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`)
- [x] First deploy triggered — site live at `relocateindex.netlify.app`
- [x] `netlify.toml` configured (Node 20, `.next` publish dir)
- [x] SEO metadata points to `relocateindex.com`
- [x] Tracking plan written (`docs/TRACKING_PLAN.md`)
- [x] Supabase Edge Functions written (4 functions + pg_cron migration)

---

## Verify deployed site (5 min)

Open `https://relocateindex.netlify.app` and check:

- [ ] Landing page loads, CTA works
- [ ] Onboarding: all 6 questions, auto-advance, skip, weight summary
- [ ] Ranking: sliders re-rank in real-time, region filter, country click
- [ ] Country detail: radar chart, dimension breakdown, back preserves weights
- [ ] Methodology: all 10 dimension cards, CSV download
- [ ] Mobile: test at 375px width (Chrome DevTools)

If build failed on Netlify, check the deploy log at:
`https://app.netlify.com/projects/relocateindex/deploys`

Common issue: the `turbopack.root` warning is harmless and won't fail the build.

---

## Custom domains (10 min)

1. Purchase `relocateindex.com` and `relocateindex.org` (if not done)
2. In Netlify dashboard → Domain management → Add custom domain
3. Add both `relocateindex.com` and `relocateindex.org`
4. Point DNS to Netlify:
   - Option A (recommended): Use Netlify DNS — update nameservers at registrar
   - Option B: Add CNAME record pointing to `relocateindex.netlify.app`
5. Enable HTTPS (automatic with Netlify, takes ~5 min after DNS propagates)
6. Set `relocateindex.com` as primary domain
7. Verify `NEXT_PUBLIC_SITE_URL` env var matches: `https://relocateindex.com`

---

## Supabase Edge Functions (15 min)

Requires Supabase CLI logged in. Run from the `relocator/` directory.

```bash
# 1. Login (if not already)
npx supabase login

# 2. Link to project
npx supabase link --project-ref rvjyhjfjvqaftaxjwzxj

# 3. Deploy all 4 functions
npx supabase functions deploy refresh-world-bank
npx supabase functions deploy refresh-who
npx supabase functions deploy refresh-climate
npx supabase functions deploy recompute-scores

# No need to set SUPABASE_SERVICE_ROLE_KEY — it's auto-injected by Supabase
```

### Set up pg_cron (annual data refresh)

Run the migration SQL in Supabase SQL Editor:

```sql
-- File: supabase/migrations/20260629000000_pg_cron_data_refresh.sql
-- Copy contents and run in SQL Editor → New query
```

This schedules annual refreshes in January-February. To test manually:

```bash
# Test each function individually
curl -L -X POST 'https://rvjyhjfjvqaftaxjwzxj.supabase.co/functions/v1/refresh-world-bank' \
  -H 'Authorization: Bearer <your-anon-key>'

curl -L -X POST 'https://rvjyhjfjvqaftaxjwzxj.supabase.co/functions/v1/recompute-scores' \
  -H 'Authorization: Bearer <your-anon-key>'
```

---

## Amplitude analytics (15 min)

1. Create Amplitude project (or provide project ID if done)
2. Install SDK:
   ```bash
   npm install @amplitude/analytics-browser
   ```
3. Add env var to `.env.local` and Netlify:
   ```
   NEXT_PUBLIC_AMPLITUDE_API_KEY=<your-api-key>
   ```
4. Tell Claude to instrument — the tracking plan at `docs/TRACKING_PLAN.md` has all 15 events defined. Implementation takes ~15 min with Claude.

---

## Post-launch (when ready)

- [ ] Submit sitemap to Google Search Console: `https://relocateindex.com/sitemap.xml`
- [ ] Set up Amplitude dashboards per tracking plan (4 dashboards, 4 funnels)
- [ ] Monitor Edge Function logs: Supabase dashboard → Edge Functions → Logs
- [ ] After first January refresh cycle, verify data freshness badges update
