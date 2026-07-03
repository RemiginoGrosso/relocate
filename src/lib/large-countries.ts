export interface CityClimate {
  avgTemp: number;
  rainDays: number;
  sunshineHours: number;
}

export interface CityEntry {
  name: string;
  lat: number;
  lon: number;
  population: number;
  isDefault: boolean;
  climate: CityClimate;
}

const LARGE_COUNTRY_CITIES: Record<string, CityEntry[]> = {
  CA: [
    { name: 'Toronto', lat: 43.6532, lon: -79.3832, population: 6200000, isDefault: true, climate: { avgTemp: 9.4, rainDays: 132, sunshineHours: 2066 } },
    { name: 'Vancouver', lat: 49.2827, lon: -123.1207, population: 2600000, isDefault: false, climate: { avgTemp: 10.4, rainDays: 166, sunshineHours: 1938 } },
    { name: 'Montreal', lat: 45.5017, lon: -73.5673, population: 4100000, isDefault: false, climate: { avgTemp: 7.3, rainDays: 162, sunshineHours: 2051 } },
    { name: 'Calgary', lat: 51.0447, lon: -114.0719, population: 1500000, isDefault: false, climate: { avgTemp: 4.4, rainDays: 111, sunshineHours: 2396 } },
  ],
  AU: [
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, population: 5300000, isDefault: true, climate: { avgTemp: 18.4, rainDays: 96, sunshineHours: 2592 } },
    { name: 'Melbourne', lat: -37.8136, lon: 144.9631, population: 5000000, isDefault: false, climate: { avgTemp: 15.0, rainDays: 108, sunshineHours: 2363 } },
    { name: 'Brisbane', lat: -27.4698, lon: 153.0251, population: 2500000, isDefault: false, climate: { avgTemp: 20.7, rainDays: 84, sunshineHours: 2884 } },
    { name: 'Perth', lat: -31.9505, lon: 115.8605, population: 2100000, isDefault: false, climate: { avgTemp: 18.7, rainDays: 79, sunshineHours: 3212 } },
  ],
  BR: [
    { name: 'São Paulo', lat: -23.5505, lon: -46.6333, population: 12300000, isDefault: true, climate: { avgTemp: 19.2, rainDays: 135, sunshineHours: 2038 } },
    { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, population: 6700000, isDefault: false, climate: { avgTemp: 23.8, rainDays: 105, sunshineHours: 2340 } },
    { name: 'Curitiba', lat: -25.4284, lon: -49.2733, population: 1900000, isDefault: false, climate: { avgTemp: 17.1, rainDays: 150, sunshineHours: 1920 } },
    { name: 'Florianópolis', lat: -27.5954, lon: -48.5480, population: 500000, isDefault: false, climate: { avgTemp: 20.3, rainDays: 130, sunshineHours: 2100 } },
  ],
  AR: [
    { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, population: 15400000, isDefault: true, climate: { avgTemp: 17.9, rainDays: 107, sunshineHours: 2524 } },
    { name: 'Córdoba', lat: -31.4201, lon: -64.1888, population: 1500000, isDefault: false, climate: { avgTemp: 18.0, rainDays: 75, sunshineHours: 2700 } },
    { name: 'Mendoza', lat: -32.8895, lon: -68.8458, population: 1100000, isDefault: false, climate: { avgTemp: 16.5, rainDays: 45, sunshineHours: 2850 } },
  ],
  CN: [
    { name: 'Shanghai', lat: 31.2304, lon: 121.4737, population: 28500000, isDefault: true, climate: { avgTemp: 16.7, rainDays: 112, sunshineHours: 1895 } },
    { name: 'Guangzhou', lat: 23.1291, lon: 113.2644, population: 18700000, isDefault: false, climate: { avgTemp: 22.4, rainDays: 140, sunshineHours: 1628 } },
    { name: 'Shenzhen', lat: 22.5431, lon: 114.0579, population: 17600000, isDefault: false, climate: { avgTemp: 23.0, rainDays: 134, sunshineHours: 1945 } },
    { name: 'Chengdu', lat: 30.5728, lon: 104.0668, population: 16300000, isDefault: false, climate: { avgTemp: 16.5, rainDays: 148, sunshineHours: 1058 } },
  ],
  IN: [
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777, population: 20700000, isDefault: true, climate: { avgTemp: 27.2, rainDays: 72, sunshineHours: 2556 } },
    { name: 'Bangalore', lat: 12.9716, lon: 77.5946, population: 12800000, isDefault: false, climate: { avgTemp: 24.1, rainDays: 60, sunshineHours: 2453 } },
    { name: 'Delhi', lat: 28.7041, lon: 77.1025, population: 32900000, isDefault: false, climate: { avgTemp: 25.2, rainDays: 36, sunshineHours: 2784 } },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707, population: 11500000, isDefault: false, climate: { avgTemp: 28.6, rainDays: 50, sunshineHours: 2762 } },
  ],
  MX: [
    { name: 'Mexico City', lat: 19.4326, lon: -99.1332, population: 21800000, isDefault: true, climate: { avgTemp: 16.6, rainDays: 95, sunshineHours: 2555 } },
    { name: 'Guadalajara', lat: 20.6597, lon: -103.3496, population: 5300000, isDefault: false, climate: { avgTemp: 20.8, rainDays: 68, sunshineHours: 2700 } },
    { name: 'Monterrey', lat: 25.6866, lon: -100.3161, population: 5100000, isDefault: false, climate: { avgTemp: 22.8, rainDays: 55, sunshineHours: 2650 } },
    { name: 'Playa del Carmen', lat: 20.6296, lon: -87.0739, population: 300000, isDefault: false, climate: { avgTemp: 26.3, rainDays: 90, sunshineHours: 2680 } },
    { name: 'Mérida', lat: 20.9674, lon: -89.5926, population: 1100000, isDefault: false, climate: { avgTemp: 26.8, rainDays: 85, sunshineHours: 2750 } },
  ],
  US: [
    { name: 'New York', lat: 40.7128, lon: -74.0060, population: 8300000, isDefault: true, climate: { avgTemp: 12.9, rainDays: 122, sunshineHours: 2535 } },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, population: 3900000, isDefault: false, climate: { avgTemp: 18.3, rainDays: 36, sunshineHours: 3254 } },
    { name: 'Miami', lat: 25.7617, lon: -80.1918, population: 450000, isDefault: false, climate: { avgTemp: 25.3, rainDays: 135, sunshineHours: 2957 } },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298, population: 2700000, isDefault: false, climate: { avgTemp: 10.0, rainDays: 125, sunshineHours: 2508 } },
    { name: 'San Francisco', lat: 37.7749, lon: -122.4194, population: 870000, isDefault: false, climate: { avgTemp: 14.6, rainDays: 67, sunshineHours: 3061 } },
  ],
};

export function isLargeCountry(iso: string): boolean {
  return iso.toUpperCase() in LARGE_COUNTRY_CITIES;
}

export function getCitiesForCountry(iso: string): CityEntry[] | null {
  return LARGE_COUNTRY_CITIES[iso.toUpperCase()] ?? null;
}

export function getDefaultCity(iso: string): string | null {
  const cities = getCitiesForCountry(iso);
  if (!cities) return null;
  return cities.find((c) => c.isDefault)?.name ?? cities[0].name;
}

export function getCityClimate(iso: string, cityName: string): CityClimate | null {
  const cities = getCitiesForCountry(iso);
  if (!cities) return null;
  return cities.find((c) => c.name === cityName)?.climate ?? null;
}

export { LARGE_COUNTRY_CITIES };
