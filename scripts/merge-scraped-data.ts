import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";

const ROOT = join(
  dirname(decodeURIComponent(new URL(import.meta.url).pathname)),
  ".."
);
const REAL_PATH = join(ROOT, "src/lib/seed/external-indices-real.json");

const realData = JSON.parse(readFileSync(REAL_PATH, "utf-8"));

// GPI 2025 data from worldpopulationreview.com (verified published source)
const GPI_2025: Record<string, number> = {
  IS: 1.095, IE: 1.260, NZ: 1.282, AT: 1.294, CH: 1.294, SG: 1.357,
  PT: 1.371, DK: 1.393, SI: 1.409, FI: 1.420, CZ: 1.435, JP: 1.440,
  MY: 1.469, CA: 1.491, NL: 1.491, BE: 1.492, HU: 1.500, AU: 1.505,
  HR: 1.519, DE: 1.533, LT: 1.558, LV: 1.558, EE: 1.559, ES: 1.578,
  QA: 1.593, SK: 1.609, BG: 1.610, GB: 1.634, NO: 1.644, IT: 1.662,
  SE: 1.709, PL: 1.713, VN: 1.721, RO: 1.721, TW: 1.730, KR: 1.736,
  GR: 1.764, AR: 1.768, UY: 1.784, ID: 1.786, AE: 1.812, CR: 1.843,
  CL: 1.899, CY: 1.933, FR: 1.967, PA: 2.006, MA: 2.012, TH: 2.017,
  SA: 2.035, PE: 2.073, CN: 2.093, PH: 2.148, IN: 2.229, ZA: 2.347,
  BR: 2.472, MX: 2.636, CO: 2.695, TR: 2.852, IL: 3.108,
};

// EF EPI 2025 data from Wikipedia (EF Education First published ranking)
// English-native countries (GB, IE, AU, NZ, CA) excluded — hardcoded to 100 in scoring engine
const EF_EPI_2025: Record<string, number> = {
  NL: 624, HR: 617, AT: 616, DE: 615, NO: 613, PT: 612, DK: 611, SE: 609,
  BE: 608, SK: 606, RO: 605, FI: 603, ZA: 602, PL: 600, LV: 599, BG: 594,
  GR: 592, HU: 590, CZ: 582, MY: 581, AR: 575, PH: 569, CH: 564, EE: 561,
  LT: 543, UY: 542, ES: 540, FR: 539, CY: 537, IL: 524, KR: 522, PE: 519,
  CL: 517, CR: 516, IT: 513, VN: 500, MA: 492, PA: 491, TR: 488, AE: 487,
  IN: 484, BR: 482, CO: 480, ID: 471, QA: 469, CN: 464, JP: 446, MX: 440,
  SA: 404, TH: 402, SI: 0, // Slovenia not in 2025 EPI — will set null below
  IS: 0, LU: 0, // Iceland, Luxembourg not in EPI
};

// IMD Infrastructure 2024 from worldpopulationreview.com
const IMD_INFRA: Record<string, number> = {
  CH: 94.8, DK: 88.3, SE: 86.0, FI: 85.0, CA: 81.4, SG: 81.0, NO: 80.6,
  NL: 80.5, TW: 79.1, IS: 77.9, DE: 77.5, AT: 77.2, CN: 74.9, BE: 72.7,
  FR: 72.0, IE: 72.0, JP: 71.1, GB: 70.1, KR: 69.7, AU: 69.7, AE: 69.0,
  LU: 66.1, PT: 64.0, LT: 64.0, ES: 62.2, NZ: 61.8, QA: 60.0, SA: 59.5,
  EE: 59.2, LV: 58.3, IT: 56.6, MY: 53.5, HU: 53.2, SI: 50.9, GR: 47.9,
  PL: 46.8, RO: 43.6, CY: 43.4, TH: 43.1, CL: 42.2, HR: 39.4, SK: 38.3,
  IN: 36.4, BG: 33.4, AR: 32.2, TR: 31.3, CO: 31.0, ID: 30.2, BR: 29.8,
  PH: 25.0, MX: 20.8, ZA: 20.4, PE: 20.0,
};

// InterNations 2024 verified ranks from CHANGELOG Iteration 16
// 53 destinations total in 2024 survey
const INTERNATIONS_2024: Record<string, number> = {
  CR: 1, MX: 2, PH: 3, ID: 4, BR: 5, TH: 6, PA: 7, CO: 8,
  GR: 10, ES: 11, VN: 13, PT: 15, AE: 16, CY: 17, CN: 19, AU: 20,
  NZ: 21, QA: 22, ZA: 23, MY: 24, SA: 25, IN: 26, IE: 29, SG: 30,
  BE: 31, IT: 33, FR: 34, JP: 35, KR: 36, PL: 37, LU: 38, CA: 39,
  TR: 40, NL: 41, GB: 42, CL: 43, HU: 44, DK: 45, CH: 46, CZ: 47,
  SE: 48, AT: 49, FI: 50, DE: 51, NO: 52,
};

// Countries NOT in InterNations 2024 survey (set null)
const NOT_IN_INTERNATIONS = new Set([
  "AR", "BG", "EE", "HR", "IL", "IS", "LT", "LV", "MA", "PE", "RO", "SI",
  "SK", "TW", "UY",
]);

const ENGLISH_NATIVE = new Set(["GB", "IE", "AU", "NZ", "CA"]);
const NO_EPI = new Set(["SI", "IS", "LU"]); // Not in EF EPI 2025

let gpiCount = 0;
let epiCount = 0;
let imdCount = 0;
let internationsCount = 0;

for (const iso of Object.keys(realData)) {
  if (iso === "_meta") continue;

  // GPI
  if (GPI_2025[iso] !== undefined) {
    realData[iso]["gpi.gpi_score"] = GPI_2025[iso];
    gpiCount++;
  }

  // EF EPI (skip English-native countries)
  if (!ENGLISH_NATIVE.has(iso) && !NO_EPI.has(iso) && EF_EPI_2025[iso] !== undefined && EF_EPI_2025[iso] > 0) {
    realData[iso]["ef.epi_score"] = EF_EPI_2025[iso];
    epiCount++;
  }

  // IMD Infrastructure
  if (IMD_INFRA[iso] !== undefined) {
    realData[iso]["imd.infrastructure_score"] = IMD_INFRA[iso];
    imdCount++;
  }

  // InterNations
  if (NOT_IN_INTERNATIONS.has(iso)) {
    realData[iso]["internations.ease_rank"] = null;
  } else if (INTERNATIONS_2024[iso] !== undefined) {
    realData[iso]["internations.ease_rank"] = INTERNATIONS_2024[iso];
    internationsCount++;
  }
}

realData._meta.gpi_source = "Global Peace Index 2025 via worldpopulationreview.com";
realData._meta.ef_epi_source = "EF EPI 2025 via Wikipedia (EF Education First)";
realData._meta.imd_source = "IMD Infrastructure 2024 via worldpopulationreview.com";
realData._meta.internations_source = "InterNations Expat Insider 2024, verified ranks from audit";
realData._meta.pew_status = "NOT YET SOURCED — requires manual entry from Pew appendix download";

writeFileSync(REAL_PATH, JSON.stringify(realData, null, 2) + "\n", "utf-8");

console.log("Merge complete:");
console.log(`  GPI: ${gpiCount}/60 countries`);
console.log(`  EF EPI: ${epiCount}/60 countries (excl. 5 English-native, 3 not in EPI)`);
console.log(`  IMD Infrastructure: ${imdCount}/60 countries`);
console.log(`  InterNations: ${internationsCount}/60 countries (${NOT_IN_INTERNATIONS.size} not in survey)`);
console.log(`  Pew GRI/SHI: 0/60 (manual entry needed)`);

// Coverage check
let fullyPopulated = 0;
let missingPewOnly = 0;
const countriesWithGaps: string[] = [];

for (const iso of Object.keys(realData)) {
  if (iso === "_meta") continue;
  const entry = realData[iso];
  const nullFields = Object.entries(entry)
    .filter(([, v]) => v === null)
    .map(([k]) => k);

  if (nullFields.length === 0) {
    fullyPopulated++;
  } else if (
    nullFields.length <= 2 &&
    nullFields.every((f) => f.startsWith("pew."))
  ) {
    missingPewOnly++;
  } else {
    countriesWithGaps.push(
      `${iso}: missing ${nullFields.join(", ")}`
    );
  }
}

console.log(`\nCoverage:`);
console.log(`  Fully populated: ${fullyPopulated}`);
console.log(`  Missing Pew only: ${missingPewOnly}`);
console.log(`  Other gaps: ${countriesWithGaps.length}`);
if (countriesWithGaps.length > 0) {
  for (const g of countriesWithGaps) {
    console.log(`    ${g}`);
  }
}
