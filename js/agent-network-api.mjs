/**
 * AbeDin Auto Agent Network: isolated client API (STAGING ONLY).
 * No app.html imports this file and no changes are made to existing modules.
 *
 * Pass an already authenticated Supabase client configured with the SALES project.
 * Do not use the service role in a browser. Agents cannot approve themselves.
 */
export function createAgentApi(supabase, options = {}) {
  const expectedProject = "buzpdyvvoiqgbeventwm";
  if (!supabase?.auth?.getUser || !supabase?.from) throw new Error("Supabase client required");
  if (options.projectRef !== expectedProject) {
    throw new Error("Agent Network must use the approved sales project");
  }
  async function currentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data?.user?.id || !data.user.email_confirmed_at) {
      throw new Error("Sila sahkan e-mel dan log masuk terlebih dahulu");
    }
    return data.user;
  }
  function result({ data, error }) {
    if (error) throw error;
    return data;
  }
  const clean = (value, limit) => String(value ?? "").trim().slice(0, limit);
  function validateApplication(fields) {
    const full_name = clean(fields?.full_name, 160);
    const phone = clean(fields?.phone, 24);
    const email = clean(fields?.email, 254).toLowerCase();
    const state = clean(fields?.state, 80);
    if (full_name.length < 3) throw new Error("Nama penuh tidak sah");
    if (!/^\+?[0-9][0-9 ()-]{7,22}$/.test(phone)) throw new Error("Nombor telefon tidak sah");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mel tidak sah");
    if (state.length < 2) throw new Error("Negeri diperlukan");
    return { full_name, phone, email, state };
  }
  return Object.freeze({
    async apply(fields) {
      const user = await currentUser();
      const normalized = validateApplication(fields);
      if (normalized.email !== String(user.email || "").toLowerCase()) {
        throw new Error("E-mel permohonan mesti sama dengan akaun yang disahkan");
      }
      return result(await supabase.from("agent_applications")
        .insert({ ...normalized, user_id: user.id, status: "pending" })
        .select("id,status,applied_at").single());
    },
    async application() {
      const user = await currentUser();
      return result(await supabase.from("agent_applications")
        .select("id,full_name,phone,email,state,status,applied_at,reviewed_at")
        .eq("user_id", user.id).maybeSingle());
    },
    async profile() {
      const user = await currentUser();
      return result(await supabase.from("agent_profiles")
        .select("id,agent_code,status,activated_at")
        .eq("user_id", user.id).maybeSingle());
    },
    async myLeads({ limit = 25 } = {}) {
      await currentUser();
      return result(await supabase.from("agent_leads")
        .select("id,vehicle_id,customer_name,customer_phone,status,created_at")
        .order("created_at", { ascending: false })
        .limit(Math.min(100, Math.max(1, Math.floor(Number(limit) || 25)))));
    },
    async createLead({ agentId, vehicleId = null, customerName, customerPhone, consentConfirmed }) {
      await currentUser();
      const profile = await this.profile();
      if (profile?.status !== "active" || profile.id !== agentId) {
        throw new Error("Hanya ejen aktif boleh daftar pelanggan sendiri");
      }
      if (consentConfirmed !== true) throw new Error("Persetujuan pelanggan diperlukan");
      const customer_name = clean(customerName, 160);
      const customer_phone = clean(customerPhone, 24);
      if (customer_name.length < 2 || !/^\+?[0-9][0-9 ()-]{7,22}$/.test(customer_phone)) throw new Error("Maklumat pelanggan tidak lengkap");
      return result(await supabase.from("agent_leads").insert({
        agent_id: profile.id, vehicle_id: vehicleId,
        customer_name, customer_phone, consent_confirmed: true, status: "new"
      }).select("id,status,created_at").single());
    },
    async myCommissions() {
      await currentUser();
      return result(await supabase.from("agent_commissions")
        .select("id,sale_id,agreed_amount,status,created_at,approved_at")
        .order("created_at", { ascending: false }).limit(100));
    },
    async myPayouts() {
      await currentUser();
      return result(await supabase.from("agent_payouts")
        .select("id,amount,status,transfer_reference,paid_at,created_at")
        .order("created_at", { ascending: false }).limit(100));
    }
  });
}
