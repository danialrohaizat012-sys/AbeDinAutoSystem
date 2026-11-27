-- Run on the disposable release fixture only after HR_RELEASE_CANDIDATE.sql.
DO $check$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['staff_payroll_records','hr_payroll_reviewers','hr_payroll_submissions','hr_payroll_handoffs','hr_kpi_targets','hr_kpi_reviews','hr_kpi_feedback','hr_letters','hr_letter_signatures','hr_discipline_events','hr_assets','hr_asset_events'] LOOP
   IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t AND rowsecurity) THEN RAISE EXCEPTION 'Missing or unprotected HR table %',t; END IF;
   IF (has_table_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR has_any_column_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,REFERENCES')) THEN RAISE EXCEPTION 'Anonymous table access %',t; END IF;
   IF (has_table_privilege('authenticated','public.'||t,'UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR has_any_column_privilege('authenticated','public.'||t,'UPDATE,REFERENCES')) THEN RAISE EXCEPTION 'Direct mutation privileges %',t; END IF;
 END LOOP;
 IF has_function_privilege('authenticated','public.hr_record_reviewed_payroll(jsonb,uuid,text)','EXECUTE')
 OR has_function_privilege('authenticated','public.hr_submit_payroll(jsonb,uuid,text)','EXECUTE') THEN RAISE EXCEPTION 'Payroll bypass executable'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'hr\_%' AND has_function_privilege('anon',p.oid,'EXECUTE')) THEN RAISE EXCEPTION 'Anonymous HR RPC executable'; END IF;
 IF has_table_privilege('authenticated','public.staff_payroll_records','SELECT,INSERT')
 OR has_column_privilege('authenticated','public.staff_payroll_records','review_reference','SELECT')
 OR has_column_privilege('authenticated','public.staff_payroll_records','recorded_by','SELECT')
 OR has_any_column_privilege('authenticated','public.staff_payroll_records','INSERT') THEN RAISE EXCEPTION 'Payroll private column or direct write exposed'; END IF;
 IF NOT has_column_privilege('authenticated','public.staff_payroll_records','net_sen','SELECT') THEN RAISE EXCEPTION 'Payroll approved amount unavailable'; END IF;
 IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'hr\_%' AND p.prosecdef AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig,ARRAY[]::text[])) AS cfg WHERE cfg IN ('search_path=""','search_path='))) THEN RAISE EXCEPTION 'HR privileged RPC missing fixed empty search path'; END IF;
END $check$;
