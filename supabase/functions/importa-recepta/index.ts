import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
};
const reply = (body: object, status = 200) => Response.json(body, { status, headers: cors });
const hosts = new Set([
  'www.3cat.cat', 'www.cuina.cat', 'www.receptes.cat', 'www.bbcgoodfood.com',
  'www.directoalpaladar.com', 'www.recetasderechupete.com', 'www.allrecipes.com',
  ...(Deno.env.get('RECIPE_HOSTS') || '').split(',').map(h => h.trim().toLowerCase()).filter(Boolean),
].flatMap(h => [h, h.replace(/^www\./, '')]));

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return reply({}, 405);
  const auth = req.headers.get('Authorization');
  if (!auth) return reply({}, 401);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    {global: {headers: {Authorization: auth}}});
  const {data: {user}} = await db.auth.getUser(auth.replace(/^Bearer /i, ''));
  if (!user) return reply({}, 401);
  const {data: profile} = await db.from('usuaris').select('rol').eq('id', user.id).single();
  if (profile?.rol !== 'editor') return reply({}, 403);

  try {
    let url = new URL((await req.json()).url);
    const signal = AbortSignal.timeout(12000);
    for (let attempt = 0; attempt < 5; attempt++) {
      if (url.protocol !== 'https:' || url.port || url.username || url.password) return reply({error: 'Cal un enllaç HTTPS públic.'});
      if (!hosts.has(url.hostname)) return reply({direct: true});
      const res = await fetch(url, {redirect: 'manual', signal, headers: {Accept: 'text/html'}});
      if ([301,302,303,307,308].includes(res.status)) {
        await res.body?.cancel();
        const location = res.headers.get('location');
        if (!location) break;
        url = new URL(location, url);
        continue;
      }
      if (!res.ok || !res.body || !res.headers.get('content-type')?.includes('text/html')) {
        await res.body?.cancel();
        break;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let html = '', length = 0;
      while (true) {
        const {done, value} = await reader.read();
        if (done) return reply({html: html + decoder.decode()});
        length += value.byteLength;
        if (length > 4_000_000) { await reader.cancel(); return reply({error: 'La pàgina és massa gran.'}); }
        html += decoder.decode(value, {stream: true});
      }
    }
  } catch { /* Les pàgines poden bloquejar la descàrrega o exhaurir el temps. */ }
  return reply({error: 'No s’ha pogut llegir la pàgina de la recepta.'});
});
