const fs = require('fs');
const path = './src/data/duas.json';
let duas = JSON.parse(fs.readFileSync(path, 'utf8'));

const fixText = (text) => {
    if (!text) return text;
    // Fix Arabic special characters (Private Use Area hamzas)
    let fixed = text
        .replace(/\uE832/g, 'أ')
        .replace(/\uE833/g, 'ؤ')
        .replace(/\uE835/g, 'إ')
        .replace(/\uE837/g, 'آ')
        .replace(/\uFFFD/g, ''); // Remove the replacement character

    // Specific known corruptions from the view_file output:
    fixed = fixed
        .replace(/tusssalliya/g, 'tusalliya')
        .replace(/alkhalsafadai/g, 'al-khalaf')
        .replace(/lii/g, 'salih')
        .replace(/binsafadasih/g, 'bi-nafsihi')
        .replace(/tawaada/g, 'tawahhada')
        .replace(/`arrsafadaa nsafadasah/g, '`arrafta nafsaka')
        .replace(/bin'ialihi/g, 'bi-na\'ilihi')
        .replace(/ataarra`u/g, 'atadarra`u')
        .replace(/`atih/g, 'ta`atihi')
        .replace(/maabbatih/g, 'mahabbatihi')
        .replace(/shukrihim/g, 'shukrihim')
        .replace(/bidnih/g, 'bidinihi')
        .replace(/martah/g, 'mardi\'atihi')
        .replace(/as'aluka biaqqi/g, 'as\'aluka bi-haqqi')
        .replace(/safada/g, '');

    return fixed;
};

duas.forEach(dua => {
    if (dua.id.startsWith('hourly-dua-')) {
        dua.title = fixText(dua.title);
        dua.description = fixText(dua.description);
        dua.lines.forEach(line => {
            line.arabic = fixText(line.arabic);
            line.transliteration = fixText(line.transliteration);
            line.english = fixText(line.english);
            
            // Final polish for transliteration
            if (line.transliteration) {
                line.transliteration = line.transliteration
                    .replace(/  +/g, ' ')
                    .trim();
            }
        });
    }
});

fs.writeFileSync(path, JSON.stringify(duas, null, 2));
console.log('Deep cleaned hourly dua data.');
