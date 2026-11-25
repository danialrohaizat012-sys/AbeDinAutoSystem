// Abe Din Auto – Edge Function tiktok-wa (V128)
//  - action "generate": owner jana ayat WhatsApp rawak (AI) untuk lead TikTok, setiap ayat ada {nama}
//  - action "send"    : owner sahaja hantar satu mesej kepada lead melalui WAHA
//    Had: WAHA mesti aktif, had harian, jarak minimum antara mesej, sekali sehari setiap lead.
// Kunci AI: app_private.ai_config (sama seperti agent-promo-ai). Kunci WAHA: app_private.waha_config.
import { createClient } from "npm:@supabase/supabase-js@2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STYLES = [
  "mula dengan salam (Assalamualaikum)", "mula dengan ucap terima kasih kerana isi borang", "mesra dan ringkas",
  "profesional tetapi santai", "fokus tanya bajet bulanan", "fokus tanya model kereta yang dicari",
  "tanya kereta untuk kegunaan apa (kerja, keluarga, harian)", "tawar bantu cari kereta ikut bajet",
  "tanya bila masa sesuai untuk berbual", "sebut King Axia secara bersahaja",
];
const pick = <T,>(a: T[], n: number) => [...a].sort(() => Math.random() - 0.5).slice(0, n);

const RULES = `Konteks: Pelanggan ini SENDIRI mengisi borang minat di TikTok Abe Din Auto (kedai kereta terpakai di Kubang Kerian, Kota Bharu, Kelantan; dikenali sebagai "King Axia"). Ini mesej WhatsApp PERTAMA daripada staff Abe Din Auto untuk menyusul.
Setiap ayat WAJIB ada:
- Salam (contoh: "Assalamualaikum") ATAU ucapan terima kasih kerana isi borang di TikTok.
- Perkenalkan diri dari Abe Din Auto, Kubang Kerian.
- Soalan susulan tentang keperluan pelanggan, contohnya: kereta apa yang dicari, bajet bulanan, bayaran pendahuluan, untuk kegunaan apa, atau bila sesuai berbual. Pilih 1–2 soalan sahaja.
Gaya:
- Bahasa Melayu Malaysia BAKU (standard) yang sopan dan mesra, macam staff kedai menaip di WhatsApp. TIADA loghat atau dialek negeri.
- Pendek: 2–4 ayat, maksimum 350 aksara.
- WAJIB ada penanda {nama} tepat sekali (sistem gantikan dengan nama pelanggan).
- Emoji 0–2 sahaja, ada ayat tanpa emoji langsung.
- Setiap ayat MESTI berbeza: pembuka, susunan, perkataan dan soalan penutup lain-lain. Jangan ulang frasa yang sama.
Larangan:
- JANGAN letak pautan/URL lain selain www.abedinauto.my (ikut arahan "Pautan" di bawah). JANGAN letak nombor telefon atau hashtag.
- JANGAN reka harga, diskaun, promosi, jaminan kelulusan atau janji yang tidak diberi.
- JANGAN guna huruf besar semua atau nada jualan desakan.
- JANGAN campur perkataan Bahasa Inggeris (contoh salah: "through", "interested", "form").
- JANGAN guna Bahasa Indonesia langsung. Contoh perkataan DILARANG: nggak, gak, banget, aja, gimana, udah, dong, sih, kok, mobil, lho, deh, kayak, pengen, mau, tuh, bapak/ibu (sebagai sapaan), silakan. Guna perkataan Malaysia: tak/tidak, sangat, sahaja, bagaimana, sudah, kereta, nak/ingin.`;

// Sesetengah ayat sertakan pautan katalog supaya pelanggan boleh semak kereta sendiri
const SITE = "www.abedinauto.my";
function linkPlan(count: number): string {
  const withLink = Math.max(1, Math.round(count * 0.3));
  return `Pautan: tepat ${withLink} daripada ${count} ayat (bercampur, bukan berturut-turut) mesti ajak pelanggan semak kereta sendiri di ${SITE} (tulis tepat begitu, tanpa https). Ayat lain TANPA sebarang pautan.`;
}
const INDO = /\b(nggak|ngga|gak|enggak|banget|aja|gimana|udah|dong|sih|kok|mobil|lho|deh|kayak|pengen|mau|tuh|silakan)\b/i;

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
    name: "ayat_whatsapp",
    description: "Pulangkan ayat WhatsApp yang dijana.",
    input_schema: { type: "object", properties: { ayat: { type: "array", items: { type: "string" }, minItems: count, maxItems: count } }, required: ["ayat"] },
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 4000, temperature: 1, tools: [tool], tool_choice: { type: "tool", name: "ayat_whatsapp" }, messages: [{ role: "user", content: prompt }] }),
  });
  const out = await r.json();
  if (!r.ok) throw new Error("AI gagal: " + (out?.error?.message || r.status));
  const t = (out.content || []).find((c: any) => c.type === "tool_use");
  return (Array.isArray(t?.input?.ayat) ? t.input.ayat : []).map((x: unknown) => String(x || "").trim());
}

function cleanTemplate(s: string): string | null {
  let t = s.replace(/(https?:\/\/)?(www\.)?abedinauto\.my\/?/gi, "\u0000").replace(/https?:\/\/\S+|www\.\S+/gi, "").replace(/\u0000/g, SITE).replace(/#\w+/g, "").replace(/\{\s*nama\s*\}/gi, "{nama}").trim();
  if ((t.match(/\{nama\}/g) || []).length !== 1) return null;
  if (/\d{7,}/.test(t.replace(/\s|-/g, ""))) return null; // nombor telefon
  if (t.length < 10 || t.length > 450) return null;
  if (/\b[a-z0-9-]+\.(com|my|ly|net|org|co|link|me)\b/i.test(t.replaceAll(SITE, ""))) return null; // pautan lain
  if (INDO.test(t) || /\b(through|interested|form|car|thanks|thank you)\b/i.test(t)) return null; // Indonesia / Inggeris
  return t;
}
const norm = (s: string) => s.toLowerCase().replace(/[^a-z{}]/g, "");

function firstName(name: string) {
  const n = String(name || "").replace(/\s+/g, " ").trim();
  const parts = n.split(" ");
  const skip = /^(mohd|muhd|muhammad|mohamad|mohammad|md|nur|nurul|siti|ahmad|abdul|wan|nik|che|tengku|ku|haji|hj)$/i;
  let i = 0;
  while (i < parts.length - 1 && skip.test(parts[i]) && i < 2) i++;
  const f = parts[i] || n;
  return f.length > 25 ? f.slice(0, 25) : f;
}
const fill = (tpl: string, name: string) => tpl.replace("{nama}", firstName(name) || "tuan/puan");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u, error: ue } = await admin.auth.getUser(jwt);
    if (ue || !u?.user?.id) return json({ error: "Sila log masuk semula." }, 401);
    const uid = u.user.id;
    const { data: prof } = await admin.from("profiles").select("role,enabled").eq("id", uid).maybeSingle();
    const role = prof?.enabled === true ? String(prof.role) : "";
    if (!["owner", "sales_advisor"].includes(role)) return json({ error: "Akses tidak dibenarkan." }, 403);
    const body = await req.json().catch(() => ({}));

    // ---------- Jana ayat AI ----------
    if (body.action === "generate") {
      if (role !== "owner") return json({ error: "Hanya owner boleh jana ayat." }, 403);
      const want = Math.min(Math.max(Number(body.count) || 50, 10), 60);
      const { key, model } = await aiConfig();
      if (!key) return json({ error: "AI belum disambung. Masukkan kunci API dalam Perbelanjaan → Tetapan AI." }, 503);
      const batches = Math.ceil(want / 25), per = Math.ceil(want / batches) + 4; // lebih sikit, ada yang ditapis
      const results = await Promise.all(Array.from({ length: batches }, (_, b) => {
        const styles = pick(STYLES, 5);
        const prompt = `Tulis ${per} ayat WhatsApp berbeza untuk menyusul lead TikTok.\nCampurkan gaya ini: ${styles.join("; ")}.\n${RULES}\n${linkPlan(per)}\nKod rawak (variasi): ${crypto.randomUUID().slice(0, 8)}-${b}`;
        return askClaude(key, model, prompt, per).catch(() => [] as string[]);
      }));
      const seen = new Set<string>(), list: string[] = [];
      for (const s of results.flat()) {
        const t = cleanTemplate(s); if (!t) continue;
        const k = norm(t); if (seen.has(k)) continue;
        seen.add(k); list.push(t);
        if (list.length >= want) break;
      }
      if (list.length < 10) return json({ error: "AI tidak memulangkan ayat yang cukup. Cuba lagi." }, 502);
      if (body.replace !== false) await admin.from("tiktok_wa_templates").update({ active: false }).eq("active", true);
      const { error } = await admin.from("tiktok_wa_templates").insert(list.map((b) => ({ body: b, created_by: uid })));
      if (error) throw error;
      return json({ ok: true, count: list.length });
    }

    // ---------- Hantar melalui WAHA ----------
    if (body.action === "send") {
      if (role !== "owner") return json({ error: "Hanya owner boleh hantar melalui WAHA. Sales advisor guna butang WhatsApp." }, 403);
      const leadId = String(body.lead_id || ""), tplId = String(body.template_id || "");
      if (!UUID.test(leadId)) return json({ error: "Lead tidak sah." }, 400);
      const { data: cfg } = await admin.rpc("waha_config_get");
      if (!cfg?.enabled || !cfg?.base_url) return json({ error: "WAHA belum diaktifkan. Owner perlu isi Tetapan WAHA." }, 503);

      const { data: lead } = await admin.from("tiktok_leads").select("id,name,phone,status,assigned_to").eq("id", leadId).maybeSingle();
      if (!lead) return json({ error: "Lead tidak dijumpai." }, 404);
      if (role !== "owner" && lead.assigned_to !== uid) return json({ error: "Lead ini bukan milik anda." }, 403);
      if (!/^\+601\d{8,9}$/.test(lead.phone)) return json({ error: "Nombor telefon lead tidak sah." }, 400);
      if (["closed", "not_interested"].includes(lead.status)) return json({ error: "Lead ini sudah Selesai / Tidak berminat." }, 409);

      const now = Date.now();
      const dayStart = new Date(new Date(now + 8 * 3600e3).toISOString().slice(0, 10) + "T00:00:00+08:00").toISOString();
      const [{ count: today }, { data: last }, { data: leadSent }] = await Promise.all([
        admin.from("tiktok_wa_sends").select("id", { count: "exact", head: true }).eq("channel", "waha").eq("status", "sent").gte("created_at", dayStart),
        admin.from("tiktok_wa_sends").select("created_at").eq("channel", "waha").eq("status", "sent").order("created_at", { ascending: false }).limit(1),
        admin.from("tiktok_wa_sends").select("id").eq("channel", "waha").eq("status", "sent").eq("lead_id", leadId).gte("created_at", new Date(now - 24 * 3600e3).toISOString()).limit(1),
      ]);
      if ((today || 0) >= cfg.daily_limit) return json({ error: `Had ${cfg.daily_limit} mesej WAHA sehari dicapai. Sambung esok.`, code: "daily_limit" }, 429);
      if (leadSent?.length) return json({ error: "Lead ini sudah dihantar mesej WAHA dalam 24 jam lepas.", code: "lead_recent" }, 409);
      const gapLeft = last?.[0] ? cfg.min_gap_sec * 1000 - (now - new Date(last[0].created_at).getTime()) : 0;
      if (gapLeft > 0) return json({ error: `Tunggu ${Math.ceil(gapLeft / 1000)} saat lagi sebelum mesej seterusnya.`, code: "gap", wait: Math.ceil(gapLeft / 1000) }, 429);

      let tq = admin.from("tiktok_wa_templates").select("id,body").eq("active", true);
      if (UUID.test(tplId)) tq = tq.eq("id", tplId);
      const { data: tpls } = await tq;
      if (!tpls?.length) return json({ error: "Tiada ayat aktif. Owner perlu jana ayat dahulu." }, 409);
      const tpl = tpls[Math.floor(Math.random() * tpls.length)];
      const text = fill(tpl.body, lead.name);
      const chatId = lead.phone.slice(1) + "@c.us";
      // ngrok-skip-browser-warning: elak halaman amaran ngrok percuma; header lain diabaikan oleh WAHA
      const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json", "ngrok-skip-browser-warning": "1", "user-agent": "AbeDinAuto-TikTokLead/1" };
      if (cfg.api_key) headers["X-Api-Key"] = cfg.api_key;
      const call = (path: string, payload: unknown) =>
        fetch(cfg.base_url + path, { method: "POST", headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });

      let ok = false, err = "";
      try {
        // Tunjuk "sedang menaip" seketika supaya nampak semula jadi (abaikan jika tidak disokong)
        await call("/api/startTyping", { session: cfg.session, chatId }).catch(() => null);
        await sleep(Math.min(6000, 1500 + text.length * 25 + Math.random() * 1500));
        await call("/api/stopTyping", { session: cfg.session, chatId }).catch(() => null);
        const r = await call("/api/sendText", { session: cfg.session, chatId, text });
        ok = r.ok;
        if (!ok) {
          const raw = (await r.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
          const hint = r.status === 401 || r.status === 403 ? " Semak kunci API WAHA."
            : r.status === 404 ? " Semak URL WAHA dan nama session."
            : r.status === 405 ? " URL WAHA salah — guna URL server WAHA anda sendiri, bukan laman lain."
            : r.status >= 500 ? " Server WAHA atau session ada masalah (pastikan session WORKING)." : "";
          err = `WAHA ${r.status}: ${raw}.${hint}`;
        }
      } catch (e) {
        err = "Tidak dapat sambung ke WAHA: " + String((e as Error)?.message || e).slice(0, 200);
      }
      await admin.from("tiktok_wa_sends").insert({ lead_id: leadId, template_id: tpl.id, channel: "waha", status: ok ? "sent" : "failed", error: err || null, sent_by: uid });
      if (!ok) return json({ error: err }, 502);
      if (lead.status === "new") await admin.from("tiktok_leads").update({ status: "contacted" }).eq("id", leadId);
      return json({ ok: true, text, sent_today: (today || 0) + 1, daily_limit: cfg.daily_limit, min_gap_sec: cfg.min_gap_sec });
    }

    return json({ error: "Tindakan tidak dikenali." }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
