async function check() {
  const res = await fetch('https://api.alquran.cloud/v1/ayah/2:1');
  const data = await res.json();
  console.log(JSON.stringify(data.data.text));
}
check();
