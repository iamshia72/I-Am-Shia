import fs from 'fs';

const path = 'src/data/namaz.json';
const content = fs.readFileSync(path, 'utf8');
const data = JSON.parse(content);

// Find Ghufaylah and update titles
const ghufaylah = data.find((item: any) => item.id === 'namaz-ghufaylah');
if (ghufaylah) {
  ghufaylah.sections[0].title = "Benefits";
  ghufaylah.sections[1].title = "Method";
  ghufaylah.sections[2].title = "1st Raka'at";
  ghufaylah.sections[3].title = "2nd Raka'at";
  ghufaylah.sections[4].title = "Qunoot";
}

// Find Wahshat and update titles
const wahshat = data.find((item: any) => item.id === 'namaz-wahshat');
if (wahshat) {
  wahshat.sections[0].title = "Importance";
  wahshat.sections[1].title = "Method";
  wahshat.sections[2].title = "Ayatul Kursi";
  wahshat.sections[3].title = "Surah al-Qadr";
  wahshat.sections[4].title = "Supplication";
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Updated Namaz titles successfully');
