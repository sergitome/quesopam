alter table public.receptes add column arxivada boolean not null default false;

create function public.modifica_recepta(recepta text, plat jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select from public.usuaris where id = auth.uid() and rol = 'editor') then
    raise exception 'Cal el rol editor.' using errcode = '42501';
  end if;
  if coalesce(jsonb_array_length(plat->'ingredients'),0) = 0 then
    raise exception 'Afegeix almenys un ingredient.';
  end if;
  update public.receptes set name = btrim(plat->>'name'), emoji = coalesce(plat->>'emoji','🍽️'),
    minutes = (plat->>'minutes')::integer, servings = (plat->>'servings')::integer,
    tags = array(select jsonb_array_elements_text(plat->'tags')),
    instructions = array(select jsonb_array_elements_text(plat->'instructions'))
    where id = recepta and not arxivada;
  if not found then raise exception 'La recepta ja no existeix.'; end if;
  delete from public.ingredients where recepta_id = recepta;
  insert into public.ingredients(recepta_id,posicio,name,amount,unit,category)
    select recepta, n, i->>'name',(i->>'amount')::numeric,i->>'unit',i->>'category'
    from jsonb_array_elements(plat->'ingredients') with ordinality as entrada(i,n);
end $$;

create function public.esborra_recepta(recepta text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select from public.usuaris where id = auth.uid() and rol = 'editor') then
    raise exception 'Cal el rol editor.' using errcode = '42501';
  end if;
  delete from public.receptes where id = recepta;
  if not found then raise exception 'La recepta ja no existeix.'; end if;
exception when foreign_key_violation then
  -- Conserva els ingredients i les instruccions dels sopars ja planificats.
  update public.receptes set arxivada = true where id = recepta;
end $$;
revoke all on function public.modifica_recepta(text,jsonb), public.esborra_recepta(text) from public, anon, authenticated;
grant execute on function public.modifica_recepta(text,jsonb), public.esborra_recepta(text) to authenticated;

create or replace function public.distribueix_mes(mes date, dies integer[], confirmacio uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  usuari uuid := auth.uid();
  anterior uuid;
  nova uuid := gen_random_uuid();
  plats text[];
  dia_menu date;
  idx integer := 1;
begin
  if usuari is null then raise exception 'Cal iniciar sessió.'; end if;
  if mes is null or extract(day from mes) <> 1 or coalesce(cardinality(dies),0) = 0
      or exists (select from unnest(dies) d where d is null or d not between 1 and 7) then
    raise exception 'Mes o dies incorrectes.';
  end if;
  perform pg_advisory_xact_lock(hashtext(usuari::text), mes - date '2000-01-01');
  select revisio into anterior from public.sopars_mensuals
    where usuari_id = usuari and dia >= mes and dia < mes + interval '1 month' limit 1;
  if anterior is distinct from confirmacio then
    return jsonb_build_object('confirmacio', anterior);
  end if;
  select array_agg(id order by random()) into plats from public.receptes where not arxivada;
  if plats is null then raise exception 'El receptari és buit.'; end if;
  delete from public.sopars_mensuals where usuari_id = usuari and dia >= mes and dia < mes + interval '1 month';
  for dia_menu in select mes + n from generate_series(0, ((mes + interval '1 month')::date - mes) - 1) n
    where extract(isodow from mes + n)::int = any(dies) order by n
  loop
    insert into public.sopars_mensuals values (usuari,dia_menu,plats[idx],nova);
    idx := idx % cardinality(plats) + 1;
  end loop;
  return jsonb_build_object('desat', true);
end $$;
