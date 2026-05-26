const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('.map(') && !line.includes('Number') && !line.includes('Set(') && !line.includes('sort(')) {
        let hasKey = false;
        let bracketCount = 0;
        let searchRange = 20; // Look ahead 20 lines
        for (let j = 0; j < searchRange && (i + j) < lines.length; j++) {
            const nextLine = lines[i + j];
            if (nextLine.includes('key=')) {
                hasKey = true;
                break;
            }
            // If we find the closing paren of the map, stop
            if (nextLine.includes(')')) {
                // simple check for closing
            }
        }
        if (!hasKey) {
            console.log(`Potential missing key at line ${i + 1}: ${line.trim()}`);
            // Show a bit of context
            for (let k = 0; k < 5; k++) {
                if (lines[i+k]) console.log(`  ${i+1+k}: ${lines[i+k].trim()}`);
            }
        }
    }
}
