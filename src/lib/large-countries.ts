export interface CityClimate {
  avgTemp: number;
  rainDays: number;
  sunshineHours: number;
  winterTemp?: number;
}

export interface CityEntry {
  name: string;
  lat: number;
  lon: number;
  population: number;
  isDefault: boolean;
  climate: CityClimate;
}

const COUNTRY_CITIES: Record<string, CityEntry[]> = {
  // ─── Americas: North America ───────────────────────────────────────────
  CA: [
    { name: 'Toronto', lat: 43.6532, lon: -79.3832, population: 6200000, isDefault: true, climate: { avgTemp: 9.4, rainDays: 132, sunshineHours: 2066, winterTemp: -5 } },
    { name: 'Vancouver', lat: 49.2827, lon: -123.1207, population: 2600000, isDefault: false, climate: { avgTemp: 10.4, rainDays: 166, sunshineHours: 1938, winterTemp: 4 } },
    { name: 'Montreal', lat: 45.5017, lon: -73.5673, population: 4100000, isDefault: false, climate: { avgTemp: 7.3, rainDays: 162, sunshineHours: 2051, winterTemp: -9 } },
    { name: 'Calgary', lat: 51.0447, lon: -114.0719, population: 1500000, isDefault: false, climate: { avgTemp: 4.4, rainDays: 111, sunshineHours: 2396, winterTemp: -8 } },
    { name: 'Victoria', lat: 48.4284, lon: -123.3656, population: 400000, isDefault: false, climate: { avgTemp: 10.9, rainDays: 145, sunshineHours: 2103, winterTemp: 5 } },
    { name: 'Halifax', lat: 44.6488, lon: -63.5752, population: 480000, isDefault: false, climate: { avgTemp: 7.0, rainDays: 165, sunshineHours: 1890, winterTemp: -4 } },
    { name: 'Edmonton', lat: 53.5461, lon: -113.4938, population: 1500000, isDefault: false, climate: { avgTemp: 4.2, rainDays: 118, sunshineHours: 2338, winterTemp: -10 } },
  ],
  US: [
    { name: 'New York', lat: 40.7128, lon: -74.0060, population: 8300000, isDefault: true, climate: { avgTemp: 12.9, rainDays: 122, sunshineHours: 2535, winterTemp: -1 } },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, population: 3900000, isDefault: false, climate: { avgTemp: 18.3, rainDays: 36, sunshineHours: 3254, winterTemp: 14 } },
    { name: 'Miami', lat: 25.7617, lon: -80.1918, population: 450000, isDefault: false, climate: { avgTemp: 25.3, rainDays: 135, sunshineHours: 2957, winterTemp: 20 } },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298, population: 2700000, isDefault: false, climate: { avgTemp: 10.0, rainDays: 125, sunshineHours: 2508, winterTemp: -6 } },
    { name: 'San Francisco', lat: 37.7749, lon: -122.4194, population: 870000, isDefault: false, climate: { avgTemp: 14.6, rainDays: 67, sunshineHours: 3061, winterTemp: 10 } },
    { name: 'Austin', lat: 30.2672, lon: -97.7431, population: 980000, isDefault: false, climate: { avgTemp: 21.4, rainDays: 86, sunshineHours: 2650, winterTemp: 11 } },
    { name: 'Denver', lat: 39.7392, lon: -104.9903, population: 720000, isDefault: false, climate: { avgTemp: 10.9, rainDays: 88, sunshineHours: 3105, winterTemp: -1 } },
    { name: 'Seattle', lat: 47.6062, lon: -122.3321, population: 740000, isDefault: false, climate: { avgTemp: 11.9, rainDays: 152, sunshineHours: 2170, winterTemp: 5 } },
    { name: 'Portland', lat: 45.5152, lon: -122.6784, population: 650000, isDefault: false, climate: { avgTemp: 12.4, rainDays: 155, sunshineHours: 2340, winterTemp: 5 } },
    { name: 'Honolulu', lat: 21.3069, lon: -157.8583, population: 350000, isDefault: false, climate: { avgTemp: 25.4, rainDays: 100, sunshineHours: 3040, winterTemp: 23 } },
  ],
  MX: [
    { name: 'Mexico City', lat: 19.4326, lon: -99.1332, population: 21800000, isDefault: true, climate: { avgTemp: 16.6, rainDays: 95, sunshineHours: 2555, winterTemp: 12 } },
    { name: 'Guadalajara', lat: 20.6597, lon: -103.3496, population: 5300000, isDefault: false, climate: { avgTemp: 20.8, rainDays: 68, sunshineHours: 2700, winterTemp: 13 } },
    { name: 'Monterrey', lat: 25.6866, lon: -100.3161, population: 5100000, isDefault: false, climate: { avgTemp: 22.8, rainDays: 55, sunshineHours: 2650, winterTemp: 13 } },
    { name: 'Playa del Carmen', lat: 20.6296, lon: -87.0739, population: 300000, isDefault: false, climate: { avgTemp: 26.3, rainDays: 90, sunshineHours: 2680, winterTemp: 23 } },
    { name: 'Mérida', lat: 20.9674, lon: -89.5926, population: 1100000, isDefault: false, climate: { avgTemp: 26.8, rainDays: 85, sunshineHours: 2750, winterTemp: 22 } },
    { name: 'Oaxaca', lat: 17.0732, lon: -96.7266, population: 700000, isDefault: false, climate: { avgTemp: 20.9, rainDays: 80, sunshineHours: 2600, winterTemp: 17 } },
    { name: 'Tijuana', lat: 32.5149, lon: -117.0382, population: 2200000, isDefault: false, climate: { avgTemp: 17.9, rainDays: 40, sunshineHours: 2900, winterTemp: 13 } },
  ],
  CR: [
    { name: 'San José', lat: 9.9281, lon: -84.0907, population: 1400000, isDefault: true, climate: { avgTemp: 21.5, rainDays: 165, sunshineHours: 2100, winterTemp: 20 } },
    { name: 'Liberia', lat: 10.6346, lon: -85.4406, population: 60000, isDefault: false, climate: { avgTemp: 27.8, rainDays: 110, sunshineHours: 2600, winterTemp: 26 } },
    { name: 'Puerto Limón', lat: 9.9908, lon: -83.0341, population: 60000, isDefault: false, climate: { avgTemp: 25.8, rainDays: 230, sunshineHours: 1900, winterTemp: 25 } },
  ],

  // ─── Americas: South America ────────────────────────────────────────────
  BR: [
    { name: 'São Paulo', lat: -23.5505, lon: -46.6333, population: 12300000, isDefault: true, climate: { avgTemp: 19.2, rainDays: 135, sunshineHours: 2038, winterTemp: 16 } },
    { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, population: 6700000, isDefault: false, climate: { avgTemp: 23.8, rainDays: 105, sunshineHours: 2340, winterTemp: 20 } },
    { name: 'Curitiba', lat: -25.4284, lon: -49.2733, population: 1900000, isDefault: false, climate: { avgTemp: 17.1, rainDays: 150, sunshineHours: 1920, winterTemp: 12 } },
    { name: 'Florianópolis', lat: -27.5954, lon: -48.5480, population: 500000, isDefault: false, climate: { avgTemp: 20.3, rainDays: 130, sunshineHours: 2100, winterTemp: 15 } },
    { name: 'Manaus', lat: -3.1190, lon: -60.0217, population: 2200000, isDefault: false, climate: { avgTemp: 27.5, rainDays: 160, sunshineHours: 2100, winterTemp: 27 } },
    { name: 'Salvador', lat: -12.9777, lon: -38.5016, population: 2900000, isDefault: false, climate: { avgTemp: 25.8, rainDays: 140, sunshineHours: 2300, winterTemp: 24 } },
    { name: 'Brasília', lat: -15.7939, lon: -47.8828, population: 3100000, isDefault: false, climate: { avgTemp: 21.1, rainDays: 100, sunshineHours: 2500, winterTemp: 19 } },
  ],
  AR: [
    { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, population: 15400000, isDefault: true, climate: { avgTemp: 17.9, rainDays: 107, sunshineHours: 2524, winterTemp: 11 } },
    { name: 'Córdoba', lat: -31.4201, lon: -64.1888, population: 1500000, isDefault: false, climate: { avgTemp: 18.0, rainDays: 75, sunshineHours: 2700, winterTemp: 9 } },
    { name: 'Mendoza', lat: -32.8895, lon: -68.8458, population: 1100000, isDefault: false, climate: { avgTemp: 16.5, rainDays: 45, sunshineHours: 2850, winterTemp: 6 } },
    { name: 'Bariloche', lat: -41.1335, lon: -71.3103, population: 130000, isDefault: false, climate: { avgTemp: 9.5, rainDays: 95, sunshineHours: 2100, winterTemp: 3 } },
    { name: 'Salta', lat: -24.7859, lon: -65.4117, population: 620000, isDefault: false, climate: { avgTemp: 17.5, rainDays: 70, sunshineHours: 2650, winterTemp: 11 } },
  ],
  CL: [
    { name: 'Santiago', lat: -33.4489, lon: -70.6693, population: 6800000, isDefault: true, climate: { avgTemp: 14.9, rainDays: 55, sunshineHours: 2760, winterTemp: 8 } },
    { name: 'Valparaíso', lat: -33.0472, lon: -71.6127, population: 950000, isDefault: false, climate: { avgTemp: 14.2, rainDays: 70, sunshineHours: 2400, winterTemp: 11 } },
    { name: 'Punta Arenas', lat: -53.1638, lon: -70.9171, population: 130000, isDefault: false, climate: { avgTemp: 6.7, rainDays: 145, sunshineHours: 1600, winterTemp: 2 } },
    { name: 'Antofagasta', lat: -23.6509, lon: -70.3975, population: 400000, isDefault: false, climate: { avgTemp: 17.8, rainDays: 3, sunshineHours: 3200, winterTemp: 15 } },
  ],
  CO: [
    { name: 'Bogotá', lat: 4.7110, lon: -74.0721, population: 10800000, isDefault: true, climate: { avgTemp: 14.5, rainDays: 190, sunshineHours: 1560, winterTemp: 13 } },
    { name: 'Medellín', lat: 6.2442, lon: -75.5812, population: 4000000, isDefault: false, climate: { avgTemp: 22.0, rainDays: 170, sunshineHours: 1900, winterTemp: 21 } },
    { name: 'Cartagena', lat: 10.3910, lon: -75.4794, population: 1100000, isDefault: false, climate: { avgTemp: 27.9, rainDays: 110, sunshineHours: 2500, winterTemp: 27 } },
    { name: 'Cali', lat: 3.4516, lon: -76.5320, population: 2400000, isDefault: false, climate: { avgTemp: 24.5, rainDays: 150, sunshineHours: 1850, winterTemp: 23 } },
  ],
  PE: [
    { name: 'Lima', lat: -12.0464, lon: -77.0428, population: 10700000, isDefault: true, climate: { avgTemp: 19.5, rainDays: 20, sunshineHours: 1230, winterTemp: 16 } },
    { name: 'Cusco', lat: -13.5319, lon: -71.9675, population: 430000, isDefault: false, climate: { avgTemp: 12.0, rainDays: 100, sunshineHours: 2400, winterTemp: 9 } },
    { name: 'Arequipa', lat: -16.4090, lon: -71.5375, population: 1080000, isDefault: false, climate: { avgTemp: 15.7, rainDays: 15, sunshineHours: 3000, winterTemp: 13 } },
  ],

  // ─── Asia-Pacific ────────────────────────────────────────────────────────
  CN: [
    { name: 'Shanghai', lat: 31.2304, lon: 121.4737, population: 28500000, isDefault: true, climate: { avgTemp: 16.7, rainDays: 112, sunshineHours: 1895, winterTemp: 4 } },
    { name: 'Guangzhou', lat: 23.1291, lon: 113.2644, population: 18700000, isDefault: false, climate: { avgTemp: 22.4, rainDays: 140, sunshineHours: 1628, winterTemp: 14 } },
    { name: 'Shenzhen', lat: 22.5431, lon: 114.0579, population: 17600000, isDefault: false, climate: { avgTemp: 23.0, rainDays: 134, sunshineHours: 1945, winterTemp: 15 } },
    { name: 'Chengdu', lat: 30.5728, lon: 104.0668, population: 16300000, isDefault: false, climate: { avgTemp: 16.5, rainDays: 148, sunshineHours: 1058, winterTemp: 6 } },
    { name: 'Beijing', lat: 39.9042, lon: 116.4074, population: 21500000, isDefault: false, climate: { avgTemp: 13.1, rainDays: 76, sunshineHours: 2671, winterTemp: -3 } },
    { name: 'Kunming', lat: 25.0389, lon: 102.7183, population: 8500000, isDefault: false, climate: { avgTemp: 16.5, rainDays: 120, sunshineHours: 2200, winterTemp: 9 } },
    { name: 'Harbin', lat: 45.8038, lon: 126.5350, population: 10600000, isDefault: false, climate: { avgTemp: 4.7, rainDays: 90, sunshineHours: 2470, winterTemp: -18 } },
  ],
  IN: [
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777, population: 20700000, isDefault: true, climate: { avgTemp: 27.2, rainDays: 72, sunshineHours: 2556, winterTemp: 24 } },
    { name: 'Bangalore', lat: 12.9716, lon: 77.5946, population: 12800000, isDefault: false, climate: { avgTemp: 24.1, rainDays: 60, sunshineHours: 2453, winterTemp: 20 } },
    { name: 'Delhi', lat: 28.7041, lon: 77.1025, population: 32900000, isDefault: false, climate: { avgTemp: 25.2, rainDays: 36, sunshineHours: 2784, winterTemp: 13 } },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707, population: 11500000, isDefault: false, climate: { avgTemp: 28.6, rainDays: 50, sunshineHours: 2762, winterTemp: 24 } },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639, population: 15100000, isDefault: false, climate: { avgTemp: 26.8, rainDays: 100, sunshineHours: 2200, winterTemp: 19 } },
    { name: 'Jaipur', lat: 26.9124, lon: 75.7873, population: 4000000, isDefault: false, climate: { avgTemp: 25.9, rainDays: 35, sunshineHours: 2900, winterTemp: 15 } },
    { name: 'Shimla', lat: 31.1048, lon: 77.1734, population: 210000, isDefault: false, climate: { avgTemp: 15.5, rainDays: 90, sunshineHours: 1900, winterTemp: 6 } },
  ],
  JP: [
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, population: 14000000, isDefault: true, climate: { avgTemp: 16.4, rainDays: 120, sunshineHours: 1970, winterTemp: 6 } },
    { name: 'Osaka', lat: 34.6937, lon: 135.5023, population: 2700000, isDefault: false, climate: { avgTemp: 17.1, rainDays: 120, sunshineHours: 2050, winterTemp: 6 } },
    { name: 'Sapporo', lat: 43.0618, lon: 141.3545, population: 1970000, isDefault: false, climate: { avgTemp: 9.1, rainDays: 110, sunshineHours: 1790, winterTemp: -4 } },
    { name: 'Okinawa (Naha)', lat: 26.2124, lon: 127.6809, population: 320000, isDefault: false, climate: { avgTemp: 23.4, rainDays: 130, sunshineHours: 1830, winterTemp: 17 } },
    { name: 'Fukuoka', lat: 33.5904, lon: 130.4017, population: 1600000, isDefault: false, climate: { avgTemp: 17.3, rainDays: 120, sunshineHours: 1890, winterTemp: 7 } },
  ],
  KR: [
    { name: 'Seoul', lat: 37.5665, lon: 126.9780, population: 9700000, isDefault: true, climate: { avgTemp: 12.9, rainDays: 100, sunshineHours: 2200, winterTemp: -2 } },
    { name: 'Busan', lat: 35.1796, lon: 129.0756, population: 3400000, isDefault: false, climate: { avgTemp: 15.0, rainDays: 110, sunshineHours: 2200, winterTemp: 3 } },
    { name: 'Jeju', lat: 33.4996, lon: 126.5312, population: 490000, isDefault: false, climate: { avgTemp: 16.1, rainDays: 130, sunshineHours: 1950, winterTemp: 6 } },
  ],
  TW: [
    { name: 'Taipei', lat: 25.0330, lon: 121.5654, population: 2600000, isDefault: true, climate: { avgTemp: 23.0, rainDays: 155, sunshineHours: 1600, winterTemp: 16 } },
    { name: 'Kaohsiung', lat: 22.6273, lon: 120.3014, population: 2770000, isDefault: false, climate: { avgTemp: 25.5, rainDays: 100, sunshineHours: 2100, winterTemp: 19 } },
    { name: 'Taichung', lat: 24.1477, lon: 120.6736, population: 2820000, isDefault: false, climate: { avgTemp: 23.6, rainDays: 110, sunshineHours: 1900, winterTemp: 16 } },
  ],
  VN: [
    { name: 'Ho Chi Minh City', lat: 10.8231, lon: 106.6297, population: 9300000, isDefault: true, climate: { avgTemp: 27.8, rainDays: 145, sunshineHours: 2400, winterTemp: 26 } },
    { name: 'Hanoi', lat: 21.0285, lon: 105.8542, population: 8100000, isDefault: false, climate: { avgTemp: 24.0, rainDays: 130, sunshineHours: 1600, winterTemp: 17 } },
    { name: 'Da Nang', lat: 16.0544, lon: 108.2022, population: 1200000, isDefault: false, climate: { avgTemp: 25.9, rainDays: 130, sunshineHours: 2100, winterTemp: 21 } },
  ],
  TH: [
    { name: 'Bangkok', lat: 13.7563, lon: 100.5018, population: 10700000, isDefault: true, climate: { avgTemp: 28.7, rainDays: 130, sunshineHours: 2500, winterTemp: 26 } },
    { name: 'Chiang Mai', lat: 18.7883, lon: 98.9853, population: 1200000, isDefault: false, climate: { avgTemp: 26.0, rainDays: 110, sunshineHours: 2400, winterTemp: 21 } },
    { name: 'Phuket', lat: 7.8804, lon: 98.3923, population: 600000, isDefault: false, climate: { avgTemp: 27.8, rainDays: 155, sunshineHours: 2350, winterTemp: 27 } },
  ],
  ID: [
    { name: 'Jakarta', lat: -6.2088, lon: 106.8456, population: 10600000, isDefault: true, climate: { avgTemp: 27.4, rainDays: 150, sunshineHours: 2000, winterTemp: 27 } },
    { name: 'Bali (Denpasar)', lat: -8.6705, lon: 115.2126, population: 900000, isDefault: false, climate: { avgTemp: 27.5, rainDays: 120, sunshineHours: 2400, winterTemp: 26 } },
    { name: 'Yogyakarta', lat: -7.7956, lon: 110.3695, population: 420000, isDefault: false, climate: { avgTemp: 26.5, rainDays: 130, sunshineHours: 2100, winterTemp: 26 } },
    { name: 'Medan', lat: 3.5952, lon: 98.6722, population: 2400000, isDefault: false, climate: { avgTemp: 27.0, rainDays: 155, sunshineHours: 2000, winterTemp: 26 } },
  ],
  MY: [
    { name: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869, population: 8200000, isDefault: true, climate: { avgTemp: 27.7, rainDays: 180, sunshineHours: 2100, winterTemp: 27 } },
    { name: 'Penang', lat: 5.4141, lon: 100.3288, population: 780000, isDefault: false, climate: { avgTemp: 27.9, rainDays: 165, sunshineHours: 2000, winterTemp: 27 } },
    { name: 'Kota Kinabalu', lat: 5.9804, lon: 116.0735, population: 500000, isDefault: false, climate: { avgTemp: 27.2, rainDays: 150, sunshineHours: 2050, winterTemp: 27 } },
  ],
  PH: [
    { name: 'Manila', lat: 14.5995, lon: 120.9842, population: 14200000, isDefault: true, climate: { avgTemp: 27.9, rainDays: 145, sunshineHours: 2200, winterTemp: 26 } },
    { name: 'Cebu', lat: 10.3157, lon: 123.8854, population: 3000000, isDefault: false, climate: { avgTemp: 27.5, rainDays: 160, sunshineHours: 2100, winterTemp: 27 } },
    { name: 'Davao', lat: 7.1907, lon: 125.4553, population: 1900000, isDefault: false, climate: { avgTemp: 27.3, rainDays: 200, sunshineHours: 1900, winterTemp: 27 } },
  ],
  NZ: [
    { name: 'Auckland', lat: -36.8485, lon: 174.7633, population: 1700000, isDefault: true, climate: { avgTemp: 16.1, rainDays: 137, sunshineHours: 2060, winterTemp: 11 } },
    { name: 'Wellington', lat: -41.2865, lon: 174.7762, population: 420000, isDefault: false, climate: { avgTemp: 13.1, rainDays: 124, sunshineHours: 2020, winterTemp: 9 } },
    { name: 'Christchurch', lat: -43.5321, lon: 172.6362, population: 400000, isDefault: false, climate: { avgTemp: 12.1, rainDays: 92, sunshineHours: 2100, winterTemp: 6 } },
    { name: 'Queenstown', lat: -45.0312, lon: 168.6626, population: 50000, isDefault: false, climate: { avgTemp: 10.6, rainDays: 100, sunshineHours: 2000, winterTemp: 3 } },
  ],
  AU: [
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, population: 5300000, isDefault: true, climate: { avgTemp: 18.4, rainDays: 96, sunshineHours: 2592, winterTemp: 13 } },
    { name: 'Melbourne', lat: -37.8136, lon: 144.9631, population: 5000000, isDefault: false, climate: { avgTemp: 15.0, rainDays: 108, sunshineHours: 2363, winterTemp: 10 } },
    { name: 'Brisbane', lat: -27.4698, lon: 153.0251, population: 2500000, isDefault: false, climate: { avgTemp: 20.7, rainDays: 84, sunshineHours: 2884, winterTemp: 15 } },
    { name: 'Perth', lat: -31.9505, lon: 115.8605, population: 2100000, isDefault: false, climate: { avgTemp: 18.7, rainDays: 79, sunshineHours: 3212, winterTemp: 13 } },
    { name: 'Adelaide', lat: -34.9285, lon: 138.6007, population: 1400000, isDefault: false, climate: { avgTemp: 17.2, rainDays: 78, sunshineHours: 2540, winterTemp: 11 } },
    { name: 'Darwin', lat: -12.4634, lon: 130.8456, population: 150000, isDefault: false, climate: { avgTemp: 27.8, rainDays: 108, sunshineHours: 2930, winterTemp: 25 } },
    { name: 'Hobart', lat: -42.8821, lon: 147.3272, population: 250000, isDefault: false, climate: { avgTemp: 12.7, rainDays: 158, sunshineHours: 2100, winterTemp: 8 } },
  ],

  // ─── Europe ─────────────────────────────────────────────────────────────
  ES: [
    { name: 'Madrid', lat: 40.4168, lon: -3.7038, population: 6700000, isDefault: true, climate: { avgTemp: 15.0, rainDays: 63, sunshineHours: 2769, winterTemp: 6 } },
    { name: 'Barcelona', lat: 41.3851, lon: 2.1734, population: 5600000, isDefault: false, climate: { avgTemp: 16.7, rainDays: 55, sunshineHours: 2524, winterTemp: 10 } },
    { name: 'Seville', lat: 37.3891, lon: -5.9845, population: 1500000, isDefault: false, climate: { avgTemp: 19.2, rainDays: 51, sunshineHours: 2924, winterTemp: 11 } },
    { name: 'Bilbao', lat: 43.2630, lon: -2.9350, population: 1000000, isDefault: false, climate: { avgTemp: 14.9, rainDays: 130, sunshineHours: 1832, winterTemp: 10 } },
    { name: 'Málaga', lat: 36.7213, lon: -4.4213, population: 580000, isDefault: false, climate: { avgTemp: 18.9, rainDays: 47, sunshineHours: 2900, winterTemp: 13 } },
  ],
  FR: [
    { name: 'Paris', lat: 48.8566, lon: 2.3522, population: 11000000, isDefault: true, climate: { avgTemp: 12.4, rainDays: 111, sunshineHours: 1662, winterTemp: 5 } },
    { name: 'Nice', lat: 43.7102, lon: 7.2620, population: 940000, isDefault: false, climate: { avgTemp: 16.0, rainDays: 63, sunshineHours: 2724, winterTemp: 9 } },
    { name: 'Bordeaux', lat: 44.8378, lon: -0.5792, population: 1000000, isDefault: false, climate: { avgTemp: 14.2, rainDays: 108, sunshineHours: 2030, winterTemp: 7 } },
    { name: 'Lyon', lat: 45.7640, lon: 4.8357, population: 1700000, isDefault: false, climate: { avgTemp: 13.0, rainDays: 105, sunshineHours: 2020, winterTemp: 3 } },
    { name: 'Strasbourg', lat: 48.5734, lon: 7.7521, population: 800000, isDefault: false, climate: { avgTemp: 11.2, rainDays: 105, sunshineHours: 1700, winterTemp: 2 } },
  ],
  IT: [
    { name: 'Milan', lat: 45.4642, lon: 9.1900, population: 3200000, isDefault: true, climate: { avgTemp: 13.9, rainDays: 90, sunshineHours: 1900, winterTemp: 3 } },
    { name: 'Rome', lat: 41.9028, lon: 12.4964, population: 4300000, isDefault: false, climate: { avgTemp: 16.5, rainDays: 78, sunshineHours: 2473, winterTemp: 8 } },
    { name: 'Naples', lat: 40.8518, lon: 14.2681, population: 3100000, isDefault: false, climate: { avgTemp: 16.8, rainDays: 90, sunshineHours: 2350, winterTemp: 9 } },
    { name: 'Palermo', lat: 38.1157, lon: 13.3613, population: 1300000, isDefault: false, climate: { avgTemp: 18.5, rainDays: 75, sunshineHours: 2530, winterTemp: 12 } },
    { name: 'Florence', lat: 43.7696, lon: 11.2558, population: 1000000, isDefault: false, climate: { avgTemp: 15.5, rainDays: 88, sunshineHours: 2200, winterTemp: 6 } },
  ],
  DE: [
    { name: 'Munich', lat: 48.1351, lon: 11.5820, population: 1500000, isDefault: true, climate: { avgTemp: 9.9, rainDays: 130, sunshineHours: 1755, winterTemp: -1 } },
    { name: 'Hamburg', lat: 53.5511, lon: 9.9937, population: 1900000, isDefault: false, climate: { avgTemp: 9.8, rainDays: 170, sunshineHours: 1550, winterTemp: 2 } },
    { name: 'Berlin', lat: 52.5200, lon: 13.4050, population: 3700000, isDefault: false, climate: { avgTemp: 10.4, rainDays: 106, sunshineHours: 1720, winterTemp: 1 } },
    { name: 'Frankfurt', lat: 50.1109, lon: 8.6821, population: 2300000, isDefault: false, climate: { avgTemp: 11.0, rainDays: 122, sunshineHours: 1680, winterTemp: 2 } },
  ],
  PT: [
    { name: 'Lisbon', lat: 38.7223, lon: -9.1393, population: 2900000, isDefault: true, climate: { avgTemp: 17.4, rainDays: 76, sunshineHours: 2799, winterTemp: 12 } },
    { name: 'Porto', lat: 41.1579, lon: -8.6291, population: 1700000, isDefault: false, climate: { avgTemp: 15.2, rainDays: 110, sunshineHours: 2470, winterTemp: 9 } },
    { name: 'Faro', lat: 37.0194, lon: -7.9304, population: 65000, isDefault: false, climate: { avgTemp: 18.0, rainDays: 66, sunshineHours: 3000, winterTemp: 12 } },
  ],
  GR: [
    { name: 'Athens', lat: 37.9838, lon: 23.7275, population: 3200000, isDefault: true, climate: { avgTemp: 18.9, rainDays: 42, sunshineHours: 2771, winterTemp: 10 } },
    { name: 'Thessaloniki', lat: 40.6401, lon: 22.9444, population: 1100000, isDefault: false, climate: { avgTemp: 16.6, rainDays: 65, sunshineHours: 2500, winterTemp: 7 } },
    { name: 'Heraklion (Crete)', lat: 35.3387, lon: 25.1442, population: 210000, isDefault: false, climate: { avgTemp: 19.0, rainDays: 55, sunshineHours: 2800, winterTemp: 12 } },
  ],
  NO: [
    { name: 'Oslo', lat: 59.9139, lon: 10.7522, population: 1100000, isDefault: true, climate: { avgTemp: 7.0, rainDays: 145, sunshineHours: 1670, winterTemp: -3 } },
    { name: 'Bergen', lat: 60.3913, lon: 5.3221, population: 290000, isDefault: false, climate: { avgTemp: 8.0, rainDays: 220, sunshineHours: 1240, winterTemp: 2 } },
    { name: 'Tromsø', lat: 69.6492, lon: 18.9553, population: 78000, isDefault: false, climate: { avgTemp: 3.0, rainDays: 180, sunshineHours: 1050, winterTemp: -4 } },
  ],
  SE: [
    { name: 'Stockholm', lat: 59.3293, lon: 18.0686, population: 1700000, isDefault: true, climate: { avgTemp: 8.0, rainDays: 165, sunshineHours: 1800, winterTemp: -2 } },
    { name: 'Gothenburg', lat: 57.7089, lon: 11.9746, population: 1050000, isDefault: false, climate: { avgTemp: 8.5, rainDays: 175, sunshineHours: 1700, winterTemp: 0 } },
    { name: 'Malmö', lat: 55.6050, lon: 13.0038, population: 350000, isDefault: false, climate: { avgTemp: 9.0, rainDays: 160, sunshineHours: 1800, winterTemp: 1 } },
  ],
  TR: [
    { name: 'Istanbul', lat: 41.0082, lon: 28.9784, population: 15500000, isDefault: true, climate: { avgTemp: 15.0, rainDays: 110, sunshineHours: 2400, winterTemp: 6 } },
    { name: 'Ankara', lat: 39.9334, lon: 32.8597, population: 5700000, isDefault: false, climate: { avgTemp: 12.0, rainDays: 100, sunshineHours: 2450, winterTemp: 1 } },
    { name: 'Antalya', lat: 36.8969, lon: 30.7133, population: 2600000, isDefault: false, climate: { avgTemp: 18.9, rainDays: 90, sunshineHours: 3000, winterTemp: 10 } },
    { name: 'Izmir', lat: 38.4237, lon: 27.1428, population: 4400000, isDefault: false, climate: { avgTemp: 17.9, rainDays: 85, sunshineHours: 2700, winterTemp: 9 } },
  ],
  HR: [
    { name: 'Zagreb', lat: 45.8150, lon: 15.9819, population: 1200000, isDefault: true, climate: { avgTemp: 12.0, rainDays: 120, sunshineHours: 1900, winterTemp: 1 } },
    { name: 'Split', lat: 43.5081, lon: 16.4402, population: 180000, isDefault: false, climate: { avgTemp: 17.0, rainDays: 90, sunshineHours: 2600, winterTemp: 8 } },
    { name: 'Dubrovnik', lat: 42.6507, lon: 18.0944, population: 43000, isDefault: false, climate: { avgTemp: 17.4, rainDays: 100, sunshineHours: 2600, winterTemp: 9 } },
  ],
  PL: [
    { name: 'Warsaw', lat: 52.2297, lon: 21.0122, population: 1800000, isDefault: true, climate: { avgTemp: 9.0, rainDays: 155, sunshineHours: 1580, winterTemp: -2 } },
    { name: 'Krakow', lat: 50.0647, lon: 19.9450, population: 780000, isDefault: false, climate: { avgTemp: 9.3, rainDays: 160, sunshineHours: 1600, winterTemp: -1 } },
    { name: 'Gdańsk', lat: 54.3520, lon: 18.6466, population: 470000, isDefault: false, climate: { avgTemp: 8.6, rainDays: 165, sunshineHours: 1650, winterTemp: -1 } },
  ],
  RO: [
    { name: 'Bucharest', lat: 44.4268, lon: 26.1025, population: 1800000, isDefault: true, climate: { avgTemp: 11.8, rainDays: 105, sunshineHours: 2100, winterTemp: -2 } },
    { name: 'Cluj-Napoca', lat: 46.7712, lon: 23.6236, population: 410000, isDefault: false, climate: { avgTemp: 9.8, rainDays: 115, sunshineHours: 1950, winterTemp: -2 } },
    { name: 'Constanța', lat: 44.1598, lon: 28.6348, population: 280000, isDefault: false, climate: { avgTemp: 12.1, rainDays: 95, sunshineHours: 2250, winterTemp: 1 } },
  ],
  BG: [
    { name: 'Sofia', lat: 42.6977, lon: 23.3219, population: 1400000, isDefault: true, climate: { avgTemp: 10.9, rainDays: 110, sunshineHours: 2100, winterTemp: -1 } },
    { name: 'Varna', lat: 43.2141, lon: 27.9147, population: 480000, isDefault: false, climate: { avgTemp: 12.9, rainDays: 90, sunshineHours: 2300, winterTemp: 3 } },
    { name: 'Plovdiv', lat: 42.1354, lon: 24.7453, population: 675000, isDefault: false, climate: { avgTemp: 12.5, rainDays: 95, sunshineHours: 2250, winterTemp: 1 } },
  ],
  FI: [
    { name: 'Helsinki', lat: 60.1699, lon: 24.9384, population: 1300000, isDefault: true, climate: { avgTemp: 6.0, rainDays: 140, sunshineHours: 1650, winterTemp: -4 } },
    { name: 'Tampere', lat: 61.4978, lon: 23.7610, population: 250000, isDefault: false, climate: { avgTemp: 4.8, rainDays: 150, sunshineHours: 1600, winterTemp: -6 } },
    { name: 'Oulu', lat: 65.0121, lon: 25.4651, population: 210000, isDefault: false, climate: { avgTemp: 2.9, rainDays: 155, sunshineHours: 1500, winterTemp: -9 } },
  ],
  AT: [
    { name: 'Vienna', lat: 48.2082, lon: 16.3738, population: 1900000, isDefault: true, climate: { avgTemp: 11.1, rainDays: 105, sunshineHours: 1900, winterTemp: 1 } },
    { name: 'Innsbruck', lat: 47.2692, lon: 11.4041, population: 130000, isDefault: false, climate: { avgTemp: 9.7, rainDays: 115, sunshineHours: 1800, winterTemp: -1 } },
    { name: 'Graz', lat: 47.0707, lon: 15.4395, population: 290000, isDefault: false, climate: { avgTemp: 10.4, rainDays: 100, sunshineHours: 1850, winterTemp: 0 } },
  ],
  CH: [
    { name: 'Zurich', lat: 47.3769, lon: 8.5417, population: 1400000, isDefault: true, climate: { avgTemp: 9.9, rainDays: 132, sunshineHours: 1700, winterTemp: 1 } },
    { name: 'Geneva', lat: 46.2044, lon: 6.1432, population: 620000, isDefault: false, climate: { avgTemp: 11.0, rainDays: 120, sunshineHours: 1900, winterTemp: 2 } },
    { name: 'Lugano', lat: 46.0037, lon: 8.9511, population: 140000, isDefault: false, climate: { avgTemp: 12.9, rainDays: 105, sunshineHours: 2100, winterTemp: 3 } },
  ],

  // ─── Africa / Middle East ────────────────────────────────────────────────
  ZA: [
    { name: 'Cape Town', lat: -33.9249, lon: 18.4241, population: 4600000, isDefault: true, climate: { avgTemp: 17.0, rainDays: 90, sunshineHours: 3100, winterTemp: 12 } },
    { name: 'Johannesburg', lat: -26.2041, lon: 28.0473, population: 5900000, isDefault: false, climate: { avgTemp: 16.0, rainDays: 100, sunshineHours: 2960, winterTemp: 10 } },
    { name: 'Durban', lat: -29.8587, lon: 31.0218, population: 3400000, isDefault: false, climate: { avgTemp: 21.0, rainDays: 115, sunshineHours: 2400, winterTemp: 17 } },
  ],
  MA: [
    { name: 'Casablanca', lat: 33.5731, lon: -7.5898, population: 3800000, isDefault: true, climate: { avgTemp: 18.5, rainDays: 60, sunshineHours: 2760, winterTemp: 12 } },
    { name: 'Marrakech', lat: 31.6295, lon: -7.9811, population: 1000000, isDefault: false, climate: { avgTemp: 19.9, rainDays: 40, sunshineHours: 3000, winterTemp: 12 } },
    { name: 'Fez', lat: 34.0181, lon: -5.0078, population: 1200000, isDefault: false, climate: { avgTemp: 18.0, rainDays: 65, sunshineHours: 2800, winterTemp: 9 } },
    { name: 'Tangier', lat: 35.7595, lon: -5.8340, population: 1100000, isDefault: false, climate: { avgTemp: 18.2, rainDays: 75, sunshineHours: 2700, winterTemp: 12 } },
  ],
  SA: [
    { name: 'Riyadh', lat: 24.7136, lon: 46.6753, population: 7700000, isDefault: true, climate: { avgTemp: 26.0, rainDays: 12, sunshineHours: 3300, winterTemp: 15 } },
    { name: 'Jeddah', lat: 21.4858, lon: 39.1925, population: 4700000, isDefault: false, climate: { avgTemp: 28.5, rainDays: 8, sunshineHours: 3400, winterTemp: 24 } },
    { name: 'Dammam', lat: 26.4207, lon: 50.0888, population: 1200000, isDefault: false, climate: { avgTemp: 27.0, rainDays: 10, sunshineHours: 3350, winterTemp: 17 } },
  ],
};

export function hasCityData(iso: string): boolean {
  return iso.toUpperCase() in COUNTRY_CITIES;
}

// Backward compat — will be removed after all call sites updated
export const isLargeCountry = hasCityData;

export function getCitiesForCountry(iso: string): CityEntry[] | null {
  return COUNTRY_CITIES[iso.toUpperCase()] ?? null;
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

export { COUNTRY_CITIES };

// Backward compat — will be removed after all call sites updated
export { COUNTRY_CITIES as LARGE_COUNTRY_CITIES };
