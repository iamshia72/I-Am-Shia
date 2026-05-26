const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('.map(')) {
        // Skip common data-only maps
        if (line.includes('Number') || line.includes('Set(') || line.includes('Math.') || line.includes('safeStringify')) continue;
        
        // Find if next few lines have a key= OR if it's a data transformation (returns object without JSX)
        let hasKey = false;
        let isJSX = false;
        let searchRange = 10;
        for (let j = 0; j < searchRange && (i + j) < lines.length; j++) {
            const nextLine = lines[i + j];
            if (nextLine.includes('key=')) {
                hasKey = true;
                break;
            }
            if (nextLine.includes('<') && !nextLine.includes('<=') && !nextLine.includes('=>')) {
                isJSX = true;
            }
        }
        if (isJSX && !hasKey) {
            console.log(`Line ${i + 1}: ${line.trim()}`);
            for(let k=0; k<5; k++) if(lines[i+k]) console.log(`  ${lines[i+k].trim()}`);
        }
    }
}
