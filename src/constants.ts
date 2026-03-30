import { Dua, IslamicEvent } from './types';

export const DUAS: Dua[] = [
  {
    id: 'kumayl',
    title: 'Dua Kumayl',
    category: 'Weekly',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ بِرَحْمَتِكَ الَّتِي وَسِعَتْ كُلَّ شَيْءٍ...',
    translation: 'O Allah, I ask You by Your mercy which envelopes all things...',
    transliteration: 'Allahumma inni as\'aluka bi-rahmatika al-lati wasi\'at kulla shay\'in...'
  },
  {
    id: 'tawassul',
    title: 'Dua Tawassul',
    category: 'Weekly',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ وَأَتَوَجَّهُ إِلَيْكَ بِنَبِيِّكَ نَبِيِّ الرَّحْمَةِ مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَآلِهِ...',
    translation: 'O Allah, I ask You and turn my face towards You through Your Prophet, the Prophet of Mercy, Muhammad (SAWA)...',
  },
  {
    id: 'ahd',
    title: 'Dua al-Ahd',
    category: 'Daily',
    arabic: 'اللَّهُمَّ رَبَّ النُّورِ الْعَظِيمِ، وَرَبَّ الْكُرْسِيِّ الرَّفِيعِ...',
    translation: 'O Allah, Lord of the Great Light, Lord of the Elevated Throne...',
  },
  {
    id: 'nudoob',
    title: 'Dua al-Nudoob',
    category: 'Weekly',
    arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ وَصَلَّى اللَّهُ عَلَى سَيِّدِنَا مُحَمَّدٍ نَبِيِّهِ وَآلِهِ وَسَلَّمَ تَسْلِيماً...',
    translation: 'Praise be to Allah, the Lord of the worlds, and may Allah bless our master Muhammad, His Prophet, and his family...',
  },
  {
    id: 'mashlool',
    title: 'Dua al-Mashlool',
    category: 'Special',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ بِاسْمِكَ بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ يَا ذَا الْجَلالِ وَالإِكْرَامِ...',
    translation: 'O Allah, I ask You by Your Name, in the Name of Allah, the Beneficent, the Merciful, O Lord of Majesty and Honor...',
  }
];

export const EVENTS: IslamicEvent[] = [
  {
    date: '2026-03-03',
    title: 'Death of Mukhtar al-Thaqafi (ra)',
    description: 'The death anniversary of Mukhtar al-Thaqafi, who sought justice for the martyrs of Karbala.',
    type: 'Shahadat'
  },
  {
    date: '2026-03-04',
    title: 'Birth of Imam al-Hassan (as)',
    description: 'The birth anniversary of the 2nd Imam, al-Hassan ibn Ali (as).',
    type: 'Wiladat'
  },
  {
    date: '2026-03-04',
    title: 'Departure of Muslim bin Aqil to Kufa',
    description: 'The day Muslim bin Aqil (as) left for Kufa as the envoy of Imam Hussain (as).',
    type: 'Event'
  },
  {
    date: '2026-03-06',
    title: 'Battle of Badr',
    description: 'The anniversary of the first major battle in Islamic history.',
    type: 'Event'
  },
  {
    date: '2026-03-08',
    title: 'Wounding of Imam Ali (as)',
    description: 'The day Imam Ali (as) was struck by the poisoned sword of Ibn Muljam in the Kufa Mosque.',
    type: 'Shahadat'
  },
  {
    date: '2026-03-10',
    title: 'Martyrdom of Imam Ali (as)',
    description: 'The martyrdom anniversary of the Commander of the Faithful, Imam Ali ibn Abi Talib (as).',
    type: 'Shahadat'
  },
  {
    date: '2026-03-12',
    title: 'Laylat al-Qadr',
    description: 'The Night of Power, one of the most sacred nights in the Islamic calendar.',
    type: 'Special'
  },
  {
    date: '2026-03-20',
    title: 'Eid al-Fitr',
    description: 'The festival of breaking the fast, marking the end of Ramadan.',
    type: 'Eid'
  },
  {
    date: '2026-03-22',
    title: 'Battle of Khandaq',
    description: 'The anniversary of the Battle of the Trench (Khandaq).',
    type: 'Event'
  }
];
