# 플랜두씨 다이어리 — Plan-Do-See (과제 7: 인증 붙이기)

과제 6에서 만든 `localStorage` 전용 다이어리에 **Supabase Auth(로그인/가입) + Row Level Security(인가)**를 붙인 버전입니다.

- **공개주소**(과제6 GitHub Pages, `localStorage` 전용 정적 버전): https://shk12170-dev.github.io/diary/
- **배포주소**(과제7, 로그인/인가가 붙은 최종 버전): https://diary-nine-omega.vercel.app
- **소스주소**: https://github.com/shk12170-dev/diary

## 화면

**웹페이지 화면 — 첫 화면(로그인)**

*(스크린샷 추가 예정)*

**5일치 실사용 결과 — 계획/할 일 목록**

![5일치 결과 화면 1](image/5일치%20결과%20화면%201(계획-할일목록).png)

**5일치 실사용 결과 — 할 일 목록 및 돌아보기 통계(계획10·완료10·지연0·막힘8·시간격차+35h)**

![5일치 결과 화면 2](image/5일치%20결과%20화면%202(할일목록-돌아보기%20통계).png)

자세한 5일치 기록/집계 검산 내용은 [5일차_실사용_기록.md](5일차_실사용_기록.md) 참고.

## 아키텍처

- **프론트엔드/백엔드**: Next.js (App Router), Vercel 배포
- **인증**: Supabase Auth (이메일/비밀번호)
- **DB/인가**: Supabase(Postgres) + Row Level Security — 테이블마다 `auth.uid() = user_id` 정책으로 본인 자료만 접근 가능

자세한 구현 설명은 [과제7_인증구현설명서.md](과제7_인증구현설명서.md), 진행 상황은 [과제7_체크리스트_진행상황.md](과제7_체크리스트_진행상황.md)를 참고하세요.

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # 없다면 아래 값 채우기
npm run dev
# http://localhost:3000 -> 로그인 화면(/login)으로 자동 이동
```

`.env.local`에 필요한 값 (Supabase 프로젝트 설정 → API):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## DB 준비 (최초 1회)

Supabase 대시보드 → SQL Editor에서 [supabase/schema.sql](supabase/schema.sql)을 실행하세요.
`plans`, `plan_histories`, `todos`, `execution_records`, `review_action_items` 테이블과 RLS 정책이 생성됩니다.

## 배포 (Vercel)

1. GitHub 저장소를 Vercel에 연결
2. Vercel 프로젝트 설정 → Environment Variables에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록
3. Deploy — 새 시크릿 창에서 접속했을 때 로그인 화면이 먼저 보이는지 확인

## 카드4(인가) 증거 캡처

테스트 계정 2개(이메일 인증까지 완료)를 만든 뒤:

```bash
node scripts/capture-evidence.mjs \
  --a-email alice@example.com --a-pass "AlicePass123!" \
  --b-email bob@example.com   --b-pass "BobPass123!"
```

`evidence/evidence.txt`에 로그인/조회/수정/삭제 시나리오의 실제 요청-응답이 저장됩니다.

## 폴더 구조

```
app/                 # Next.js 라우트 (/, /login)
components/           # AuthForms(로그인·가입), Diary(Plan-Do-See 본문)
lib/supabase.js        # Supabase 클라이언트
supabase/schema.sql     # 테이블 + RLS 정책
scripts/capture-evidence.mjs  # 카드4 증거 자동 캡처
contracts/pds-schema-v2.json   # 과제6 스키마 계약(참고용)
_archive/                # 채택하지 않은 이전 구현들(참고용, 제출 대상 아님)
```
