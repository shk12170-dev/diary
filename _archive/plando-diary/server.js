// server.js — 플랜두씨 다이어리 2 (과제7): 인증 + 인가 백엔드
require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const path = require("path");
const store = require("./store");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------------
// 카드 3: 세션(토큰) 저장소
// ---------------------------------------------------------------------------
// JWT 대신 "서버가 직접 들고 있는 불투명(opaque) 세션 토큰" 방식을 골랐다.
// 이유: JWT는 서버가 들고 있지 않아 "로그아웃했는데도 그 값이 계속 통한다"는 문제를
// 피하려면 별도의 블랙리스트가 또 필요하다. 반면 세션 테이블 하나면 로그아웃 = 삭제로
// 끝나서 카드3 요구사항(로그아웃 뒤 같은 값 재요청 시 반드시 거절)을 가장 단순하게 만족한다.
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 30 * 60 * 1000); // 기본 30분
const sessions = new Map(); // token -> { userId, createdAt, expiresAt }

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex"); // 64자 랜덤값, 추측 불가
  const now = Date.now();
  sessions.set(token, { userId, createdAt: now, expiresAt: now + SESSION_TTL_MS });
  return token;
}

function destroySession(token) {
  sessions.delete(token);
}

function destroyAllSessionsForUser(userId) {
  for (const [token, s] of sessions.entries()) {
    if (s.userId === userId) sessions.delete(token);
  }
}

function getSession(token) {
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    sessions.delete(token); // 만료된 세션은 조회 시점에 즉시 청소
    return null;
  }
  return s;
}

const COOKIE_NAME = "session";
const COOKIE_OPTS = {
  httpOnly: true,      // 자바스크립트(document.cookie)로 못 읽음 -> XSS로 탈취 어려움
  sameSite: "lax",     // 다른 사이트에서 실어 보내는 요청에 자동 동봉되지 않음(CSRF 완화)
  secure: process.env.NODE_ENV === "production", // 배포(HTTPS) 환경에서는 HTTPS에서만 전송
  maxAge: SESSION_TTL_MS,
  path: "/"
};

// ---------------------------------------------------------------------------
// 인증 미들웨어 — 로그인 여부 확인 (카드1, 카드3)
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "로그인이 필요합니다." });
  const session = getSession(token);
  if (!session) return res.status(401).json({ error: "세션이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요." });
  req.userId = session.userId;
  next();
}

// ---------------------------------------------------------------------------
// 카드 1+2: 회원가입 / 로그인 / 로그아웃 / 내 정보
// ---------------------------------------------------------------------------
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "아이디와 비밀번호를 모두 입력하세요." });
  }
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "아이디는 영문/숫자/밑줄 3~20자여야 합니다." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: "비밀번호는 8자 이상이어야 합니다." });
  }

  const db = store.load();
  const dup = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (dup) {
    // T07-C98: 같은 아이디로 두 번 가입되지 않는다.
    return res.status(409).json({ error: "이미 사용 중인 아이디입니다." });
  }

  // 카드 2: bcrypt로 단방향 해시. bcrypt는 해시 안에 salt를 함께 담기 때문에
  // 같은 비밀번호라도 계정마다 저장값이 서로 달라진다(레인보우 테이블 무력화).
  const passwordHash = bcrypt.hashSync(String(password), 12);

  const user = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  db.pendingActionItems[user.id] = "";
  store.save(db);

  return res.status(201).json({ id: user.id, username: user.username });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "아이디와 비밀번호를 모두 입력하세요." });
  }
  const db = store.load();
  const user = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());

  // T07-C99: "아이디는 맞고 비밀번호만 틀렸을 때"와 "아이디 자체가 없을 때"에
  // 동일한 안내 문구 + 동일한 상태코드(401)를 준다. 계정 존재 여부를 노출하지 않기 위함.
  const genericFail = () => res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });

  if (!user) return genericFail();
  const ok = bcrypt.compareSync(String(password), user.passwordHash);
  if (!ok) return genericFail();

  const token = createSession(user.id);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  return res.json({ id: user.id, username: user.username });
});

app.post("/api/auth/logout", (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) destroySession(token);
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: undefined });
  return res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const db = store.load();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(401).json({ error: "로그인이 필요합니다." });
  return res.json({ id: user.id, username: user.username });
});

// 계정 삭제 — T07-C134: 계정 삭제 시 내 자료도 함께 삭제된다.
app.delete("/api/account", requireAuth, (req, res) => {
  const db = store.load();
  const uidToDelete = req.userId;
  db.users = db.users.filter(u => u.id !== uidToDelete);
  db.plans = db.plans.filter(p => p.ownerId !== uidToDelete);
  db.planHistories = db.planHistories.filter(p => p.ownerId !== uidToDelete);
  db.todos = db.todos.filter(t => t.ownerId !== uidToDelete);
  db.executionRecords = db.executionRecords.filter(r => r.ownerId !== uidToDelete);
  db.reviewActionItems = db.reviewActionItems.filter(r => r.ownerId !== uidToDelete);
  delete db.pendingActionItems[uidToDelete];
  store.save(db);
  destroyAllSessionsForUser(uidToDelete);
  const token = req.cookies[COOKIE_NAME];
  if (token) destroySession(token);
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: undefined });
  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// 소유권 헬퍼 — 카드 4: 남의 자료 접근 차단
// ---------------------------------------------------------------------------
// 존재를 감추기 위해 "내 것이 아님"과 "애초에 없음"을 모두 404로 응답한다.
// (403 대신 404를 고른 이유는 README/설명서에 기록)
function findOwned(list, id, ownerId) {
  const item = list.find(x => x.id === id);
  if (!item || item.ownerId !== ownerId) return null;
  return item;
}
const NOT_FOUND = { error: "해당 자료를 찾을 수 없습니다." };

// ---------------------------------------------------------------------------
// 계획(Plan) — 카드 1 데이터의 연장 (과제6 로직 이식)
// ---------------------------------------------------------------------------
app.get("/api/plan", requireAuth, (req, res) => {
  const db = store.load();
  const plan = db.plans.find(p => p.ownerId === req.userId && p.active) || null;
  const histories = db.planHistories.filter(p => p.ownerId === req.userId);
  const pendingActionItem = db.pendingActionItems[req.userId] || "";
  res.json({ plan, histories, pendingActionItem });
});

app.post("/api/plan", requireAuth, (req, res) => {
  const { title, start, end, priority, hours, criteria } = req.body || {};
  if (!title || !start || !end || !priority || hours === undefined || !criteria) {
    return res.status(400).json({ error: "계획 항목을 모두 입력하세요." });
  }
  const db = store.load();
  const prev = db.plans.find(p => p.ownerId === req.userId && p.active);

  if (prev) {
    // 고치기 전 값을 이력에 그대로 보존(원본 삭제 안 함)
    db.planHistories.push({
      id: crypto.randomUUID(),
      ownerId: req.userId,
      planId: prev.id,
      title: prev.title, start: prev.start, end: prev.end,
      priority: prev.priority, hours: prev.hours, criteria: prev.criteria,
      modifiedAt: new Date().toISOString()
    });
    prev.active = false;
  }

  const pending = db.pendingActionItems[req.userId] || "";
  if (pending) {
    db.reviewActionItems.push({
      id: crypto.randomUUID(), ownerId: req.userId, text: pending,
      createdAt: new Date().toISOString(), appliedToPlanId: null
    });
    db.pendingActionItems[req.userId] = "";
  }

  const newPlan = {
    id: crypto.randomUUID(), ownerId: req.userId, active: true,
    title, start, end, priority, hours: Number(hours), criteria,
    carriedActionItem: pending || null,
    createdAt: new Date().toISOString()
  };
  db.plans.push(newPlan);
  store.save(db);
  res.status(201).json(newPlan);
});

app.post("/api/review-action-items", requireAuth, (req, res) => {
  const { text } = req.body || {};
  if (!text || !String(text).trim()) return res.status(400).json({ error: "고칠 점을 입력하세요." });
  const db = store.load();
  db.pendingActionItems[req.userId] = String(text).trim();
  store.save(db);
  res.status(201).json({ pendingActionItem: db.pendingActionItems[req.userId] });
});

// ---------------------------------------------------------------------------
// 할 일(Todo) — 카드 4 검증의 핵심 리소스
// ---------------------------------------------------------------------------
app.get("/api/todos", requireAuth, (req, res) => {
  const db = store.load();
  const todos = db.todos.filter(t => t.ownerId === req.userId); // 소유자 조건 — 목록에도 걸어야 함(막히는 지점 1)
  res.json(todos);
});

app.post("/api/todos", requireAuth, (req, res) => {
  const { title, dueDate, priority, tags, estimatedHours } = req.body || {};
  if (!title || !dueDate || !priority || estimatedHours === undefined) {
    return res.status(400).json({ error: "할 일 항목을 모두 입력하세요." });
  }
  const db = store.load();
  const todo = {
    id: crypto.randomUUID(), ownerId: req.userId,
    title, dueDate, priority, tags: tags || "",
    estimatedHours: Number(estimatedHours), status: "TODO",
    updatedAt: new Date().toISOString()
  };
  db.todos.push(todo);
  store.save(db);
  res.status(201).json(todo);
});

app.get("/api/todos/:id", requireAuth, (req, res) => {
  const db = store.load();
  const todo = findOwned(db.todos, req.params.id, req.userId);
  if (!todo) return res.status(404).json(NOT_FOUND); // 남의 것이거나 없음 -> 동일하게 404
  res.json(todo);
});

app.put("/api/todos/:id", requireAuth, (req, res) => {
  const db = store.load();
  const todo = findOwned(db.todos, req.params.id, req.userId);
  if (!todo) return res.status(404).json(NOT_FOUND);
  const { title, dueDate, priority, tags, estimatedHours } = req.body || {};
  if (title !== undefined) todo.title = title;
  if (dueDate !== undefined) todo.dueDate = dueDate;
  if (priority !== undefined) todo.priority = priority;
  if (tags !== undefined) todo.tags = tags;
  if (estimatedHours !== undefined) todo.estimatedHours = Number(estimatedHours);
  todo.updatedAt = new Date().toISOString();
  store.save(db);
  res.json(todo);
});

app.delete("/api/todos/:id", requireAuth, (req, res) => {
  const db = store.load();
  const todo = findOwned(db.todos, req.params.id, req.userId);
  if (!todo) return res.status(404).json(NOT_FOUND);
  db.todos = db.todos.filter(t => t.id !== req.params.id);
  db.executionRecords = db.executionRecords.filter(r => r.todoId !== req.params.id);
  store.save(db);
  res.json({ ok: true });
});

app.post("/api/todos/:id/complete", requireAuth, (req, res) => {
  const db = store.load();
  const todo = findOwned(db.todos, req.params.id, req.userId);
  if (!todo) return res.status(404).json(NOT_FOUND);
  if (todo.status === "DONE") return res.status(409).json({ error: "이미 완료된 항목입니다." });

  const { startedAt, endedAt, actualHours, obstacleReason } = req.body || {};
  todo.status = "DONE";
  todo.updatedAt = new Date().toISOString();
  const record = {
    id: crypto.randomUUID(), ownerId: req.userId, todoId: todo.id,
    idempotencyKey: `todo_${todo.id}_done`,
    startedAt: startedAt ? new Date(startedAt).toISOString() : "",
    endedAt: endedAt ? new Date(endedAt).toISOString() : "",
    actualHours: Number(actualHours) || 0,
    obstacleReason: (obstacleReason || "").trim(),
    completedAt: new Date().toISOString()
  };
  db.executionRecords.push(record);
  store.save(db);
  res.status(201).json({ todo, record });
});

app.post("/api/todos/:id/revert", requireAuth, (req, res) => {
  const db = store.load();
  const todo = findOwned(db.todos, req.params.id, req.userId);
  if (!todo) return res.status(404).json(NOT_FOUND);
  todo.status = "TODO";
  todo.updatedAt = new Date().toISOString();
  db.executionRecords = db.executionRecords.filter(r => r.todoId !== req.params.id);
  store.save(db);
  res.json(todo);
});

// ---------------------------------------------------------------------------
// 실행 기록(Execution Record)
// ---------------------------------------------------------------------------
app.get("/api/execution-records", requireAuth, (req, res) => {
  const db = store.load();
  res.json(db.executionRecords.filter(r => r.ownerId === req.userId));
});

app.get("/api/execution-records/:id", requireAuth, (req, res) => {
  const db = store.load();
  const record = findOwned(db.executionRecords, req.params.id, req.userId);
  if (!record) return res.status(404).json(NOT_FOUND);
  res.json(record);
});

// ---------------------------------------------------------------------------
// 내보내기 — 카드 5
// ---------------------------------------------------------------------------
app.get("/api/export", requireAuth, (req, res) => {
  const db = store.load();
  const payload = {
    plan: db.plans.find(p => p.ownerId === req.userId && p.active) || null,
    planHistories: db.planHistories.filter(p => p.ownerId === req.userId),
    todos: db.todos.filter(t => t.ownerId === req.userId),
    executionRecords: db.executionRecords.filter(r => r.ownerId === req.userId),
    pendingActionItem: db.pendingActionItems[req.userId] || "",
    actionItemLog: db.reviewActionItems.filter(r => r.ownerId === req.userId),
    exportedAt: new Date().toISOString()
  };
  res.json(payload);
});

// ---------------------------------------------------------------------------
// SPA 라우팅: 정적 파일 외 나머지 경로는 index.html(로그인 여부는 프론트에서 /api/auth/me로 판단)
// ---------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/diary", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`plando-diary auth server listening on :${PORT}`);
  console.log(`SESSION_TTL_MS = ${SESSION_TTL_MS}`);
});
