const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
    const html = await fetchUrl('https://www.ya-mahdi.net/category.php?code=maf_ziy&lang=en');
    const regex = /<a href='([^']+)' class='submenu-item'>([^<]+)<\/a>/g;
    let match;
    const links = [];
    while ((match = regex.exec(html)) !== null) {
      links.push({ url: match[1], title: match[2].trim() });
    }
    console.log(`Found ${links.length} ziyarats:`);
    console.log(links);
  } catch (e) {
    console.error(e);
  }
}

run();
