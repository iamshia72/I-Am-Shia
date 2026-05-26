import https from 'https';

const fetchMonth = (month, year) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'hussainiat.com',
      port: 443,
      path: `/calendar/calendar.asp?month=${month}&year=${year}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', reject);
    req.end();
  });
};

async function run() {
  const events = [];
  for (let m = 1; m <= 12; m++) {
    const html = await fetchMonth(m, 2026);
    const tdRegex = /<td class=textBody2[^>]*>(.*?)<\/td>/gi;
    let tdMatch;
    while ((tdMatch = tdRegex.exec(html)) !== null) {
      const tdContent = tdMatch[1];
      const dayMatch = tdContent.match(/^(\d+)/);
      if (dayMatch) {
        const day = dayMatch[1];
        const eventRegex = /<B><P><FONT[^>]*>(.*?)<\/B>/gi;
        let eventMatch;
        while ((eventMatch = eventRegex.exec(tdContent)) !== null) {
          const eventText = eventMatch[1].trim();
          events.push({
            date: `2026-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            title: eventText
          });
        }
      }
    }
  }
  console.log(JSON.stringify(events, null, 2));
}

run();
