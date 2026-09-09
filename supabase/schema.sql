-- 플랜두씨 다이어리 2 (과제7) — Supabase 스키마 + RLS 정책
-- 실행 방법: Supabase 대시보드 -> SQL Editor -> 이 파일 내용 붙여넣고 Run
-- (익명 anon key만 쓰는 클라이언트에서 직접 SQL을 실행할 수 없으므로, 이 파일은
--  프로젝트 소유자가 대시보드에서 한 번만 실행해 테이블/정책을 만드는 용도입니다.)

create extension if not exists pgcrypto;

-- ---------- 1. 계획 (Plan) ----------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  priority text not null check (priority in ('HIGH', 'MEDIUM', 'LOW')),
  hours numeric not null,
  criteria text not null,
  carried_action_item text,
  created_at timestamptz not null default now()
);

-- ---------- 2. 계획 변경 이력 ----------
create table if not exists public.plan_histories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  title text not null,
  start_date date not null,
  end_date date not null,
  priority text not null,
  hours numeric not null,
  criteria text not null,
  modified_at timestamptz not null default now()
);

-- ---------- 3. 할 일 (Todo) ----------
-- 주의: 예전 프로토타입(app/page.js 초안)에서 만든 todos 테이블이 이미 있다면
-- id/user_id가 integer 타입이라 auth.uid()(uuid)와 비교가 안 됩니다.
-- 아래 DO 블록은 기존 todos 테이블이 있고 비어 있을 때만(데이터 保存 필요 없을 때만)
-- 안전하게 지우고 새로 만듭니다. 이미 데이터가 들어있다면 직접 백업 후 지워주세요.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'todos') then
    if (select count(*) from public.todos) = 0 then
      execute 'drop table public.todos cascade';
    else
      raise notice 'public.todos 테이블에 데이터가 있어 자동으로 지우지 않았습니다. 직접 확인 후 처리하세요.';
    end if;
  end if;
end $$;

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  title text not null,
  due_date date not null,
  priority text not null check (priority in ('HIGH', 'MEDIUM', 'LOW')),
  tags text not null default '',
  estimated_hours numeric not null,
  status text not null default 'TODO' check (status in ('TODO', 'DONE')),
  updated_at timestamptz not null default now()
);

-- ---------- 4. 실행 기록 (완료 시점 기록, 중복 방지) ----------
create table if not exists public.execution_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  todo_id uuid not null references public.todos(id) on delete cascade,
  idempotency_key text not null unique,
  started_at timestamptz,
  ended_at timestamptz,
  actual_hours numeric not null default 0,
  obstacle_reason text,
  completed_at timestamptz not null default now()
);

-- ---------- 5. 돌아보기에서 다음 계획으로 넘기는 액션 아이템 ----------
create table if not exists public.review_action_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  applied_to_plan_id uuid references public.plans(id) on delete set null
);

-- ================= Row Level Security =================
-- 목표: "본인 소유(user_id = auth.uid())" 행만 조회/추가/수정/삭제 가능.
-- 이 정책이 곧 과제7의 인가(Authorization) 구현체다 — 앱 코드가 실수로
-- WHERE 조건을 빼먹어도 DB가 타인 데이터 접근을 차단한다.

alter table public.plans enable row level security;
alter table public.plan_histories enable row level security;
alter table public.todos enable row level security;
alter table public.execution_records enable row level security;
alter table public.review_action_items enable row level security;

drop policy if exists "own rows only" on public.plans;
create policy "own rows only" on public.plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows only" on public.plan_histories;
create policy "own rows only" on public.plan_histories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows only" on public.todos;
create policy "own rows only" on public.todos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows only" on public.execution_records;
create policy "own rows only" on public.execution_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows only" on public.review_action_items;
create policy "own rows only" on public.review_action_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ================= 인덱스 =================
create index if not exists plans_user_id_idx on public.plans(user_id);
create index if not exists todos_user_id_idx on public.todos(user_id);
create index if not exists todos_plan_id_idx on public.todos(plan_id);
create index if not exists execution_records_user_id_idx on public.execution_records(user_id);
create index if not exists execution_records_todo_id_idx on public.execution_records(todo_id);
