import fs from 'fs';

const rawEvents = [
  {
    "date": "2026-01-02",
    "title": "Wiladat: Imam Ali Ibne Abu Talib (AS)"
  },
  {
    "date": "2026-01-11",
    "title": "Nazr-e-Imam Jafar-us-Sadiq (AS)"
  },
  {
    "date": "2026-01-14",
    "title": "Martyrdom: Imam Moosa Kazim (AS)"
  },
  {
    "date": "2026-01-15",
    "title": "Wafat: Hazrat Abu Talib (AS)"
  },
  {
    "date": "2026-01-16",
    "title": "Yaum-e-Be'sat / Mairaj-un-Nabi (PBUH)"
  },
  {
    "date": "2026-01-20",
    "title": "Wiladat: BiBi Zainab S.A."
  },
  {
    "date": "2026-01-21",
    "title": "Fasting in Ramzan was made compulsory"
  },
  {
    "date": "2026-01-22",
    "title": "Wiladat: Imam Hussain (AS)"
  },
  {
    "date": "2026-01-23",
    "title": "Wiladat: Hazrat Abbas Alamdar (AS)"
  },
  {
    "date": "2026-01-24",
    "title": "Wiladat: Imam Zain-ul-Abideen (AS)"
  },
  {
    "date": "2026-01-26",
    "title": "Wiladat: Hazrat Qasim Ibne Hasan (AS)"
  },
  {
    "date": "2026-01-30",
    "title": "Wiladat: Hazrat Ali Akbar Ibne Hussain (AS)"
  },
  {
    "date": "2026-02-02",
    "title": "Shab-e-Bara'at"
  },
  {
    "date": "2026-02-03",
    "title": "Wiladat: Imam Mehdi Aakhir-uz-Zaman (AS)"
  },
  {
    "date": "2026-02-23",
    "title": "Torah was revealed"
  },
  {
    "date": "2026-02-27",
    "title": "Wafat: Hazrat Khadija (SA)"
  },
  {
    "date": "2026-03-01",
    "title": "Bible was revealed"
  },
  {
    "date": "2026-03-04",
    "title": "Wiladat: Imam Hasan (AS)"
  },
  {
    "date": "2026-03-06",
    "title": "Battle of Badr was fought"
  },
  {
    "date": "2026-03-07",
    "title": "Zabur was revealed"
  },
  {
    "date": "2026-03-08",
    "title": "Subhe Zarbat: Imam Ali Ibne Abi Talib (AS)"
  },
  {
    "date": "2026-03-10",
    "title": "Martyrdom: Imam Ali Ibne Abi Talib (AS)"
  },
  {
    "date": "2026-03-11",
    "title": "Shab-e-Qadr: Quran was revealed"
  },
  {
    "date": "2026-03-13",
    "title": "Juma'tul Wida / Yaum-e-Quds"
  },
  {
    "date": "2026-03-20",
    "title": "Eid-Ul-Fitr"
  },
  {
    "date": "2026-03-27",
    "title": "Mourning: Jannat-ul-Baqee demolished by Aal-e-Saud (Aal-e-Yazeed)"
  },
  {
    "date": "2026-03-29",
    "title": "Ghaibat Kubra (Imam Aakhir-uz-Zaman AS) began"
  },
  {
    "date": "2026-04-05",
    "title": "Battle of Uhud was fought"
  },
  {
    "date": "2026-04-13",
    "title": "Martyrdom: Imam Jafar-us-Sadiq (AS)"
  },
  {
    "date": "2026-04-28",
    "title": "Wiladat: Imam Ali Raza (AS)"
  },
  {
    "date": "2026-05-12",
    "title": "Wiladat: Hazrat Ibrahim (AS) and Hazrat Eesaa (AS)"
  },
  {
    "date": "2026-05-16",
    "title": "Martyrdom: Imam Mohammad Taqi (AS)"
  },
  {
    "date": "2026-05-18",
    "title": "Wedding: Imam Ali (AS) and Bibi Fatima Zehra (SA)"
  },
  {
    "date": "2026-05-20",
    "title": "Allah accepted Hazrat Adam's (AS) dua"
  },
  {
    "date": "2026-05-22",
    "title": "Wafat: Hazrat Abu Zur Ghaffari (RA)"
  },
  {
    "date": "2026-05-24",
    "title": "Martyrdom: Imam Mohammad Baqir (AS)"
  },
  {
    "date": "2026-05-25",
    "title": "Imam Hussain (AS) left Makkah towards Karbala"
  },
  {
    "date": "2026-05-26",
    "title": "Martyrdom: Hazrat Muslim Ibne Aqeel (AS) / Yaum-e-Arafat"
  },
  {
    "date": "2026-05-27",
    "title": "Eid-ul-Azha"
  },
  {
    "date": "2026-06-01",
    "title": "Wiladat: Imam Ali-an-Naqi (AS)"
  },
  {
    "date": "2026-06-04",
    "title": "Eid Al-Ghadir"
  },
  {
    "date": "2026-06-18",
    "title": "Imam Hussain (AS) reached Karbala"
  },
  {
    "date": "2026-06-26",
    "title": "Ashoora-e-Muharram/Martyrdom: Imam Hussain (AS)"
  },
  {
    "date": "2026-06-28",
    "title": "Soyem Shuhada-e-Karbala (AS)"
  },
  {
    "date": "2026-07-11",
    "title": "Martyrdom: Imam Zain-ul-Abideen (AS)"
  },
  {
    "date": "2026-07-13",
    "title": "Martyrdom: Hazrat Mesam-e-Tammar (RA)"
  },
  {
    "date": "2026-07-23",
    "title": "Wiladat: Imam Moosa Kazim (AS)"
  },
  {
    "date": "2026-07-25",
    "title": "Battle of Naharwan was won"
  },
  {
    "date": "2026-07-29",
    "title": "Martyrdom: Bibi Sakina (SA) binte Hussain (AS)"
  },
  {
    "date": "2026-08-02",
    "title": "Martyrdom: Imam Ali Raza (AS)"
  },
  {
    "date": "2026-08-05",
    "title": "Arbaeen-e-Shuhada-e-Karbala  (AS)"
  },
  {
    "date": "2026-08-09",
    "title": "Martyrdom: BiBi Zainab (SA) (ref)"
  },
  {
    "date": "2026-08-13",
    "title": "Wafat: Hazrat Mohammad Mustafa (SAWW) /Martyrdom: Imam Hasan (AS"
  },
  {
    "date": "2026-08-18",
    "title": "Wafat: Masooma-e-Qum (SA)"
  },
  {
    "date": "2026-08-22",
    "title": "Martyrdom: Imam Hasan Askari (AS)"
  },
  {
    "date": "2026-08-23",
    "title": "Eid-e-Zehra (SA)"
  },
  {
    "date": "2026-08-31",
    "title": "Wiladat: Hazrat Mohammad Mustafa (SAWW) / Wiladat: Imam Ja'far-us-Sadiq (AS)"
  },
  {
    "date": "2026-09-01",
    "title": "Wiladat: Bibi Umme Kulsoom binte Ali (SA)"
  },
  {
    "date": "2026-09-23",
    "title": "Wiladat: Imam Hasan Askari (AS)"
  },
  {
    "date": "2026-10-25",
    "title": "Martyrdom: Bibi Sayedda Fatima Zehra (SA)"
  },
  {
    "date": "2026-11-14",
    "title": "Martyrdom: Bibi Sayedda Fatima Zehra (SA)"
  },
  {
    "date": "2026-11-21",
    "title": "Battle of Mu'ta & Martyrdom of Jaafar alTayyar, yr 8 AH."
  },
  {
    "date": "2026-12-01",
    "title": "Wiladat: Shehzadi Bibi Sayyedda Fatima Zehra (SA)"
  },
  {
    "date": "2026-12-11",
    "title": "Wiladat: Imam Mohammad Baqir (AS)"
  },
  {
    "date": "2026-12-13",
    "title": "Martyrdom: Imam Ali Naqi (AS)"
  },
  {
    "date": "2026-12-15",
    "title": "Wiladat: Imam Ali Naqi (AS)"
  },
  {
    "date": "2026-12-19",
    "title": "Wiladat: Hazrat Ali Asghar Ibne Hussain (AS)"
  },
  {
    "date": "2026-12-20",
    "title": "Wiladat: Imam Mohammad Taqi (AS)"
  },
  {
    "date": "2026-12-23",
    "title": "Wiladat: Imam Ali Ibne Abu Talib (AS)"
  }
];

const formattedEvents = rawEvents.map(e => {
  let type = 'Event';
  if (e.title.toLowerCase().includes('wiladat')) type = 'Wiladat';
  else if (e.title.toLowerCase().includes('martyrdom') || e.title.toLowerCase().includes('wafat')) type = 'Shahadat';
  else if (e.title.toLowerCase().includes('eid')) type = 'Eid';
  
  return `  {
    date: '${e.date}',
    title: '${e.title.replace(/'/g, "\\'")}',
    description: '',
    type: '${type}'
  }`;
}).join(',\n');

const output = `export const EVENTS: IslamicEvent[] = [\n${formattedEvents}\n];\n`;
fs.writeFileSync('new_events.ts', output);
console.log('Done');
