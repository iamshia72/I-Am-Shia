const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/ziyarats.json', 'utf8'));
const idCount = {};
data.forEach(item => {
  idCount[item.id] = (idCount[item.id] || 0) + 1;
});
const duplicates = Object.keys(idCount).filter(id => idCount[id] > 1);
if (duplicates.length > 0) {
  console.log('Duplicate IDs found:', duplicates);
  duplicates.forEach(id => console.log(`${id}: ${idCount[id]}`));
} else {
  console.log('No duplicate IDs found.');
}
