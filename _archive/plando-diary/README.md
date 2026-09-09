# 플랜두씨 다이어리 2 — 과제7 (인증 추가)

과제6(클라이언트 전용 `localStorage` 앱)에 서버 인증/인가를 붙인 버전입니다.

## ⚠️ 시작 전 꼭 확인 (과제6 이어받기)

이 폴더는 **새 프로젝트로 취급하면 안 됩니다.** 과제6 채점 기준(T07-C77, C78)은
"과제7 소스 이력에 과제6 최종 제출 커밋이 조상(ancestor)으로 포함되어 있는지"를 봅니다.

즉, 아래 파일들을 **본인의 과제6 Git 저장소 안에 그대로 추가**하고, 그 저장소에서 커밋을 이어가야 합니다.
(새 저장소를 만들어 `git init`부터 다시 시작하면 안 됩니다.)

```bash
# 본인의 과제6 저장소 루트에서:
cp -r (이 폴더의 모든 파일) .
git add .
git commit -m "과제7: 로그인/세션/소유권 검증 추가"
```

기존 과제6의 `index.html`(클라이언트 전용 버전)은 참고용으로만 두거나,
`public/index.html`(이번에 API 연동으로 새로 만든 버전)로 완전히 대체하세요.

## 폴더 구조

```
plando-diary/
├── server.js              # Express 백엔드 (인증/인가/API)
├── store.js                # JSON 파일 저장소
├── package.json
├── .env.example             # 환경변수 예시 (복사해서 .env로 사용)
├── .gitignore                # data/db.json, .env, node_modules 제외
├── data/
│   └── db.json               # 실행하면 자동 생성됨 (커밋 금지 — .gitignore에 포함됨)
├── public/
│   ├── login.html            # 첫 화면 (로그인/회원가입)
│   └── index.html            # 보호된 다이어리 화면 (로그인 필요)
└── AUTH_설명서.md            # 인증 구현 설명서 (제출용, 실제 curl 증거 포함)
```

## 로컬 실행

```bash
npm install
cp .env.example .env
npm start
# http://localhost:3000 접속 -> 로그인 화면
```

## 배포 (택 1)

과제 제출물은 "새 시크릿 창에서 계정생성/로그인/초대 없이 열리는 공개 주소"여야 합니다.
아래 중 하나로 배포하세요. 모두 Node.js 서버를 그대로 올릴 수 있습니다.

- **Render** (render.com): Web Service로 이 저장소 연결 → Build: `npm install` → Start: `npm start` → 환경변수에 `SESSION_TTL_MS`, `NODE_ENV=production` 추가.
- **Railway** (railway.app): 저장소 연결 후 자동 감지, 환경변수만 추가.
- **Fly.io / Cyclic / Glitch** 등도 동일한 방식으로 가능합니다.

> Vercel은 서버리스 함수 특성상 `sessions` 인메모리 Map이 요청마다 초기화될 수 있어 이 구조에는 맞지 않습니다. Render/Railway처럼 "항상 켜져 있는 서버" 방식을 권장합니다.

배포 후 `.env`의 `NODE_ENV=production`으로 두면 쿠키에 `Secure` 옵션이 붙어 HTTPS에서만 세션 쿠키가 오갑니다(배포 주소가 https:// 인지 꼭 확인).

## 카드5 — 5일 실사용 기록 가이드 (직접 해야 하는 부분)

이 부분은 코드가 아니라 **실제 서로 다른 5일 동안 앱을 써야** 하는 항목입니다. 순서:

1. 1일차: 관찰하고 싶은 질문 1문장 + 지표 1개(단위 포함) + 계산 규칙을 정해서 계획/할 일에 기록.
2. 2일차: 같은 규칙으로 계속 기록.
3. **2일차와 3일차 사이**에 계산 규칙을 1개만 바꾸고, 바꾼 시각과 이유를 기록(고칠 점 카드나 별도 메모).
4. 3~5일차: 바뀐 규칙으로 계속 기록.
5. 마지막 날: 화면의 합계/평균과 직접 손으로 더한 값이 같은지 검산 → `AUTH_설명서.md`나 별도 제출 문서에 스크린샷/캡처와 함께 적기.
6. `JSON 파일 내보내기`로 전체 자료를 파일 1개로 내려받아 제출물에 첨부.

이 5일 로그는 실제 캘린더 날짜가 달라야 하므로 지금 한 번에 만들어 드릴 수 없습니다. 배포 후 실제로 5일간 사용해 주세요.

## 카드4 검증을 직접 재현하고 싶다면

`evidence.txt`에 이번에 실제로 재현한 curl 로그가 들어 있습니다. 같은 방식으로 배포된 주소에 대해 재현하려면:

```bash
# 계정 두 개 가입 + 로그인
curl -c a.txt -X POST https://<배포주소>/api/auth/register -H "Content-Type: application/json" -d '{"username":"userA","password":"passwordA1"}'
curl -c a.txt -X POST https://<배포주소>/api/auth/login    -H "Content-Type: application/json" -d '{"username":"userA","password":"passwordA1"}'
curl -c b.txt -X POST https://<배포주소>/api/auth/register -H "Content-Type: application/json" -d '{"username":"userB","password":"passwordB1"}'
curl -c b.txt -X POST https://<배포주소>/api/auth/login    -H "Content-Type: application/json" -d '{"username":"userB","password":"passwordB1"}'

# A가 할 일 생성
curl -b a.txt -X POST https://<배포주소>/api/todos -H "Content-Type: application/json" \
  -d '{"title":"t","dueDate":"2026-09-10","priority":"HIGH","tags":"","estimatedHours":1}'
# 응답의 id를 <ID>에 넣고, B로 접근 시도
curl -i -b b.txt https://<배포주소>/api/todos/<ID>   # -> 404 여야 정상
```
