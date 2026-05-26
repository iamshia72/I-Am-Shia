import https from 'https';

https.get('https://api.quran.com/api/v4/verses/by_chapter/1?words=true&audio=7', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.stringify(JSON.parse(data).verses[0], null, 2)));
});
