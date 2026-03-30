import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes, HighLatitudeRule } from 'adhan';
import { format } from 'date-fns';
import { PrayerTime, PrayerSettings } from '../types';

export function getPrayerTimes(
  lat: number, 
  lng: number, 
  settings: PrayerSettings = { method: 'Tehran', madhab: 'Shafi', highLatitudeRule: 'MiddleOfTheNight' }
): PrayerTime[] {
  const coords = new Coordinates(lat, lng);
  const date = new Date();
  
  let params;
  switch (settings.method) {
    case 'Tehran': params = CalculationMethod.Tehran(); break;
    case 'NorthAmerica': params = CalculationMethod.NorthAmerica(); break;
    case 'MuslimWorldLeague': params = CalculationMethod.MuslimWorldLeague(); break;
    case 'UmmAlQura': params = CalculationMethod.UmmAlQura(); break;
    case 'Egyptian': params = CalculationMethod.Egyptian(); break;
    case 'Karachi': params = CalculationMethod.Karachi(); break;
    case 'Dubai': params = CalculationMethod.Dubai(); break;
    case 'MoonsightingCommittee': params = CalculationMethod.MoonsightingCommittee(); break;
    case 'Kuwait': params = CalculationMethod.Kuwait(); break;
    case 'Qatar': params = CalculationMethod.Qatar(); break;
    case 'Singapore': params = CalculationMethod.Singapore(); break;
    case 'Turkey': params = CalculationMethod.Turkey(); break;
    default: params = CalculationMethod.Tehran();
  }

  // Shia specific adjustments (Tehran method is the default Shia method in adhan)
  // For Shia, Maghrib is slightly later than sunset.
  
  const prayerTimes = new PrayerTimes(coords, date, params);
  
  return [
    { id: 'fajr', name: 'Fajr', time: format(prayerTimes.fajr, 'HH:mm'), icon: 'Sun' },
    { id: 'sunrise', name: 'Sunrise', time: format(prayerTimes.sunrise, 'HH:mm'), icon: 'Sun' },
    { id: 'dhuhr', name: 'Dhuhr', time: format(prayerTimes.dhuhr, 'HH:mm'), icon: 'Sun' },
    { id: 'asr', name: 'Asr', time: format(prayerTimes.asr, 'HH:mm'), icon: 'Sun' },
    { id: 'maghrib', name: 'Maghrib', time: format(prayerTimes.maghrib, 'HH:mm'), icon: 'Moon' },
    { id: 'isha', name: 'Isha', time: format(prayerTimes.isha, 'HH:mm'), icon: 'Moon' },
  ];
}

export async function geocodeLocation(city: string, country: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${city}, ${country}`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (e) {
    console.error("Geocoding error:", e);
    return null;
  }
}

export const CALCULATION_METHODS = [
  { id: 'Tehran', name: 'Tehran (Shia)' },
  { id: 'NorthAmerica', name: 'ISNA (North America)' },
  { id: 'MuslimWorldLeague', name: 'Muslim World League' },
  { id: 'UmmAlQura', name: 'Umm Al-Qura' },
  { id: 'Egyptian', name: 'Egyptian' },
  { id: 'Karachi', name: 'Karachi' },
  { id: 'Dubai', name: 'Dubai' },
  { id: 'MoonsightingCommittee', name: 'Moonsighting Committee' },
  { id: 'Kuwait', name: 'Kuwait' },
  { id: 'Qatar', name: 'Qatar' },
  { id: 'Singapore', name: 'Singapore' },
  { id: 'Turkey', name: 'Turkey' },
];
