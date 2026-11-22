-- Disposable PostgreSQL fixture; no production customer or agent records modified.
select public.assert_test(
 (select count(*)=2 from public.agent_public_share_tokens),
 'Existing two fixture agents have stable opaque sharing tokens');
select public.assert_test(
 (select bool_and(token ~ '^[a-f0-9]{32}$') from public.agent_public_share_tokens),
 'Every sharing token is random-format and does not show agent code');
select public.assert_test(
 (select count(distinct token)=2 from public.agent_public_share_tokens),
 'Agent sharing tokens are unique');
select public.assert_test(
 not has_table_privilege('anon','public.agent_public_share_tokens','SELECT')
 and not has_table_privilege('authenticated','public.agent_public_share_tokens','SELECT'),
 'Anonymous users and other agents cannot enumerate promotion tokens');
select public.assert_test(
 (select count(*)=2 from public.agent_public_share_tokens t
   join public.agent_profiles a on a.id=t.agent_id where a.status='active'),
 'Share tokens resolve server-side to active agent records');
