\set ON_ERROR_STOP on
\ir kpi-db-smoke.sql
-- Simulate production profiles RLS, including own profile visibility.
grant select on public.profiles to authenticated;
alter table public.profiles enable row level security;
create policy demo_profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.att_role()='owner');
update public.profiles set full_name='Demo Recipient' where id='00000000-0000-0000-0000-000000000002';
\ir ../sql/PROPOSED_hr_letters.sql
\ir ../sql/PROPOSED_hr_esign.sql
create function public.demo_letter(p_series uuid,p_revision int,p_state text,p_kind text,p_body text,p_staff uuid default '00000000-0000-0000-0000-000000000002') returns uuid language sql security invoker as $$
insert into public.hr_letters(staff_id,series_id,revision,kind,state,subject,recipient,body,reason)
values(p_staff,p_series,p_revision,p_kind,p_state,'Demo letter','Demo Recipient',p_body,'Test') returning id
$$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select set_config('hr.demo.series',gen_random_uuid()::text,false);
select set_config('hr.demo.draft',public.demo_letter(current_setting('hr.demo.series')::uuid,1,'draft','contract','Demo contract')::text,false);
do $$begin
 begin perform public.demo_letter(gen_random_uuid(),1,'issued','contract','Bypass'); raise exception 'Issued without draft'; exception when raise_exception then if sqlerrm<>'Start with draft revision 1' then raise; end if; end;
 begin perform public.demo_letter(current_setting('hr.demo.series')::uuid,2,'issued','contract','Changed content'); raise exception 'Changed issue accepted'; exception when raise_exception then if sqlerrm<>'Issue only the exact latest reviewed draft' then raise; end if; end;
 begin perform public.demo_letter(current_setting('hr.demo.series')::uuid,2,'draft','contract','Demo','00000000-0000-0000-0000-000000000003'); raise exception 'Recipient swap accepted'; exception when raise_exception then if sqlerrm<>'Invalid revision or recipient; reload' then raise; end if; end;
end$$;
select set_config('hr.demo.issued',public.demo_letter(current_setting('hr.demo.series')::uuid,2,'issued','contract','Demo contract')::text,false);
select set_config('hr.demo.new_draft',public.demo_letter(current_setting('hr.demo.series')::uuid,3,'draft','contract','Updated contract')::text,false);
select set_config('hr.demo.latest',public.demo_letter(current_setting('hr.demo.series')::uuid,4,'issued','contract','Updated contract')::text,false);
select set_config('hr.demo.warning_series',gen_random_uuid()::text,false);
select public.demo_letter(current_setting('hr.demo.warning_series')::uuid,1,'draft','warning','Demo warning');
select set_config('hr.demo.warning',public.demo_letter(current_setting('hr.demo.warning_series')::uuid,2,'issued','warning','Demo warning')::text,false);
do $$declare s uuid:=gen_random_uuid();begin
 perform public.demo_letter(s,1,'draft','general','[ISI NAMA]');
 begin perform public.demo_letter(s,2,'issued','general','[ISI NAMA]'); raise exception 'Placeholder accepted'; exception when check_violation then null; end;
 begin update public.hr_letters set body='Tampered'; raise exception 'Update accepted'; exception when insufficient_privilege then null; end;
 begin delete from public.hr_letters; raise exception 'Delete accepted'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
 if (select count(*) from public.hr_letters)<>3 or exists(select 1 from public.hr_letters where state='draft') then raise exception 'Draft leaked or issued missing'; end if;
 begin perform public.demo_letter(gen_random_uuid(),1,'draft','general','Unauthorized'); raise exception 'Staff write accepted'; exception when raise_exception then if sqlerrm<>'Owner required' then raise; end if; end;
 begin insert into public.hr_letter_signatures(letter_id,typed_name,intent) values(current_setting('hr.demo.draft')::uuid,'Demo Recipient','receipt'); raise exception 'Draft sign accepted'; exception when raise_exception then if sqlerrm<>'Issued document for own account required' then raise; end if; end;
 begin insert into public.hr_letter_signatures(letter_id,typed_name,intent) values(current_setting('hr.demo.issued')::uuid,'Demo Recipient','acceptance'); raise exception 'Old version sign accepted'; exception when raise_exception then if sqlerrm<>'Document superseded' then raise; end if; end;
 begin insert into public.hr_letter_signatures(letter_id,typed_name,intent) values(current_setting('hr.demo.latest')::uuid,'Wrong name','acceptance'); raise exception 'Name spoof accepted'; exception when raise_exception then if sqlerrm<>'Name must match account' then raise; end if; end;
 begin insert into public.hr_letter_signatures(letter_id,typed_name,intent) values(current_setting('hr.demo.warning')::uuid,'Demo Recipient','acceptance'); raise exception 'Warning accepted as agreement'; exception when raise_exception then if sqlerrm<>'Receipt only for this document' then raise; end if; end;
end$$;
insert into public.hr_letter_signatures(letter_id,typed_name,intent) values(current_setting('hr.demo.latest')::uuid,'demo recipient','acceptance'),(current_setting('hr.demo.warning')::uuid,'Demo Recipient','receipt');
do $$begin
 if (select count(*) from public.hr_letter_signatures)<>2 then raise exception 'Signatures missing'; end if;
 if not exists(select 1 from public.hr_letter_signatures s join public.hr_letters d on d.id=s.letter_id where s.letter_id=current_setting('hr.demo.latest')::uuid and s.document_sha256=encode(sha256(convert_to(jsonb_build_array(d.id,d.series_id,d.revision,d.staff_id,d.kind,d.subject,d.recipient,d.body,d.effective_date)::text,'UTF8')),'hex') and s.typed_name='Demo Recipient') then raise exception 'Document hash or name incorrect'; end if;
 begin insert into public.hr_letter_signatures(letter_id,typed_name,intent) values(current_setting('hr.demo.latest')::uuid,'Demo Recipient','receipt'); raise exception 'Duplicate sign accepted'; exception when unique_violation then null; end;
 begin update public.hr_letter_signatures set intent='receipt'; raise exception 'Signature update accepted'; exception when insufficient_privilege then null; end;
 begin delete from public.hr_letter_signatures; raise exception 'Signature delete accepted'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$begin
 if (select count(*) from public.hr_letters)<>0 or (select count(*) from public.hr_letter_signatures)<>0 then raise exception 'Cross-staff document leaked'; end if;
 begin insert into public.hr_letter_signatures(letter_id,typed_name,intent) values(current_setting('hr.demo.latest')::uuid,'Demo Recipient','acceptance'); raise exception 'Cross-staff signature accepted'; exception when raise_exception then if sqlerrm<>'Issued document for own account required' then raise; end if; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
do $$begin if (select count(*) from public.hr_letters)<>0 or (select count(*) from public.hr_letter_signatures)<>0 then raise exception 'Disabled access'; end if; end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$begin if (select count(*) from public.hr_letter_signatures)<>2 then raise exception 'Owner signature audit missing'; end if; end$$;
reset role;
set role anon;
do $$begin begin perform id from public.hr_letters; raise exception 'Anonymous letter read accepted'; exception when insufficient_privilege then null; end; begin perform letter_id from public.hr_letter_signatures; raise exception 'Anonymous signature read accepted'; exception when insufficient_privilege then null; end; end$$;
reset role;
