const https = require('https');

https.get('https://www.ya-mahdi.net/category.php?code=maf_dua&lang=en', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data.substring(0, 2000));
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
