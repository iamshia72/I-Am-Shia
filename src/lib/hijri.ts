export const getHijriDateParts = (date: Date, offset: number = 0) => {
  const adjustedDate = new Date(date);
  adjustedDate.setDate(adjustedDate.getDate() + offset);

  // Exact lunar calibration for 1448 AH (2026-2027)
  // - 1 Muharram 1448 = June 17, 2026 (29 days: June 17 - July 15)
  // - 1 Safar 1448 = July 16, 2026 (30 days: July 16 - August 14)
  // - 1 Rabi' al-Awwal 1448 = August 15, 2026 (3 Rabi' al-Awwal = August 17)
  const dt = new Date(adjustedDate.getFullYear(), adjustedDate.getMonth(), adjustedDate.getDate());
  const muharramStart = new Date(2026, 5, 17); // June 17, 2026
  const safarStart = new Date(2026, 6, 16);    // July 16, 2026
  const rabi1Start = new Date(2026, 7, 15);    // August 15, 2026
  const rabi2Start = new Date(2026, 8, 14);    // September 14, 2026

  if (dt >= rabi1Start && dt < rabi2Start) {
    const diff = Math.round((dt.getTime() - rabi1Start.getTime()) / (1000 * 60 * 60 * 24));
    return { day: diff + 1, month: 3, year: 1448 };
  } else if (dt >= safarStart && dt < rabi1Start) {
    const diff = Math.round((dt.getTime() - safarStart.getTime()) / (1000 * 60 * 60 * 24));
    return { day: diff + 1, month: 2, year: 1448 };
  } else if (dt >= muharramStart && dt < safarStart) {
    const diff = Math.round((dt.getTime() - muharramStart.getTime()) / (1000 * 60 * 60 * 24));
    return { day: diff + 1, month: 1, year: 1448 };
  }

  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-civil', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }).formatToParts(adjustedDate);
    
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '1448', 10);
    
    return { day, month, year };
  } catch (e) {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }).formatToParts(adjustedDate);
    
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '1448', 10);
    
    return { day, month, year };
  }
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
