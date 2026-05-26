const search = async () => {
  const res = await fetch('https://api.alquran.cloud/v1/search/Abraham/all/en');
  const data = await res.json();
  console.log(data.data.matches.slice(0, 2));
};
search();
