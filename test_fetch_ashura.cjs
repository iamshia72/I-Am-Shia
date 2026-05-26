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
    const html = await fetchUrl('https://www.duas.org/ziyarat-imam-hussain-ashura.html');
    console.log(html.substring(5000, 15000)); 
  } catch (e) {
    console.error(e.message);
  }
}

main();
