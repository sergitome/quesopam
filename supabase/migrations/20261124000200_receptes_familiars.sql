with plats(id, name, emoji, minutes, servings, instructions) as (values
    ('sopa', 'Sopa', '🍲', 15, 2, array['Escalfa el brou en una olla fins que bulli.', 'Afegeix els fideus i cou-los el temps indicat al paquet.', 'Reparteix la sopa en bols i serveix-la calenta.']),
    ('tortilla', 'Tortilla', '🍳', 10, 2, array['Bat els ous amb la sal.', 'Escalfa l’oli en una paella antiadherent i aboca-hi els ous.', 'Quan la base hagi quallat, plega la truita i acaba de coure-la.']),
    ('ous-frits', 'Ous frits', '🍳', 10, 2, array['Escalfa l’oli en una paella petita.', 'Trenca cada ou en una tassa i fes-lo lliscar dins la paella.', 'Fregeix els ous fins que les clares hagin quallat. Retira’ls amb una escumadora i sala’ls.']),
    ('salmo-amb-xampinyons', 'Salmó amb xampinyons', '🐟', 25, 2, array['Neteja els xampinyons i talla’ls a làmines. Pica l’all.', 'Salta els xampinyons amb l’oli i l’all i reserva’ls.', 'Sala el salmó i cou-lo a la mateixa paella per les dues bandes fins que sigui cuit al centre.', 'Torna-hi a posar els xampinyons i serveix.']),
    ('hamburgueses', 'Hamburgueses', '🍔', 20, 2, array['Divideix la carn en dues porcions, forma les hamburgueses i sala-les.', 'Escalfa l’oli i cou les hamburgueses per les dues bandes fins que siguin ben cuites al centre.', 'Talla el tomàquet a rodanxes i munta els panets amb tomàquet i hamburguesa.']),
    ('perritos', 'Perritos', '🌭', 10, 2, array['Escalfa les salsitxes segons les indicacions del paquet.', 'Obre els panets i torra’ls lleugerament.', 'Posa una salsitxa dins cada panet i afegeix-hi la mostassa.']),
    ('pure', 'Puré', '🥔', 30, 2, array['Pela les patates i talla-les a trossos de mida semblant.', 'Cobreix-les amb aigua i bull-les fins que es desfacin fàcilment amb una forquilla.', 'Escorre-les i aixafa-les amb la mantega. Incorpora-hi la llet calenta de mica en mica i ajusta la sal.']),
    ('ternera-amb-girgoles', 'Ternera amb gírgoles', '🍄', 25, 2, array['Talla la vedella a tires i esquinça les gírgoles.', 'Enrosseix la vedella amb la meitat de l’oli i reserva-la.', 'Salta les gírgoles amb la resta de l’oli i l’all picat.', 'Torna-hi a posar la vedella, sala-la i acaba de coure el conjunt.']),
    ('fajitas', 'Fajitas', '🌯', 25, 2, array['Talla el pollastre, el pebrot i la ceba a tires.', 'Enrosseix el pollastre amb l’oli. Afegeix-hi el pebrot, la ceba i el pebre vermell.', 'Salta-ho fins que el pollastre sigui ben cuit i les verdures siguin tendres.', 'Escalfa les tortilles, reparteix-hi el farciment i enrotlla-les.']),
    ('espaguetis-amb-nata', 'Espaguetis amb nata', '🍝', 20, 2, array['Bull els espaguetis en aigua amb sal segons el temps del paquet.', 'Escalfa la nata a foc suau i incorpora-hi el parmesà ratllat.', 'Escorre la pasta, barreja-la amb la salsa i serveix-la de seguida.'])
), noves as (
  insert into public.receptes(id, name, emoji, minutes, servings, instructions)
    select p.* from plats p
    where not exists (select from public.receptes r where lower(btrim(r.name)) = lower(p.name))
    on conflict (id) do nothing
    returning id
)
insert into public.ingredients(recepta_id, posicio, name, amount, unit, category)
select i.* from (values
  ('sopa', 1, 'Brou de verdures', 750, 'ml', 'Rebost'),
  ('sopa', 2, 'Fideus fins', 80, 'g', 'Rebost'),
  ('tortilla', 1, 'Ous', 4, 'u', 'Làctics i ous'),
  ('tortilla', 2, 'Oli d’oliva', 15, 'ml', 'Rebost'),
  ('tortilla', 3, 'Sal', 1, 'g', 'Rebost'),
  ('ous-frits', 1, 'Ous', 4, 'u', 'Làctics i ous'),
  ('ous-frits', 2, 'Oli d’oliva', 50, 'ml', 'Rebost'),
  ('ous-frits', 3, 'Sal', 1, 'g', 'Rebost'),
  ('salmo-amb-xampinyons', 1, 'Llom de salmó', 2, 'u', 'Carn i peix'),
  ('salmo-amb-xampinyons', 2, 'Xampinyons', 250, 'g', 'Fruita i verdura'),
  ('salmo-amb-xampinyons', 3, 'All', 1, 'gra', 'Fruita i verdura'),
  ('salmo-amb-xampinyons', 4, 'Oli d’oliva', 15, 'ml', 'Rebost'),
  ('salmo-amb-xampinyons', 5, 'Sal', 1, 'g', 'Rebost'),
  ('hamburgueses', 1, 'Carn picada de vedella', 300, 'g', 'Carn i peix'),
  ('hamburgueses', 2, 'Panet d’hamburguesa', 2, 'u', 'Forn'),
  ('hamburgueses', 3, 'Tomàquet', 1, 'u', 'Fruita i verdura'),
  ('hamburgueses', 4, 'Oli d’oliva', 15, 'ml', 'Rebost'),
  ('hamburgueses', 5, 'Sal', 1, 'g', 'Rebost'),
  ('perritos', 1, 'Salsitxa de Frankfurt', 2, 'u', 'Carn i peix'),
  ('perritos', 2, 'Panet de Frankfurt', 2, 'u', 'Forn'),
  ('perritos', 3, 'Mostassa', 10, 'g', 'Rebost'),
  ('pure', 1, 'Patata', 500, 'g', 'Fruita i verdura'),
  ('pure', 2, 'Mantega', 25, 'g', 'Làctics i ous'),
  ('pure', 3, 'Llet', 100, 'ml', 'Làctics i ous'),
  ('pure', 4, 'Sal', 1, 'g', 'Rebost'),
  ('ternera-amb-girgoles', 1, 'Vedella', 300, 'g', 'Carn i peix'),
  ('ternera-amb-girgoles', 2, 'Gírgoles', 250, 'g', 'Fruita i verdura'),
  ('ternera-amb-girgoles', 3, 'All', 1, 'gra', 'Fruita i verdura'),
  ('ternera-amb-girgoles', 4, 'Oli d’oliva', 15, 'ml', 'Rebost'),
  ('ternera-amb-girgoles', 5, 'Sal', 1, 'g', 'Rebost'),
  ('fajitas', 1, 'Pit de pollastre', 300, 'g', 'Carn i peix'),
  ('fajitas', 2, 'Pebrot vermell', 1, 'u', 'Fruita i verdura'),
  ('fajitas', 3, 'Ceba', 1, 'u', 'Fruita i verdura'),
  ('fajitas', 4, 'Tortilles de blat', 4, 'u', 'Forn'),
  ('fajitas', 5, 'Pebre vermell dolç', 2, 'g', 'Rebost'),
  ('fajitas', 6, 'Oli d’oliva', 15, 'ml', 'Rebost'),
  ('espaguetis-amb-nata', 1, 'Espaguetis', 180, 'g', 'Rebost'),
  ('espaguetis-amb-nata', 2, 'Nata per cuinar', 150, 'ml', 'Làctics i ous'),
  ('espaguetis-amb-nata', 3, 'Parmesà', 30, 'g', 'Làctics i ous'),
  ('espaguetis-amb-nata', 4, 'Sal', 1, 'g', 'Rebost')
) as i(recepta_id, posicio, name, amount, unit, category)
join noves on noves.id = i.recepta_id;
