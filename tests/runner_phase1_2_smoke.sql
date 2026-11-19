-- Runner V86-V90 smoke test. Run with SQL Editor privileges in the linked Supabase project.
-- Tests use temporary rows and an explicit ROLLBACK; no real Runner records are edited.
-- set_config('request.jwt.claim.sub',...) simulates actor identity but is NOT a replacement
-- for a real JWT/RLS browser test. Only use this script in a controlled environment.
begin;
do $$
declare
  op_id uuid;
  owner_id uuid;
  trip text := 'runner_smoke_'||substr(md5(random()::text),1,12);
  req uuid;
  current_upah numeric;
  n int;
  denied boolean;
begin
  select id into op_id from public.profiles where role::text='operations' and enabled limit 1;
  select id into owner_id from public.profiles where role::text='owner' and enabled limit 1;
  if op_id is null or owner_id is null then raise exception 'Missing active test actors'; end if;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  insert into public.runner_trips(id,car,plate,from_loc,to_loc,upah,exp)
    values(trip,'Smoke Test','SMOKE 101','A','B',80,'[{"n":"Tol","a":10}]'::jsonb);
  perform set_config('request.jwt.claim.sub',op_id::text,true);
  update public.runner_trips set car='Smoke Updated',assigned_to=op_id where id=trip;
  insert into public.runner_receipts(trip_id,category,amount,image_data)
    values(trip,'Tol',10,'data:image/png;base64,a');

  insert into public.runner_upah_requests(trip_id,direction,amount,base_upah,reason)
    values(trip,'tambah',20,80,'Extra distance during journey') returning id into req;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  denied:=false;
  begin
    insert into public.runner_payments(trip_id,amount) values(trip,90);
  exception when others then
    if SQLERRM like '%belum diputuskan%' then denied:=true; else raise; end if;
  end;
  if not denied then raise exception 'Pending upah payment lock failed'; end if;

  perform public.runner_decide_upah_request(req,true,null);
  select upah into current_upah from public.runner_trips where id=trip;
  if current_upah<>100 then raise exception 'Approved upah not reflected'; end if;
  insert into public.runner_payments(trip_id,amount) values(trip,110);

  denied:=false;
  begin
    update public.runner_trips set upah=125 where id=trip;
  exception when others then
    if SQLERRM like '%dibayar%' then denied:=true; else raise; end if;
  end;
  if not denied then raise exception 'Paid trip financial lock failed'; end if;

  perform set_config('request.jwt.claim.sub',op_id::text,true);
  denied:=false;
  begin
    insert into public.runner_receipts(trip_id,category,amount,image_data)
      values(trip,'Tol',3,'data:image/png;base64,b');
  exception when others then
    if SQLERRM like '%dibayar%' then denied:=true; else raise; end if;
  end;
  if not denied then raise exception 'Paid trip receipt guard failed'; end if;

  select count(*) into n from public.runner_audit where trip_id=trip;
  if n<3 then raise exception 'Audit entries missing'; end if;
  select count(*) into n from public.app_notifications where ref_id=req::text and user_id=op_id;
  if n<1 then raise exception 'Decision notification missing'; end if;
  raise notice 'PASS: Runner Phase 1+2 smoke tests, reverting changes';
end $$;
rollback;
