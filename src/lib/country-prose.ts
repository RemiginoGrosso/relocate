import type { ClimateData, CountryScores, DimensionKey, RawIndex } from './types';
import {
  DIMENSIONS,
  ENGLISH_NATIVE_COUNTRIES,
  HEALTHCARE_SYSTEM_LABELS,
  HEALTHCARE_SYSTEM_MAP,
} from './constants';
import {
  DIMENSION_INDICATORS,
  INDICATOR_LABELS,
  formatValue,
} from './indicator-display';
import { computeComposite, normaliseWeights } from './scoring';
import { DEFAULT_WEIGHTS } from './constants';
import { ordinal, interpret, findRaw, compositeRank, dimRank } from './prose-helpers';

export interface DimensionProse {
  key: DimensionKey;
  name: string;
  sentences: string[];
  sources: string[];
}

export interface CountryProse {
  summary: string;
  dimensions: DimensionProse[];
}

function fmtScore(score: number | null): string {
  if (score === null) return 'no data';
  return Math.round(score).toString();
}

function sourcesForDimension(dimKey: DimensionKey, rawIndices: RawIndex[]): string[] {
  const indicators = DIMENSION_INDICATORS[dimKey];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const key of indicators) {
    const raw = findRaw(rawIndices, key);
    if (raw && raw.value !== null) {
      const label = INDICATOR_LABELS[key] ?? key;
      const yearStr = raw.year ? ` (${raw.year})` : '';
      const entry = `${label}${yearStr}`;
      if (!seen.has(entry)) {
        seen.add(entry);
        result.push(entry);
      }
    }
  }
  return result;
}

function generatePurchasingPower(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): DimensionProse | null {
  const dimScore = country.dimensionScores.purchasing_power?.score ?? null;
  if (dimScore === null) return null;

  const sentences: string[] = [];
  const r = dimRank(country.iso, 'purchasing_power', allCountries);
  if (r) sentences.push(`${country.name} ranks ${ordinal(r.rank)} out of ${r.total} countries for purchasing power, scoring ${fmtScore(dimScore)} out of 100.`);

  const ppp = findRaw(rawIndices, 'worldbank.oecd_ppp_aic');
  const plr = findRaw(rawIndices, 'worldbank.price_level_ratio');
  const oop = findRaw(rawIndices, 'worldbank.who_oop_pct');

  if (ppp?.value != null) {
    const label = interpret('worldbank.oecd_ppp_aic', ppp.value);
    sentences.push(`OECD purchasing power parity: ${formatValue(ppp)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }
  if (plr?.value != null) {
    const label = interpret('worldbank.price_level_ratio', plr.value);
    sentences.push(`Price level ratio vs US: ${formatValue(plr)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }
  if (oop?.value != null) {
    const label = interpret('worldbank.who_oop_pct', oop.value);
    sentences.push(`Out-of-pocket health spending: ${formatValue(oop)} of total health expenditure${label ? ` (${label.toLowerCase()})` : ''}.`);
  }

  return {
    key: 'purchasing_power',
    name: 'Purchasing Power',
    sentences,
    sources: sourcesForDimension('purchasing_power', rawIndices),
  };
}

function generateCivicCulture(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): DimensionProse | null {
  const dimScore = country.dimensionScores.civic_culture?.score ?? null;
  if (dimScore === null) return null;

  const sentences: string[] = [];
  const r = dimRank(country.iso, 'civic_culture', allCountries);
  if (r) sentences.push(`${country.name} ranks ${ordinal(r.rank)} out of ${r.total} countries for rule of law, scoring ${fmtScore(dimScore)} out of 100.`);

  const rol = findRaw(rawIndices, 'worldbank.wgi_rule_of_law');
  const cc = findRaw(rawIndices, 'worldbank.wgi_corruption_control');
  const crime = findRaw(rawIndices, 'numbeo.crime_index');

  if (rol?.value != null) {
    const label = interpret('worldbank.wgi_rule_of_law', rol.value);
    sentences.push(`WGI Rule of Law percentile: ${formatValue(rol)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }
  if (cc?.value != null) {
    const label = interpret('worldbank.wgi_corruption_control', cc.value);
    sentences.push(`WGI Corruption Control: ${formatValue(cc)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }
  if (crime?.value != null) {
    const label = interpret('numbeo.crime_index', crime.value);
    sentences.push(`Numbeo Crime Index: ${formatValue(crime)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }

  return {
    key: 'civic_culture',
    name: 'Rule of Law',
    sentences,
    sources: sourcesForDimension('civic_culture', rawIndices),
  };
}

function generateSafety(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): DimensionProse | null {
  const dimScore = country.dimensionScores.safety?.score ?? null;
  if (dimScore === null) return null;

  const sentences: string[] = [];
  const r = dimRank(country.iso, 'safety', allCountries);
  if (r) sentences.push(`${country.name} ranks ${ordinal(r.rank)} out of ${r.total} countries for safety, scoring ${fmtScore(dimScore)} out of 100.`);

  const gpi = findRaw(rawIndices, 'gpi.gpi_score');
  if (gpi?.value != null) {
    const label = interpret('gpi.gpi_score', gpi.value);
    sentences.push(`Global Peace Index: ${formatValue(gpi)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }

  return {
    key: 'safety',
    name: 'Safety',
    sentences,
    sources: sourcesForDimension('safety', rawIndices),
  };
}

function generateWarmth(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): DimensionProse | null {
  const dimScore = country.dimensionScores.warmth?.score ?? null;
  if (dimScore === null) return null;

  const sentences: string[] = [];
  const r = dimRank(country.iso, 'warmth', allCountries);
  if (r) sentences.push(`${country.name} ranks ${ordinal(r.rank)} out of ${r.total} countries for warmth, scoring ${fmtScore(dimScore)} out of 100.`);

  const ivr = findRaw(rawIndices, 'hofstede.ivr');
  const ease = findRaw(rawIndices, 'internations.ease_rank');

  if (ivr?.value != null) {
    const label = interpret('hofstede.ivr', ivr.value);
    sentences.push(`Hofstede Indulgence vs Restraint: ${formatValue(ivr)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }
  if (ease?.value != null) {
    const label = interpret('internations.ease_rank', ease.value);
    sentences.push(`InterNations Ease of Settling In rank: ${formatValue(ease)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }

  return {
    key: 'warmth',
    name: 'Warmth',
    sentences,
    sources: sourcesForDimension('warmth', rawIndices),
  };
}

function generateSchoolCulture(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): DimensionProse | null {
  const dimScore = country.dimensionScores.school_culture?.score ?? null;
  if (dimScore === null) return null;

  const sentences: string[] = [];
  const r = dimRank(country.iso, 'school_culture', allCountries);
  if (r) sentences.push(`${country.name} ranks ${ordinal(r.rank)} out of ${r.total} countries for school culture, scoring ${fmtScore(dimScore)} out of 100.`);

  const reading = findRaw(rawIndices, 'pisa.pisa_reading');
  const maths = findRaw(rawIndices, 'pisa.pisa_maths');
  const belonging = findRaw(rawIndices, 'pisa.pisa_belonging');
  const bullying = findRaw(rawIndices, 'pisa.pisa_bullying');

  if (reading?.value != null && maths?.value != null) {
    const rLabel = interpret('pisa.pisa_reading', reading.value);
    const mLabel = interpret('pisa.pisa_maths', maths.value);
    sentences.push(`PISA 2022 academic scores: reading ${Math.round(reading.value)}${rLabel ? ` (${rLabel.toLowerCase()})` : ''}, maths ${Math.round(maths.value)}${mLabel ? ` (${mLabel.toLowerCase()})` : ''}.`);
  }
  if (belonging?.value != null) {
    const label = interpret('pisa.pisa_belonging', belonging.value);
    sentences.push(`Student belonging index: ${formatValue(belonging)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }
  if (bullying?.value != null) {
    const label = interpret('pisa.pisa_bullying', bullying.value);
    sentences.push(`Bullying exposure index: ${formatValue(bullying)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }

  return {
    key: 'school_culture',
    name: 'School Culture',
    sentences,
    sources: sourcesForDimension('school_culture', rawIndices),
  };
}

function generateHealthcare(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): DimensionProse | null {
  const dimScore = country.dimensionScores.healthcare?.score ?? null;
  if (dimScore === null) return null;

  const sentences: string[] = [];
  const r = dimRank(country.iso, 'healthcare', allCountries);
  if (r) sentences.push(`${country.name} ranks ${ordinal(r.rank)} out of ${r.total} countries for healthcare, scoring ${fmtScore(dimScore)} out of 100.`);

  const uhc = findRaw(rawIndices, 'worldbank.who_uhc_coverage');
  const haq = findRaw(rawIndices, 'ihme.haq_index');
  const physicians = findRaw(rawIndices, 'oecd.physicians_per_1000');
  const beds = findRaw(rawIndices, 'oecd.beds_per_1000');

  if (uhc?.value != null) {
    const label = interpret('worldbank.who_uhc_coverage', uhc.value);
    sentences.push(`WHO UHC coverage: ${formatValue(uhc)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }
  if (haq?.value != null) {
    const label = interpret('ihme.haq_index', haq.value);
    sentences.push(`HAQ Index: ${formatValue(haq)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }
  if (physicians?.value != null) {
    const label = interpret('oecd.physicians_per_1000', physicians.value);
    sentences.push(`Physicians: ${formatValue(physicians)} per 1,000${label ? ` (${label.toLowerCase()})` : ''}.`);
  }
  if (beds?.value != null) {
    const label = interpret('oecd.beds_per_1000', beds.value);
    sentences.push(`Hospital beds: ${formatValue(beds)} per 1,000${label ? ` (${label.toLowerCase()})` : ''}.`);
  }

  const systemType = HEALTHCARE_SYSTEM_MAP[country.iso.toUpperCase()];
  if (systemType) {
    sentences.push(HEALTHCARE_SYSTEM_LABELS[systemType].tooltip);
  }

  return {
    key: 'healthcare',
    name: 'Healthcare',
    sentences,
    sources: sourcesForDimension('healthcare', rawIndices),
  };
}

function generateInfrastructure(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): DimensionProse | null {
  const dimScore = country.dimensionScores.infrastructure?.score ?? null;
  if (dimScore === null) return null;

  const sentences: string[] = [];
  const r = dimRank(country.iso, 'infrastructure', allCountries);
  if (r) sentences.push(`${country.name} ranks ${ordinal(r.rank)} out of ${r.total} countries for infrastructure, scoring ${fmtScore(dimScore)} out of 100.`);

  const imd = findRaw(rawIndices, 'imd.infrastructure_score');
  if (imd?.value != null) {
    const label = interpret('imd.infrastructure_score', imd.value);
    sentences.push(`IMD Infrastructure Score: ${formatValue(imd)}${label ? ` (${label.toLowerCase()})` : ''}.`);
  }

  return {
    key: 'infrastructure',
    name: 'Infrastructure',
    sentences,
    sources: sourcesForDimension('infrastructure', rawIndices),
  };
}

function generateClimate(
  country: CountryScores,
  climate: ClimateData | null,
  allCountries: CountryScores[],
): DimensionProse | null {
  if (!climate) return null;

  const sentences: string[] = [];

  const parts: string[] = [];
  if (climate.avgTempAnnual != null) parts.push(`average annual temperature ${climate.avgTempAnnual.toFixed(1)} °C`);
  if (climate.sunshineHoursAnnual != null) parts.push(`${Math.round(climate.sunshineHoursAnnual)} sunshine hours per year`);
  if (climate.rainDaysAnnual != null) parts.push(`${Math.round(climate.rainDaysAnnual)} rain days per year`);
  if (parts.length > 0) {
    sentences.push(`${country.name} has ${parts.join(', ')}.`);
  }

  if (climate.avgTempSummer != null && climate.avgTempWinter != null) {
    sentences.push(`Summers average ${climate.avgTempSummer.toFixed(1)} °C; winters average ${climate.avgTempWinter.toFixed(1)} °C.`);
  }

  return {
    key: 'climate',
    name: 'Climate',
    sentences,
    sources: climate.dataYear ? [`Open-Meteo ERA5 (${climate.dataYear})`] : ['Open-Meteo ERA5'],
  };
}

function generateReligiousFreedom(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): DimensionProse | null {
  const dimScore = country.dimensionScores.religious_freedom?.score ?? null;
  if (dimScore === null) return null;

  const sentences: string[] = [];
  const r = dimRank(country.iso, 'religious_freedom', allCountries);
  if (r) sentences.push(`${country.name} ranks ${ordinal(r.rank)} out of ${r.total} countries for religious freedom, scoring ${fmtScore(dimScore)} out of 100.`);

  const govt = findRaw(rawIndices, 'pew.govt_restrictions');
  const social = findRaw(rawIndices, 'pew.social_hostility');

  if (govt?.value != null) {
    const label = interpret('pew.govt_restrictions', govt.value);
    sentences.push(`Government restrictions on religion: ${formatValue(govt)} out of 10${label ? ` (${label.toLowerCase()})` : ''}.`);
  }
  if (social?.value != null) {
    const label = interpret('pew.social_hostility', social.value);
    sentences.push(`Social hostilities toward religion: ${formatValue(social)} out of 10${label ? ` (${label.toLowerCase()})` : ''}.`);
  }

  return {
    key: 'religious_freedom',
    name: 'Religious Freedom',
    sentences,
    sources: sourcesForDimension('religious_freedom', rawIndices),
  };
}

function generateEnglishProficiency(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): DimensionProse | null {
  const dimScore = country.dimensionScores.english_proficiency?.score ?? null;
  if (dimScore === null) return null;

  const sentences: string[] = [];
  const isNative = (ENGLISH_NATIVE_COUNTRIES as readonly string[]).includes(country.iso.toUpperCase());

  if (isNative) {
    sentences.push(`${country.name} is a native English-speaking country, scored at 100.`);
  } else {
    const r = dimRank(country.iso, 'english_proficiency', allCountries);
    if (r) sentences.push(`${country.name} ranks ${ordinal(r.rank)} out of ${r.total} countries for English proficiency, scoring ${fmtScore(dimScore)} out of 100.`);

    const epi = findRaw(rawIndices, 'ef.epi_score');
    if (epi?.value != null) {
      const label = interpret('ef.epi_score', epi.value);
      sentences.push(`EF English Proficiency Index: ${formatValue(epi)}${label ? ` (${label.toLowerCase()})` : ''}.`);
    }
  }

  return {
    key: 'english_proficiency',
    name: 'English Proficiency',
    sentences,
    sources: isNative ? [] : sourcesForDimension('english_proficiency', rawIndices),
  };
}

const GENERATORS: Array<(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
  climate: ClimateData | null,
) => DimensionProse | null> = [
  (c, r, a) => generatePurchasingPower(c, r, a),
  (c, r, a) => generateCivicCulture(c, r, a),
  (c, r, a) => generateSafety(c, r, a),
  (c, r, a) => generateWarmth(c, r, a),
  (c, r, a) => generateSchoolCulture(c, r, a),
  (c, r, a) => generateHealthcare(c, r, a),
  (c, r, a) => generateInfrastructure(c, r, a),
  (c, _r, a, cl) => generateClimate(c, cl, a),
  (c, r, a) => generateReligiousFreedom(c, r, a),
  (c, r, a) => generateEnglishProficiency(c, r, a),
];

export function generateCountryProse(
  country: CountryScores,
  rawIndices: RawIndex[],
  climate: ClimateData | null,
  allCountries: CountryScores[],
): CountryProse {
  const normW = normaliseWeights(DEFAULT_WEIGHTS);
  const { score: compositeScore } = computeComposite(country, normW);
  const overall = compositeRank(country.iso, allCountries);

  const scored = DIMENSIONS
    .map((d) => ({ key: d.key, name: d.name, score: country.dimensionScores[d.key]?.score ?? null }))
    .filter((d): d is { key: DimensionKey; name: string; score: number } => d.score !== null)
    .sort((a, b) => b.score - a.score);

  const strongest = scored.slice(0, 2);
  const weakest = scored.slice(-1);

  let summary = overall.limitedData
    ? `${country.name} has limited data coverage in the Relocate Index, with a partial composite score of ${compositeScore.toFixed(1)} out of 100.`
    : `${country.name} ranks ${ordinal(overall.rank)} overall out of ${overall.total} countries in the Relocate Index, with a composite score of ${compositeScore.toFixed(1)} out of 100.`;

  if (strongest.length >= 2 && weakest.length > 0 && weakest[0].key !== strongest[1].key) {
    summary += ` It scores highest on ${strongest[0].name.toLowerCase()} (${fmtScore(strongest[0].score)}) and ${strongest[1].name.toLowerCase()} (${fmtScore(strongest[1].score)}), and lowest on ${weakest[0].name.toLowerCase()} (${fmtScore(weakest[0].score)}).`;
  }

  const nullCount = DIMENSIONS.length - scored.length;
  if (nullCount > 0) {
    summary += ` Data is unavailable for ${nullCount} of the 10 dimensions.`;
  }

  const dimensions = GENERATORS
    .map((gen) => gen(country, rawIndices, allCountries, climate))
    .filter((d): d is DimensionProse => d !== null);

  return { summary, dimensions };
}
