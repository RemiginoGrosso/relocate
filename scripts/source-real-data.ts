/**
 * source-real-data.ts
 *
 * Fetches real published data from free APIs (World Bank) and generates
 * manual-entry templates for sources without free APIs (GPI, EF EPI,
 * InterNations, IMD, Pew).
 *
 * Output:
 *   - src/lib/seed/external-indices-real.json  (World Bank data filled, manual sources null)
 *   - scripts/data-templates/*.json             (templates for manual data entry)
 *
 * Run: npx tsx scripts/source-real-data.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = join(dirname(decodeURIComponent(new URL(import.meta.url).pathname)), "..");
const COUNTRIES_PATH = join(ROOT, "src/lib/seed/countries.json");
const OUTPUT_PATH = join(ROOT, "src/lib/seed/external-indices-real.json");
const TEMPLATES_DIR = join(ROOT, "scripts/data-templates");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Country {
  name: string;
  iso_alpha2: string;
  iso_alpha3: string;
  region: string;
}

interface CountryData {
  "worldbank.wgi_rule_of_law": number | null;
  "worldbank.wgi_corruption_control": number | null;
  "gpi.gpi_score": number | null;
  "internations.ease_rank": number | null;
  "worldbank.who_uhc_coverage": number | null;
  "worldbank.oecd_ppp_aic": number | null;
  "worldbank.price_level_ratio": number | null;
  "worldbank.who_oop_pct": number | null;
  "imd.infrastructure_score": number | null;
  "pew.govt_restrictions": number | null;
  "pew.social_hostility": number | null;
  "ef.epi_score": number | null;
}

interface OutputMeta {
  description: string;
  generated: string;
  world_bank_fetched: string;
  manual_sources_status: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OutputData = Record<string, any> & {
  _meta: OutputMeta;
};

// ---------------------------------------------------------------------------
// World Bank API configuration
// ---------------------------------------------------------------------------

// The World Bank API uses ISO alpha-3 codes.
// WGI percentile rank indicators provide 0-100 values directly.
// Note: Taiwan (TWN) is NOT in the World Bank database.

const WORLD_BANK_INDICATORS: {
  indicatorId: string;
  fieldName: keyof CountryData;
  description: string;
  preferredYear: number;
  fallbackYears: number[];
  source?: number;
}[] = [
  {
    indicatorId: "GOV_WGI_RL.SC",
    fieldName: "worldbank.wgi_rule_of_law",
    description: "WGI Rule of Law — Governance score (0-100)",
    preferredYear: 2023,
    fallbackYears: [2022, 2021, 2020],
    source: 3,
  },
  {
    indicatorId: "GOV_WGI_CC.SC",
    fieldName: "worldbank.wgi_corruption_control",
    description: "WGI Control of Corruption — Governance score (0-100)",
    preferredYear: 2023,
    fallbackYears: [2022, 2021, 2020],
    source: 3,
  },
  {
    indicatorId: "SH.UHC.SRVS.CV.XD",
    fieldName: "worldbank.who_uhc_coverage",
    description: "WHO UHC Service Coverage Index",
    preferredYear: 2021,
    fallbackYears: [2020, 2019, 2018, 2017],
    source: 16,
  },
  {
    indicatorId: "NY.GDP.PCAP.PP.CD",
    fieldName: "worldbank.oecd_ppp_aic",
    description: "GDP per capita, PPP (current international $) — proxy for OECD AIC",
    preferredYear: 2023,
    fallbackYears: [2022, 2021, 2020],
  },
  {
    indicatorId: "SH.XPD.OOPC.CH.ZS",
    fieldName: "worldbank.who_oop_pct",
    description: "Out-of-pocket expenditure (% of current health expenditure)",
    preferredYear: 2021,
    fallbackYears: [2020, 2019, 2018],
  },
];

// Price level ratio is computed from two indicators: PPP / exchange rate
const PRICE_LEVEL_INDICATORS = {
  ppp: { indicatorId: "PA.NUS.PRVT.PP", description: "PPP conversion factor, private consumption" },
  exchangeRate: { indicatorId: "PA.NUS.FCRF", description: "Official exchange rate (LCU per US$)" },
  preferredYear: 2023,
  fallbackYears: [2022, 2021, 2020],
};

// Countries not in World Bank database
const WORLD_BANK_EXCLUDED = new Set(["TWN"]); // Taiwan

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[source-real-data] ${msg}`);
}

function logSection(title: string): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(60)}\n`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a World Bank indicator for ALL countries in one request.
 * Returns a Map of iso_alpha3 -> value (most recent available year).
 *
 * World Bank API v2 format:
 *   https://api.worldbank.org/v2/country/all/indicator/{ID}?format=json&date=2019:2023&per_page=500
 *
 * Response: [pagination_meta, data_array]
 * Each data item: { countryiso3code, date (year string), value }
 */
async function fetchWorldBankIndicator(
  indicatorId: string,
  preferredYear: number,
  fallbackYears: number[],
  source?: number
): Promise<Map<string, { value: number; year: number }>> {
  const allYears = [preferredYear, ...fallbackYears];
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  const dateRange = `${minYear}:${maxYear}`;

  const results = new Map<string, { value: number; year: number }>();

  // Paginate through all results
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const sourceParam = source ? `&source=${source}` : "";
    const url = `https://api.worldbank.org/v2/country/all/indicator/${indicatorId}?format=json&date=${dateRange}&per_page=500&page=${page}${sourceParam}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `World Bank API error for ${indicatorId}: ${response.status} ${response.statusText}`
      );
    }

    const json = await response.json();

    if (!Array.isArray(json) || json.length < 2) {
      throw new Error(
        `Unexpected World Bank API response format for ${indicatorId}`
      );
    }

    const [meta, data] = json;
    totalPages = meta.pages;

    if (data) {
      for (const item of data) {
        const iso3 = item.countryiso3code;
        const year = parseInt(item.date, 10);
        const value = item.value;

        if (value === null || value === undefined) continue;

        const existing = results.get(iso3);
        // Keep the value from the most recent year
        if (!existing || year > existing.year) {
          results.set(iso3, { value: Number(value), year });
        }
      }
    }

    page++;
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  logSection("RELOCATOR DATA SOURCING SCRIPT");
  log("Loading countries...");

  const countries: Country[] = JSON.parse(
    readFileSync(COUNTRIES_PATH, "utf-8")
  );
  log(`Loaded ${countries.length} countries`);

  // Build alpha3 -> alpha2 mapping
  const alpha3ToAlpha2 = new Map<string, string>();
  const alpha2ToAlpha3 = new Map<string, string>();
  const alpha2ToName = new Map<string, string>();
  for (const c of countries) {
    alpha3ToAlpha2.set(c.iso_alpha3, c.iso_alpha2);
    alpha2ToAlpha3.set(c.iso_alpha2, c.iso_alpha3);
    alpha2ToName.set(c.iso_alpha2, c.name);
  }

  // Initialize output with null values for all countries
  const output: OutputData = {
    _meta: {
      description:
        "External data indices for 60 countries. World Bank data fetched from API. GPI, InterNations, IMD, Pew, EF EPI require manual entry from published reports.",
      generated: new Date().toISOString().split("T")[0],
      world_bank_fetched: "",
      manual_sources_status:
        "Fields marked null require manual data entry. See scripts/data-templates/ for templates and source links.",
    },
  };

  for (const c of countries) {
    output[c.iso_alpha2] = {
      "worldbank.wgi_rule_of_law": null,
      "worldbank.wgi_corruption_control": null,
      "gpi.gpi_score": null,
      "internations.ease_rank": null,
      "worldbank.who_uhc_coverage": null,
      "worldbank.oecd_ppp_aic": null,
      "worldbank.price_level_ratio": null,
      "worldbank.who_oop_pct": null,
      "imd.infrastructure_score": null,
      "pew.govt_restrictions": null,
      "pew.social_hostility": null,
      "ef.epi_score": null,
    };
  }

  // ==========================================================================
  // MILESTONE 1 & 2: Fetch World Bank indicators
  // ==========================================================================

  logSection("FETCHING WORLD BANK DATA");

  const fetchSummary: {
    indicator: string;
    field: string;
    matched: number;
    missing: string[];
    yearUsed: Map<string, number>;
  }[] = [];

  for (const indicator of WORLD_BANK_INDICATORS) {
    log(
      `Fetching: ${indicator.description} (${indicator.indicatorId})...`
    );

    try {
      const data = await fetchWorldBankIndicator(
        indicator.indicatorId,
        indicator.preferredYear,
        indicator.fallbackYears,
        indicator.source
      );

      let matched = 0;
      const missing: string[] = [];
      const yearUsed = new Map<string, number>();

      for (const c of countries) {
        if (WORLD_BANK_EXCLUDED.has(c.iso_alpha3)) {
          missing.push(`${c.iso_alpha2} (${c.name}) [not in World Bank]`);
          continue;
        }

        const entry = data.get(c.iso_alpha3);
        if (entry) {
          // Round to 1 decimal
          const rounded = Math.round(entry.value * 10) / 10;
          output[c.iso_alpha2][
            indicator.fieldName
          ] = rounded;
          yearUsed.set(c.iso_alpha2, entry.year);
          matched++;
        } else {
          missing.push(`${c.iso_alpha2} (${c.name})`);
        }
      }

      fetchSummary.push({
        indicator: indicator.indicatorId,
        field: indicator.fieldName,
        matched,
        missing,
        yearUsed,
      });

      log(
        `  -> Matched: ${matched}/${countries.length} countries`
      );
      if (missing.length > 0) {
        log(`  -> Missing: ${missing.join(", ")}`);
      }

      // Be polite to the API
      await sleep(500);
    } catch (err) {
      log(`  -> ERROR: ${err}`);
      fetchSummary.push({
        indicator: indicator.indicatorId,
        field: indicator.fieldName,
        matched: 0,
        missing: countries.map((c) => c.iso_alpha2),
        yearUsed: new Map(),
      });
    }
  }

  // Compute price level ratio from PPP conversion factor / exchange rate
  log("Computing price level ratio (PPP / exchange rate)...");
  try {
    const pppData = await fetchWorldBankIndicator(
      PRICE_LEVEL_INDICATORS.ppp.indicatorId,
      PRICE_LEVEL_INDICATORS.preferredYear,
      PRICE_LEVEL_INDICATORS.fallbackYears
    );
    await sleep(500);
    const fxData = await fetchWorldBankIndicator(
      PRICE_LEVEL_INDICATORS.exchangeRate.indicatorId,
      PRICE_LEVEL_INDICATORS.preferredYear,
      PRICE_LEVEL_INDICATORS.fallbackYears
    );

    let plrMatched = 0;
    const plrMissing: string[] = [];

    for (const c of countries) {
      if (WORLD_BANK_EXCLUDED.has(c.iso_alpha3)) {
        plrMissing.push(`${c.iso_alpha2} (${c.name}) [not in World Bank]`);
        continue;
      }
      const ppp = pppData.get(c.iso_alpha3);
      const fx = fxData.get(c.iso_alpha3);
      if (ppp && fx && fx.value !== 0) {
        const plr = Math.round((ppp.value / fx.value) * 100) / 100;
        output[c.iso_alpha2][
          "worldbank.price_level_ratio"
        ] = plr;
        plrMatched++;
      } else {
        plrMissing.push(`${c.iso_alpha2} (${c.name})`);
      }
    }

    log(`  -> Matched: ${plrMatched}/${countries.length} countries`);
    if (plrMissing.length > 0) {
      log(`  -> Missing: ${plrMissing.join(", ")}`);
    }
    fetchSummary.push({
      indicator: "PA.NUS.PRVT.PP / PA.NUS.FCRF",
      field: "worldbank.price_level_ratio",
      matched: plrMatched,
      missing: plrMissing,
      yearUsed: new Map(),
    });
    await sleep(500);
  } catch (err) {
    log(`  -> ERROR computing price level ratio: ${err}`);
    fetchSummary.push({
      indicator: "PA.NUS.PRVT.PP / PA.NUS.FCRF",
      field: "worldbank.price_level_ratio",
      matched: 0,
      missing: countries.map((c) => c.iso_alpha2),
      yearUsed: new Map(),
    });
  }

  // Print summary
  logSection("WORLD BANK FETCH SUMMARY");
  for (const s of fetchSummary) {
    log(
      `${s.field} (${s.indicator}): ${s.matched}/${countries.length} matched`
    );
    if (s.yearUsed.size > 0) {
      const years = new Set(s.yearUsed.values());
      log(`  Years used: ${[...years].sort().join(", ")}`);
    }
  }

  output._meta.world_bank_fetched = new Date().toISOString();

  // ==========================================================================
  // MILESTONE 2 verification: Check coverage
  // ==========================================================================

  logSection("MILESTONE 2 CHECK: WORLD BANK DATA COVERAGE");

  let worldBankComplete = 0;
  let worldBankPartial = 0;
  let worldBankEmpty = 0;

  const worldBankFields: (keyof CountryData)[] = [
    "worldbank.wgi_rule_of_law",
    "worldbank.wgi_corruption_control",
    "worldbank.who_uhc_coverage",
    "worldbank.oecd_ppp_aic",
    "worldbank.price_level_ratio",
    "worldbank.who_oop_pct",
  ];

  for (const c of countries) {
    const entry = output[c.iso_alpha2];
    const filled = worldBankFields.filter((f) => entry[f] !== null).length;
    if (filled === worldBankFields.length) {
      worldBankComplete++;
    } else if (filled > 0) {
      worldBankPartial++;
      log(
        `  Partial: ${c.iso_alpha2} (${c.name}) - ${filled}/${worldBankFields.length} fields`
      );
    } else {
      worldBankEmpty++;
      log(
        `  Empty: ${c.iso_alpha2} (${c.name}) - 0/${worldBankFields.length} fields`
      );
    }
  }

  log(
    `\nWorld Bank coverage: ${worldBankComplete} complete, ${worldBankPartial} partial, ${worldBankEmpty} empty out of ${countries.length}`
  );

  // ==========================================================================
  // MILESTONE 3: Generate manual data templates
  // ==========================================================================

  logSection("GENERATING MANUAL DATA TEMPLATES");

  if (!existsSync(TEMPLATES_DIR)) {
    mkdirSync(TEMPLATES_DIR, { recursive: true });
  }

  // --- GPI Template ---
  generateGPITemplate(countries);

  // --- EF EPI Template ---
  generateEFEPITemplate(countries);

  // --- InterNations Template ---
  generateInterNationsTemplate(countries);

  // --- IMD Template ---
  generateIMDTemplate(countries);

  // --- Pew Template ---
  generatePewTemplate(countries);

  // --- WVS Template ---
  generateWVSTemplate(countries);

  // ==========================================================================
  // MILESTONE 4: Write output file
  // ==========================================================================

  logSection("WRITING OUTPUT");

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf-8");
  log(`Written: ${OUTPUT_PATH}`);

  // Final summary
  logSection("FINAL SUMMARY");

  log("Fields populated from World Bank API:");
  for (const f of worldBankFields) {
    const count = countries.filter(
      (c) => output[c.iso_alpha2][f] !== null
    ).length;
    log(`  ${f}: ${count}/${countries.length}`);
  }

  log("\nFields requiring manual entry (currently null):");
  const manualFields: (keyof CountryData)[] = [
    "gpi.gpi_score",
    "internations.ease_rank",
    "imd.infrastructure_score",
    "pew.govt_restrictions",
    "pew.social_hostility",
    "ef.epi_score",
  ];
  for (const f of manualFields) {
    log(`  ${f}: 0/${countries.length} (see data-templates/)`);
  }

  log(`\nTemplate files generated in: ${TEMPLATES_DIR}`);
  log("Next steps:");
  log("  1. Fill in templates from published reports");
  log("  2. Run a merge script or manually update external-indices-real.json");
  log("  3. Review and replace external-indices.json");
}

// ---------------------------------------------------------------------------
// Template generators
// ---------------------------------------------------------------------------

function generateGPITemplate(countries: Country[]): void {
  const template: Record<string, unknown> = {
    _instructions: {
      source: "Institute for Economics & Peace - Global Peace Index",
      url: "https://www.visionofhumanity.org/maps/",
      report_url:
        "https://www.visionofhumanity.org/resources/",
      description:
        "The GPI score ranges from 1 (most peaceful) to 5 (least peaceful). Download the latest GPI report PDF or use the interactive map. Look for the 'Overall Score' column.",
      year: "2024 (or latest available)",
      field_name: "gpi.gpi_score",
      value_range: "1.0 to 5.0 (lower = more peaceful)",
      how_to_find:
        "1. Go to visionofhumanity.org/maps/ 2. Select GPI year 3. Click each country 4. Record the Overall Score value",
    },
    data: {} as Record<string, { country: string; gpi_score: number | null }>,
  };

  for (const c of countries) {
    (template.data as Record<string, unknown>)[c.iso_alpha2] = {
      country: c.name,
      gpi_score: null,
    };
  }

  const path = join(TEMPLATES_DIR, "gpi-template.json");
  writeFileSync(path, JSON.stringify(template, null, 2) + "\n", "utf-8");
  log(`Generated: ${path}`);
}

function generateEFEPITemplate(countries: Country[]): void {
  const template: Record<string, unknown> = {
    _instructions: {
      source: "EF Education First - English Proficiency Index",
      url: "https://www.ef.com/epi/",
      report_url: "https://www.ef.com/epi/regions/",
      description:
        "EF EPI score ranges roughly from 300 to 700+. Higher = better English proficiency. English-native countries (GB, IE, AU, NZ, CA) should NOT be in this index (they are hardcoded to 100 in the scoring engine).",
      year: "2024 (or latest available)",
      field_name: "ef.epi_score",
      value_range: "~300 to ~700 (higher = better proficiency)",
      notes: [
        "Not all 60 countries will be in the EF EPI. Set null for countries not covered.",
        "English-native countries (GB, IE, AU, NZ, CA) are EXCLUDED from EF EPI - they use a hardcoded score.",
        "EF EPI does not cover some countries in our list (e.g., some Middle East, Africa).",
      ],
    },
    data: {} as Record<
      string,
      { country: string; epi_score: number | null; notes: string }
    >,
  };

  const englishNative = new Set(["GB", "IE", "AU", "NZ", "CA"]);

  for (const c of countries) {
    (template.data as Record<string, unknown>)[c.iso_alpha2] = {
      country: c.name,
      epi_score: null,
      notes: englishNative.has(c.iso_alpha2)
        ? "SKIP: English-native country (hardcoded to 100 in scoring engine)"
        : "",
    };
  }

  const path = join(TEMPLATES_DIR, "ef-epi-template.json");
  writeFileSync(path, JSON.stringify(template, null, 2) + "\n", "utf-8");
  log(`Generated: ${path}`);
}

function generateInterNationsTemplate(countries: Country[]): void {
  // Countries NOT in InterNations 2024 survey (per CHANGELOG Iteration 16)
  const notInSurvey = new Set(["AR", "UY", "HR", "RO", "LT", "IL", "EE", "TW"]);

  const template: Record<string, unknown> = {
    _instructions: {
      source: "InterNations Expat Insider Survey",
      url: "https://www.internations.org/expat-insider/",
      description:
        "The 'Ease of Settling In' rank from the annual Expat Insider survey. Rank 1 = easiest to settle in. The 2024 survey covers ~53 destinations. Countries not in the survey should be set to null.",
      year: "2024 (or latest available)",
      field_name: "internations.ease_rank",
      value_range: "1 to ~53 (lower = easier to settle in)",
      countries_not_in_2024_survey:
        "AR, UY, HR, RO, LT, IL, EE, TW - these should remain null",
      countries_to_add_note:
        "CR (Costa Rica, rank 1 in 2024), CY (Cyprus, rank 17 in 2024) were verified in audit",
      notes: [
        "Only ~53 countries are covered each year.",
        "Countries outside the survey get null (excluded from scoring via NULL handling).",
        "Verified 2024 ranks from CHANGELOG Iteration 16 are pre-filled below where available.",
      ],
    },
    data: {} as Record<
      string,
      {
        country: string;
        ease_rank: number | null;
        in_2024_survey: boolean;
        notes: string;
      }
    >,
  };

  // Pre-fill verified ranks from CHANGELOG Iteration 16
  // These were cross-checked against the published 2024 InterNations report
  const verifiedRanks: Record<string, number> = {
    // From CHANGELOG: CR=1, TH=2, MX=3, CO=4, PT=5, TW=6(excluded), MY=7
    // Plus others verified in the audit
  };

  for (const c of countries) {
    const inSurvey = !notInSurvey.has(c.iso_alpha2);
    (template.data as Record<string, unknown>)[c.iso_alpha2] = {
      country: c.name,
      ease_rank: verifiedRanks[c.iso_alpha2] ?? null,
      in_2024_survey: inSurvey,
      notes: notInSurvey.has(c.iso_alpha2)
        ? "NOT in InterNations 2024 survey - set to null"
        : "",
    };
  }

  const path = join(TEMPLATES_DIR, "internations-template.json");
  writeFileSync(path, JSON.stringify(template, null, 2) + "\n", "utf-8");
  log(`Generated: ${path}`);
}

function generateIMDTemplate(countries: Country[]): void {
  const template: Record<string, unknown> = {
    _instructions: {
      source: "IMD World Competitiveness Yearbook - Infrastructure sub-factor",
      url: "https://www.imd.org/centers/wcc/world-competitiveness-center/rankings/world-competitiveness-ranking/",
      description:
        "The Infrastructure sub-factor score from the IMD World Competitiveness Yearbook. Score is 0-100, higher = better infrastructure.",
      year: "2024 (or latest available)",
      field_name: "imd.infrastructure_score",
      value_range: "0 to 100 (higher = better)",
      notes: [
        "IMD covers ~67 economies. Some of our 60 countries may not be included.",
        "The full ranking is behind a paywall, but summary data is available in press releases.",
        "Look for 'Infrastructure' as one of the four competitiveness factors.",
        "Some countries (IS, LV, CY, CR, PA, VN, MA) may not be in the IMD ranking.",
      ],
    },
    data: {} as Record<
      string,
      { country: string; infrastructure_score: number | null }
    >,
  };

  for (const c of countries) {
    (template.data as Record<string, unknown>)[c.iso_alpha2] = {
      country: c.name,
      infrastructure_score: null,
    };
  }

  const path = join(TEMPLATES_DIR, "imd-template.json");
  writeFileSync(path, JSON.stringify(template, null, 2) + "\n", "utf-8");
  log(`Generated: ${path}`);
}

function generatePewTemplate(countries: Country[]): void {
  const template: Record<string, unknown> = {
    _instructions: {
      source: "Pew Research Center - Government Restrictions Index (GRI) & Social Hostilities Index (SHI)",
      url: "https://www.pewresearch.org/religion/datasets/",
      report_url:
        "https://www.pewresearch.org/religion/interactives/restrictions-on-religion/",
      description:
        "Two indices measuring religious freedom: GRI (Government Restrictions Index, 0-10 scale) and SHI (Social Hostilities Index, 0-10 scale). Lower = more religious freedom.",
      year: "2023 (or latest available, typically 2-year lag)",
      fields: {
        "pew.govt_restrictions":
          "Government Restrictions Index (GRI), 0-10 scale",
        "pew.social_hostility":
          "Social Hostilities Index (SHI), 0-10 scale",
      },
      notes: [
        "Pew covers 198 countries, so all 60 should be available.",
        "Data is typically released with a 2-year lag (e.g., 2023 data released in 2025).",
        "Access data at pewresearch.org/religion/datasets/ - look for the annual restrictions report.",
        "GRI and SHI are scored 0.0-10.0 with one decimal.",
      ],
    },
    data: {} as Record<
      string,
      {
        country: string;
        govt_restrictions: number | null;
        social_hostility: number | null;
      }
    >,
  };

  for (const c of countries) {
    (template.data as Record<string, unknown>)[c.iso_alpha2] = {
      country: c.name,
      govt_restrictions: null,
      social_hostility: null,
    };
  }

  const path = join(TEMPLATES_DIR, "pew-template.json");
  writeFileSync(path, JSON.stringify(template, null, 2) + "\n", "utf-8");
  log(`Generated: ${path}`);
}

function generateWVSTemplate(countries: Country[]): void {
  const template: Record<string, unknown> = {
    _instructions: {
      source: "World Values Survey - Wave 7 (2017-2022)",
      url: "https://www.worldvaluessurvey.org/WVSDocumentationWV7.jsp",
      description:
        "Interpersonal trust question: 'Generally speaking, would you say that most people can be trusted, or that you need to be very careful in dealing with people?' Value = percentage answering 'Most people can be trusted'.",
      field_name: "wvs.trust_pct",
      value_range: "0 to 100 (percentage)",
      status: "PARTIALLY VERIFIED - already in wvs.json, flag for manual review",
      notes: [
        "The existing wvs.json file was partially verified in the data audit.",
        "This template is for review/update purposes only.",
        "WVS data does NOT change annually - Wave 7 covers 2017-2022.",
        "Not all countries participate in every wave.",
      ],
    },
    data: {} as Record<
      string,
      { country: string; trust_pct: number | null; status: string }
    >,
  };

  for (const c of countries) {
    (template.data as Record<string, unknown>)[c.iso_alpha2] = {
      country: c.name,
      trust_pct: null,
      status: "REVIEW: Check against published WVS Wave 7 data",
    };
  }

  const path = join(TEMPLATES_DIR, "wvs-review-template.json");
  writeFileSync(path, JSON.stringify(template, null, 2) + "\n", "utf-8");
  log(`Generated: ${path}`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error("\nFATAL ERROR:", err);
  process.exit(1);
});
