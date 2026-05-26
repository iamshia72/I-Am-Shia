const https = require('https');

async function fetchMonth(month, year) {
  return new Promise((resolve, reject) => {
    https.get(`https://hussainiat.com/calendar/calendar.asp?month=${month}&year=${year}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const events = [];
  // We will fetch for year 2024 to get a full cycle of Islamic months mapped to Gregorian?
  // Wait, the hussainiat calendar maps Gregorian months to Islamic events?
  // Let's check the HTML structure of one month.
  const html = await fetchMonth(3, 2026);
  console.log(html);
}

main();
