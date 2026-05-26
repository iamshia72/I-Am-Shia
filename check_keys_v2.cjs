const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('.map(') && !line.includes('Set(')) {
    // Check if subsequent lines have key=
    let foundKey = false;
    for (let i = 0; i < 15; i++) {
        if (lines[index + i] && lines[index + i].includes('key=')) {
            foundKey = true;
            break;
        }
    }
    if (!foundKey) {
        console.log(`Potential missing key at line ${index + 1}: ${line.trim()}`);
    }
  }
});
