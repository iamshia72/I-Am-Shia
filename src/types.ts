export interface PrayerTime {
  name: string;
  time: string;
  icon: string;
  id: string;
}

export interface PrayerSettings {
  method: 'Tehran' | 'NorthAmerica' | 'MuslimWorldLeague' | 'UmmAlQura' | 'Egyptian' | 'Karachi' | 'Dubai' | 'MoonsightingCommittee' | 'Kuwait' | 'Qatar' | 'Singapore' | 'Turkey';
  madhab: 'Shafi' | 'Hanafi';
  highLatitudeRule: 'MiddleOfTheNight' | 'SeventhOfTheNight' | 'TwilightAngle';
  manualLocation?: {
    city: string;
    country: string;
    lat?: number;
    lng?: number;
  };
}

export interface PrayerReminder {
  id: string;
  enabled: boolean;
}

export interface Dua {
  id: string;
  title: string;
  arabic: string;
  translation: string;
  transliteration?: string;
  category: 'Daily' | 'Weekly' | 'Special';
}

export interface IslamicEvent {
  date: string;
  title: string;
  description: string;
  type: 'Wiladat' | 'Shahadat' | 'Event' | 'Eid' | 'Special';
}

export interface Hadith {
  arabic: string;
  english: string;
  source: string;
}
