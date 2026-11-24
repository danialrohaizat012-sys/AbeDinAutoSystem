// Abe Din Auto – tema Terang untuk modul dalam Shadow DOM (Staff, Kehadiran, Profil, Perbelanjaan, Pemeriksaan, Runner, dll).
// Modul ditulis dengan warna gelap. Bila <html> ada kelas "ada-light", setiap <style> dalam shadow root ditukar:
//  - permukaan gelap  -> cerah (hue sama, jadi warna lencana kekal)
//  - teks cerah        -> gelap
//  - warna aksen (emas, merah, hijau) dikekalkan
// Asal disimpan dan dipulihkan bila kembali ke tema Gelap. Dimuat awal (sebelum modul) dalam app.html.
(() => {
  if (window.__adaShadowTheme) return; window.__adaShadowTheme = true;
  const roots = new Set(), cache = new Map();
  const isLight = () => document.documentElement.classList.contains("ada-light");

  // Pemboleh ubah warna bersama: nilai cerah yang dipilih tangan (lebih kemas daripada tukar automatik)
  const LIGHT_VARS = ":host{color-scheme:light;--bg:#f6f5f2;--card:#ffffff;--soft:#f4f2ed;--line:#e3ded2;--fg:#1c1914;--mute:#6b6455;"
    + "--ok-bg:#e3f5ea;--ng-bg:#fde8e6;--red:#fde8e6;--y-soft:#fbf3d4;--y-ink:#7a5b00;--red-ink:#a3271f;--hl:#e8b10b;--na:#8a857a}";

  const clamp = x => Math.max(0, Math.min(1, x));
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l) {
    if (!s) { const v = Math.round(l * 255); return [v, v, v]; }
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t < 0 && (t += 1); t > 1 && (t -= 1); return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
  }
  const hex2 = n => n.toString(16).padStart(2, "0");
  // Tukar satu warna (r,g,b,a) untuk latar cerah
  function flip(r, g, b, a) {
    if (a < 1 && r + g + b === 0) return null;                    // bayang / lapisan gelap: kekal
    if (r === 255 && g === 255 && b === 255) return a < .35 ? [0, 0, 0, Math.min(.08, a * 1.1)] : null;   // putih: kekal (teks atas butang); lut sinar -> gelap halus
    const [h, s, l] = rgb2hsl(r, g, b);
    if (s >= .45 && l >= .35 && l <= .66) return null;           // aksen tepu: emas, merah, hijau, biru
    let nl;
    if (l < .2) nl = 1 - l * .32;                                  // permukaan gelap -> sangat cerah (tona kekal)
    else if (l < .35) nl = .93 - (l - .2) * 1.1;                   // permukaan bertona / sempadan
    else nl = 1 - l;                                               // teks cerah -> gelap
    const ns = l < .35 ? Math.min(1, s * 1.15) : s;
    return [...hsl2rgb(h, ns, clamp(nl)), a];
  }
  const out = (c, a, short) => c ? (a < 1 ? `rgba(${c[0]},${c[1]},${c[2]},${+c[3].toFixed(3)})` : `#${hex2(c[0])}${hex2(c[1])}${hex2(c[2])}`) : short;
  // Warna pertama dalam nilai latar: kekal (aksen) atau ditukar (permukaan gelap)?
  const HEXRE = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/;
  function rgbaOf(tok) {
    let m = tok.match(HEXRE);
    if (m) { const x = m[1], e = x.length <= 4 ? x.split("").map(c => c + c).join("") : x; return [parseInt(e.slice(0, 2), 16), parseInt(e.slice(2, 4), 16), parseInt(e.slice(4, 6), 16), e.length === 8 ? parseInt(e.slice(6, 8), 16) / 255 : 1]; }
    m = tok.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/); if (m) return [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]];
    if (/\bblack\b/.test(tok)) return [0, 0, 0, 1];
    return null;
  }
  const PROTECT = s => s.replace(/#/g, "#\u0000").replace(/rgb/g, "r\u0000gb");
  // Teks putih: kekal putih atas latar aksen, jadi gelap atas permukaan yang dicerahkan; plat/lencana hitam tulen dikekalkan
  function blockFix(body) {
    const col = body.match(/(^|;)\s*color\s*:\s*(#fff(?:fff)?|white|#ffffff)\s*(?=;|$|!)/i);
    if (!col) return body;
    const bg = body.match(/(^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i);
    const v = bg ? bg[2] : "";
    const c = v ? rgbaOf(v) : null;
    if (c && c[3] >= .9 && c[0] <= 10 && c[1] <= 10 && c[2] <= 10) return PROTECT(body);              // plat nombor hitam: kekal
    const accent = v && (/var\(--(?!bg|card|soft|line)/.test(v) || (c && flip(c[0], c[1], c[2], c[3]) === null && !(c[0] + c[1] + c[2] === 0)));
    if (accent) return body;
    return body.replace(col[0], `${col[1]}color:#\u00001c1914`);
  }
  function convert(css) {
    if (cache.has(css)) return cache.get(css);
    let t = css.replace(/\{([^{}]*)\}/g, (m, b) => "{" + blockFix(b) + "}")
      .replace(/color-scheme\s*:\s*dark/g, "color-scheme:light")
      // pemboleh ubah warna teks atas butang (--pri-fg dll.) kekal gelap
      .replace(/(--[\w-]*-fg\s*:\s*)(#[0-9a-fA-F]{3,8})/g, (m, p, v) => p + v.replace("#", "#\u0000"))
      .replace(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/g, (m, x) => {
        const e = x.length <= 4 ? x.split("").map(c => c + c).join("") : x;
        const r = parseInt(e.slice(0, 2), 16), g = parseInt(e.slice(2, 4), 16), b = parseInt(e.slice(4, 6), 16), a = e.length === 8 ? parseInt(e.slice(6, 8), 16) / 255 : 1;
        return out(flip(r, g, b, a), a, m);
      })
      .replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g, (m, r, g, b, a) => out(flip(+r, +g, +b, a == null ? 1 : +a), a == null ? 1 : +a, m))
      .replace(/#\u0000/g, "#").replace(/r\u0000gb/g, "rgb");
    t += "\n" + LIGHT_VARS;
    cache.set(css, t);
    return t;
  }
  function apply(root) {
    const light = isLight();
    root.querySelectorAll("style").forEach(st => {
      if (light) {
        if (st.__adaLight && st.textContent === st.__adaLightText) return;
        st.__adaOrig = st.__adaLight ? st.__adaOrig : st.textContent;
        if (st.__adaLight && st.textContent !== st.__adaLightText) st.__adaOrig = st.textContent;   // modul tulis semula gaya
        st.__adaLightText = convert(st.__adaOrig); st.__adaLight = true; st.textContent = st.__adaLightText;
      } else if (st.__adaLight) {
        st.__adaLight = false; if (st.textContent === st.__adaLightText) st.textContent = st.__adaOrig;
      }
    });
  }
  const orig = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    const r = orig.call(this, init); roots.add(r);
    new MutationObserver(ms => { if (ms.some(m => [...m.addedNodes].some(n => n.nodeName === "STYLE" || n.querySelector?.("style")))) apply(r); })
      .observe(r, { childList: true, subtree: true });
    queueMicrotask(() => apply(r));
    return r;
  };
  // Gaya gelap yang dimasukkan terus dalam halaman (cth. Laporan Jualan) — kecuali gaya yang sudah ada peraturan ada-light
  const pageRoot = { querySelectorAll: sel => [...document.querySelectorAll("#ada-cloud-view style")].filter(st => !/ada-light/.test(st.__adaOrig || st.textContent)) };
  const pageLight = css => convert(css).replace(/\n:host\{[^}]*\}$/, "");
  const sync = () => { roots.forEach(r => { if (r.host?.isConnected === false) roots.delete(r); else apply(r); }); applyPage(); };
  function applyPage() {
    const light = isLight();
    pageRoot.querySelectorAll().forEach(st => {
      if (light) { if (st.__adaLight && st.textContent === st.__adaLightText) return; st.__adaOrig = st.textContent; st.__adaLightText = pageLight(st.__adaOrig); st.__adaLight = true; st.textContent = st.__adaLightText; }
      else if (st.__adaLight) { st.__adaLight = false; if (st.textContent === st.__adaLightText) st.textContent = st.__adaOrig; }
    });
  }
  let pend = false;
  const startPage = () => new MutationObserver(ms => { if (pend || !ms.some(m => [...m.addedNodes].some(n => n.nodeName === "STYLE" || n.querySelector?.("style")))) return; pend = true; queueMicrotask(() => { pend = false; applyPage(); }); })
    .observe(document.body, { childList: true, subtree: true });
  if (document.body) startPage(); else document.addEventListener("DOMContentLoaded", startPage);
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  window.adaShadowThemeConvert = convert;   // untuk ujian
})();
