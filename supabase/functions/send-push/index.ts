// Abe Din Auto – Edge Function send-push (V82)
// Dipanggil oleh trigger pangkalan data (pg_net) bila notifikasi baharu dicipta.
// Hantar Web Push ke semua peranti pengguna; padam langganan yang sudah tamat (404/410).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
let cfg: { vapid_public: string; vapid_private: string; fn_secret: string } | null = null;

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("method", { status: 405 });
    if (!cfg) {
      const { data, error } = await sb.rpc("push_config_get");
      if (error || !data) return new Response("config", { status: 500 });
      cfg = data;
      webpush.setVapidDetails("mailto:admin@abedinauto.my", cfg!.vapid_public, cfg!.vapid_private);
    }
    if (req.headers.get("x-push-secret") !== cfg!.fn_secret) return new Response("forbidden", { status: 403 });
    const n = await req.json();
    const { data: subs, error } = await sb.rpc("push_targets", { p_user: n.user_id });
    if (error) return new Response(error.message, { status: 500 });
    const payload = JSON.stringify({ title: n.title || "Abe Din Auto", body: n.body || "", page: n.page || "", kind: n.kind || "", id: n.id });
    const ok: number[] = [], gone: number[] = [];
    await Promise.all((subs || []).map(async (s: any) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400, urgency: "high" });
        ok.push(s.id);
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) gone.push(s.id);
      }
    }));
    if (ok.length || gone.length) await sb.rpc("push_result", { p_ok: ok, p_gone: gone });
    return new Response(JSON.stringify({ sent: ok.length, removed: gone.length }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
