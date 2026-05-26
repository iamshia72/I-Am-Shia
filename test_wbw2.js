import https from 'https';

https.get('https://verses.quran.com/wbw/001_001_002.mp3', (res) => {
  console.log('Status Code:', res.statusCode);
});
