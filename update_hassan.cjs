const fs = require('fs');

const ziyarat = JSON.parse(fs.readFileSync('extracted_hassan.json', 'utf8'));
const ziyarats = JSON.parse(fs.readFileSync('src/data/ziyarats.json', 'utf8'));

// Check if already exists
const existing = ziyarats.findIndex(z => z.id === ziyarat.id);
if (existing !== -1) {
    ziyarats[existing] = ziyarat;
    console.log('Updated existing ' + ziyarat.id);
} else {
    ziyarats.push(ziyarat);
    console.log('Added new ' + ziyarat.id);
}

fs.writeFileSync('src/data/ziyarats.json', JSON.stringify(ziyarats, null, 2));
console.log('Successfully updated src/data/ziyarats.json');

// Update search index
const searchIndex = JSON.parse(fs.readFileSync('search_index.json', 'utf8'));
const idx = searchIndex.findIndex(i => i.id === ziyarat.id);
const entry = {
    id: ziyarat.id,
    title: ziyarat.title,
    type: 'ziyarat',
    category: ziyarat.category
};
if (idx !== -1) {
    searchIndex[idx] = entry;
} else {
    searchIndex.push(entry);
}

fs.writeFileSync('search_index.json', JSON.stringify(searchIndex, null, 2));
console.log('Successfully updated search_index.json');
