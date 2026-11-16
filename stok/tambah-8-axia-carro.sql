-- Abe Din Auto: tambah 8 kereta Perodua Axia (bidaan Carro) ke inventori
-- Jalankan dalam Supabase > SQL Editor (projek buzpdyvvoiqgbeventwm).
-- Selamat dijalankan lebih sekali: plat yang sudah wujud akan dilangkau.
-- Modal = harga bidaan Carro. Harga jual (asking_price) dibiar 0 untuk diisi kemudian.

do $$
declare
  sup_id  uuid;
  next_no int;
  r       record;
  added   int := 0;
begin
  -- Pembekal "Carro": guna yang sedia ada, atau cipta baru
  select id into sup_id from public.suppliers where lower(name) = 'carro' limit 1;
  if sup_id is null then
    insert into public.suppliers (name, notes)
    values ('Carro', 'Bidaan kereta terpakai Carro')
    returning id into sup_id;
  end if;

  -- Nombor ADA-xxxx seterusnya
  select coalesce(max((substring(vehicle_id from '^ADA-(\d+)$'))::int), 0) + 1
    into next_no
    from public.vehicles
   where vehicle_id ~* '^ADA-\d+$';

  for r in
    select * from (values
      ('VJG7922',  'Axia SE 1.0 MT',     2014, 173268,  5700, 'Carro #ID 2825159 · bidaan 10 Nov 2026 · pick up Kota Bharu Inspection Centre'),
      ('WC4368L',  'Axia G 1.0 AT',      2016, 156298,  9900, 'Carro #ID 2824339 · bidaan 09 Nov 2026 · pick up Kota Bharu Inspection Centre'),
      ('JRD5562',  'Axia AV 1.0 AT',     2015, 139093,  9900, 'Carro #ID 2822783 · bidaan 08 Nov 2026 · pick up Batu Pahat Inspection Centre'),
      ('JRH324',   'Axia G 1.0 AT',      2016, 131090,  9900, 'Carro #ID 2821872 · bidaan 08 Nov 2026 · pick up JB Eco Inspection Centre'),
      ('WB5492C',  'Axia SE 1.0 AT',     2015, 213859,  9500, 'Carro #ID 2821784 · bidaan 07 Nov 2026 · pick up CCC Sungai Buloh'),
      ('WC3195T',  'Axia G 1.0 AT',      2016, 269272,  9900, 'Carro #ID 2815386 · bidaan 05 Nov 2026 · pick up Kota Bharu Inspection Centre'),
      ('AKE8420',  'Axia G 1.0 AT',      2015, 102792,  8900, 'Carro #ID 2812196 · bidaan 02 Nov 2026 · pick up CCC Sungai Buloh'),
      ('JTT9100',  'Axia Style 1.0 AT',  2019, 106644, 17100, 'Carro #ID 2806257 · bidaan 29 Oct 2026 · pick up Melaka Inspection Centre')
    ) as t(plate, model, model_year, mileage_km, purchase_cost, notes)
  loop
    if exists (select 1 from public.vehicles v
                where upper(replace(v.plate, ' ', '')) = r.plate) then
      raise notice 'Langkau % (plat sudah ada dalam inventori)', r.plate;
      continue;
    end if;

    insert into public.vehicles
      (vehicle_id, plate, make, model, model_year, mileage_km,
       acquisition_type, supplier_id, purchase_cost, asking_price,
       status, is_published, notes)
    values
      ('ADA-' || lpad(next_no::text, 4, '0'), r.plate, 'Perodua', r.model,
       r.model_year, r.mileage_km, 'direct', sup_id, r.purchase_cost, 0,
       'preparation', false, r.notes);

    next_no := next_no + 1;
    added   := added + 1;
  end loop;

  raise notice 'Selesai: % kereta ditambah ke inventori.', added;
end $$;

-- Semak hasil:
select vehicle_id, plate, make, model, model_year, mileage_km, purchase_cost, status
  from public.vehicles
 where plate in ('VJG7922','WC4368L','JRD5562','JRH324','WB5492C','WC3195T','AKE8420','JTT9100')
 order by vehicle_id;
