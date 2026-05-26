const fs = require('fs');

const html = fs.readFileSync('imam_hassan_page.html', 'utf8');

const extractLines = (content) => {
    const lines = [];
    const araRegex = /<div class="Ara"><a1>([\s\S]*?)<\/a1><\/div>/g;
    const trlRegex = /<div class="Trl"><t2>([\s\S]*?)(?:<\/t2>|<\/div>)/g;
    const traRegex = /<div class="Tra"><t1>([\s\S]*?)(?:<\/t1>|<\/div>)/g;

    const aras = [];
    let match;
    while ((match = araRegex.exec(content)) !== null) aras.push(match[1].trim());

    const trls = [];
    while ((match = trlRegex.exec(content)) !== null) trls.push(match[1].trim());

    const tras = [];
    while ((match = traRegex.exec(content)) !== null) tras.push(match[1].trim());

    const length = Math.max(aras.length, trls.length, tras.length);
    for (let i = 0; i < length; i++) {
        lines.push({
            arabic: aras[i] || '',
            transliteration: trls[i] || '',
            english: tras[i] || '',
            urdu: ''
        });
    }
    return lines;
};

// Extract sections
const oneaMatch = html.match(/id="onea"([\s\S]*?)id="two"/);
const oneaContent = oneaMatch ? oneaMatch[1] : '';

const twoMatch = html.match(/id="two"([\s\S]*?)id="three"/);
const twoContent = twoMatch ? twoMatch[1] : '';

const threeMatch = html.match(/id="three"([\s\S]*?)id="four"/);
const threeContent = threeMatch ? threeMatch[1] : '';

const ziyarat = {
    id: "ziyarat-imam-hassan",
    title: "Ziyarah of Imam Hassan Mujtaba (as)",
    description: "Ziyahat of Imam Hassan (as) including the general Baqi Ziyarah and special Monday Ziyarah.",
    category: "Special",
    sections: [
        {
            title: "Baqi Ziyarah",
            audioUrl: "https://mp3.duas.org/ziyarat/Baqi_ziarat.mp3",
            lines: extractLines(oneaContent)
        },
        {
            title: "Monday Ziyarah",
            audioUrl: "https://mp3.duas.org/Day_of_week/Monday%20Dua%20-%20AbdulHayy%20Al%20Qambar.mp3",
            lines: extractLines(twoContent)
        },
        {
            title: "Salawat",
            audioUrl: "https://mp3.duas.org/Salwat%20Imam%20Hassan%20Hussain.mp4",
            lines: extractLines(threeContent)
        }
    ]
};

fs.writeFileSync('extracted_hassan.json', JSON.stringify(ziyarat, null, 2));
console.log('Extracted ' + ziyarat.sections[0].lines.length + ' / ' + ziyarat.sections[1].lines.length + ' / ' + ziyarat.sections[2].lines.length + ' lines.');
