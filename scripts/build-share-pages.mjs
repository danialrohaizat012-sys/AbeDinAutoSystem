// Jana halaman kongsi statik /k/<ID>/index.html dengan tag Open Graph,
// supaya WhatsApp/Facebook papar gambar kereta sebagai thumbnail.
// Guna: node scripts/build-share-pages.mjs            (ambil data dari Supabase)
//       node scripts/build-share-pages.mjs data.json  (guna fail JSON)
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'k');
const SITE = 'https://abedinauto.my';
const PROJECT = 'https://buzpdyvvoiqgbeventwm.supabase.co';
const KEY = 'sb_publishable_zuuNipsMpalN_38SJwXpFA_MRzQ6eZ0';
const BUCKET = PROJECT + '/storage/v1/object/public/vehicle-images/';
const FALLBACK_IMG = SITE + '/catalogue-hero-showroom.png';

async function loadCars() {
  if (process.argv[2]) return JSON.parse(await readFile(process.argv[2], 'utf8'));
  const r = await fetch(PROJECT + '/rest/v1/rpc/get_public_catalogue', {
    method: 'POST',
    headers: { apikey: KEY, authorization: 'Bearer ' + KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ p_vehicle_id: null }),
  });
  if (!r.ok) throw new Error('get_public_catalogue ' + r.status + ': ' + (await r.text()));
  return r.json();
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const rm0 = (n) => 'RM ' + Number(n).toLocaleString('en-MY', { maximumFractionDigits: 0 });

function coverOf(car) {
  const imgs = Array.isArray(car.images) ? car.images.filter((x) => x && x.storage_path) : [];
  imgs.sort((a, b) => (b.is_cover === true) - (a.is_cover === true) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return imgs.length ? BUCKET + imgs[0].storage_path.split('/').map(encodeURIComponent).join('/') : FALLBACK_IMG;
}

function page(car) {
  const id = car.vehicle_id;
  const name = [car.make, car.model, car.model_year].filter(Boolean).join(' ');
  const price = car.asking_price ? rm0(car.asking_price) : '';
  const title = [name, price].filter(Boolean).join(' – ') + ' | Abe Din Auto';
  const bits = [car.model_year && 'Tahun ' + car.model_year, car.mileage_km && Number(car.mileage_km).toLocaleString('en-MY') + ' km', price && 'Harga ' + price];
  const desc = bits.filter(Boolean).join(' · ') + '. Tekan untuk lihat gambar & maklumat penuh di Abe Din Auto, Kota Bharu.';
  const img = coverOf(car);
  const url = SITE + '/k/' + encodeURIComponent(id) + '/';
  const target = '/?car=' + encodeURIComponent(id);
  return `<!doctype html>
<html lang="ms"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Abe Din Auto">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:secure_url" content="${esc(img)}">
<meta property="og:image:alt" content="${esc(name)}">
<meta property="og:locale" content="ms_MY">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(img)}">
<link rel="canonical" href="${esc(url)}">
<style>html,body{margin:0;background:#101419;color:#fff;font-family:system-ui,sans-serif}a{color:#9cc3ff}</style>
<script>(function(){var q=new URLSearchParams(location.search),t=${JSON.stringify(target)},r=q.get('ref');if(r)t+='&ref='+encodeURIComponent(r);location.replace(t+location.hash)})();</script>
</head><body><p style="padding:24px">Membuka <a href="${esc(target)}">${esc(name || id)}</a>…</p></body></html>
`;
}

const cars = (await loadCars()).filter((c) => c && typeof c.vehicle_id === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(c.vehicle_id));
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const car of cars) {
  const dir = join(OUT, car.vehicle_id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page(car));
}
console.log('Halaman kongsi dijana:', cars.length);
