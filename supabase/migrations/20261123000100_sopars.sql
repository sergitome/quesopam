create table public.usuaris (
  id uuid primary key references auth.users on delete cascade,
  rol text not null default 'lector' check (rol in ('lector','editor'))
);
create function public.perfil_nou() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.usuaris(id) values (new.id);
  return new;
end $$;
revoke all on function public.perfil_nou() from public, anon, authenticated;
create trigger crea_perfil_sopars after insert on auth.users for each row execute function public.perfil_nou();
insert into public.usuaris(id) select id from auth.users on conflict do nothing;

create table public.receptes (
  id text primary key default gen_random_uuid()::text,
  autor uuid references public.usuaris on delete set null,
  name text not null check (btrim(name) <> ''),
  emoji text not null default '🍽️',
  minutes integer not null check (minutes > 0),
  servings integer not null check (servings > 0),
  tags text[] not null default '{}',
  instructions text[] not null
);
create table public.ingredients (
  recepta_id text not null references public.receptes on delete cascade,
  posicio integer not null,
  name text not null check (btrim(name) <> ''),
  amount numeric not null check (amount > 0 and amount < 'Infinity'::numeric),
  unit text not null check (btrim(unit) <> ''),
  category text not null check (category in ('Fruita i verdura','Carn i peix','Làctics i ous','Rebost','Forn','Congelats','Altres')),
  primary key (recepta_id, posicio)
);
create table public.sopars_mensuals (
  usuari_id uuid not null references public.usuaris on delete cascade,
  dia date not null,
  recepta_id text not null references public.receptes,
  revisio uuid not null,
  primary key (usuari_id, dia)
);

alter table public.usuaris enable row level security;
alter table public.receptes enable row level security;
alter table public.ingredients enable row level security;
alter table public.sopars_mensuals enable row level security;
revoke all on public.usuaris, public.receptes, public.ingredients, public.sopars_mensuals from public, anon, authenticated;
grant select on public.usuaris, public.receptes, public.ingredients, public.sopars_mensuals to authenticated;
create policy perfil_propi on public.usuaris for select to authenticated using (id = (select auth.uid()));
create policy consulta_receptes on public.receptes for select to authenticated using (true);
create policy consulta_ingredients on public.ingredients for select to authenticated using (true);
create policy calendari_propi on public.sopars_mensuals for select to authenticated using (usuari_id = (select auth.uid()));

create function public.publica_recepta(plat jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare nova_id text;
begin
  if not exists (select from public.usuaris where id = auth.uid() and rol = 'editor') then
    raise exception 'Cal el rol editor per publicar.' using errcode = '42501';
  end if;
  if coalesce(jsonb_array_length(plat->'ingredients'),0) = 0 then
    raise exception 'Afegeix almenys un ingredient.';
  end if;
  insert into public.receptes(autor,name,emoji,minutes,servings,tags,instructions)
    values (auth.uid(), btrim(plat->>'name'), coalesce(plat->>'emoji','🍽️'),
      (plat->>'minutes')::integer,(plat->>'servings')::integer,
      array(select jsonb_array_elements_text(plat->'tags')),array(select jsonb_array_elements_text(plat->'instructions')))
    returning id into nova_id;
  insert into public.ingredients(recepta_id,posicio,name,amount,unit,category)
    select nova_id, n, i->>'name',(i->>'amount')::numeric,i->>'unit',i->>'category'
    from jsonb_array_elements(plat->'ingredients') with ordinality as entrada(i,n);
  return nova_id;
end $$;

-- Serialitza els repartiments del mateix usuari i mes. La revisió identifica el menú confirmat.
create function public.distribueix_mes(mes date, dies integer[], confirmacio uuid default null)
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
  select array_agg(id order by random()) into plats from public.receptes;
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
revoke all on function public.publica_recepta(jsonb), public.distribueix_mes(date,integer[],uuid) from public, anon, authenticated;
grant execute on function public.publica_recepta(jsonb), public.distribueix_mes(date,integer[],uuid) to authenticated;
