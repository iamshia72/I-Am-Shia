const fs = require('fs');

async function extract() {
    const response = await fetch('https://www.duas.org/mobile/hadith-kisa.html');
    const html = await response.text();
    
    const lines = [];
    const araRegex = /<div class="Ara"><a1>([\s\S]*?)<\/a1><\/div>/g;
    const trlRegex = /<div class="Trl"><t2>([\s\S]*?)<\/div><\/t2>/g;
    const traRegex = /<div class="Tra"><t1>([\s\S]*?)<\/div><\/t1>/g;
    
    let araMatch, trlMatch, traMatch;
    
    // Using a more robust way to match blocks
    const blocks = html.split('<br><div class="Ara">');
    // The first block might contain the first line without the split prefix
    if (blocks[0].includes('<div class="Ara">')) {
        const parts = blocks[0].split('<div class="Ara">');
        blocks[0] = parts[parts.length - 1];
    } else {
        blocks.shift(); // Remove the meta/header part
    }
    
    for (const block of blocks) {
        const fullBlock = '<div class="Ara">' + block;
        const ara = (fullBlock.match(/<div class="Ara"><a1>([\s\S]*?)<\/a1><\/div>/) || [])[1];
        const trl = (fullBlock.match(/<div class="Trl"><t2>([\s\S]*?)<\/div><\/t2>/) || [])[1];
        const tra = (fullBlock.match(/<div class="Tra"><t1>([\s\S]*?)<\/div><\/t1>/) || [])[1];
        
        if (ara && tra) {
            lines.push({
                arabic: ara.trim().replace(/\s+/g, ' '),
                english: tra.trim().replace(/\s+/g, ' '),
                transliteration: (trl || '').trim().replace(/\s+/g, ' '),
                urdu: ""
            });
        }
    }
    
    const dua = {
        id: "hadith-kisa",
        title: "Hadith al-Kisa",
        category: "Special",
        type: "supplication",
        audioUrl: "https://mp3.duas.org/hadithkisa-abather.mp3",
        description: "The Tradition of the Cloak (Hadith al-Kisa) is a narrative of an incident where the Prophet Muhammad (s) assembled Hasan, Husayn, Ali, and Fatima under his cloak. It is highly reliable and recited for blessings and fulfillment of desires.",
        lines: lines
    };
    
    console.log(JSON.stringify(dua, null, 2));
}

extract();
