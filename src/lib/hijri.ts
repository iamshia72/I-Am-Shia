import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const getHijriDateParts = (date: Date, offset: number = 0) => {
  const adjustedDate = new Date(date);
  adjustedDate.setDate(adjustedDate.getDate() - 1 + offset);

  const parts = new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  }).formatToParts(adjustedDate);
  
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1');
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '1447');
  
  return { day, month, year };
};

export const ISLAMIC_MONTHS = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

export const getHijriDateString = (date: Date, offset: number = 0) => {
  const { day, month, year } = getHijriDateParts(date, offset);
  const monthName = ISLAMIC_MONTHS[month - 1] || "Unknown";
  
  return `${day} ${monthName} ${year} AH`;
};
