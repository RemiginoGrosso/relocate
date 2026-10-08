import type { ClimateData, CountryScores, RawIndex } from './types';
import {
  ENGLISH_NATIVE_COUNTRIES,
  HEALTHCARE_SYSTEM_LABELS,
  HEALTHCARE_SYSTEM_MAP,
} from './constants';
import { formatValue } from './indicator-display';
import { ordinal, interpret, findRaw, compositeRank, dimRank, dimensionName } from './prose-helpers';

export interface FaqItem {
  question: string;
  answer: string;
}

function safetyFaq(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): FaqItem | null {
  const score = country.dimensionScores.safety?.score;
  if (score == null) return null;

  const r = dimRank(country.iso, 'safety', allCountries);
  const homicide = findRaw(rawIndices, 'worldbank.homicide_rate');
  const crime = findRaw(rawIndices, 'numbeo.crime_index');

  let answer = `${country.name} scores ${Math.round(score)} out of 100 for safety in the Relocate Index`;
  if (r) answer += `, ranking ${ordinal(r.rank)} out of ${r.total} countries`;
  answer += '.';
  if (homicide?.value != null) {
    answer += ` It records ${formatValue(homicide)} homicides per 100,000 people per year.`;
  }
  if (crime?.value != null) {
    const label = interpret('numbeo.crime_index', crime.value);
    answer += ` Residents rate crime at ${formatValue(crime)} on the Numbeo Crime Index`;
    if (label) answer += ` (${label.toLowerCase()})`;
    answer += '.';
  }
  answer += ' National averages: safety varies a lot between cities and neighbourhoods. Sources: UNODC via World Bank, Numbeo.';

  return { question: `How safe is ${country.name}?`, answer };
}

function healthcareFaq(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): FaqItem | null {
  const score = country.dimensionScores.healthcare?.score;
  if (score == null) return null;

  const r = dimRank(country.iso, 'healthcare', allCountries);
  const uhc = findRaw(rawIndices, 'worldbank.who_uhc_coverage');
  const systemType = HEALTHCARE_SYSTEM_MAP[country.iso.toUpperCase()];

  let answer = `${country.name} scores ${Math.round(score)} out of 100 for healthcare`;
  if (r) answer += `, ranking ${ordinal(r.rank)} out of ${r.total} countries`;
  answer += '.';
  if (uhc?.value != null) {
    const label = interpret('worldbank.who_uhc_coverage', uhc.value);
    answer += ` WHO Universal Health Coverage index: ${formatValue(uhc)}`;
    if (label) answer += ` (${label.toLowerCase()})`;
    answer += '.';
  }
  if (systemType) {
    answer += ` ${HEALTHCARE_SYSTEM_LABELS[systemType].tooltip}`;
  }
  answer += ' Sources: WHO, IHME Global Burden of Disease, OECD Health Statistics.';

  return { question: `What is healthcare like in ${country.name}?`, answer };
}

function affordabilityFaq(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): FaqItem | null {
  const score = country.dimensionScores.purchasing_power?.score;
  if (score == null) return null;

  const r = dimRank(country.iso, 'purchasing_power', allCountries);
  const plr = findRaw(rawIndices, 'worldbank.price_level_ratio');

  let answer = `${country.name} scores ${Math.round(score)} out of 100 for purchasing power on income from abroad`;
  if (r) answer += `, ranking ${ordinal(r.rank)} out of ${r.total} countries`;
  answer += '.';
  if (plr?.value != null) {
    const label = interpret('worldbank.price_level_ratio', plr.value);
    answer += ` Its price level ratio relative to the US is ${formatValue(plr)}`;
    if (label) answer += ` (${label.toLowerCase()})`;
    answer += '.';
  }
  answer += ' A local salary is scored differently, on local income levels. Source: World Bank.';

  return { question: `How affordable is ${country.name}?`, answer };
}

function warmthFaq(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): FaqItem | null {
  const score = country.dimensionScores.warmth?.score;
  const r = score != null ? dimRank(country.iso, 'warmth', allCountries) : null;

  if (score == null) {
    return {
      question: `Is it easy to settle in ${country.name}?`,
      answer: `Warmth data is not available for ${country.name}. This dimension requires both Hofstede IVR and InterNations Ease of Settling In data, and at least one source is missing for this country.`,
    };
  }

  const ivr = findRaw(rawIndices, 'hofstede.ivr');
  const ease = findRaw(rawIndices, 'internations.ease_rank');

  let answer = `${country.name} scores ${Math.round(score)} out of 100 for warmth (ease of settling in)`;
  if (r) answer += `, ranking ${ordinal(r.rank)} out of ${r.total} countries`;
  answer += '.';
  if (ivr?.value != null) {
    const label = interpret('hofstede.ivr', ivr.value);
    answer += ` Hofstede Indulgence vs Restraint score: ${formatValue(ivr)}`;
    if (label) answer += ` (${label.toLowerCase()})`;
    answer += '.';
  }
  if (ease?.value != null) {
    const label = interpret('internations.ease_rank', ease.value);
    answer += ` InterNations Ease of Settling In rank: ${formatValue(ease)}`;
    if (label) answer += ` (${label.toLowerCase()})`;
    answer += '.';
  }
  answer += ' Sources: Hofstede Insights, InterNations Expat Insider.';

  return { question: `Is it easy to settle in ${country.name}?`, answer };
}

function climateFaq(
  country: CountryScores,
  climate: ClimateData | null,
): FaqItem | null {
  if (!climate) return null;

  const parts: string[] = [];
  if (climate.avgTempAnnual != null) {
    parts.push(`an average annual temperature of ${climate.avgTempAnnual.toFixed(1)} °C`);
  }
  if (climate.avgTempSummer != null && climate.avgTempWinter != null) {
    parts.push(`summers averaging ${climate.avgTempSummer.toFixed(1)} °C and winters ${climate.avgTempWinter.toFixed(1)} °C`);
  }
  if (climate.sunshineHoursAnnual != null) {
    parts.push(`${Math.round(climate.sunshineHoursAnnual)} sunshine hours per year`);
  }
  if (climate.rainDaysAnnual != null) {
    parts.push(`${Math.round(climate.rainDaysAnnual)} rain days per year`);
  }

  if (parts.length === 0) return null;

  const answer = `${country.name} has ${parts.join(', ')}. Climate data from an Open-Meteo climate model.`;

  return { question: `What is the climate like in ${country.name}?`, answer };
}

function schoolFaq(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): FaqItem | null {
  const score = country.dimensionScores.school_culture?.score;
  if (score == null) return null;

  const r = dimRank(country.iso, 'school_culture', allCountries);
  const reading = findRaw(rawIndices, 'pisa.pisa_reading');
  const maths = findRaw(rawIndices, 'pisa.pisa_maths');
  const belonging = findRaw(rawIndices, 'pisa.pisa_belonging');

  let answer = `${country.name} scores ${Math.round(score)} out of 100 for school culture`;
  if (r) answer += `, ranking ${ordinal(r.rank)} out of ${r.total} countries`;
  answer += '.';
  if (reading?.value != null && maths?.value != null) {
    answer += ` PISA 2022 scores: reading ${Math.round(reading.value)}, maths ${Math.round(maths.value)}.`;
  }
  if (belonging?.value != null) {
    const label = interpret('pisa.pisa_belonging', belonging.value);
    answer += ` Student belonging index: ${formatValue(belonging)}`;
    if (label) answer += ` (${label.toLowerCase()})`;
    answer += '.';
  }
  answer += ' Source: OECD PISA 2022.';

  return { question: `How good are schools in ${country.name}?`, answer };
}

function englishFaq(
  country: CountryScores,
  rawIndices: RawIndex[],
  allCountries: CountryScores[],
): FaqItem | null {
  const score = country.dimensionScores.english_proficiency?.score;
  if (score == null) return null;

  const isNative = (ENGLISH_NATIVE_COUNTRIES as readonly string[]).includes(country.iso.toUpperCase());

  if (isNative) {
    return {
      question: `How widely is English spoken in ${country.name}?`,
      answer: `${country.name} is a native English-speaking country and is scored at 100 out of 100 for English proficiency.`,
    };
  }

  const r = dimRank(country.iso, 'english_proficiency', allCountries);
  const epi = findRaw(rawIndices, 'ef.epi_score');

  let answer = `${country.name} scores ${Math.round(score)} out of 100 for English proficiency`;
  if (r) answer += `, ranking ${ordinal(r.rank)} out of ${r.total} countries`;
  answer += '.';
  if (epi?.value != null) {
    const label = interpret('ef.epi_score', epi.value);
    answer += ` EF English Proficiency Index score: ${formatValue(epi)}`;
    if (label) answer += `, rated "${label.toLowerCase()}"`;
    answer += '.';
  }
  answer += ' Source: EF Education First, EF EPI.';

  return { question: `How widely is English spoken in ${country.name}?`, answer };
}

function overallFaq(
  country: CountryScores,
  allCountries: CountryScores[],
): FaqItem {
  const overall = compositeRank(country.iso, allCountries);
  const scored = Object.entries(country.dimensionScores)
    .filter(([, v]) => v?.score != null)
    .map(([k, v]) => ({ key: k, score: v!.score! }))
    .sort((a, b) => b.score - a.score);

  let answer = overall.limitedData
    ? `${country.name} has limited data in the Relocate Index, with a partial composite score of ${overall.score.toFixed(1)} out of 100. It is not ranked due to missing dimensions.`
    : `${country.name} ranks ${ordinal(overall.rank)} out of ${overall.total} countries in the Relocate Index with a composite score of ${overall.score.toFixed(1)} out of 100.`;
  if (scored.length >= 2) {
    const top = scored[0];
    const bottom = scored[scored.length - 1];
    answer += ` It scores highest on ${dimensionName(top.key).toLowerCase()} (${Math.round(top.score)}) and lowest on ${dimensionName(bottom.key).toLowerCase()} (${Math.round(bottom.score)}).`;
  }
  answer += ` The index covers 10 dimensions scored on data from OECD, World Bank, WHO, and other institutional sources.`;

  return {
    question: `Is ${country.name} a good country to relocate to?`,
    answer,
  };
}

export function generateCountryFaq(
  country: CountryScores,
  rawIndices: RawIndex[],
  climate: ClimateData | null,
  allCountries: CountryScores[],
): FaqItem[] {
  const faqs: FaqItem[] = [overallFaq(country, allCountries)];

  const generators = [
    () => safetyFaq(country, rawIndices, allCountries),
    () => healthcareFaq(country, rawIndices, allCountries),
    () => affordabilityFaq(country, rawIndices, allCountries),
    () => warmthFaq(country, rawIndices, allCountries),
    () => climateFaq(country, climate),
    () => schoolFaq(country, rawIndices, allCountries),
    () => englishFaq(country, rawIndices, allCountries),
  ];

  for (const gen of generators) {
    const faq = gen();
    if (faq) faqs.push(faq);
  }

  return faqs;
}

export function faqToJsonLd(faqs: FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
