// Abe Din Auto – Edge Function social-post (V119, DRAF)
// Owner sahaja: post gambar kereta + kapsyen ke Facebook Page, Instagram (Business) dan Threads.
// Token disimpan dalam app_private.social_config (owner set melalui owner_social_config_set_v1).
import { createClient } from "npm:@supabase/supabase-js@2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const GRAPH = "https://graph.facebook.com/v21.0";
const THREADS = "https://graph.threads.net/v1.0";
const BUCKET = "https://buzpdyvvoiqgbeventwm.supabase.co/storage/v1/object/public/vehicle-images/";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post(url: string, params: Record<string, string>) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j?.error?.message || `HTTP ${r.status}`);
  return j;
}

async function toFacebook(c: any, image: string, caption: string) {
  const j = await post(`${GRAPH}/${c.fb_page_id}/photos`, { url: image, caption, access_token: c.fb_page_token });
  return String(j.post_id || j.id || "");
}
async function toInstagram(c: any, image: string, caption: string) {
  const m = await post(`${GRAPH}/${c.ig_user_id}/media`, { image_url: image, caption, access_token: c.fb_page_token });
  for (let i = 0; i < 6; i++) {
    try { const p = await post(`${GRAPH}/${c.ig_user_id}/media_publish`, { creation_id: m.id, access_token: c.fb_page_token }); return String(p.id || ""); }
    catch (e) { if (i === 5) throw e; await sleep(2000); }
  }
  return "";
}
async function toThreads(c: any, image: string, caption: string) {
  const m = await post(`${THREADS}/${c.threads_user_id}/threads`, { media_type: "IMAGE", image_url: image, text: caption.slice(0, 500), access_token: c.threads_token });
  for (let i = 0; i < 6; i++) {
    await sleep(i === 0 ? 3000 : 2000);
    try { const p = await post(`${THREADS}/${c.threads_user_id}/threads_publish`, { creation_id: m.id, access_token: c.threads_token }); return String(p.id || ""); }
    catch (e) { if (i === 5) throw e; }
  }
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u, error: ue } = await admin.auth.getUser(jwt);
    if (ue || !u?.user?.id) return json({ error: "Sila log masuk semula." }, 401);
    const { data: prof } = await admin.from("profiles").select("role,enabled").eq("id", u.user.id).maybeSingle();
    if (prof?.role !== "owner" || prof?.enabled !== true) return json({ error: "Hanya owner." }, 403);

    const body = await req.json().catch(() => ({}));
    const vid = String(body.vehicle_id || "");
    const caption = String(body.caption || "").trim().slice(0, 2000);
    const platforms: string[] = Array.isArray(body.platforms) ? body.platforms.filter((p: string) => ["facebook", "instagram", "threads"].includes(p)) : [];
    if (!/^[A-Za-z0-9_-]{1,60}$/.test(vid)) return json({ error: "Kereta tidak sah." }, 400);
    if (!caption) return json({ error: "Kapsyen kosong." }, 400);
    if (!platforms.length) return json({ error: "Pilih sekurang-kurangnya satu platform." }, 400);

    const { data: rows } = await admin.rpc("get_public_catalogue", { p_vehicle_id: vid });
    const car = (Array.isArray(rows) ? rows : []).find((v: any) => v.vehicle_id === vid);
    if (!car) return json({ error: "Kereta tiada dalam katalog awam." }, 404);
    const imgs = Array.isArray(car.images) ? car.images : [];
    const cover = imgs.find((x: any) => x.is_cover) || imgs[0];
    if (!cover?.storage_path) return json({ error: "Kereta ini belum ada gambar." }, 400);
    const image = BUCKET + String(cover.storage_path).split("/").map(encodeURIComponent).join("/");

    const { data: c } = await admin.rpc("social_config_get_v1");
    const results: Record<string, { ok: boolean; id?: string; error?: string }> = {};
    for (const p of platforms) {
      try {
        if (p === "facebook") { if (!c?.fb_page_id || !c?.fb_page_token) throw new Error("Facebook Page belum disambung."); results[p] = { ok: true, id: await toFacebook(c, image, caption) }; }
        if (p === "instagram") { if (!c?.ig_user_id || !c?.fb_page_token) throw new Error("Instagram belum disambung."); results[p] = { ok: true, id: await toInstagram(c, image, caption) }; }
        if (p === "threads") { if (!c?.threads_user_id || !c?.threads_token) throw new Error("Threads belum disambung."); results[p] = { ok: true, id: await toThreads(c, image, caption) }; }
      } catch (e) {
        results[p] = { ok: false, error: String((e as Error)?.message || e).slice(0, 300) };
      }
      await admin.from("social_posts").insert({ vehicle_id: vid, platform: p, status: results[p].ok ? "ok" : "error", external_id: results[p].id || null, error: results[p].error || null, caption, created_by: u.user.id });
    }
    return json({ ok: Object.values(results).some((r) => r.ok), results, image });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
