/**
 * extract-pew-data.ts
 *
 * Extracts Pew GRI (Government Restrictions Index) and SHI (Social Hostilities Index)
 * composite scores from the text-extracted Appendix E of the Pew Research Center report.
 *
 * Formulae (per Pew methodology):
 *   GRI = sum(Q1..Q20 scores) / 2   -> 0-10 scale
 *   SHI = sum(Q1..Q13 scores) * 10/13  -> 0-10 scale
 *
 * Uses the "Latest year, ending DEC 2023" column (3rd score per country).
 *
 * Output:
 *   - scripts/data-templates/pew-extracted.json
 *   - Merges into src/lib/seed/external-indices-real.json
 *
 * Run: npx tsx scripts/extract-pew-data.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = join(
  dirname(decodeURIComponent(new URL(import.meta.url).pathname)),
  ".."
);
const TEXT_FILE = join(
  ROOT,
  "../_TEMP/pew_appendix_e.txt"
);
const EXTERNAL_JSON = join(ROOT, "src/lib/seed/external-indices-real.json");
const OUTPUT_JSON = join(ROOT, "scripts/data-templates/pew-extracted.json");

// ---------------------------------------------------------------------------
// Country name -> ISO mapping (for our 60 countries)
// ---------------------------------------------------------------------------

const COUNTRY_TO_ISO: Record<string, string> = {
  Argentina: "AR",
  Australia: "AU",
  Austria: "AT",
  Belgium: "BE",
  Brazil: "BR",
  Bulgaria: "BG",
  Canada: "CA",
  Chile: "CL",
  China: "CN",
  Colombia: "CO",
  "Costa Rica": "CR",
  Croatia: "HR",
  Cyprus: "CY",
  "Czech Republic": "CZ",
  Czechia: "CZ",
  Denmark: "DK",
  Estonia: "EE",
  Finland: "FI",
  France: "FR",
  Germany: "DE",
  Greece: "GR",
  Hungary: "HU",
  Iceland: "IS",
  India: "IN",
  Indonesia: "ID",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",
  Japan: "JP",
  "South Korea": "KR",
  Latvia: "LV",
  Lithuania: "LT",
  Luxembourg: "LU",
  Malaysia: "MY",
  Mexico: "MX",
  Morocco: "MA",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Norway: "NO",
  Panama: "PA",
  Peru: "PE",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",
  Qatar: "QA",
  Romania: "RO",
  "Saudi Arabia": "SA",
  Singapore: "SG",
  Slovakia: "SK",
  Slovenia: "SI",
  "South Africa": "ZA",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Taiwan: "TW",
  Thailand: "TH",
  Turkey: "TR",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  Uruguay: "UY",
  Vietnam: "VN",
};

// ---------------------------------------------------------------------------
// Question line numbers (0-indexed) in pew_appendix_e.txt
// ---------------------------------------------------------------------------

const GRI_QUESTIONS: Record<number, number> = {
  1: 31,
  2: 1671,
  3: 3306,
  4: 4938,
  5: 6570,
  6: 8201,
  7: 9832,
  8: 11462,
  9: 13092,
  10: 14723,
  11: 16353,
  12: 17984,
  13: 19614,
  14: 21244,
  15: 22876,
  16: 24506,
  17: 26138,
  18: 27768,
  19: 29400,
  20: 31033,
};

const SHI_QUESTIONS: Record<number, number> = {
  1: 45732,
  2: 57174,
  3: 58805,
  4: 60437,
  5: 62072,
  6: 63707,
  7: 65341,
  8: 66975,
  9: 68607,
  10: 70239,
  11: 71872,
  12: 73504,
  13: 75137,
};

// End boundaries (where sub-questions or next question starts)
function getGriEnd(q: number): number {
  if (q < 20) return GRI_QUESTIONS[q + 1];
  return 32668; // Before GRI.Q.20.1 sub-questions
}

function getShiEnd(q: number, totalLines: number): number {
  if (q === 1) return 47381; // Before SHI.Q.1a sub-questions
  if (q < 13) return SHI_QUESTIONS[q + 1];
  return totalLines;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function isScoreLike(s: string): boolean {
  return s === "n/a" || /^\d+\.\d+$/.test(s);
}

function parseQuestionSection(
  lines: string[],
  startLine: number,
  endLine: number
): Record<string, number | null> {
  const section = lines.slice(startLine, endLine);

  // Find where data starts (after the last "2022" column header)
  let dataStart = 0;
  for (let i = 0; i < section.length; i++) {
    const stripped = section[i].trim();
    if (stripped === "2022" && i > 5) {
      // Check if "Country / Territory" appears shortly before
      for (let j = Math.max(0, i - 15); j < i; j++) {
        if (section[j].includes("Country / Territory")) {
          dataStart = i + 1;
          break;
        }
      }
    }
  }

  // Collect non-blank, non-header data lines
  const skipPatterns = [
    "Country / Territory",
    "Baseline year,",
    "ending JUN",
    "Previous year,",
    "Latest year,",
    "ending DEC",
    "www.pew",
  ];

  const dataLines: string[] = [];
  for (const line of section.slice(dataStart)) {
    const stripped = line.trim();
    if (stripped === "") continue;

    // Stop at notes/footers
    if (stripped.startsWith("Note:") || stripped.startsWith("Article ")) break;
    if (stripped.toLowerCase().includes("www.pew")) break;

    // Skip header lines
    if (skipPatterns.some((p) => stripped.includes(p))) continue;
    if (stripped === "2022" || stripped === "2007") continue;
    if (stripped.startsWith("ending DEC 2023")) continue;

    // Skip page numbers (1-2 digit standalone integers)
    if (/^\d{1,2}$/.test(stripped) && !isScoreLike(stripped)) continue;

    // Skip long text lines (notes/descriptions within data)
    if (stripped.length > 60 && !isScoreLike(stripped)) continue;

    dataLines.push(stripped);
  }

  // Parse alternating country names and score triplets
  const countryScores: Record<string, number | null> = {};
  let i = 0;
  while (i < dataLines.length) {
    const line = dataLines[i];
    if (isScoreLike(line)) {
      i++;
      continue; // Orphan score
    }

    // Country name found - collect next 3 scores
    const countryName = line;
    const scores: string[] = [];
    let j = i + 1;
    while (j < dataLines.length && scores.length < 3) {
      if (isScoreLike(dataLines[j])) {
        scores.push(dataLines[j]);
        j++;
      } else {
        break;
      }
    }

    if (scores.length === 3) {
      const score2023 = scores[2];
      countryScores[countryName] =
        score2023 !== "n/a" ? parseFloat(score2023) : null;
      i = j;
    } else {
      i++;
    }
  }

  return countryScores;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const text = readFileSync(TEXT_FILE, "utf-8");
  const lines = text.split("\n");

  // Parse all GRI questions
  console.log("=== Parsing GRI Questions ===");
  const allGriScores: Record<string, Record<number, number | null>> = {};

  for (let q = 1; q <= 20; q++) {
    const scores = parseQuestionSection(
      lines,
      GRI_QUESTIONS[q],
      getGriEnd(q)
    );
    const count = Object.keys(scores).length;
    console.log(`GRI.Q.${q}: ${count} countries`);

    for (const [country, score] of Object.entries(scores)) {
      if (!allGriScores[country]) allGriScores[country] = {};
      allGriScores[country][q] = score;
    }
  }

  // Parse all SHI questions
  console.log("\n=== Parsing SHI Questions ===");
  const allShiScores: Record<string, Record<number, number | null>> = {};

  for (let q = 1; q <= 13; q++) {
    const scores = parseQuestionSection(
      lines,
      SHI_QUESTIONS[q],
      getShiEnd(q, lines.length)
    );
    const count = Object.keys(scores).length;
    console.log(`SHI.Q.${q}: ${count} countries`);

    for (const [country, score] of Object.entries(scores)) {
      if (!allShiScores[country]) allShiScores[country] = {};
      allShiScores[country][q] = score;
    }
  }

  // Compute composites
  console.log("\n=== Computing Composite Scores ===");
  const allCountries = new Set([
    ...Object.keys(allGriScores),
    ...Object.keys(allShiScores),
  ]);
  console.log(`Total countries found: ${allCountries.size}`);

  const results: Record<
    string,
    { gri: number | null; shi: number | null }
  > = {};

  for (const country of allCountries) {
    const griScores = allGriScores[country] ?? {};
    const shiScores = allShiScores[country] ?? {};

    // GRI composite: sum all 20 questions, divide by 2
    let griSum = 0;
    let griCount = 0;
    for (let q = 1; q <= 20; q++) {
      const s = griScores[q];
      if (s !== undefined && s !== null) {
        griSum += s;
        griCount++;
      }
    }

    // SHI composite: sum all 13 questions, multiply by 10/13
    let shiSum = 0;
    let shiCount = 0;
    for (let q = 1; q <= 13; q++) {
      const s = shiScores[q];
      if (s !== undefined && s !== null) {
        shiSum += s;
        shiCount++;
      }
    }

    results[country] = {
      gri:
        griCount === 20
          ? Math.round((griSum / 2) * 10) / 10
          : null,
      shi:
        shiCount === 13
          ? Math.round(((shiSum * 10) / 13) * 10) / 10
          : null,
    };
  }

  // Build output JSON (ISO-keyed for our 60 countries)
  const external = JSON.parse(readFileSync(EXTERNAL_JSON, "utf-8"));
  const ourCountries = Object.keys(external).filter((k) => k !== "_meta");

  // Map country names to ISO codes
  const isoResults: Record<string, unknown> = {
    _meta: {
      source: "Pew Research Appendix E, 2023 data",
      computed: "GRI = sum(Q1-Q20)/2, SHI = sum(Q1-Q13)*10/13",
    },
  };

  console.log(
    `\n${"ISO".padEnd(5)} ${"Country".padEnd(25)} ${"GRI".padStart(6)} ${"SHI".padStart(6)}`
  );
  console.log("-".repeat(45));

  let merged = 0;
  for (const iso of ourCountries.sort()) {
    // Find the Pew country name for this ISO
    let pewName: string | undefined;
    for (const [name, code] of Object.entries(COUNTRY_TO_ISO)) {
      if (code === iso && results[name]) {
        pewName = name;
        break;
      }
    }

    if (pewName && results[pewName]) {
      const r = results[pewName];
      const griStr = r.gri !== null ? r.gri.toFixed(1) : "N/A";
      const shiStr = r.shi !== null ? r.shi.toFixed(1) : "N/A";
      console.log(
        `${iso.padEnd(5)} ${pewName.padEnd(25)} ${griStr.padStart(6)} ${shiStr.padStart(6)}`
      );

      isoResults[iso] = { gri: r.gri, shi: r.shi };

      // Merge into external-indices-real.json
      if (external[iso]) {
        external[iso]["pew.govt_restrictions"] = r.gri;
        external[iso]["pew.social_hostility"] = r.shi;
        merged++;
      }
    } else {
      console.log(`${iso.padEnd(5)} ${"NOT FOUND".padEnd(25)}`);
    }
  }

  // Write outputs
  const templatesDir = join(ROOT, "scripts/data-templates");
  if (!existsSync(templatesDir)) mkdirSync(templatesDir, { recursive: true });

  writeFileSync(OUTPUT_JSON, JSON.stringify(isoResults, null, 2));
  console.log(`\nSaved extracted data to ${OUTPUT_JSON}`);

  writeFileSync(EXTERNAL_JSON, JSON.stringify(external, null, 2));
  console.log(`Merged ${merged} countries into ${EXTERNAL_JSON}`);

  // Plausibility checks
  console.log("\n=== Plausibility Checks ===");
  const checks: Array<{
    iso: string;
    name: string;
    expected: string;
    check: (r: { gri: number | null; shi: number | null }) => boolean;
  }> = [
    {
      iso: "CN",
      name: "China",
      expected: "GRI >= 6",
      check: (r) => r.gri !== null && r.gri >= 6,
    },
    {
      iso: "DK",
      name: "Denmark",
      expected: "SHI < 3",
      check: (r) => r.shi !== null && r.shi < 3,
    },
    {
      iso: "SA",
      name: "Saudi Arabia",
      expected: "GRI > 5",
      check: (r) => r.gri !== null && r.gri > 5,
    },
    {
      iso: "IN",
      name: "India",
      expected: "SHI > 5",
      check: (r) => r.shi !== null && r.shi > 5,
    },
    {
      iso: "PT",
      name: "Portugal",
      expected: "GRI < 2 and SHI < 2",
      check: (r) =>
        r.gri !== null && r.gri < 2 && r.shi !== null && r.shi < 2,
    },
  ];

  for (const c of checks) {
    const r = isoResults[c.iso] as
      | { gri: number | null; shi: number | null }
      | undefined;
    if (r) {
      const passed = c.check(r);
      console.log(
        `  ${passed ? "PASS" : "FAIL"}: ${c.name} (${c.iso}) - expected ${c.expected}, got GRI=${r.gri}, SHI=${r.shi}`
      );
    }
  }
}

main();
