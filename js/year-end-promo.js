/* AbeDin Auto: public vehicle detail year-end promotion. No polling or Supabase calls. */
(() => {
  'use strict';
  // Show once per catalogue page load, not once per browser tab lifetime.
  // Safari may restore sessionStorage across browser visits, hiding the promotion indefinitely.
  const DEFAULT = {
    enabled:true,popup_delay_seconds:10,badge:'PROMOSI HUJUNG TAHUN • 2026',headline:'JIMAT',highlight:'RM300–RM500!',
    subtitle:'Penghantaran Percuma Seluruh Malaysia',
    description:'Jimat anggaran RM300 hingga RM500 kos penghantaran sempena promosi hujung tahun! Daftar minat hari ini untuk memulakan permohonan kereta pilihan anda.',
    button_text:'SAYA NAK GRAB',whatsapp_text:'Saya nak grab promosi',whatsapp_number:'601156366925',
    disclaimer:'Anggaran penjimatan mengikut lokasi penghantaran. Promosi tertakluk kepada kelayakan, kawasan liputan dan terma.'
  };
  let promotion = {...DEFAULT};
  const esc = v => String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  window.adaSetYearEndPromoConfig = data => {
    if (data && typeof data === 'object') promotion = {...DEFAULT,...data};
    if (!promotion.enabled) {
      if (pending !== null) clearTimeout(pending);
      pending = null;
      close();
    }
  };
  const preview = new URLSearchParams(location.search).get('promo_test') === '1';
  let pending = null;
  let shownThisPage = false;
  const seen = () => shownThisPage;
  const remember = () => { shownThisPage = true; };
  function close() {
    document.getElementById('ada-year-end-promo')?.remove();
    document.body.classList.remove('ada-promo-open');
  }
  function show(carId) {
    const detail = Boolean(carId);
    const catalogue = document.querySelector('#ada-public-catalogue');
    if (!promotion.enabled || (!preview && seen()) || !catalogue ||
        (detail && (!catalogue.classList.contains('abx-detail') || !catalogue.querySelector('.abx-info-card'))) ||
        (!detail && !catalogue.classList.contains('abx-home'))) return;
    const message = String(promotion.whatsapp_text || DEFAULT.whatsapp_text);
    const phone = /^60\d{8,11}$/.test(String(promotion.whatsapp_number||'')) ? promotion.whatsapp_number : DEFAULT.whatsapp_number;
    const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(
      detail ? message + '\nKereta: ' + location.origin + '/?car=' + encodeURIComponent(carId) : message
    );
    const root = document.createElement('div');
    root.id = 'ada-year-end-promo';
    root.className = 'ada-promo-overlay';
    root.innerHTML = `
      <section class="ada-promo-dialog" role="dialog" aria-modal="true" aria-labelledby="ada-promo-title" aria-describedby="ada-promo-copy">
        <button class="ada-promo-close" type="button" aria-label="Tutup promosi">×</button>
        <div class="ada-promo-tag">${esc(promotion.badge)}</div>
        <div class="ada-promo-icon" aria-hidden="true">🚚</div>
        <h2 id="ada-promo-title">${esc(promotion.headline)}<br><span>${esc(promotion.highlight)}</span></h2>
        <p class="ada-promo-region">${esc(promotion.subtitle)}</p>
        <p id="ada-promo-copy">${esc(promotion.description)}</p>
        <a class="ada-promo-primary" href="${esc(url)}" rel="noopener">${esc(promotion.button_text)}</a>
        <button class="ada-promo-later" type="button">Terus Tengok Kereta</button>
        <small>${esc(promotion.disclaimer)}</small>
      </section>`;
    const previousFocus = document.activeElement;
    const dismiss = () => {
      close();
      document.removeEventListener('keydown', onKey);
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
    };
    const onKey = e => { if (e.key === 'Escape') dismiss(); };
    root.addEventListener('click', e => {
      if (e.target === root || e.target.closest('.ada-promo-close,.ada-promo-later')) dismiss();
      if (e.target.closest('.ada-promo-primary')) {
        // Normal anchor navigation works on iOS Safari without popup blockers.
        // WhatsApp prepares the text; customer taps Send.
        remember();
      }
    });
    document.addEventListener('keydown', onKey);
    // The catalogue gate itself uses maximum z-index; mount inside it so the dialog is not obscured.
    const gate = document.getElementById('ada-cloud-gate');
    (gate || document.body).appendChild(root);
    document.body.classList.add('ada-promo-open');
    if (!preview) remember();
    root.querySelector('.ada-promo-close')?.focus();
  }
  window.adaCancelYearEndPromo = function () {
    if (pending !== null) clearTimeout(pending);
    pending = null;
    close();
  };
  window.adaScheduleYearEndPromo = function (carId) {
    window.adaCancelYearEndPromo();
    if (!promotion.enabled || !document.getElementById('ada-public-catalogue') || (!preview && seen())) return;
    const raw = promotion.popup_delay_seconds;
    const seconds = raw !== null && raw !== '' && Number.isInteger(Number(raw)) && Number(raw)>=0 && Number(raw)<=300 ? Number(raw) : DEFAULT.popup_delay_seconds;
    pending = setTimeout(() => { pending = null; show(carId ? String(carId) : null); }, seconds * 1000);
  };
  window.addEventListener('popstate', window.adaCancelYearEndPromo);
  const style = document.createElement('style');
  style.textContent = `
    .ada-promo-open{overflow:hidden!important}
    .ada-promo-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(10,20,35,.72);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}
    .ada-promo-dialog{position:relative;width:min(100%,420px);max-height:calc(100dvh - 36px);overflow:auto;box-sizing:border-box;background:#fff;color:#19243a;border-radius:22px;padding:30px 23px 22px;text-align:center;box-shadow:0 25px 70px #071a3780;font-family:system-ui,-apple-system,sans-serif}
    .ada-promo-close{position:absolute;right:12px;top:10px;border:0;background:#f1f4f7;color:#334155;width:34px;height:34px;border-radius:50%;font-size:26px;line-height:1;cursor:pointer}
    .ada-promo-tag{display:inline-block;background:#fff1da;color:#9a4e00;font-size:11px;letter-spacing:.07em;font-weight:850;border-radius:100px;padding:9px 13px;margin-bottom:12px}
    .ada-promo-icon{font-size:43px;line-height:1.2;margin:8px 0}
    .ada-promo-dialog h2{font-size:clamp(29px,7.5vw,39px);font-weight:900;letter-spacing:-.04em;line-height:1.06;margin:8px 0;color:#12263e}
    .ada-promo-dialog h2 span{color:#138c57}
    .ada-promo-region{font-size:19px;font-weight:800;color:#138c57;margin:12px 0}
    .ada-promo-dialog #ada-promo-copy{font-size:14px;line-height:1.6;color:#475569;margin:14px 0 21px}
    .ada-promo-primary{display:block;background:#12864f;color:#fff!important;border-radius:12px;text-decoration:none;padding:15px 12px;font-weight:850;font-size:14px;box-shadow:0 6px 17px #12864f33}
    .ada-promo-later{display:block;width:100%;background:transparent;border:0;padding:14px 6px;color:#53657a;font-size:13px;font-weight:700;cursor:pointer}
    .ada-promo-dialog small{display:block;color:#7b8695;font-size:10.5px;line-height:1.5}
    @media(max-height:650px){.ada-promo-dialog{padding:23px 20px 16px}.ada-promo-icon{font-size:29px;margin:2px}.ada-promo-dialog h2{font-size:27px}.ada-promo-region{margin:7px 0}.ada-promo-dialog #ada-promo-copy{margin:9px 0}}
    @media(prefers-reduced-motion:no-preference){.ada-promo-dialog{animation:adaPromoIn .22s ease-out}@keyframes adaPromoIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}}
  `;
  document.head.appendChild(style);
})();