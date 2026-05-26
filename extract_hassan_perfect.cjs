const fs = require('fs');

const html = fs.readFileSync('imam_hassan_page.html', 'utf8');

const parseSection = (content) => {
    const lines = [];
    
    // Normalize content: remove scripts, navs, etc.
    content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<ul class=\"nav[\s\S]*?<\/ul>/gi, '');
    content = content.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
    content = content.replace(/<audio[\s\S]*?<\/audio>/gi, '');
    content = content.replace(/<a target=\"_blank\" href=\"https:\/\/www.duas.org\/ziaratbaqi.htm\"> Seperate Baqi Ziyarat page<\/a>/gi, '');

    // Tokenize by blocks
    // We look for Ara blocks
    const parts = content.split(/<div class=\"Ara\">/);
    
    // The first part is text before any Arabic
    if (parts[0]) {
        extractTextBlocks(parts[0]).forEach(block => lines.push(block));
    }

    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        // part starts with <a1>...
        const araMatch = part.match(/<a1>([\s\S]*?)<\/a1><\/div>/);
        const trlMatch = part.match(/<div class=\"Trl\"><t2>([\s\S]*?)(?:<\/t2>|<\/div>)/);
        const traMatch = part.match(/<div class=\"Tra\"><t1>([\s\S]*?)(?:<\/t1>|<\/div>)/);

        if (araMatch) {
            lines.push({
                arabic: araMatch[1].trim(),
                transliteration: trlMatch ? trlMatch[1].trim() : '',
                english: traMatch ? traMatch[1].trim() : '',
                urdu: ''
            });
        }

        // Text after this block until the next Ara block (if any)
        const traEndIndex = part.indexOf('</div></t1>');
        const traEndIndex2 = part.indexOf('</div></div>'); 
        let traEnd = -1;
        if (traEndIndex !== -1) traEnd = traEndIndex + 11;
        else if (traEndIndex2 !== -1) traEnd = traEndIndex2 + 12;

        if (traEnd !== -1) {
            const extra = part.substring(traEnd);
            extractTextBlocks(extra).forEach(block => lines.push(block));
        }
    }

    return lines;
};

const extractTextBlocks = (html) => {
    const blocks = [];
    
    // Split by <br> or <hr> or </p> to get potential blocks
    const subParts = html.split(/<br\s*\/?>|<hr\s*\/?>|<\/p>|<div>|<\/div>|<audio[\s\S]*?<\/audio>/gi);
    
    subParts.forEach(p => {
        let text = p.trim();
        if (!text) return;

        // Skip script residue and role attributes
        if (text.includes('role=') || text.includes('tabpanel') || text.includes('aria-labelledby')) return;
        if (text.includes('Search Quran') || text.includes('Do Not alter')) return;

        // Check if it's a heading (wrapped in <b> or <strong> or <t4>)
        const isBold = /<b>([\s\S]*?)<\/b>|<strong>([\s\S]*?)<\/strong>|<t4>([\s\S]*?)<\/t4>/gi.test(text);
        
        // Clean tags
        text = text.replace(/<[^>]+>/g, '').trim();
        
        if (text && text.length > 5) {
            if (isBold) {
                blocks.push({ english: text, isSeparator: true, urdu: '', arabic: '' });
            } else {
                blocks.push({ english: text, urdu: '', arabic: '' });
            }
        }
    });

    return blocks;
};

const oneaMatch = html.match(/id=\"onea\"([\s\S]*?)id=\"two\"/);
const oneaContent = oneaMatch ? oneaMatch[1] : '';

const twoMatch = html.match(/id=\"two\"([\s\S]*?)id=\"three\"/);
const twoContent = twoMatch ? twoMatch[1] : '';

const threeMatch = html.match(/id=\"three\"([\s\S]*?)id=\"four\"/);
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
            lines: parseSection(oneaContent)
        },
        {
            title: "Monday Ziyarah",
            audioUrl: "https://mp3.duas.org/Day_of_week/Monday%20Dua%20-%20AbdulHayy%20Al%20Qambar.mp3",
            lines: parseSection(twoContent)
        },
        {
            title: "Salawat",
            audioUrl: "https://mp3.duas.org/Salwat%20Imam%20Hassan%20Hussain.mp4",
            lines: parseSection(threeContent)
        }
    ]
};

fs.writeFileSync('extracted_hassan_perfect.json', JSON.stringify(ziyarat, null, 2));
console.log('Extracted ' + ziyarat.sections[0].lines.length + ' / ' + ziyarat.sections[1].lines.length + ' / ' + ziyarat.sections[2].lines.length + ' lines.');
