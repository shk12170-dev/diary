# 배포 전 꼭 확인할 것

## 1. 기존 파일 정리 (충돌/혼란 방지)
- 예전 `api/auth.js` (query param 방식, `?action=signup|login`)는 **삭제**하세요.
  → 대신 `api/auth/register.js`, `api/auth/login.js`, `api/auth/logout.js` 사용.
- 기존 `api/todos.js`는 **삭제**하고 `api/todos/index.js`로 교체하세요.
  (Vercel에서 `api/todos.js`와 `api/todos/index.js`를 동시에 두면 라우팅이 꼬일 수 있습니다.)
- 기존 `login.html`은 `index.html`과 내용이 동일한 파일이라, 실제로 쓰는 게 아니라면 혼란을 피하기 위해 지워도 됩니다.

## 2. 최종 폴더 구조
```
/index.html
/api/auth/register.js
/api/auth/login.js
/api/auth/logout.js
/api/todos/index.js
/api/todos/[id].js
/api/todos/[id]/complete.js
/api/todos/[id]/revert.js
/api/plan.js
/api/execution-records.js
/api/account.js
/lib/requireAuth.js
/pds-schema-v2.json  (문서용, DB에 이미 이 구조로 테이블이 있어야 함)
```

## 3. 환경 변수 확인 (Vercel 프로젝트 설정 → Environment Variables)
- `POSTGRES_URL` 등 Vercel Postgres 연결 정보 (Vercel Postgres를 연결하면 자동 생성됨)
- `JWT_SECRET` — **반드시 직접 설정하세요.** 지금 코드는 이 값이 없으면 `'secret-key'`라는
  하드코딩된 기본값으로 동작하는데, 이건 누구나 아는 값이라 실제 배포에서는 위험합니다.
  (예: `openssl rand -hex 32` 로 만든 랜덤 문자열을 사용)

## 4. package.json 확인
`bcrypt`, `jsonwebtoken`, `@vercel/postgres`가 dependencies에 있어야 합니다.
없다면:
```
npm install bcrypt jsonwebtoken @vercel/postgres
```

## 5. DB 테이블이 아직 없다면 (pds-schema-v2.json 기준, Postgres 문법으로)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('HIGH','MEDIUM','LOW')) NOT NULL,
  success_criteria TEXT NOT NULL,
  estimated_hours REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plan_histories (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  priority TEXT NOT NULL,
  success_criteria TEXT NOT NULL,
  estimated_hours REAL NOT NULL,
  modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('TODO','DONE')) DEFAULT 'TODO',
  due_date TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('HIGH','MEDIUM','LOW')) NOT NULL,
  tags TEXT,
  estimated_hours REAL NOT NULL
);

CREATE TABLE execution_records (
  id SERIAL PRIMARY KEY,
  todo_id INTEGER UNIQUE NOT NULL REFERENCES todos(id),
  idempotency_key TEXT UNIQUE NOT NULL,
  actual_hours REAL NOT NULL,
  obstacle_reason TEXT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6. 배포 후 직접 테스트할 순서
1. 배포 주소 접속 → 로그인 화면이 첫 화면인지 확인
2. 회원가입 (계정 A) → 로그인 → 할 일 1~2개 등록
3. 로그아웃 → 회원가입 (계정 B) → 로그인
4. 브라우저 개발자도구(Network 탭)를 열고, 계정 B로 로그인한 상태에서
   계정 A의 할 일 id를 직접 넣어 PUT/DELETE 요청을 보내보기
   → 404 응답이 와야 함 (스크린샷으로 남기기)
5. 로그아웃 후 다이어리 메인 주소로 직접 접속 → 로그인 화면으로 자동 전환되는지 확인
