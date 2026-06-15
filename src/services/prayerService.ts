import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes, HighLatitudeRule } from 'adhan';
import { format } from 'date-fns';
import { PrayerTime, PrayerSettings } from '../types';

export function getPrayerTimes(
  lat: number, 
  lng: number, 
  settings: PrayerSettings = { method: 'Tehran', madhab: 'Shafi', highLatitudeRule: 'MiddleOfTheNight', arabicFont: 'Amiri Quran', prayerOffsets: {} }
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

  const prayerTimes = new PrayerTimes(coords, date, params);
  
  const applyOffset = (time: Date, offsetMinutes: number = 0) => {
    const newTime = new Date(time);
    newTime.setMinutes(newTime.getMinutes() + offsetMinutes);
    return newTime;
  };

  const offsets = settings.prayerOffsets || {};

  return [
    { id: 'fajr', name: 'Fajr', time: format(applyOffset(prayerTimes.fajr, offsets.fajr), 'HH:mm'), formattedTime: format(applyOffset(prayerTimes.fajr, offsets.fajr), 'h:mm a'), icon: 'Moon' },
    { id: 'sunrise', name: 'Sunrise', time: format(applyOffset(prayerTimes.sunrise, offsets.sunrise), 'HH:mm'), formattedTime: format(applyOffset(prayerTimes.sunrise, offsets.sunrise), 'h:mm a'), icon: 'Sun' },
    { id: 'dhuhr', name: 'Dhuhr', time: format(applyOffset(prayerTimes.dhuhr, offsets.dhuhr), 'HH:mm'), formattedTime: format(applyOffset(prayerTimes.dhuhr, offsets.dhuhr), 'h:mm a'), icon: 'Sun' },
    { id: 'sunset', name: 'Sunset', time: format(applyOffset(prayerTimes.sunset || prayerTimes.maghrib, offsets.sunset), 'HH:mm'), formattedTime: format(applyOffset(prayerTimes.sunset || prayerTimes.maghrib, offsets.sunset), 'h:mm a'), icon: 'Sun' },
    { id: 'maghrib', name: 'Maghrib', time: format(applyOffset(prayerTimes.maghrib, offsets.maghrib), 'HH:mm'), formattedTime: format(applyOffset(prayerTimes.maghrib, offsets.maghrib), 'h:mm a'), icon: 'Moon' },
  ];
}

export async function geocodeLocation(city: string, country: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${city}, ${country}`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    }
    return null;
  } catch (e) {
    console.warn("Geocoding failed gracefully:", e);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  // Try BigDataCloud reverse geocoding API first (extremely reliable, CORS-friendly, fast)
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision;
      if (city) {
        return city;
      }
    }
  } catch (e) {
    console.warn("Primary reverse geocoding failed, trying fallback...", e);
  }

  // Fallback to OSM Nominatim
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        return data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || null;
      }
    }
  } catch (e) {
    console.warn("Fallback reverse geocoding failed gracefully:", e);
  }

  return null;
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
