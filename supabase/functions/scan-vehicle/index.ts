// Abe Din Auto – Edge Function scan-vehicle (V120)
// Terima 1–4 gambar (geran / kad pendaftaran / foto kereta / odometer) daripada staff yang log masuk,
// minta AI (Claude) baca, pulangkan data kereta berstruktur untuk isi borang Daftar Kereta.
// Kunci API: env ANTHROPIC_API_KEY, atau app_private.ai_config (sama seperti scan-receipt).
import { createClient } from "npm:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const TOOL = {
  name: "rekod_kereta",
  description: "Rekod maklumat kereta yang dibaca daripada gambar.",
  input_schema: {
    type: "object",
    properties: {
      doc_types: { type: "array", items: { type: "string", enum: ["geran", "kad_pendaftaran", "foto_kereta", "odometer", "lain"] }, description: "Jenis setiap gambar mengikut susunan" },
      plate: { type: "string", description: "No. pendaftaran kenderaan, huruf besar tanpa jarak (contoh DCX1234). Kosong jika tidak kelihatan." },
      make: { type: "string", description: "Jenama sahaja, huruf pertama besar (contoh Perodua, Proton, Toyota, Honda, Nissan, Mazda, BMW, Mercedes-Benz)" },
      model: { type: "string", description: "Nama model + varian/enjin jika ada, tanpa jenama (contoh 'Myvi 1.5 AV', 'Saga 1.3 Standard', 'Vios 1.5 G'). Kosong jika tidak pasti." },
      model_year: { type: "integer", description: "Tahun dibuat (Tahun Dibuat / Year of manufacture). 0 jika tidak pasti." },
      registration_date: { type: "string", description: "Tarikh pendaftaran pertama YYYY-MM-DD, kosong jika tiada" },
      color: { type: "string", description: "Warna (dalam Bahasa Melayu, contoh Putih, Hitam, Perak, Merah, Kelabu, Biru)" },
      chassis_no: { type: "string", description: "No. casis / VIN, kosong jika tiada" },
      engine_no: { type: "string", description: "No. enjin, kosong jika tiada" },
      engine_cc: { type: "integer", description: "Keupayaan enjin dalam cc, 0 jika tiada" },
      fuel: { type: "string", description: "Bahan bakar: Petrol, Diesel, Hibrid, Elektrik, atau kosong" },
      transmission: { type: "string", description: "Auto atau Manual jika diketahui (contoh (A) = Auto), kosong jika tidak pasti" },
      body_type: { type: "string", description: "Jenis badan (contoh Sedan, Hatchback, MPV, SUV, Pickup) jika diketahui" },
      mileage_km: { type: "integer", description: "Bacaan odometer (km) jika ada gambar odometer/meter, 0 jika tiada" },
      registered_owner: { type: "string", description: "Nama pemilik berdaftar pada geran jika kelihatan, kosong jika tiada" },
      summary: { type: "string", description: "Ringkasan 1 baris Bahasa Melayu tentang apa yang dibaca dan bahagian yang kurang jelas" },
      confidence: { type: "number", description: "0 hingga 1, keyakinan keseluruhan" },
    },
    required: ["plate", "make", "model", "model_year", "confidence", "summary"],
  },
};

const PROMPT = `Anda pembantu inventori untuk ABE DIN AUTO, kedai jual beli kereta terpakai di Kota Bharu, Kelantan, Malaysia.
Gambar yang diberi mungkin: geran kenderaan JPJ (Sijil Pemilikan / VOC), kad pendaftaran, salinan/skrin MyJPJ, foto kereta (nampak plat), atau gambar meter odometer.
Baca SEMUA gambar dan gabungkan maklumat, kemudian panggil alat rekod_kereta.
Panduan geran JPJ: "No. Pendaftaran" = plate; "Buatan/Nama Model" biasanya "JENAMA MODEL VARIAN" (contoh "PERODUA MYVI 1.5 AV (A)" → make Perodua, model "Myvi 1.5 AV", transmission Auto);
"Keupayaan Enjin" = cc; "Bahan Bakar" = fuel; "No. Enjin"; "No. Chasis"; "Tahun Dibuat" = model_year; "Tarikh Pendaftaran" (DD/MM/YYYY → YYYY-MM-DD); "Warna"; "Jenis Badan".
Jika hanya foto kereta: baca plat dan teka jenama/model dari rupa kereta hanya jika jelas, dan turunkan confidence.
Jika gambar odometer: isi mileage_km (km). Jangan reka maklumat yang tiada — biarkan kosong / 0.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u, error: ue } = await admin.auth.getUser(jwt);
    if (ue || !u?.user) return json({ error: "Sila log masuk semula." }, 401);
    const { data: prof } = await admin.from("profiles").select("role,enabled").eq("id", u.user.id).maybeSingle();
    if (!prof || prof.enabled === false) return json({ error: "Akaun tidak aktif sebagai staff." }, 403);

    const body = await req.json();
    const imgs = (Array.isArray(body.images) ? body.images : []).slice(0, 4).map((x: any) => ({
      data: String(x?.data || "").replace(/^data:[^,]+,/, ""),
      mime: ["image/jpeg", "image/png", "image/webp"].includes(x?.mime) ? x.mime : "image/jpeg",
    })).filter((x: any) => x.data);
    if (!imgs.length) return json({ error: "Tiada gambar." }, 400);
    if (imgs.reduce((n: number, x: any) => n + x.data.length, 0) > 14_000_000) return json({ error: "Gambar terlalu besar." }, 400);

    let key = Deno.env.get("ANTHROPIC_API_KEY") || "", model = Deno.env.get("ANTHROPIC_MODEL") || "";
    if (!key || !model) {
      const { data: cfg } = await admin.rpc("ai_config_get");
      key ||= cfg?.key || ""; model ||= cfg?.model || "claude-haiku-4-5";
    }
    if (!key) return json({ error: "AI belum disambung. Owner perlu masukkan kunci API dalam Perbelanjaan → Tetapan AI.", code: "no_key" }, 503);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model, max_tokens: 1200,
        tools: [TOOL], tool_choice: { type: "tool", name: "rekod_kereta" },
        messages: [{ role: "user", content: [
          ...imgs.map((x: any) => ({ type: "image", source: { type: "base64", media_type: x.mime, data: x.data } })),
          { type: "text", text: PROMPT },
        ] }],
      }),
    });
    const out = await r.json();
    if (!r.ok) return json({ error: "AI gagal: " + (out?.error?.message || r.status) }, 502);
    const t = (out.content || []).find((c: any) => c.type === "tool_use");
    if (!t) return json({ error: "AI tidak dapat membaca gambar." }, 502);
    const d = t.input || {};
    d.plate = String(d.plate || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const y = Number(d.model_year) || 0, now = new Date().getFullYear() + 1;
    d.model_year = y >= 1950 && y <= now ? y : 0;
    d.mileage_km = Math.max(0, Math.round(Number(d.mileage_km) || 0));
    d.engine_cc = Math.max(0, Math.round(Number(d.engine_cc) || 0));
    if (d.registration_date && !/^\d{4}-\d{2}-\d{2}$/.test(d.registration_date)) d.registration_date = "";
    return json({ ok: true, data: d, model });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
