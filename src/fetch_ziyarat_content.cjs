const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const html = await fetchUrl('https://www.ya-mahdi.net/view.php?cat=maf_ziy124&lang=en');
    const lines = html.split('\n');
    let inContent = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("class='arabic")) {
        console.log(lines[i].trim());
        console.log(lines[i+1]?.trim());
        console.log(lines[i+2]?.trim());
        break;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

run();
