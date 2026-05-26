const fs = require('fs');
const html = fs.readFileSync('ziarat_source.html', 'utf8');

function clean(text) {
    if (!text) return "";
    return text.trim().replace(/\s+/g, ' ').replace(/<[^>]*>?/gm, '');
}

function extractSectionLines(sectionHtml) {
    const lines = [];
    const elements = [];
    
    const divRegex = /<div[^>]*class="(Ara|Trl|Tra)"[^>]*>([\s\S]*?)<\/div>/gi;
    let match;
    while ((match = divRegex.exec(sectionHtml)) !== null) {
        elements.push({
            type: match[1],
            content: match[2],
            index: match.index
        });
    }

    elements.sort((a, b) => a.index - b.index);

    let currentAra = null;
    let currentTrl = null;
    let currentTra = null;

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

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
            if (araLines[j]) {
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

const idOneStart = html.indexOf('id="one"');
const idTwoStart = html.indexOf('id="two"');
const idFourStart = html.indexOf('id="four"');

const section1Html = html.substring(idOneStart, idTwoStart);
const section2Html = html.substring(idTwoStart, idFourStart);

const blocks = section1Html.split(/<hr>/i);
const sections = [];

if (blocks[0]) {
    sections.push({
        title: "Salutations to Prophet (saw)",
        lines: extractSectionLines(blocks[0])
    });
}

if (blocks[1]) {
    sections.push({
        title: "Ziyarat Imam Hussain (as)",
        lines: extractSectionLines(blocks[1])
    });
}

if (blocks[2]) {
    sections.push({
        title: "Ziarat Imam Mahdi (atfs)",
        lines: extractSectionLines(blocks[2])
    });
}

if (blocks[3]) {
    sections.push({
        title: "Imam ar-Ridha (as)",
        lines: extractSectionLines(blocks[3])
    });
}

fs.writeFileSync('sections_after_salat.json', JSON.stringify(sections, null, 2));

const lines2 = extractSectionLines(section2Html);
fs.writeFileSync('lines_tasbih.json', JSON.stringify(lines2, null, 2));
