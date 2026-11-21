// Abe Din Auto – Edge Function scan-receipt (V91)
// Terima gambar resit (base64) daripada staf yang log masuk, minta AI (Claude) baca, pulangkan data berstruktur.
// Kunci API: env ANTHROPIC_API_KEY, atau app_private.ai_config (Owner tetapkan dalam modul Perbelanjaan).
import { createClient } from "npm:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const INV = ["baiki","alat_ganti","tayar_bateri","cat_body","cuci_polish","jpj_puspakom","insurans","transport_kereta"];
const OVH = ["sewa_premis","utiliti","telefon_internet","langganan","bank_caj"];
const PEM = ["minyak","tol_parking","alat_tulis","makan_entertain","iklan","marketing_lain","armada_sewa","lain"];
const CATS = [...INV, ...OVH, ...PEM];
const jenisOf = (c: string) => INV.includes(c) ? "inventori" : OVH.includes(c) ? "overhead" : "pembelian";

const TOOL = {
  name: "rekod_resit",
  description: "Rekod data yang dibaca daripada resit / invois / bil.",
  input_schema: {
    type: "object",
    properties: {
      is_receipt: { type: "boolean", description: "false jika gambar bukan resit/invois/bil" },
      vendor: { type: "string", description: "Nama kedai/syarikat yang mengeluarkan resit" },
      receipt_no: { type: "string", description: "No. resit / invois, kosong jika tiada" },
      receipt_date: { type: "string", description: "Tarikh resit dalam format YYYY-MM-DD, kosong jika tidak jelas" },
      amount: { type: "number", description: "Jumlah besar yang dibayar (RM) termasuk cukai" },
      tax_amount: { type: "number", description: "Jumlah SST/cukai (RM), 0 jika tiada" },
      payment_method: { type: "string", enum: ["tunai","transfer","kad","ewallet","cek","lain"] },
      category: { type: "string", enum: CATS, description: "Kategori perbelanjaan paling sesuai untuk kedai kereta terpakai" },
      jenis: { type: "string", enum: ["inventori","pembelian","overhead"], description: "inventori = kos melekat pada kereta stok (baiki, spare part, cat, JPJ, transport kereta); overhead = bil tetap bulanan (sewa kedai, TNB, air, internet, langganan); pembelian = belanja operasi lain" },
      unit: { type: "string", enum: ["jualan","sewa","umum"], description: "jualan = kos kereta untuk dijual; sewa = kereta sewa; umum = operasi kedai" },
      plate: { type: "string", description: "No. plat kenderaan jika tertulis pada resit (contoh DCX1234), kosong jika tiada" },
      items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, qty: { type: "number" }, price: { type: "number" } }, required: ["name"] } },
      summary: { type: "string", description: "Ringkasan 1 baris dalam Bahasa Melayu tentang apa yang dibeli" },
      confidence: { type: "number", description: "0 hingga 1, keyakinan bacaan" },
    },
    required: ["is_receipt", "vendor", "amount", "category", "jenis", "unit", "confidence"],
  },
};

const PROMPT = `Anda pembantu akaun untuk ABE DIN AUTO, kedai jual beli kereta terpakai di Kota Bharu, Kelantan (juga ada perniagaan kereta sewa "Abedin Car Rental").
Baca gambar resit ini dengan teliti dan panggil alat rekod_resit.
Kategori ikut 3 jenis:
INVENTORI (kos melekat pada kereta stok):
- baiki: bengkel, upah mekanik, servis kereta stok
- alat_ganti: spare part, minyak hitam, filter, aksesori
- tayar_bateri: kedai tayar, bateri, alignment
- cat_body: cat, ketuk, body kit, cermin
- cuci_polish: car wash, polish, detailing
- jpj_puspakom: JPJ, Puspakom, roadtax, tukar nama
- insurans: insurans / takaful kenderaan
- transport_kereta: tunda, lori angkut kereta
OVERHEAD TETAP BULANAN:
- sewa_premis: sewa kedai / tapak
- utiliti: TNB, air (SAKN / Air Kelantan)
- telefon_internet: Unifi, Maxis, Celcom, Digi, U Mobile, TM
- langganan: pakej bulanan Mudah/Carlist, perisian, sistem
- bank_caj: caj bank bulanan, fi transaksi
PEMBELIAN / OPERASI:
- minyak: stesen minyak (Petronas, Shell, BHP, Petron, Caltex)
- tol_parking: tol, Touch n Go reload, parking
- alat_tulis: alat tulis, barang pejabat
- makan_entertain: makan, minum, belanja pelanggan
- iklan: Facebook/TikTok/Google ads (boost); marketing_lain: banner, cetakan, hadiah
- armada_sewa: kos untuk kereta sewa
- lain: selain di atas
Tarikh di Malaysia ditulis DD/MM/YYYY (hari dahulu, kemudian bulan) — contoh 11/12/2026 = 11 Disember 2026, 12/11/26 = 12 November 2026. Tukar kepada YYYY-MM-DD. Resit biasanya bertarikh dalam beberapa minggu sebelum hari ini dan TIDAK PERNAH selepas hari ini; jika tahun kabur/2 digit, pilih tahun yang paling hampir dengan hari ini. Jumlah = TOTAL / JUMLAH yang dibayar. Jangan reka maklumat yang tiada.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const auth = req.headers.get("Authorization") || "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    const { data: u, error: ue } = await admin.auth.getUser(jwt);
    if (ue || !u?.user) return json({ error: "Sila log masuk semula." }, 401);
    const { data: prof } = await admin.from("profiles").select("role,enabled").eq("id", u.user.id).maybeSingle();
    if (!prof || prof.enabled === false) return json({ error: "Akaun tidak aktif sebagai staf." }, 403);

    const body = await req.json();
    const b64 = String(body.image || "").replace(/^data:[^,]+,/, "");
    const mime = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(body.mime) ? body.mime : "image/jpeg";
    if (!b64 || b64.length > 7_000_000) return json({ error: "Gambar tiada atau terlalu besar." }, 400);

    let key = Deno.env.get("ANTHROPIC_API_KEY") || "", model = Deno.env.get("ANTHROPIC_MODEL") || "";
    if (!key || !model) {
      const { data: cfg } = await admin.rpc("ai_config_get");
      key ||= cfg?.key || ""; model ||= cfg?.model || "claude-haiku-4-5";
    }
    if (!key) return json({ error: "AI belum disambung. Owner perlu masukkan kunci API dalam Perbelanjaan → Tetapan AI.", code: "no_key" }, 503);

    const today = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model, max_tokens: 1500,
        tools: [TOOL], tool_choice: { type: "tool", name: "rekod_resit" },
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mime, data: b64 } },
          { type: "text", text: PROMPT + `\nTarikh hari ini: ${today}.` },
        ] }],
      }),
    });
    const out = await r.json();
    if (!r.ok) return json({ error: "AI gagal: " + (out?.error?.message || r.status) }, 502);
    const t = (out.content || []).find((c: any) => c.type === "tool_use");
    if (!t) return json({ error: "AI tidak dapat membaca resit." }, 502);
    const d = t.input || {};
    if (!CATS.includes(d.category)) d.category = "lain";
    d.jenis = jenisOf(d.category); // jenis sentiasa ikut kategori supaya konsisten
    if (d.receipt_date && !/^\d{4}-\d{2}-\d{2}$/.test(d.receipt_date)) d.receipt_date = "";
    return json({ ok: true, data: d, model });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
