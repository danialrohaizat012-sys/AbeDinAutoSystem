// Abe Din Auto – Post kereta ke Facebook Page, Instagram & Threads (owner sahaja). V119 draf.
const FN = 'https://buzpdyvvoiqgbeventwm.supabase.co/functions/v1/';
const KEY = 'sb_publishable_zuuNipsMpalN_38SJwXpFA_MRzQ6eZ0';
const PLAT = [['facebook', 'Facebook Page'], ['instagram', 'Instagram'], ['threads', 'Threads']];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function callFn(client, name, body) {
  const { data } = await client.auth.getSession();
  const r = await fetch(FN + name, { method: 'POST', headers: { 'content-type': 'application/json', apikey: KEY, authorization: 'Bearer ' + (data?.session?.access_token || '') }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Permintaan gagal (' + r.status + ')');
  return j;
}

const CSS = `.sp-ov{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}
.sp-box{background:#161b1e;color:#f1f2ee;width:min(560px,100%);max-height:92vh;overflow:auto;border-radius:18px 18px 0 0;padding:18px;box-sizing:border-box;font:14px system-ui,sans-serif}
html.ada-light .sp-box{background:#fff;color:#21323b}
.sp-box h3{margin:0 0 4px;font-size:18px}.sp-muted{color:#9aa7ac;font-size:12.5px}
.sp-img{width:100%;max-height:240px;object-fit:cover;border-radius:12px;margin:10px 0;background:#222}
.sp-box textarea,.sp-box input[type=text],.sp-box input[type=password]{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid #526066;background:#222a2f;color:inherit;padding:10px;font:inherit}
html.ada-light .sp-box textarea,html.ada-light .sp-box input{background:#fff;border-color:#a5b6c5}
.sp-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}
.sp-chip{display:inline-flex;gap:6px;align-items:center;border:1px solid #343d41;border-radius:999px;padding:7px 12px}
.sp-chip.off{opacity:.5}
.sp-btn{border:0;border-radius:10px;padding:11px 14px;font-weight:700;cursor:pointer;background:#303b41;color:#e1e9ec}
.sp-btn.pri{background:#d7b468;color:#161b1e}.sp-btn:disabled{opacity:.6}
.sp-res{margin-top:10px;display:grid;gap:6px}.sp-res div{padding:8px 10px;border-radius:9px;background:#22302f}.sp-res .bad{background:#382927}
.sp-box details{margin-top:14px;border-top:1px solid #343d41;padding-top:10px}.sp-box summary{cursor:pointer;font-weight:700}
.sp-box label{display:block;margin:8px 0 3px;font-size:12.5px;color:#9aa7ac}`;

export async function openSocialPost({ client, vehicle }) {
  if (!document.getElementById('sp-css')) { const st = document.createElement('style'); st.id = 'sp-css'; st.textContent = CSS; document.head.append(st); }
  document.querySelector('.sp-ov')?.remove();
  const vid = vehicle.vehicle_id;
  const link = location.origin + '/k/' + encodeURIComponent(vid) + '/';
  const label = [vehicle.make, vehicle.model, vehicle.model_year].filter(Boolean).join(' ');
  const price = Number(vehicle.promo_price > 0 && vehicle.promo_price < vehicle.asking_price ? vehicle.promo_price : vehicle.asking_price || 0);
  const ov = document.createElement('div'); ov.className = 'sp-ov';
  ov.innerHTML = `<div class="sp-box" role="dialog" aria-label="Post ke media sosial">
   <div class="sp-row" style="justify-content:space-between;margin:0"><h3>📣 Post ke Media Sosial</h3><button class="sp-btn" data-x>✕</button></div>
   <div class="sp-muted">${esc(label)} · ${esc(vid)} · DRAF — semak sebelum post</div>
   <img class="sp-img" alt="" hidden>
   <div class="sp-row"><button class="sp-btn" data-ai>✨ Jana ayat AI</button><span class="sp-muted" data-aimsg></span></div>
   <textarea rows="7" data-cap></textarea>
   <div class="sp-muted">Link kereta disertakan di hujung. Instagram tidak benarkan link boleh-tekan dalam kapsyen.</div>
   <div class="sp-row" data-plats></div>
   <button class="sp-btn pri" data-go style="width:100%">Ya, Post Sekarang</button>
   <div class="sp-res" data-res></div>
   <details data-hist><summary>Sejarah post kereta ini</summary><div class="sp-res" data-histlist><span class="sp-muted">Memuatkan…</span></div></details>
   <details data-cfg><summary>⚙️ Sambung akaun (sekali sahaja)</summary>
    <p class="sp-muted">Isi dari Meta App anda. Token disimpan di server dan tidak dipaparkan semula. Biarkan kosong untuk kekalkan nilai lama; taip "-" untuk padam.</p>
    <label>Facebook Page ID</label><input type="text" data-k="fb_page_id" autocomplete="off">
    <label>Page Access Token (juga digunakan untuk Instagram)</label><input type="password" data-k="fb_page_token" autocomplete="off">
    <label>Instagram Business Account ID</label><input type="text" data-k="ig_user_id" autocomplete="off">
    <label>Threads User ID</label><input type="text" data-k="threads_user_id" autocomplete="off">
    <label>Threads Access Token</label><input type="password" data-k="threads_token" autocomplete="off">
    <div class="sp-row"><button class="sp-btn pri" data-save>Simpan sambungan</button><span class="sp-muted" data-savemsg></span></div>
   </details></div>`;
  document.body.append(ov);
  const $ = s => ov.querySelector(s);
  const close = () => ov.remove();
  $('[data-x]').onclick = close; ov.onclick = e => { if (e.target === ov) close(); };
  const cap = $('[data-cap]');
  cap.value = `🚗 ${label}\n💰 RM ${price.toLocaleString('en-MY')}\n📍 Abe Din Auto, Kota Bharu\n\nGambar & maklumat penuh 👉 ${link}`;

  // gambar cover
  try {
    const { data } = await client.rpc('get_public_catalogue', { p_vehicle_id: vid });
    const car = (Array.isArray(data) ? data : []).find(x => x.vehicle_id === vid);
    const imgs = Array.isArray(car?.images) ? car.images : []; const cv = imgs.find(x => x.is_cover) || imgs[0];
    if (cv?.storage_path) { const im = $('.sp-img'); im.src = 'https://buzpdyvvoiqgbeventwm.supabase.co/storage/v1/object/public/vehicle-images/' + cv.storage_path.split('/').map(encodeURIComponent).join('/'); im.hidden = false; }
    else $('[data-res]').innerHTML = '<div class="bad">Kereta ini belum ada gambar — tambah gambar dahulu.</div>';
  } catch (_) {}

  // status sambungan
  let st = {};
  async function loadStatus() {
    try { const { data } = await client.rpc('owner_social_config_status_v1'); st = data || {}; } catch (_) { st = {}; }
    const box = $('[data-plats]'); box.innerHTML = '';
    for (const [k, n] of PLAT) {
      const l = document.createElement('label'); l.className = 'sp-chip' + (st[k] ? '' : ' off');
      l.innerHTML = `<input type="checkbox" value="${k}" ${st[k] ? 'checked' : 'disabled'}> ${n}${st[k] ? '' : ' <small>(belum disambung)</small>'}`;
      box.append(l);
    }
    if (!PLAT.some(([k]) => st[k])) $('[data-cfg]').open = true;
  }
  await loadStatus();

  $('[data-ai]').onclick = async () => {
    const b = $('[data-ai]'), m = $('[data-aimsg]'); b.disabled = true; m.textContent = 'AI sedang menulis…';
    try { const j = await callFn(client, 'agent-promo-ai', { mode: 'car', vehicle_id: vid }); cap.value = j.ayat + `\n\nGambar & maklumat penuh 👉 ${link}`; m.textContent = 'Tekan lagi untuk ayat lain.'; }
    catch (e) { m.textContent = e.message; } finally { b.disabled = false; }
  };

  $('[data-go]').onclick = async () => {
    const plats = [...ov.querySelectorAll('[data-plats] input:checked')].map(x => x.value);
    if (!plats.length) return alert('Pilih sekurang-kurangnya satu platform yang sudah disambung.');
    if (!cap.value.trim()) return alert('Kapsyen kosong.');
    if (!confirm('Post kereta ini ke ' + plats.map(p => PLAT.find(x => x[0] === p)[1]).join(', ') + ' sekarang?')) return;
    const b = $('[data-go]'); b.disabled = true; b.textContent = 'Sedang post…';
    const res = $('[data-res]'); res.innerHTML = '';
    try {
      const j = await callFn(client, 'social-post', { vehicle_id: vid, caption: cap.value.trim(), platforms: plats });
      for (const [k, r] of Object.entries(j.results || {})) {
        const d = document.createElement('div'); if (!r.ok) d.className = 'bad';
        d.textContent = (r.ok ? '✅ ' : '❌ ') + PLAT.find(x => x[0] === k)[1] + (r.ok ? ' — berjaya' : ' — ' + r.error); res.append(d);
      }
      loadHist();
    } catch (e) { res.innerHTML = `<div class="bad">❌ ${esc(e.message)}</div>`; }
    finally { b.disabled = false; b.textContent = 'Ya, Post Sekarang'; }
  };

  $('[data-save]').onclick = async () => {
    const p = {}; ov.querySelectorAll('[data-k]').forEach(i => { if (i.value.trim()) p[i.dataset.k] = i.value.trim(); });
    const m = $('[data-savemsg]'); if (!Object.keys(p).length) { m.textContent = 'Tiada perubahan.'; return; }
    try { const { error } = await client.rpc('owner_social_config_set_v1', { p }); if (error) throw error; ov.querySelectorAll('[data-k]').forEach(i => i.value = ''); m.textContent = '✓ Disimpan.'; await loadStatus(); }
    catch (e) { m.textContent = e.message; }
  };

  async function loadHist() {
    const box = $('[data-histlist]');
    const { data, error } = await client.from('social_posts').select('platform,status,error,created_at').eq('vehicle_id', vid).order('created_at', { ascending: false }).limit(10);
    if (error) { box.innerHTML = '<span class="sp-muted">Tidak dapat dimuat.</span>'; return; }
    box.innerHTML = (data || []).length ? data.map(r => `<div class="${r.status === 'ok' ? '' : 'bad'}">${r.status === 'ok' ? '✅' : '❌'} ${esc(PLAT.find(x => x[0] === r.platform)?.[1] || r.platform)} · ${new Date(r.created_at).toLocaleString('ms-MY')}${r.error ? ' · ' + esc(r.error) : ''}</div>`).join('') : '<span class="sp-muted">Belum pernah dipost.</span>';
  }
  loadHist();
}
