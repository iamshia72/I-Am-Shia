import https from 'https';

https.get('https://www.ya-mahdi.net/category.php?code=maf_ziy&lang=en', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data.substring(2000, 4000));
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
