const https = require('https');
const http = require('http');

const url = 'http://www.duas.org/martyrdomali.htm';

const fetch = (targetUrl) => {
  const client = targetUrl.startsWith('https') ? https : http;
  client.get(targetUrl, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      let next = res.headers.location;
      if (!next.startsWith('http')) {
        const parsed = new URL(targetUrl);
        next = parsed.protocol + '//' + parsed.host + next;
      }
      console.error(`Redirecting to ${next}`);
      fetch(next);
      return;
    }
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(data);
    });
  }).on('error', (err) => {
    console.error(err);
  });
};

fetch(url);
