// Abe Din Auto – Edge Function agent-promo-ai (V118)
// Jana ayat promosi kereta dengan AI (Claude).
//  - mode "owner5": owner aktif -> 5 templat ayat dengan {model}, {tahun}, {harga}
//  - mode "car"   : ejen aktif / owner -> 1 ayat untuk satu kereta katalog awam (Available)
// Kunci API: env ANTHROPIC_API_KEY, atau app_private.ai_config (sama seperti scan-receipt).
import { createClient } from "npm:@supabase/supabase-js@2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const AGENT_DAILY_LIMIT = 40;

const RULES = `Nada & gaya:
- Santai, mesra dan MEMUKAU — macam kawan rekomen kereta, bukan iklan kaku. Bahasa Melayu Malaysia harian (boleh selit slang ringan seperti "weh", "confirm", "berbaloi gila", "jom"), tapi tetap sopan.
- Mulakan dengan "hook" yang buat orang berhenti scroll (soalan, situasi harian, atau ayat pendek yang punchy).
- Ayat pendek-pendek, ada rentak. Boleh guna 1–2 baris baru untuk penekanan.
- Emoji yang sesuai 2–4 (contoh 🚗🔥✨💸👀), jangan berlebihan.
- Tonjolkan nilai: harga, tahun, jimat, sesuai kegunaan harian — guna fakta yang diberi sahaja.
- Akhiri dengan ajakan (CTA) yang ringkas dan mesra untuk tekan link.
Peraturan wajib:
- JANGAN reka diskaun, promosi, kelulusan pinjaman, jaminan, waranti, hadiah, keadaan kereta, servis atau stok yang tidak diberi. Jangan guna perkataan "dijamin", "100% lulus", "tiada masalah".
- JANGAN letak pautan/URL, nombor telefon atau hashtag (pautan disertakan sendiri).
- Maksimum 320 aksara setiap ayat.`;

const STYLES = ["hook soalan yang buat orang tersenyum", "situasi harian (jem, hujan, hantar anak sekolah)", "gaya kawan bagi tip rahsia", "punchy & ringkas macam caption viral", "nada teruja 'jumpa barang baik'", "untuk anak muda first car", "untuk keluarga kecil", "gaya FOMO lembut (tanpa tipu stok)", "gaya cerita mini 2 baris"];
const pick = <T,>(a: T[], n: number) => [...a].sort(() => Math.random() - 0.5).slice(0, n);

async function aiConfig() {
  let key = Deno.env.get("ANTHROPIC_API_KEY") || "", model = Deno.env.get("ANTHROPIC_MODEL") || "";
  if (!key || !model) {
    const { data: cfg } = await admin.rpc("ai_config_get");
    key ||= cfg?.key || ""; model ||= cfg?.model || "claude-haiku-4-5";
  }
  return { key, model };
}

async function askClaude(key: string, model: string, prompt: string, count: number): Promise<string[]> {
  const tool = {
    name: "ayat_promosi",
    description: "Pulangkan ayat promosi yang dijana.",
    input_schema: { type: "object", properties: { ayat: { type: "array", items: { type: "string" }, minItems: count, maxItems: count } }, required: ["ayat"] },
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 1200, temperature: 1, tools: [tool], tool_choice: { type: "tool", name: "ayat_promosi" }, messages: [{ role: "user", content: prompt }] }),
  });
  const out = await r.json();
  if (!r.ok) throw new Error("AI gagal: " + (out?.error?.message || r.status));
  const t = (out.content || []).find((c: any) => c.type === "tool_use");
  const list = Array.isArray(t?.input?.ayat) ? t.input.ayat : [];
  return list.map((x: unknown) => String(x || "").replace(/https?:\/\/\S+/g, "").trim().slice(0, 600)).filter(Boolean);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u, error: ue } = await admin.auth.getUser(jwt);
    if (ue || !u?.user?.id || !u.user.email_confirmed_at) return json({ error: "Sila log masuk semula." }, 401);
    const uid = u.user.id;
    const [{ data: prof }, { data: agent }] = await Promise.all([
      admin.from("profiles").select("role,enabled").eq("id", uid).maybeSingle(),
      admin.from("agent_profiles").select("id,status").eq("user_id", uid).maybeSingle(),
    ]);
    const isOwner = prof?.role === "owner" && prof?.enabled === true;
    const isAgent = agent?.status === "active";
    const body = await req.json().catch(() => ({}));
    const { key, model } = await aiConfig();
    if (!key) return json({ error: "AI belum disambung. Owner perlu masukkan kunci API dalam Perbelanjaan → Tetapan AI." }, 503);

    if (body.mode === "owner5") {
      if (!isOwner) return json({ error: "Hanya owner." }, 403);
      const styles = pick(STYLES, 5);
      const prompt = `Tulis 5 TEMPLAT ayat promosi untuk kereta terpakai yang dijual oleh Abe Din Auto (Kota Bharu, Kelantan).
Setiap templat WAJIB mengandungi tepat penanda {model}, {tahun} dan {harga} (sistem akan menggantikannya). Jangan tulis nama model sebenar.
Gaya setiap ayat berbeza: ${styles.map((s, i) => `${i + 1}) ${s}`).join("; ")}.
Setiap ayat mesti terasa lain — hook, rentak dan CTA berbeza.
${RULES}
Kod rawak (untuk variasi): ${crypto.randomUUID().slice(0, 8)}`;
      const ayat = (await askClaude(key, model, prompt, 5)).filter((x) => x.includes("{model}") && x.includes("{harga}"));
      if (ayat.length < 5) return json({ error: "AI tidak memulangkan 5 ayat yang sah. Cuba lagi." }, 502);
      return json({ ok: true, ayat: ayat.slice(0, 5) });
    }

    if (body.mode === "car") {
      if (!isAgent && !isOwner) return json({ error: "Akaun ejen aktif diperlukan." }, 403);
      const vid = String(body.vehicle_id || "");
      if (!/^[A-Za-z0-9_-]{1,60}$/.test(vid)) return json({ error: "Kereta tidak sah." }, 400);
      if (!isOwner) {
        const { data: ok } = await admin.rpc("agent_ai_take_v1", { p_user: uid, p_limit: AGENT_DAILY_LIMIT });
        if (ok === false) return json({ error: `Had ${AGENT_DAILY_LIMIT} ayat AI sehari dicapai. Cuba lagi esok.` }, 429);
      }
      const [{ data: rows }, { data: offers }] = await Promise.all([
        admin.rpc("get_public_catalogue", { p_vehicle_id: vid }),
        admin.rpc("get_public_vehicle_offers"),
      ]);
      const car = (Array.isArray(rows) ? rows : []).find((v: any) => v.vehicle_id === vid);
      if (!car || String(car.status || "").toLowerCase() !== "available") return json({ error: "Kereta ini tiada dalam katalog (Available)." }, 404);
      const off = (Array.isArray(offers) ? offers : []).find((o: any) => String(o.vehicle_id) === vid) || {};
      const base = Number(car.asking_price || 0), promo = Number(off.promo_price || 0);
      const price = promo > 0 && promo < base ? promo : base;
      const facts = [
        `Kereta: ${[car.make, car.model].filter(Boolean).join(" ")}`,
        car.model_year ? `Tahun: ${car.model_year}` : "",
        price ? `Harga: RM ${price.toLocaleString("en-MY")}` : "Harga: hubungi kami",
        promo > 0 && promo < base ? `(Harga asal RM ${base.toLocaleString("en-MY")} — harga promosi rasmi)` : "",
        car.mileage_km ? `Mileage: ${Number(car.mileage_km).toLocaleString("en-MY")} km` : "",
        off.monthly_installment ? `Anggaran ansuran bulanan: RM ${Number(off.monthly_installment).toLocaleString("en-MY")} (anggaran, tertakluk kelulusan)` : "",
      ].filter(Boolean).join("\n");
      const style = pick(STYLES, 1)[0];
      const prompt = `Tulis 1 ayat promosi untuk kereta terpakai Abe Din Auto (Kota Bharu, Kelantan) berdasarkan fakta ini SAHAJA:
${facts}
Gaya: ${style}. Sebut model, tahun dan harga secara semula jadi.
${RULES}
Kod rawak: ${crypto.randomUUID().slice(0, 8)}`;
      const [ayat] = await askClaude(key, model, prompt, 1);
      if (!ayat) return json({ error: "AI tidak memulangkan ayat. Cuba lagi." }, 502);
      return json({ ok: true, ayat });
    }
    return json({ error: "Mode tidak sah." }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
