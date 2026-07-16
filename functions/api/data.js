const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders
    }
  });
}

async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

async function readState(db) {
  const row = await db.prepare('SELECT value, updated_at FROM app_state WHERE key = ?').bind('main').first();
  if (!row) return { state: null, updated_at: null };
  return { state: JSON.parse(row.value), updated_at: row.updated_at };
}

async function writeState(db, state) {
  await db.prepare(
    `INSERT INTO app_state (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = CURRENT_TIMESTAMP`
  ).bind('main', JSON.stringify(state)).run();
}

function normalizeState(state) {
  if (!state || typeof state !== 'object') state = {};
  if (!state.mode) state.mode = 'term';
  if (!Array.isArray(state.students)) state.students = [];
  if (!Array.isArray(state.sections)) state.sections = [];
  if (!Array.isArray(state.rules)) state.rules = [];
  if (!state.totalPieces) state.totalPieces = 50;
  // 기존 버전과의 호환: 기존 sections/rules를 학기 중 설정으로 이전
  if (!state.termConfig) state.termConfig = { targetPct: 70, sections: state.sections, rules: state.rules };
  if (!state.vacationConfig) state.vacationConfig = { targetPct: 50, sections: [], rules: [{min:50,max:79,pieces:1},{min:80,max:99,pieces:2},{min:100,max:100,pieces:3}] };
  if (!Array.isArray(state.termConfig.sections)) state.termConfig.sections = [];
  if (!Array.isArray(state.termConfig.rules)) state.termConfig.rules = [];
  if (!Array.isArray(state.vacationConfig.sections)) state.vacationConfig.sections = [];
  if (!Array.isArray(state.vacationConfig.rules)) state.vacationConfig.rules = [];
  const active = state.mode === 'vacation' ? state.vacationConfig : state.termConfig;
  state.sections = active.sections;
  state.rules = active.rules;
  state.students.forEach((s, i) => {
    if (!s.id) s.id = i + 1;
    if (!s.name) s.name = '학생' + (i + 1);
    if (s.pieces === undefined) s.pieces = 0;
    if (s.stars === undefined) s.stars = 0;
    if (!Array.isArray(s.history)) s.history = [];
    if (!Array.isArray(s.snapshots)) s.snapshots = [];
    if (!s.checks || typeof s.checks !== 'object') s.checks = {};
    if (s.colorIdx === undefined) s.colorIdx = i % 8;
  });
  return state;
}

function mergeOneStudent(baseState, incomingState, student) {
  // 학생 화면 저장은 학생 1명의 데이터만 바꿉니다.
  // 운영 모드와 체크리스트 설정은 관리자 화면에서만 변경할 수 있습니다.
  let base = baseState;
  if (!base || typeof base !== 'object') {
    base = incomingState && typeof incomingState === 'object'
      ? incomingState
      : { mode: 'term', students: [] };
  }
  base = normalizeState(base);

  const idx = base.students.findIndex(s => String(s.id) === String(student.id));
  const cleanStudent = normalizeState({ students: [student] }).students[0];
  if (idx >= 0) base.students[idx] = cleanStudent;
  else base.students.push(cleanStudent);

  // 현재 서버의 운영 모드에 맞춰 활성 설정만 다시 맞춥니다.
  const active = base.mode === 'vacation' ? base.vacationConfig : base.termConfig;
  base.sections = active.sections;
  base.rules = active.rules;
  return base;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  if (!env.DB) {
    return json({
      ok: false,
      error: 'D1 binding DB가 없습니다.',
      fix: 'Cloudflare Pages > Settings > Functions > D1 database bindings에서 Variable name을 반드시 DB로 지정하세요.'
    }, 500);
  }

  try {
    await ensureSchema(env.DB);

    if (request.method === 'GET') {
      const { state, updated_at } = await readState(env.DB);
      return json({ ok: true, state, updated_at });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const action = body && body.action;

      // 학생 화면용: 학생 1명만 안전하게 업데이트합니다.
      if (action === 'updateStudent') {
        if (!body.student || typeof body.student !== 'object') {
          return json({ ok: false, error: 'student 객체가 필요합니다.' }, 400);
        }
        const { state: current } = await readState(env.DB);
        const next = mergeOneStudent(current, body.state, body.student);
        await writeState(env.DB, next);
        return json({ ok: true, state: next });
      }

      // 관리자용: 의도적으로 전체 상태를 저장합니다. 학생 추가·삭제·설정 변경에 사용합니다.
      const state = action === 'saveState' ? body.state : body;
      if (!state || typeof state !== 'object' || !Array.isArray(state.students)) {
        return json({ ok: false, error: '잘못된 데이터 형식입니다. students 배열이 필요합니다.' }, 400);
      }
      const next = normalizeState(state);
      await writeState(env.DB, next);
      return json({ ok: true, state: next });
    }

    return json({ ok: false, error: 'Method Not Allowed' }, 405);
  } catch (err) {
    return json({
      ok: false,
      error: String(err && err.message ? err.message : err),
      fix: 'D1 데이터베이스가 생성되어 있고 Pages 프로젝트에 DB라는 이름으로 바인딩되어 있는지 확인하세요.'
    }, 500);
  }
}
