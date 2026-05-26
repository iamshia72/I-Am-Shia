const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  try {
    const html = await fetchUrl('https://www.duas.org/ziyarat.html');
    // Extract links like <a href="...">...</a>
    const links = [];
    const regex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const href = match[1];
      const text = match[2].replace(/<[^>]*>?/gm, '').trim();
      if (href.includes('.htm') || href.includes('.php')) {
        links.push({ href, text });
      }
    }
    console.log(JSON.stringify(links, null, 2));
  } catch (e) {
    console.error(e.message);
  }
}

main();
