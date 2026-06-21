const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (!env.DB) return json({ error: 'D1 binding DB가 없습니다. Cloudflare Pages 설정에서 D1 binding 이름을 DB로 지정하세요.' }, 500);

  try {
    if (request.method === 'GET') {
      const row = await env.DB.prepare('SELECT value FROM app_state WHERE key = ?').bind('main').first();
      return json({ state: row ? JSON.parse(row.value) : null });
    }

    if (request.method === 'POST') {
      const state = await request.json();
      if (!state || typeof state !== 'object' || !Array.isArray(state.students)) {
        return json({ error: '잘못된 데이터 형식입니다.' }, 400);
      }
      await env.DB.prepare(
        `INSERT INTO app_state (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      ).bind('main', JSON.stringify(state)).run();
      return json({ ok: true });
    }

    return json({ error: 'Method Not Allowed' }, 405);
  } catch (err) {
    return json({ error: String(err && err.message ? err.message : err) }, 500);
  }
}
