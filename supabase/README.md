# Connectar el planificador amb Supabase

La web ja té el Project URL i la clau pública a `src/app/supabase-config.ts`. L’accés amb correu utilitza Supabase Auth. La pestanya **Menú mensual** carrega el receptari compartit i el calendari privat del compte. El planificador setmanal i la pestanya Receptes fan servir el mateix catàleg de Supabase. El navegador conserva les preferències i els identificadors dels sopars planificats.

## Crear les taules i automatitzar els canvis

1. Al repositori de GitHub obre **Settings → Secrets and variables → Actions → New repository secret**.
2. Desa `SUPABASE_ACCESS_TOKEN` amb un token personal creat a [Access Tokens](https://supabase.com/dashboard/account/tokens). Desa `SUPABASE_DB_PASSWORD` amb la contrasenya PostgreSQL del projecte. La trobaràs entre les credencials que vas guardar en crear el projecte. Si l’has perduda, pots restablir-la des de la configuració de la base de dades. Guarda tots dos valors exclusivament com a secrets.
3. Puja els fitxers del projecte, inclosos `.github/workflows/supabase.yml` i `supabase/migrations/`, a la branca principal (`master` o `main`). A **Actions → Migracions de Supabase** comprova que l’execució acaba en verd. També pots repetir-la amb **Run workflow**.
4. A **Table Editor** veuràs `usuaris`, `receptes`, `ingredients` i `sopars_mensuals`. La segona migració carrega les vuit receptes inicials i els seus ingredients.

Cada canvi futur d’esquema s’afegeix com un fitxer SQL nou a `supabase/migrations/`. En pujar-lo a la branca principal, el flux aplica les migracions pendents. Publicar una recepta des de la web la desa a l’instant, juntament amb els ingredients. El desplegament de la web es fa pel procediment habitual del projecte.

## Aplicar les migracions des de PowerShell

Per posar en marxa la base de dades abans de configurar GitHub Actions, executa aquestes ordres des de la carpeta del projecte. La CLI obre l’inici de sessió i et pot demanar la contrasenya PostgreSQL.

```powershell
pnpm dlx supabase login
pnpm dlx supabase link --project-ref racbiakimcxupfrnioyi
pnpm dlx supabase db push --remote --dry-run
pnpm dlx supabase db push --remote
```

## Donar accés a una persona

1. Després d’aplicar les migracions, a **Authentication → Users → Add user → Create new user**, crea un compte amb correu i contrasenya. Confirma el correu del compte per habilitar l’accés.
2. Copia l’UID del compte. A **Table Editor → usuaris**, localitza la fila amb aquell identificador i canvia `rol` de `lector` a `editor` si ha de publicar receptes. Els perfils es creen també per als comptes anteriors a la migració.
3. A la web, entra a **Menú mensual** amb aquest compte. Un editor pot prémer **Nova recepta**. Tant els lectors com els editors poden consultar el receptari i generar el seu calendari privat.

## Distribuir els sopars

Tria el mes i marca els dies de la setmana. Prem **Distribueix les receptes**. L’aplicació reparteix tot el receptari en ordre aleatori i fa servir cada plat abans de repetir-lo. Si ja hi ha sopars aquell mes, et demana confirmació abans de substituir tot el mes amb els dies seleccionats. Cancel·lar conserva el calendari anterior.

[Documentació de Supabase sobre migracions i GitHub Actions](https://supabase.com/docs/guides/deployment/managing-environments)

## Importar i editar receptes

A **Menú mensual → Receptari compartit**, un editor pot enganxar un enllaç HTTPS i prémer **Importa des del web**. El lector extreu ingredients i passos de les pàgines amb dades de recepta JSON-LD o microdades. Revisa les quantitats, les unitats, les categories, el temps i les racions abans de publicar. Cada ingredient es desa a `ingredients` amb la seva posició i la referència a la recepta. Els passos es desen en ordre a `receptes.instructions`.

El flux de GitHub aplica la migració d’edició i desplega la funció `importa-recepta`. La funció comprova el compte i el rol d’editor. Pot descarregar directament els dominis enumerats al fitxer de la funció. Pots afegir dominis de confiança al secret `RECIPE_HOSTS`, separats per comes. Per a altres dominis, el navegador prova la lectura directa si el web d’origen permet CORS.

Esborrar una recepta compartida la retira del catàleg i dels repartiments futurs. Els sopars mensuals que ja l’utilitzen en conserven la fitxa.
