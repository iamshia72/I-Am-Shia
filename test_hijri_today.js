const date = new Date();
const parts = new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).formatToParts(date);
console.log(parts);
