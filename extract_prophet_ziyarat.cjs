const fs = require('fs');
const html = fs.readFileSync('prophet_ziyarat.html', 'utf8');

function clean(text) {
    if (!text) return "";
    return text.trim().replace(/\s+/g, ' ').replace(/<[^>]*>?/gm, '');
}

function extractLinesFromHtml(sectionHtml) {
    const lines = [];
    const elements = [];
    
    // Find Ara, Trl, Tra divs
    const divRegex = /<div[^>]*class="(Ara|Trl|Tra)"[^>]*>([\s\S]*?)<\/div>/gi;
    let match;
    while ((match = divRegex.exec(sectionHtml)) !== null) {
        elements.push({
            type: match[1],
            content: match[2],
            index: match.index
        });
    }

    // Find headers (between <audio> and the first <div class="Ara"> or between text blocks)
    // Looking for <b>...</b> or text outside of divs
    const titleRegex = /<b>(.*?)<\/b>|<u>(.*?)<\/u>/gi;
    while ((match = titleRegex.exec(sectionHtml)) !== null) {
        const titleText = clean(match[1] || match[2]);
        if (titleText && titleText.length > 5 && !titleText.toLowerCase().includes('arabic') && !titleText.toLowerCase().includes('translation')) {
            elements.push({
                type: 'Title',
                content: titleText,
                index: match.index
            });
        }
    }

    elements.sort((a, b) => a.index - b.index);

    let currentAra = null;
    let currentTrl = null;
    let currentTra = null;

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.type === 'Title') {
            lines.push({ isSeparator: true, english: el.content });
            continue;
        }

        if (el.type === 'Ara') {
            if (currentAra) {
                pushLines(lines, currentAra, currentTrl, currentTra);
                currentTrl = null;
                currentTra = null;
            }
            currentAra = el.content;
        } else if (el.type === 'Trl') {
            currentTrl = el.content;
        } else if (el.type === 'Tra') {
            currentTra = el.content;
            pushLines(lines, currentAra, currentTrl, currentTra);
            currentAra = null;
            currentTrl = null;
            currentTra = null;
        }
    }

    if (currentAra) {
        pushLines(lines, currentAra, currentTrl, currentTra);
    }

    return lines;
}

function pushLines(lines, ara, trl, tra) {
    if (!ara) return;
    const araClean = clean(ara);
    const trlClean = clean(trl);
    const traClean = clean(tra);

    const araLines = araClean.split(/\n/).map(l => l.trim()).filter(l => l);
    const trlLines = trlClean.split(/\n/).map(l => l.trim()).filter(l => l);
    const traLines = traClean.split(/\n/).map(l => l.trim()).filter(l => l);

    const maxLines = Math.max(araLines.length, trlLines.length, traLines.length);
    
    if (maxLines <= 1) {
        lines.push({
            arabic: araClean,
            english: traClean,
            transliteration: trlClean,
            urdu: ""
        });
    } else {
        for (let j = 0; j < maxLines; j++) {
            if (araLines[j] || traLines[j]) {
                lines.push({
                    arabic: araLines[j] || "",
                    english: traLines[j] || "",
                    transliteration: trlLines[j] || "",
                    urdu: ""
                });
            }
        }
    }
}

function getTabContent(id) {
    const startTag = `id="${id}"`;
    const startIndex = html.indexOf(startTag);
    if (startIndex === -1) return "";
    
    // Find the next tab-pane start or the end of tab-content
    let nextIndex = html.indexOf('class="tab-pane', startIndex + startTag.length);
    if (nextIndex === -1) {
        nextIndex = html.indexOf('<!-- PANES "ONE" CONTENT END -->', startIndex);
    }
    if (nextIndex === -1) {
        nextIndex = html.indexOf('</article>', startIndex);
    }

    const content = html.substring(startIndex, nextIndex);
    // console.log(`Debug: Captured ${content.length} chars for ${id}`);
    return content;
}

const sections = [];

// Tab 2: Ziyarat shrine
sections.push({
    title: "Ziyarat at Shrine",
    lines: extractLinesFromHtml(getTabContent('two'))
});

// Tab 3: Ziarat-17 Rabiul Awal-Distance
sections.push({
    title: "Ziyarat from Distance",
    lines: extractLinesFromHtml(getTabContent('three'))
});

// Tab 4: Salwat
sections.push({
    title: "Salwat of Holy Prophet (saw)",
    lines: extractLinesFromHtml(getTabContent('four'))
});

// Tab 4a: 17 Rabiul Awal-Iqbal
sections.push({
    title: "Ziyarat for 17th Rabiul Awwal",
    lines: extractLinesFromHtml(getTabContent('foura'))
});

const ziyarat = {
    id: "holy-prophet-saw-comprehensive",
    title: "Ziyarat of the Holy Prophet (saw)",
    description: "Comprehensive Ziyarat of the Holy Prophet (saw) including shrine visitation, distance recitation, and special salutations.",
    category: "Special",
    type: "ziyarat",
    audioUrl: "https://mp3.duas.org/ziyarat/Ziyarat_of_the_Prophet_Muhammad_saw.mp3",
    sections: sections
};

console.log(JSON.stringify(ziyarat, null, 2));
