/**
 * V1 country list: 40 countries with ISO codes and capital coordinates.
 * Coordinates are needed by the climate refresh function (Open-Meteo API).
 * ISO codes are needed by World Bank API calls.
 *
 * Source of truth: src/lib/seed/countries.json
 */

export interface CountryRef {
  name: string;
  iso2: string;
  iso3: string;
  capitalLat: number;
  capitalLon: number;
}

export const COUNTRIES: CountryRef[] = [
  { name: "Denmark", iso2: "DK", iso3: "DNK", capitalLat: 55.6761, capitalLon: 12.5683 },
  { name: "Netherlands", iso2: "NL", iso3: "NLD", capitalLat: 52.3676, capitalLon: 4.9041 },
  { name: "Germany", iso2: "DE", iso3: "DEU", capitalLat: 52.52, capitalLon: 13.405 },
  { name: "Switzerland", iso2: "CH", iso3: "CHE", capitalLat: 46.948, capitalLon: 7.4474 },
  { name: "Sweden", iso2: "SE", iso3: "SWE", capitalLat: 59.3293, capitalLon: 18.0686 },
  { name: "Finland", iso2: "FI", iso3: "FIN", capitalLat: 60.1699, capitalLon: 24.9384 },
  { name: "Norway", iso2: "NO", iso3: "NOR", capitalLat: 59.9139, capitalLon: 10.7522 },
  { name: "France", iso2: "FR", iso3: "FRA", capitalLat: 48.8566, capitalLon: 2.3522 },
  { name: "Ireland", iso2: "IE", iso3: "IRL", capitalLat: 53.3498, capitalLon: -6.2603 },
  { name: "United Kingdom", iso2: "GB", iso3: "GBR", capitalLat: 51.5074, capitalLon: -0.1278 },
  { name: "Portugal", iso2: "PT", iso3: "PRT", capitalLat: 38.7223, capitalLon: -9.1393 },
  { name: "Spain", iso2: "ES", iso3: "ESP", capitalLat: 40.4168, capitalLon: -3.7038 },
  { name: "Italy", iso2: "IT", iso3: "ITA", capitalLat: 41.9028, capitalLon: 12.4964 },
  { name: "Austria", iso2: "AT", iso3: "AUT", capitalLat: 48.2082, capitalLon: 16.3738 },
  { name: "Luxembourg", iso2: "LU", iso3: "LUX", capitalLat: 49.6117, capitalLon: 6.13 },
  { name: "Belgium", iso2: "BE", iso3: "BEL", capitalLat: 50.8503, capitalLon: 4.3517 },
  { name: "Czech Republic", iso2: "CZ", iso3: "CZE", capitalLat: 50.0755, capitalLon: 14.4378 },
  { name: "Poland", iso2: "PL", iso3: "POL", capitalLat: 52.2297, capitalLon: 21.0122 },
  { name: "Hungary", iso2: "HU", iso3: "HUN", capitalLat: 47.4979, capitalLon: 19.0402 },
  { name: "Greece", iso2: "GR", iso3: "GRC", capitalLat: 37.9838, capitalLon: 23.7275 },
  { name: "Estonia", iso2: "EE", iso3: "EST", capitalLat: 59.437, capitalLon: 24.7536 },
  { name: "Croatia", iso2: "HR", iso3: "HRV", capitalLat: 45.815, capitalLon: 15.9819 },
  { name: "Romania", iso2: "RO", iso3: "ROU", capitalLat: 44.4268, capitalLon: 26.1025 },
  { name: "Lithuania", iso2: "LT", iso3: "LTU", capitalLat: 54.6872, capitalLon: 25.2797 },
  { name: "Canada", iso2: "CA", iso3: "CAN", capitalLat: 45.4215, capitalLon: -75.6972 },
  { name: "Mexico", iso2: "MX", iso3: "MEX", capitalLat: 19.4326, capitalLon: -99.1332 },
  { name: "Chile", iso2: "CL", iso3: "CHL", capitalLat: -33.4489, capitalLon: -70.6693 },
  { name: "Colombia", iso2: "CO", iso3: "COL", capitalLat: 4.711, capitalLon: -74.0721 },
  { name: "Argentina", iso2: "AR", iso3: "ARG", capitalLat: -34.6037, capitalLon: -58.3816 },
  { name: "Uruguay", iso2: "UY", iso3: "URY", capitalLat: -34.9011, capitalLon: -56.1645 },
  { name: "Japan", iso2: "JP", iso3: "JPN", capitalLat: 35.6762, capitalLon: 139.6503 },
  { name: "South Korea", iso2: "KR", iso3: "KOR", capitalLat: 37.5665, capitalLon: 126.978 },
  { name: "Singapore", iso2: "SG", iso3: "SGP", capitalLat: 1.3521, capitalLon: 103.8198 },
  { name: "Taiwan", iso2: "TW", iso3: "TWN", capitalLat: 25.033, capitalLon: 121.5654 },
  { name: "Malaysia", iso2: "MY", iso3: "MYS", capitalLat: 3.139, capitalLon: 101.6869 },
  { name: "Thailand", iso2: "TH", iso3: "THA", capitalLat: 13.7563, capitalLon: 100.5018 },
  { name: "Australia", iso2: "AU", iso3: "AUS", capitalLat: -35.2809, capitalLon: 149.13 },
  { name: "New Zealand", iso2: "NZ", iso3: "NZL", capitalLat: -41.2865, capitalLon: 174.7762 },
  { name: "Israel", iso2: "IL", iso3: "ISR", capitalLat: 32.0853, capitalLon: 34.7818 },
  { name: "United Arab Emirates", iso2: "AE", iso3: "ARE", capitalLat: 24.4539, capitalLon: 54.3773 },
];

/**
 * Countries not available in World Bank API.
 * Taiwan is not a member state and has no World Bank data.
 */
export const WORLD_BANK_EXCLUDED: Set<string> = new Set(["TW"]);

/** English-native countries scored at 100 for English proficiency. */
export const ENGLISH_NATIVE: Set<string> = new Set(["GB", "IE", "AU", "NZ", "CA"]);

/**
 * Southern hemisphere countries where "winter" = Jun-Aug.
 * Used by climate refresh to compute correct winter averages.
 */
export const SOUTHERN_HEMISPHERE: Set<string> = new Set([
  "AU", "NZ", "CL", "AR", "UY",
]);
