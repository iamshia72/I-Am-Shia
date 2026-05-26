const https = require('https');

const urls = [
  'https://www.duas.org/audio/z-ashura.mp3',
  'https://www.duas.org/audio/z-warith.mp3',
  'https://www.duas.org/audio/z-aminullah.mp3',
  'https://www.duas.org/audio/z-aleyasin.mp3',
  'https://www.duas.org/audio/z-jamia.mp3',
  'https://www.duas.org/audio/z-jamiakabira.mp3',
  'https://www.duas.org/audio/z-nahiya.mp3',
  'https://www.duas.org/audio/z-arbaeen.mp3',
  'https://www.duas.org/audio/ziyarat-jamia.mp3',
  'https://www.duas.org/audio/ziyarat-nahiya.mp3',
  'https://www.duas.org/audio/ziyarat-arbaeen.mp3'
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(url, res.statusCode);
  }).on('error', (e) => {
    console.error(url, e.message);
  });
});
