export interface PrayerTime {
  name: string;
  time: string;
  formattedTime?: string;
  icon: string;
  id: string;
}

export interface PrayerSettings {
  method: 'Tehran' | 'NorthAmerica' | 'MuslimWorldLeague' | 'UmmAlQura' | 'Egyptian' | 'Karachi' | 'Dubai' | 'MoonsightingCommittee' | 'Kuwait' | 'Qatar' | 'Singapore' | 'Turkey';
  madhab: 'Shafi' | 'Hanafi';
  highLatitudeRule: 'MiddleOfTheNight' | 'SeventhOfTheNight' | 'TwilightAngle';
  arabicFont: 'Amiri Quran' | 'Lateef' | 'Scheherazade New' | 'Noto Naskh Arabic';
  manualLocation?: {
    city: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  hijriOffset?: number;
  prayerOffsets?: Record<string, number>;
  language?: 'en' | 'ur';
  arabicFontSize?: number;
}

export interface PrayerReminder {
  id: string;
  enabled: boolean;
}

export interface DuaLine {
  arabic?: string;
  english?: string;
  urdu?: string;
  transliteration?: string;
  isSeparator?: boolean;
  highlight?: boolean;
}

export interface RelatedItem {
  id: string;
  type: 'dua' | 'ziyarat' | 'supplication';
  title: string;
}

export interface Dua {
  id: string;
  title: string;
  arabicTitle?: string;
  description?: string;
  footer?: string;
  significance?: string;
  arabic?: string;
  translation?: string;
  translationUrdu?: string;
  category: string;
  audioUrl?: string;
  dataUrl?: string;
  type?: 'dua' | 'supplication';
  lines?: DuaLine[];
  sections?: ZiyaratSection[];
  transliteration?: string;
  relatedItems?: RelatedItem[];
  prelude?: string;
}

export interface IslamicEvent {
  hijriMonth: number;
  hijriDay: number;
  title: string;
  description: string;
  type: 'Wiladat' | 'Shahadat' | 'Event' | 'Eid' | 'Special';
}

export interface Hadith {
  arabic: string;
  english: string;
  source: string;
}

export interface ZiyaratSection {
  title: string;
  lines: DuaLine[];
  audioUrl?: string;
  prelude?: string;
}

export interface Ziyarat {
  id: string;
  title: string;
  arabicTitle?: string;
  description?: string;
  footer?: string;
  significance?: string;
  arabic?: string;
  translation?: string;
  translationUrdu?: string;
  category: string;
  audioUrl?: string;
  dataUrl?: string;
  lines?: DuaLine[];
  sections?: ZiyaratSection[];
  transliteration?: string;
  relatedItems?: RelatedItem[];
  prelude?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  deletedAt?: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  artist?: string;
  category?: string;
}

export interface AudioState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
}
