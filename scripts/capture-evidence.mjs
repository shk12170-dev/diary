// 과제7 카드4(인가/타인 데이터 접근 차단) 증거 자동 캡처 스크립트.
//
// 사전 준비:
//   1. supabase/schema.sql 을 Supabase 대시보드(SQL Editor)에서 먼저 실행해야 합니다.
//   2. 테스트 계정 2개(A, B)를 회원가입 후 각각 이메일 인증까지 완료해야 합니다.
//
// 실행:
//   node scripts/capture-evidence.mjs \
//     --a-email alice@example.com --a-pass "AlicePass123!" \
//     --b-email bob@example.com   --b-pass "BobPass123!"
//
// 결과: evidence/evidence.txt 에 성공/거절 요청-응답을 나란히 저장합니다.
// 토큰은 앞 12자만 남기고 마스킹해서 저장하므로 그대로 제출 문서에 붙여도 됩니다.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function loadEnvLocal() {
  const raw = readFileSync(path.join(root, '.env.local'), 'utf8')
  const env = {}
  for (const rawLine of raw.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (let i = 0; i < args.length; i += 2) {
    out[args[i].replace(/^--/, '')] = args[i + 1]
  }
  return out
}

function mask(token) {
  if (!token) return '(없음)'
  return token.slice(0, 12) + '...[마스킹]'
}

const env = loadEnvLocal()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const args = parseArgs()

const A_EMAIL = args['a-email']
const A_PASS = args['a-pass']
const B_EMAIL = args['b-email']
const B_PASS = args['b-pass']

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('오류: .env.local 에서 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 찾을 수 없습니다.')
  process.exit(1)
}
if (!A_EMAIL || !A_PASS || !B_EMAIL || !B_PASS) {
  console.error('사용법: node scripts/capture-evidence.mjs --a-email A계정이메일 --a-pass A비밀번호 --b-email B계정이메일 --b-pass B비밀번호')
  process.exit(1)
}

const lines = []
function log(section, text) {
  lines.push(`\n=== ${section} ===`)
  lines.push(text)
  console.log(`\n=== ${section} ===`)
  console.log(text)
}

async function login(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json()
  return { status: res.status, body }
}

async function rest(pathAndQuery, { method = 'GET', token, body, prefer } = {}) {
  const headers = { apikey: ANON_KEY, Authorization: `Bearer ${token || ANON_KEY}` }
  if (body) headers['Content-Type'] = 'application/json'
  if (prefer) headers['Prefer'] = prefer
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let json
  try { json = await res.json() } catch { json = null }
  return { status: res.status, body: json }
}

async function main() {
  log('0) 로그인 없이 todos 조회 (anon key만)', await (async () => {
    const r = await rest('todos?select=*')
    return `GET /rest/v1/todos\nAuthorization: Bearer ${mask(ANON_KEY)}\n\n-> ${r.status}\n${JSON.stringify(r.body)}`
  })())

  const aLogin = await login(A_EMAIL, A_PASS)
  const bLogin = await login(B_EMAIL, B_PASS)

  log('1) 계정 A 로그인', `POST /auth/v1/token?grant_type=password  (email: ${A_EMAIL})\n-> ${aLogin.status}\naccess_token: ${mask(aLogin.body.access_token)}`)
  log('2) 계정 B 로그인', `POST /auth/v1/token?grant_type=password  (email: ${B_EMAIL})\n-> ${bLogin.status}\naccess_token: ${mask(bLogin.body.access_token)}`)

  if (aLogin.status !== 200 || bLogin.status !== 200) {
    log('중단', '로그인이 실패해 이후 단계를 진행할 수 없습니다. 계정 이메일 인증(Confirm) 여부와 비밀번호를 확인하세요.')
    writeFileSync(path.join(root, 'evidence', 'evidence.txt'), lines.join('\n'))
    return
  }

  const aToken = aLogin.body.access_token
  const bToken = bLogin.body.access_token
  const aUserId = aLogin.body.user.id

  const created = await rest('todos', {
    method: 'POST',
    token: aToken,
    prefer: 'return=representation',
    body: { user_id: aUserId, title: '과제7 카드4 검증용 할 일', due_date: '2026-09-10', priority: 'HIGH', estimated_hours: 1, tags: 'evidence' },
  })
  const todoId = created.body?.[0]?.id
  log('3) A가 자기 할 일 생성', `POST /rest/v1/todos (A 토큰)\n-> ${created.status}\n${JSON.stringify(created.body)}`)

  if (!todoId) {
    log('중단', 'A의 할 일 생성에 실패해 이후 단계를 진행할 수 없습니다.')
    writeFileSync(path.join(root, 'evidence', 'evidence.txt'), lines.join('\n'))
    return
  }

  const bRead = await rest(`todos?id=eq.${todoId}&select=*`, { token: bToken })
  log('4) B가 A의 할 일을 id로 조회 시도', `GET /rest/v1/todos?id=eq.${todoId} (B 토큰)\n-> ${bRead.status}\n${JSON.stringify(bRead.body)}\n(빈 배열 = RLS가 존재 자체를 숨김. 타인 자료가 보이지 않아야 정상)`)

  const bUpdate = await rest(`todos?id=eq.${todoId}`, { method: 'PATCH', token: bToken, prefer: 'return=representation', body: { title: '해킹 시도' } })
  log('5) B가 A의 할 일 수정 시도', `PATCH /rest/v1/todos?id=eq.${todoId} (B 토큰)\n-> ${bUpdate.status}\n${JSON.stringify(bUpdate.body)}\n(빈 배열 = 수정된 행 0건, 거절됨)`)

  const bDelete = await rest(`todos?id=eq.${todoId}`, { method: 'DELETE', token: bToken, prefer: 'return=representation' })
  log('6) B가 A의 할 일 삭제 시도', `DELETE /rest/v1/todos?id=eq.${todoId} (B 토큰)\n-> ${bDelete.status}\n${JSON.stringify(bDelete.body)}\n(빈 배열 = 삭제된 행 0건, 거절됨)`)

  const aReread = await rest(`todos?id=eq.${todoId}&select=*`, { token: aToken })
  log('7) A가 자기 할 일 재조회 (변조/삭제 안 됐는지 확인)', `GET /rest/v1/todos?id=eq.${todoId} (A 토큰)\n-> ${aReread.status}\n${JSON.stringify(aReread.body)}`)

  const bList = await rest('todos?select=*', { token: bToken })
  log('8) B의 목록 조회에 A 자료가 섞이는지 확인', `GET /rest/v1/todos (B 토큰)\n-> ${bList.status}\n${JSON.stringify(bList.body)}`)

  const noAuth = await rest(`todos?id=eq.${todoId}&select=*`)
  log('9) 로그아웃(비로그인) 상태로 같은 자료 재조회', `GET /rest/v1/todos?id=eq.${todoId} (토큰 없음, anon key만)\n-> ${noAuth.status}\n${JSON.stringify(noAuth.body)}`)

  await rest(`todos?id=eq.${todoId}`, { method: 'DELETE', token: aToken })
  log('정리', '검증용 할 일(A 소유)을 A 계정으로 삭제해 정리했습니다.')

  writeFileSync(path.join(root, 'evidence', 'evidence.txt'), lines.join('\n'))
  console.log('\n완료: evidence/evidence.txt 에 저장되었습니다.')
}

main()
