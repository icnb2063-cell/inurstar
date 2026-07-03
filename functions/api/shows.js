const KEY = 'shows';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

async function ensureTable(DB) {
  await DB.prepare(`
    CREATE TABLE IF NOT EXISTS app_data (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return json({ error: 'D1 바인딩 DB가 없습니다.' }, 500);
    await ensureTable(env.DB);
    const row = await env.DB.prepare('SELECT value FROM app_data WHERE key = ?')
      .bind(KEY)
      .first();
    const shows = row ? JSON.parse(row.value) : [];
    return json({ shows });
  } catch (error) {
    return json({ error: error.message || '불러오기 실패' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: 'D1 바인딩 DB가 없습니다.' }, 500);
    const body = await request.json();
    const shows = Array.isArray(body.shows) ? body.shows : [];
    await ensureTable(env.DB);
    await env.DB.prepare(`
      INSERT INTO app_data (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `).bind(KEY, JSON.stringify(shows)).run();
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message || '저장 실패' }, 500);
  }
}
