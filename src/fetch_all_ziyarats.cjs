const https = require('https');
const fs = require('fs');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = 'https://www.ya-mahdi.net/' + redirectUrl;
        }
        resolve(fetchUrl(redirectUrl));
        return;
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseContent(html) {
  const result = [];
  
  // Find all arabic and translation divs
  const regex = /<div class='(arabic[^']*)'[^>]*>(.*?)<\/div>|<div class='(translation[^']*)'[^>]*>(.*?)<\/div>/g;
  let match;
  
  let currentArabic = '';
  let currentTrans = '';
  
  while ((match = regex.exec(html)) !== null) {
    if (match[1] && match[1].includes('arabic')) {
      if (currentArabic) {
        result.push({ arabic: currentArabic, translation: currentTrans });
      }
      currentArabic = match[2].replace(/<[^>]+>/g, '').trim();
      currentTrans = '';
    } else if (match[3] && match[3].includes('translation')) {
      const text = match[4].replace(/<[^>]+>/g, '').trim();
      if (text) {
        if (currentTrans) currentTrans += ' ' + text;
        else currentTrans = text;
      }
    }
  }
  
  if (currentArabic) {
    result.push({ arabic: currentArabic, translation: currentTrans });
  }
  
  return result;
}

async function run() {
  try {
    console.log("Fetching list...");
    const html = await fetchUrl('https://www.ya-mahdi.net/category.php?code=maf_ziy&lang=en');
    const regex = /<a href='([^']+)' class='submenu-item'>([^<]+)<\/a>/g;
    let match;
    const links = [];
    while ((match = regex.exec(html)) !== null) {
      links.push({ url: match[1], title: match[2].trim() });
    }
    
    console.log(`Found ${links.length} ziyarats. Fetching content...`);
    const allZiyarats = [];
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      console.log(`Fetching ${i+1}/${links.length}: ${link.title}`);
      
      const idMatch = link.url.match(/code=([^&]+)/) || link.url.match(/cat=([^&]+)/);
      if (!idMatch) continue;
      const id = idMatch[1];
      
      const enUrl = `https://www.ya-mahdi.net/view.php?cat=${id}&lang=en`;
      const urUrl = `https://www.ya-mahdi.net/view.php?cat=${id}&lang=ur`;
      
      const enHtml = await fetchUrl(enUrl);
      const urHtml = await fetchUrl(urUrl);
      
      const enParsed = parseContent(enHtml);
      const urParsed = parseContent(urHtml);
      
      // Combine
      const combinedLines = [];
      for (let j = 0; j < enParsed.length; j++) {
        const line = {
          arabic: enParsed[j].arabic,
          english: enParsed[j].translation || '',
          urdu: urParsed[j] ? (urParsed[j].translation || '') : ''
        };
        combinedLines.push(line);
      }
      
      allZiyarats.push({
        id: id,
        title: link.title,
        lines: combinedLines,
        category: 'Ziyarat'
      });
      
      // Small delay
      await new Promise(r => setTimeout(r, 500));
    }
    
    fs.writeFileSync('src/data/ziyarats.json', JSON.stringify(allZiyarats, null, 2));
    console.log("Done!");
    
  } catch (e) {
    console.error(e);
  }
}

run();
