const https = require('https');

const urls = [
  'https://www.duas.org/audio/kumayl.mp3',
  'https://www.duas.org/audio/tawassul.mp3',
  'https://www.duas.org/audio/ahd.mp3',
  'https://www.duas.org/audio/nudoob.mp3',
  'https://www.duas.org/audio/mashlool.mp3',
  'https://www.duas.org/audio/z-ashura.mp3',
  'https://www.duas.org/audio/z-warith.mp3',
  'https://www.duas.org/audio/z-aminullah.mp3',
  'https://www.duas.org/audio/z-aleyasin.mp3'
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(url, res.statusCode);
  }).on('error', (e) => {
    console.error(url, e.message);
  });
});
