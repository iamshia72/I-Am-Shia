import { DUAS, ZIYARATS, EVENTS, SALAWAAT, NAMAZ, SALAT_MASOOMEEN } from '../constants';
import { IslamicEvent, Dua, Ziyarat } from '../types';
import { format } from 'date-fns';

export interface Recommendation {
  id: string;
  title: string;
  type: 'dua' | 'ziyarat' | 'salawaat' | 'namaz' | 'event';
  description?: string;
  category?: string;
}

export const getDailyRecommendations = (hijriDate: { day: number; month: number }, gregorianDate: Date): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  const dayOfWeek = gregorianDate.getDay(); // 0 is Sunday, 6 is Saturday

  // 1. Add Events for today
  const todayEvents = EVENTS.filter(e => e.hijriMonth === hijriDate.month && e.hijriDay === hijriDate.day);
  todayEvents.forEach(event => {
    recommendations.push({
      id: `event-${event.hijriMonth}-${event.hijriDay}`,
      title: event.title,
      type: 'event',
      description: event.description
    });
  });

  // 2. Add Weekday Specifics
  switch (dayOfWeek) {
    case 0: // Sunday
      addById(recommendations, 'dua-yastashir', 'dua');
      addById(recommendations, 'ziyarat-syeda-fatima-zahra', 'ziyarat');
      addById(recommendations, 'salawaat-lady-fatima', 'salawaat');
      addById(recommendations, 'salat-zahra', 'namaz');
      break;
    case 1: // Monday
      addById(recommendations, 'dua-faraj', 'dua');
      addById(recommendations, 'ziyarat-imam-hassan', 'ziyarat');
      addById(recommendations, 'salawaat-imam-hasan-husayn', 'salawaat');
      addById(recommendations, 'salat-hasan', 'namaz');
      break;
    case 2: // Tuesday
      addById(recommendations, 'tawassul', 'dua');
      addById(recommendations, 'ziyarat-aimmatul-momineen', 'ziyarat');
      addById(recommendations, 'salawaat-imam-sajjad', 'salawaat');
      addById(recommendations, 'salat-sajjad', 'namaz');
      break;
    case 3: // Wednesday
      addById(recommendations, 'dua-yashahida-najwa', 'dua');
      addById(recommendations, 'ziyarat-ameenullah', 'ziyarat');
      addById(recommendations, 'salawaat-imam-kadhim', 'salawaat');
      addById(recommendations, 'salat-kazim', 'namaz');
      break;
    case 4: // Thursday
      addById(recommendations, 'dua-kumayl', 'dua');
      addById(recommendations, 'ziyarat-waritha', 'ziyarat');
      addById(recommendations, 'salawaat-imam-ridha', 'salawaat');
      addById(recommendations, 'salat-rida', 'namaz');
      break;
    case 5: // Friday
      addById(recommendations, 'dua-nudbah', 'dua');
      addById(recommendations, 'friday-one', 'ziyarat'); // Friday Ziyarah
      addById(recommendations, 'friday-two', 'salawaat'); // Friday Salawaat
      addById(recommendations, 'salat-mahdi', 'namaz');
      break;
    case 6: // Saturday
      addById(recommendations, 'dua-sabah', 'dua');
      addById(recommendations, 'holy-prophet-saw-comprehensive', 'ziyarat');
      addById(recommendations, 'salawaat-holy-prophet', 'salawaat');
      addById(recommendations, 'salat-prophet', 'namaz');
      break;
  }

  // 3. Special Date Recommendations
  if (hijriDate.month === 1 && hijriDate.day === 10) { // Ashura
    addById(recommendations, 'ziyarat-ashura', 'ziyarat');
    addById(recommendations, 'dua-alqama', 'dua');
  }

  // Featured Duas
  addById(recommendations, 'dua-akhasi-sifatik', 'dua');
  addById(recommendations, 'dua-yaman-azharal-jamil', 'dua');
  addById(recommendations, 'dua-saif-saghir-qamoos', 'dua');

  if (hijriDate.month === 9) { // Ramadan
    addById(recommendations, 'dua-iftitah', 'dua');
    if (hijriDate.day >= 19) {
        addById(recommendations, 'dua-jawshan-kabir', 'dua');
    }
  }

  // Fallback: If too few recommendations, add some general ones or hourly ones
  if (recommendations.length < 3) {
      // Add current hourly dua if possible (simplified for now)
      const currentHour = gregorianDate.getHours();
      const hourlyDuaId = `hourly-dua-${currentHour % 12 || 12}`;
      addById(recommendations, hourlyDuaId, 'dua');
  }

  return recommendations;
};

const addById = (list: Recommendation[], id: string, type: Recommendation['type']) => {
  let item: any;
  switch (type) {
    case 'dua':
      item = DUAS.find(d => d.id === id);
      break;
    case 'ziyarat':
      item = ZIYARATS.find(z => z.id === id);
      break;
    case 'salawaat':
      item = SALAWAAT.find(s => s.id === id);
      break;
    case 'namaz':
      item = NAMAZ.find(n => n.id === id) || SALAT_MASOOMEEN.find(n => n.id === id);
      break;
  }

  if (item) {
    list.push({
      id: item.id,
      title: item.title,
      type: type,
      description: item.description,
      category: item.category
    });
  }
};
