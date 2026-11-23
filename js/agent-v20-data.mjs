/**
 * AbeDin V20 agent data adapter.
 * Read-only, existing Supabase client, no service-role key.
 * Backend RLS remains the security boundary.
 */
export function createV20AgentData(supabase) {
  if (!supabase?.auth?.getUser || !supabase?.from) throw new Error('Authenticated Supabase client required');
  async function agentId() {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth?.user?.id) throw new Error('Login required');
    const { data, error } = await supabase.from('agent_profiles')
      .select('id,status').eq('user_id', auth.user.id).eq('status','active').maybeSingle();
    if (error) throw error;
    if (!data?.id) throw new Error('Active agent required');
    return data.id;
  }
  async function list(table, columns) {
    const id = await agentId();
    const { data, error } = await supabase.from(table).select(columns)
      .eq('agent_id', id).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data ?? [];
  }
  return Object.freeze({
    leads: () => list('agent_leads', 'id,vehicle_id,customer_name,customer_phone,status,lead_source,agent_read_at,created_at'),
    commissions: () => list('agent_commissions', 'id,lead_id,sale_id,agreed_amount,status,created_at,approved_at'),
    payouts: () => list('agent_payouts', 'id,amount,status,transfer_reference,paid_at,created_at'),
  });
}
