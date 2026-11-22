// Staged-only Edge Function. Do not deploy before schemas, auth and RLS QA pass.
// Pin to a tested release and commit the dependency lock before production use.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const respond = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== "POST") return respond(405, { error: "Method not allowed" });
  // No permissive CORS. Browser same-origin/CORS integration must explicitly
  // allow only approved origins. Until then this endpoint is not browser-ready.
  if (req.headers.get("origin")) return respond(403, { error: "Browser origin not configured" });

  const rawAuthorization = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(rawAuthorization);
  if (!match) return respond(401, { error: "Authentication required" });

  const url = Deno.env.get("SUPABASE_URL");
  const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !adminKey) return respond(503, { error: "Server not configured" });
  if (new URL(url).hostname !== "buzpdyvvoiqgbeventwm.supabase.co")
    return respond(503, { error: "Wrong Supabase project" });

  // Admin client never takes user-provided Authorization header.
  const server = createClient(url, adminKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: identity, error: authError } = await server.auth.getUser(match[1]);
  if (authError || !identity.user?.id || !identity.user.email_confirmed_at)
    return respond(401, { error: "Invalid or unverified account" });

  const { data: owner, error: roleError } = await server.from("profiles")
    .select("role,enabled").eq("id", identity.user.id).maybeSingle();
  if (roleError || !owner || owner.role !== "owner" || owner.enabled !== true)
    return respond(403, { error: "Owner access required" });

  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) return respond(415, { error: "JSON required" });
  const size = Number(req.headers.get("content-length") ?? 0);
  if (size > 4096) return respond(413, { error: "Request too large" });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
    if (!body || Array.isArray(body) || typeof body !== "object")
      return respond(400, { error: "Invalid request" });
  } catch {
    return respond(400, { error: "Invalid JSON" });
  }
  const application = body.application_id;
  const decision = body.decision;
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) : null;
  if (typeof application !== "string" || !uuid.test(application)
      || (decision !== "approve" && decision !== "reject")
      || (decision === "reject" && !reason)) {
    return respond(400, { error: "Invalid application review" });
  }

  // The RPC independently checks that the actor is an enabled owner and
  // atomically locks the application, creates the agent and writes audit data.
  const { data, error } = await server.rpc("agent_admin_review_v1", {
    p_actor: identity.user.id, p_application: application,
    p_decision: decision, p_reason: reason,
  });
  if (error) {
    if (error.code === "23505") return respond(409, { error: "Application already reviewed or conflicting agent" });
    if (error.code === "P0002") return respond(404, { error: "Application not found" });
    if (error.code === "42501") return respond(403, { error: "Not authorized" });
    return respond(400, { error: "Review failed; check approval conditions" });
  }
  return respond(200, { ok: true, result: data });
});
