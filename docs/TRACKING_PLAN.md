# Relocator — Amplitude Tracking Plan

**Version:** 1.0
**Date:** 2026-06-29
**Scope:** V1, no auth, session-based only
**Convention:** Amplitude standard — snake_case event names, object-keyed properties

---

## Contents

1. [User Properties](#1-user-properties)
2. [Pageview Events](#2-pageview-events)
3. [Onboarding Flow Events](#3-onboarding-flow-events)
4. [Ranking Interaction Events](#4-ranking-interaction-events)
5. [Country Exploration Events](#5-country-exploration-events)
6. [Methodology Events](#6-methodology-events)
7. [Engagement Computed Events](#7-engagement-computed-events)
8. [Funnel Definitions](#8-funnel-definitions)
9. [Key Metrics Dashboard](#9-key-metrics-dashboard)
10. [Implementation Notes](#10-implementation-notes)

---

## 1. User Properties

Set once per session via `amplitude.setUserProperties()`. Because there is no auth, these are session-level signals only — they give segmentation value without requiring identity.

| Property | Type | Example Values | When Set | Notes |
|---|---|---|---|---|
| `device_type` | string | `"mobile"`, `"tablet"`, `"desktop"` | On first page load | Derive from `window.innerWidth` or `navigator.userAgent` |
| `referrer_domain` | string | `"google.com"`, `"twitter.com"`, `""` | On first page load | `document.referrer` hostname; empty string if direct |
| `referrer_raw` | string | `"https://t.co/abc123"`, `""` | On first page load | Full referrer URL, useful for UTM chain debugging |
| `utm_source` | string | `"newsletter"`, `"twitter"`, `""` | On first page load | From `?utm_source=` query param |
| `utm_medium` | string | `"social"`, `"email"`, `""` | On first page load | From `?utm_medium=` query param |
| `utm_campaign` | string | `"launch_june26"`, `""` | On first page load | From `?utm_campaign=` query param |
| `entry_point` | string | `"onboarding"`, `"ranking_direct"` | On first page load | `"onboarding"` if user landed on `/` and clicked CTA; `"ranking_direct"` if they landed directly on `/ranking` or used Skip |
| `browser_language` | string | `"fr-FR"`, `"en-US"`, `"es-CO"` | On first page load | `navigator.language` — reveals international audience composition |

---

## 2. Pageview Events

Fire once per route change. Use Next.js router events (`usePathname` + `useEffect`) as the trigger, not `useEffect` on mount alone — this ensures correct firing on client-side navigation.

---

### `page_viewed`

**Description:** User navigated to a named page.

**Trigger:** On route change completion (`router.events` or `pathname` change resolves).

| Property | Type | Example | Notes |
|---|---|---|---|
| `page_name` | string | `"landing"`, `"onboarding"`, `"ranking"`, `"country_detail"`, `"methodology"` | Canonical name; not the URL path |
| `page_path` | string | `"/"`, `"/ranking"`, `"/country/germany"` | Actual `window.location.pathname` |
| `referrer_page` | string | `"landing"`, `"onboarding"`, `""` | Previous `page_name` in this session; empty on first load |
| `country_slug` | string | `"germany"`, `null` | Set only when `page_name === "country_detail"` |
| `session_elapsed_ms` | number | `12400` | ms since session start — helps identify fast/confused navigation |

---

## 3. Onboarding Flow Events

The onboarding is 6 questions. Each question is identified by a stable `question_id` (see table below). Questions can be skipped individually. The entire flow can be abandoned.

**Question ID Reference:**

| `question_id` | `question_label` | Input type |
|---|---|---|
| `household` | Household composition | Select |
| `income_level` | Monthly disposable income | Select |
| `civic_importance` | How much does rule of law matter? | Slider / Select |
| `warmth_importance` | How important is social warmth? | Slider / Select |
| `climate_preference` | Climate preference | Select |
| `religious_needs` | Religious practice importance | Select |

---

### `onboarding_question_viewed`

**Description:** A specific onboarding question became visible to the user.

**Trigger:** When the question card/screen animates into view (intersection observer or step index change).

| Property | Type | Example | Notes |
|---|---|---|---|
| `question_id` | string | `"household"` | Stable ID from the table above |
| `question_label` | string | `"Household composition"` | Human-readable label |
| `question_index` | number | `0` | 0-based position in the sequence |
| `questions_total` | number | `6` | Always 6 in V1 — useful when/if count changes |

---

### `onboarding_answer_selected`

**Description:** User selected or changed an answer to a specific question.

**Trigger:** On answer selection (option click, slider release, or select change). Fire on every change, not just the final one — tracks deliberation.

| Property | Type | Example | Notes |
|---|---|---|---|
| `question_id` | string | `"climate_preference"` | |
| `question_label` | string | `"Climate preference"` | |
| `question_index` | number | `4` | |
| `answer_value` | string | `"warm_year_round"`, `"four_seasons"`, `"mild_temperate"` | Normalised slug of the selected option |
| `answer_label` | string | `"Warm year-round"` | Display text |
| `is_change` | boolean | `true` | `true` if user already had an answer for this question and changed it |

---

### `onboarding_question_skipped`

**Description:** User explicitly skipped a question (clicked Skip, not just left it blank).

**Trigger:** On Skip button click.

| Property | Type | Example | Notes |
|---|---|---|---|
| `question_id` | string | `"religious_needs"` | |
| `question_label` | string | `"Religious practice importance"` | |
| `question_index` | number | `5` | |
| `had_answer_before_skip` | boolean | `false` | Whether the user had previously answered this question before skipping |

---

### `onboarding_completed`

**Description:** User finished the onboarding questionnaire and reached the weight summary screen.

**Trigger:** On arrival at the weight summary screen (after question 6 or after the last unskipped question is confirmed).

| Property | Type | Example | Notes |
|---|---|---|---|
| `questions_answered` | number | `5` | Count of questions with a non-null answer |
| `questions_skipped` | number | `1` | Count of explicitly skipped questions |
| `skipped_question_ids` | string[] | `["religious_needs"]` | Which questions were skipped |
| `time_to_complete_ms` | number | `47200` | ms from first question viewed to this event |
| `household_answer` | string | `"couple_no_kids"`, `null` | Null if skipped — enables segmentation of ranking by household |
| `income_answer` | string | `"3000_5000_usd"`, `null` | |
| `climate_answer` | string | `"mild_temperate"`, `null` | |
| `religious_needs_answer` | string | `"not_important"`, `null` | |

---

### `onboarding_abandoned`

**Description:** User left the onboarding flow before completing it.

**Trigger:** On navigation away from `/onboarding` while `onboarding_completed` has NOT yet fired this session. Use `beforeunload` + route change detection.

| Property | Type | Example | Notes |
|---|---|---|---|
| `last_question_viewed` | string | `"warmth_importance"` | `question_id` of the last question seen |
| `last_question_index` | number | `3` | 0-based index |
| `questions_answered` | number | `2` | Non-null answers at time of abandonment |
| `time_in_flow_ms` | number | `23100` | ms from first question viewed to abandonment |
| `exit_destination` | string | `"ranking"`, `"landing"`, `"external"`, `"tab_closed"` | Where the user went |

---

### `weight_summary_cta_clicked`

**Description:** User clicked a CTA on the weight summary screen.

**Trigger:** On button click on the weight summary screen.

| Property | Type | Example | Notes |
|---|---|---|---|
| `cta_label` | string | `"see_my_ranking"`, `"adjust_weights_first"` | Slug of the button clicked |
| `time_on_summary_ms` | number | `8400` | ms spent on the summary screen before clicking |

---

## 4. Ranking Interaction Events

---

### `slider_changed`

**Description:** User moved a dimension weight slider and released it.

**Trigger:** On slider `mouseup` / `touchend` / `keyup` — NOT on every `mousemove`. Debounce to avoid flooding: wait 300ms after last movement before firing.

| Property | Type | Example | Notes |
|---|---|---|---|
| `dimension` | string | `"civic_culture"` | One of the 10 dimension keys |
| `old_value` | number | `50` | Slider value before this interaction (0–100) |
| `new_value` | number | `80` | Slider value after release |
| `delta` | number | `30` | `new_value - old_value`; positive = up, negative = down |
| `slider_index` | number | `1` | 0-based position in the slider list |
| `sliders_at_zero` | number | `2` | Count of dimensions currently set to 0 (dimension excluded) |
| `session_slider_adjustments` | number | `7` | Running count of slider changes this session |

---

### `region_filter_changed`

**Description:** User switched the region filter tab on the ranking page.

**Trigger:** On filter tab click.

| Property | Type | Example | Notes |
|---|---|---|---|
| `previous_region` | string | `"all"` | Previous active filter |
| `new_region` | string | `"europe"` | One of: `"all"`, `"europe"`, `"asia_pacific"`, `"americas"`, `"middle_east"` |
| `visible_country_count` | number | `15` | Countries visible after applying the new filter |

---

### `weights_reset`

**Description:** User clicked "Reset weights" to restore defaults.

**Trigger:** On reset button click.

| Property | Type | Example | Notes |
|---|---|---|---|
| `sliders_modified_count` | number | `4` | How many sliders had been changed from default before reset |
| `session_slider_adjustments_before_reset` | number | `12` | Total slider adjustments before this reset |

---

## 5. Country Exploration Events

---

### `country_clicked`

**Description:** User clicked a country row in the ranking list.

**Trigger:** On click/tap of a country row that navigates to the detail page.

| Property | Type | Example | Notes |
|---|---|---|---|
| `country_name` | string | `"Germany"` | Display name |
| `country_code` | string | `"DEU"` | ISO 3166-1 alpha-3 |
| `rank_position` | number | `3` | Country's position in the current ranked list (1-based) |
| `composite_score` | number | `74.2` | Composite score at time of click (1 decimal) |
| `active_region_filter` | string | `"europe"` | Which region filter was active |
| `countries_viewed_before` | number | `1` | How many country detail pages already visited this session |
| `session_elapsed_ms` | number | `95000` | Time since session start |

---

### `country_detail_viewed`

**Description:** Country detail page fully loaded and visible to the user.

**Trigger:** On page mount of `/country/[slug]`. Distinct from `country_clicked` — fires even on direct URL navigation.

| Property | Type | Example | Notes |
|---|---|---|---|
| `country_name` | string | `"Germany"` | |
| `country_code` | string | `"DEU"` | |
| `rank_position` | number | `3` | Rank at time of view; `null` if arrived via direct URL |
| `composite_score` | number | `74.2` | Score at time of view; `null` if direct URL |
| `has_limited_data_flag` | boolean | `false` | Whether the country has >3 NULL dimensions |
| `null_dimension_count` | number | `1` | How many dimensions have NULL data |
| `entry_method` | string | `"ranking_list"`, `"direct_url"`, `"back_navigation"` | How user arrived |

---

### `country_detail_time_spent`

**Description:** User left the country detail page. Captures dwell time.

**Trigger:** On route change away from `/country/[slug]`, or on `beforeunload`.

| Property | Type | Example | Notes |
|---|---|---|---|
| `country_name` | string | `"Germany"` | |
| `country_code` | string | `"DEU"` | |
| `time_on_page_ms` | number | `42000` | ms from `country_detail_viewed` to this event |
| `exit_destination` | string | `"ranking"`, `"another_country"`, `"external"`, `"tab_closed"` | Where user went |

---

## 6. Methodology Events

---

### `methodology_viewed`

**Description:** User viewed the methodology page.

**Trigger:** On page mount of `/methodology`.

| Property | Type | Example | Notes |
|---|---|---|---|
| `entry_method` | string | `"footer_link"`, `"direct_url"`, `"country_detail_link"` | How user arrived |
| `countries_explored_before` | number | `3` | Country detail pages viewed before visiting methodology |
| `onboarding_completed` | boolean | `true` | Whether user completed onboarding this session |

---

### `csv_downloaded`

**Description:** User downloaded the country scores CSV file.

**Trigger:** On download link click / anchor click for the CSV file.

| Property | Type | Example | Notes |
|---|---|---|---|
| `file_name` | string | `"relocator_scores_v1.csv"` | Actual filename |
| `time_on_methodology_ms` | number | `28000` | ms spent on the methodology page before downloading |

---

## 7. Engagement Computed Events

These are not raw event fires — they are derived metrics. Compute them at the end of key user moments using session-accumulated state, or compute them in Amplitude via user properties updated incrementally.

### Strategy: use `amplitude.setUserProperties()` with increment operations

```typescript
// After each country detail visit:
amplitude.identify(new amplitude.Identify()
  .add('countries_explored_count', 1)
);

// After each slider change:
amplitude.identify(new amplitude.Identify()
  .add('sliders_adjusted_count', 1)
);
```

| Metric | How to capture | Amplitude property name |
|---|---|---|
| Countries explored this session | Increment on each `country_detail_viewed` | `countries_explored_count` |
| Sliders adjusted this session | Increment on each `slider_changed` | `sliders_adjusted_count` |
| Session duration | Fire `session_ended` on `beforeunload` with `session_elapsed_ms` | Use `session_elapsed_ms` property on `session_ended` |

---

### `session_ended`

**Description:** Session is ending (tab close, navigation away from domain).

**Trigger:** `window.addEventListener('beforeunload', ...)` + `visibilitychange` to `hidden`.

| Property | Type | Example | Notes |
|---|---|---|---|
| `session_duration_ms` | number | `187000` | ms from first event to now |
| `pages_visited` | string[] | `["landing", "onboarding", "ranking", "country_detail"]` | Ordered list of unique pages |
| `countries_explored_count` | number | `4` | Country detail pages viewed |
| `sliders_adjusted_count` | number | `9` | Total slider adjustments |
| `onboarding_completed` | boolean | `true` | |
| `reached_ranking` | boolean | `true` | Whether user ever saw the ranking page |
| `last_page` | string | `"country_detail"` | Last page visited |

---

## 8. Funnel Definitions

Define these as saved funnels in Amplitude.

---

### Funnel 1: Onboarding Completion

Track the drop-off at each step.

```
Step 1 → page_viewed [page_name = "landing"]
Step 2 → onboarding_question_viewed [question_index = 0]
Step 3 → onboarding_question_viewed [question_index = 5]
Step 4 → onboarding_completed
Step 5 → page_viewed [page_name = "ranking"]
```

**Key question:** Where do users drop out — before question 1, mid-flow, or at the weight summary?

---

### Funnel 2: Landing → Ranking Conversion

Captures both paths (onboarding and skip-to-ranking).

```
Step 1 → page_viewed [page_name = "landing"]
Step 2 → page_viewed [page_name = "ranking"]
```

**Segment by:** `entry_point` user property to compare onboarding-path vs. direct-to-ranking conversion quality (countries explored, sliders adjusted).

---

### Funnel 3: Ranking → Country Exploration

```
Step 1 → page_viewed [page_name = "ranking"]
Step 2 → country_clicked
Step 3 → country_detail_viewed
```

**Key question:** Do users click through to details, or do they stop at the ranked list?

---

### Funnel 4: Session Depth

```
Step 1 → page_viewed [page_name = "landing"]
Step 2 → page_viewed [page_name = "ranking"]
Step 3 → country_detail_viewed [countries_explored_before = 0]   (first country)
Step 4 → country_detail_viewed [countries_explored_before = 2]   (third country)
```

**Key question:** How many users go deep (3+ countries) vs. bounce after one?

---

## 9. Key Metrics Dashboard

Recommended Amplitude charts. Create as a saved dashboard named **"Relocator V1 Core"**.

---

### Chart 1: Onboarding Completion Rate (Funnel)
- **Type:** Funnel
- **Events:** Funnel 1 above
- **Segment by:** `device_type`
- **Goal:** Identify the biggest drop-off step and its device distribution

---

### Chart 2: Landing → Ranking Conversion Rate (Daily)
- **Type:** Conversion over time
- **Events:** Funnel 2 above
- **Time:** Rolling 30 days
- **Goal:** Measure product activation rate; baseline for A/B tests

---

### Chart 3: Average Countries Explored Per Session
- **Type:** User property average
- **Property:** `countries_explored_count` from `session_ended`
- **Goal:** Depth-of-engagement proxy; target >2 at launch

---

### Chart 4: Most Adjusted Dimensions (Bar)
- **Type:** Event segmentation → count of `slider_changed` grouped by `dimension`
- **Goal:** Reveals what users actually care about; validates dimension priority against design assumptions

---

### Chart 5: Top Countries by Detail Views (Bar)
- **Type:** Event segmentation → count of `country_detail_viewed` grouped by `country_name`
- **Time:** Rolling 7 days
- **Goal:** Content interest signal; useful for future marketing and copy prioritisation

---

### Chart 6: Onboarding Question Skip Rate (Bar)
- **Type:** Event segmentation → count of `onboarding_question_skipped` grouped by `question_id`, normalized by `onboarding_question_viewed`
- **Goal:** Identifies unclear or high-friction questions; input for copy iteration

---

### Chart 7: Slider Activity Distribution
- **Type:** Histogram or box plot on `sliders_adjusted_count` from `session_ended`
- **Goal:** Understand whether users are one-tap rankers or active explorers; segment by `onboarding_completed`

---

### Chart 8: Entry Point Split
- **Type:** User composition (pie or bar)
- **Property:** `entry_point` user property
- **Goal:** What share of users use onboarding vs. skip — and does it change with campaigns?

---

## 10. Implementation Notes

### Initialisation (Next.js App Router)

Place Amplitude init in `/src/app/layout.tsx` or a `providers.tsx` client component. Fire user properties immediately after init.

```typescript
// /src/lib/analytics.ts
import * as amplitude from '@amplitude/analytics-browser';

export function initAmplitude() {
  amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY!, {
    defaultTracking: false, // disable autocapture — we track manually
    sessionTimeout: 30 * 60 * 1000, // 30-minute inactivity timeout
  });

  const identify = new amplitude.Identify();
  identify.setOnce('device_type', getDeviceType());
  identify.setOnce('referrer_domain', getReferrerDomain());
  identify.setOnce('referrer_raw', document.referrer || '');
  identify.setOnce('utm_source', getUtmParam('utm_source'));
  identify.setOnce('utm_medium', getUtmParam('utm_medium'));
  identify.setOnce('utm_campaign', getUtmParam('utm_campaign'));
  identify.setOnce('browser_language', navigator.language);
  amplitude.identify(identify);
}
```

Use `setOnce` for all session-level user properties so they are not overwritten if the user navigates back to the landing page.

### pageview tracking hook

```typescript
// /src/hooks/usePageTracking.ts
'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import * as amplitude from '@amplitude/analytics-browser';

const PAGE_NAMES: Record<string, string> = {
  '/': 'landing',
  '/onboarding': 'onboarding',
  '/ranking': 'ranking',
  '/methodology': 'methodology',
};

function getPageName(path: string): string {
  if (path.startsWith('/country/')) return 'country_detail';
  return PAGE_NAMES[path] ?? 'unknown';
}

export function usePageTracking() {
  const pathname = usePathname();
  const previousPage = useRef<string>('');

  useEffect(() => {
    const pageName = getPageName(pathname);
    amplitude.track('page_viewed', {
      page_name: pageName,
      page_path: pathname,
      referrer_page: previousPage.current,
      country_slug: pathname.startsWith('/country/') ? pathname.split('/')[2] : null,
      session_elapsed_ms: Date.now() - (window.__sessionStart ?? Date.now()),
    });
    previousPage.current = pageName;
  }, [pathname]);
}
```

### Event naming checklist

- All event names: `snake_case`, verb-noun pattern (`slider_changed`, not `sliderChange` or `SliderChanged`)
- All property names: `snake_case`
- Boolean property values: `true` / `false`, never `"yes"` / `"no"`
- Null-valued properties: pass `null` explicitly rather than omitting the key — Amplitude treats missing and null differently in filters
- Dimension identifiers: always use the canonical key from the 10-dimension list (e.g. `"civic_culture"`, not `"Civic Culture"` or `"civic"`)
- Country identifiers: always send both `country_name` (display) and `country_code` (ISO alpha-3) together

### Environment variable

```bash
NEXT_PUBLIC_AMPLITUDE_API_KEY=your_key_here
```

Add to `.env.local` and to Vercel project environment variables.

### What NOT to track

- Mouse movements, hover events, or scroll depth — not actionable for this product
- Slider `mousemove` / every keystroke — too noisy; use debounced `mouseup`
- PII: household or income answers contain no PII but treat them as sensitive; never log them to the console in production
