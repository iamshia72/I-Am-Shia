import fs from 'fs';

const filePath = 'src/data/duas.json';
let content = fs.readFileSync(filePath, 'utf8');

// Remove the problematic byte order marks or invalid characters around the broken areas
// Line 16496 corresponds to this pattern
content = content.replace(/\]\ufffd\u064eا كَافِىَ مُوْسٰی فِرْعَوْنَ\",/g, '          },\n          {\n            "arabic": "يَا كَافِيَ مُوسَىٰ فِرْعَوْنَ",');

// Also remove any other stray broken markers starting with ] at line start
content = content.replace(/^\].*$/gm, (match) => {
    if (match === ']') return match; // Keep the real EOF
    return '          },'; // Replace others with a closing brace
});

fs.writeFileSync(filePath, content);
console.log('Fixed JSON successfully');
