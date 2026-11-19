create or replace function public.runner_decide_upah_request(p_request_id uuid,p_approve boolean,p_note text default null)
returns public.runner_upah_requests language plpgsql security definer set search_path=public as $$
declare req public.runner_upah_requests%rowtype; t public.runner_trips%rowtype; new_upah numeric(12,2);
begin
 if auth.uid() is null or public.runner_role()<>'owner' then
  raise exception 'Hanya Owner boleh membuat keputusan permohonan.';
 end if;
 select * into req from public.runner_upah_requests where id=p_request_id for update;
 if not found or req.status<>'pending' then raise exception 'Permohonan tiada atau sudah diputuskan.'; end if;
 if p_approve then
  select * into t from public.runner_trips where id=req.trip_id for update;
  if not found then raise exception 'Trip tidak dijumpai.'; end if;
  if exists(select 1 from public.runner_payments where trip_id=req.trip_id) or
     exists(select 1 from public.runner_ownerpaid where trip_id=req.trip_id) then
   raise exception 'Trip telah dibayar; tidak boleh luluskan upah.';
  end if;
  if t.upah<>req.base_upah then raise exception 'Upah sudah berubah. Tolak permohonan lama.'; end if;
  new_upah:=t.upah+(case when req.direction='tambah' then req.amount else -req.amount end);
  if new_upah<0 then raise exception 'Upah tidak boleh negatif.'; end if;
 end if;
 -- Mark decision before writing approved amount; trip guard blocks only unresolved requests.
 update public.runner_upah_requests set status=case when p_approve then 'approved' else 'rejected' end,
 reviewed_by=auth.uid(),reviewed_at=now(),review_note=nullif(btrim(coalesce(p_note,'')),'')
 where id=req.id returning * into req;
 if p_approve then update public.runner_trips set upah=new_upah where id=req.trip_id; end if;
 return req;
end $$;