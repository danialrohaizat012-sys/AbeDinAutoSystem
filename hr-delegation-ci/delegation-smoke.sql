-- Run against a disposable database after the original HR smoke suite.
alter table public.profiles add column if not exists full_name text;
update public.profiles set full_name='Demo '||right(id::text,1) where full_name is null;
\ir PROPOSED_hr_delegation.sql
-- Existing fixture has owner 001, enabled staff 002 and 003, disabled 004.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
 begin perform public.hr_set_delegate('00000000-0000-0000-0000-000000000002',true); raise exception 'Self promotion accepted'; exception when insufficient_privilege then null; end;
 begin perform public.hr_delegate_directory(); raise exception 'Unauthorized directory'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.hr_set_delegate('00000000-0000-0000-0000-000000000002',true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$declare req uuid; begin
 if (select count(*) from public.hr_delegate_directory())<>1 then raise exception 'Incorrect directory exposure'; end if;
 req:=public.hr_delegate_submit('00000000-0000-0000-0000-000000000003','letter','{"kind":"warning","subject":"Demo draft","body":"Demo body for owner review","reason":"Demo test"}');
 if not exists(select 1 from public.hr_delegate_requests where id=req and state='pending') then raise exception 'Request not found'; end if;
 begin perform public.hr_delegate_decide(req,true,'No self approval'); raise exception 'Self approval accepted'; exception when insufficient_privilege then null; end;
 if exists(select 1 from public.hr_letters where subject='Demo draft') then raise exception 'Draft released before owner approval'; end if;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$declare req uuid; doc uuid; begin
 select id into req from public.hr_delegate_requests where state='pending';
 doc:=public.hr_delegate_decide(req,true,'Reviewed demo');
 if not exists(select 1 from public.hr_letters where id=doc and state='draft') then raise exception 'Missing owner draft'; end if;
end$$;
select public.hr_set_delegate('00000000-0000-0000-0000-000000000002',false);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
 if exists(select 1 from public.hr_delegate_requests) then raise exception 'Revoked delegate still sees queue'; end if;
 begin perform public.hr_delegate_directory(); raise exception 'Revoked access accepted'; exception when insufficient_privilege then null; end;
end$$;
reset role;
do $$begin
 if (select count(*) from public.hr_delegate_audit)<>2 then raise exception 'Audit mismatch'; end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('hr_set_delegate','hr_delegate_directory','hr_delegate_submit','hr_delegate_decide') and has_function_privilege('anon',p.oid,'EXECUTE')) then raise exception 'Anonymous RPC access'; end if;
end$$;
