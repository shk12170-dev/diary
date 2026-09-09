// store.js — 간이 JSON 파일 저장소.
// 과제6의 PDS_SCHEMA_V2 표 구조를 그대로 따르되, 각 레코드에 ownerId(소유자)를 추가했다.
// 운영 DB(Postgres 등)로 옮길 때도 테이블 구조와 소유자 컬럼만 그대로 옮기면 되도록 설계했다.
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "db.json");

function emptyDb() {
  return {
    users: [],              // { id, username, passwordHash, createdAt }
    plans: [],               // { id, ownerId, title, start, end, priority, hours, criteria, carriedActionItem, createdAt }
    planHistories: [],       // { id, ownerId, planId, title, start, end, priority, hours, criteria, modifiedAt }
    todos: [],                // { id, ownerId, planId, title, dueDate, priority, tags, estimatedHours, status, updatedAt }
    executionRecords: [],     // { id, ownerId, todoId, idempotencyKey, startedAt, endedAt, actualHours, obstacleReason, completedAt }
    reviewActionItems: [],    // { id, ownerId, text, createdAt, appliedToPlanId }
    pendingActionItems: {}    // { [ownerId]: text }
  };
}

function load() {
  if (!fs.existsSync(DB_PATH)) {
    save(emptyDb());
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("db.json 파싱 실패, 빈 DB로 초기화합니다.", e);
    const fresh = emptyDb();
    save(fresh);
    return fresh;
  }
}

function save(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

module.exports = { load, save, emptyDb, DB_PATH };
