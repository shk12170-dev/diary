# diary

# 공개주소 : https://shk12170-dev.github.io/diary/
# 배포주소 : https://diary-nine-omega.vercel.app
# 소스주소 : https://github.com/shk12170-dev/diary/tree/a0080ad39b723b4d0bc13942712572efad8af4b8

# 플랜두씨 다이어리 — Plan-Do-See

과제 6 규격 (`contracts/pds-schema-v2.json`)을 준수하여 Plan(계획) → Do(실행) → See(돌아보기) 구조로 구현된 일기/다이어리 웹 애플리케이션입니다.

---

## 전체 프론트엔드 소스 코드 (`index.html`)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>플랜두씨 다이어리 — Plan-Do-See</title>
<link href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --paper:#EFF1E6; --paper-card:#FBFAF3; --paper-card2:#F5F6EC; --ink:#2B2A28;
    --ink-soft:#63604F; --line:rgba(43,42,40,0.14); --plan:#6B7FA3; --actual:#C1512E;
    --good:#4C7A5E; --amber:#E0A23D; --danger:#B23A3A; --radius:12px;
  }
  *{box-sizing:border-box;} body{margin:0; padding:20px; background:var(--paper); color:var(--ink); font-family:'Noto Sans KR', sans-serif;}
  .wrap{max-width:1000px; margin:0 auto;}
  .page-title{font-family:'Gowun Batang', serif; font-size:28px; font-weight:700; color:var(--ink); margin-top:10px; margin-bottom:20px; padding-bottom:12px; border-bottom:2px solid var(--line);}
  .notice-banner{background:var(--amber); color:#fff; padding:12px 16px; border-radius:var(--radius); font-weight:600; margin-bottom:20px;}
  .card{background:var(--paper-card); border:1px solid var(--line); border-radius:var(--radius); padding:20px; margin-bottom:24px; box-shadow:0 2px 8px rgba(0,0,0,0.05);}
  h1, h2, h3{font-family:'Gowun Batang', serif; margin-top:0;}
  .hint{font-size:12px; color:var(--ink-soft); margin:2px 0 10px;}
  .form-grid{display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:12px;}
  label{display:block; font-size:12px; font-weight:600; color:var(--ink-soft); margin-bottom:4px;}
  input, select, textarea{width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; font-family:inherit; background:#fff;}
  .btn{padding:8px 16px; border-radius:6px; font-weight:600; border:none; cursor:pointer; background:var(--plan); color:#fff;}
  .btn-actual{background:var(--actual);}
  .btn-danger{background:var(--danger);}
  .btn-ghost{background:transparent; color:var(--ink-soft); border:1px solid var(--line);}
  .btn-sm{padding:5px 10px; font-size:12px;}
  table{width:100%; border-collapse:collapse; margin-top:10px; font-size:14px;}
  th, td{border-bottom:1px solid var(--line); padding:10px 8px; text-align:left; vertical-align:top;}
  th{background:var(--paper-card2); font-size:12px; color:var(--ink-soft);}
  tr.hl{animation:hlflash 1.6s ease;}
  @keyframes hlflash{ 0%{background:#FFF3D6;} 100%{background:transparent;} }
  .badge{padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; color:#fff;}
  .badge-HIGH{background:var(--danger);} .badge-MEDIUM{background:var(--amber);} .badge-LOW{background:var(--good);}
  .stat-grid{display:grid; grid-template-columns:repeat(5, 1fr); gap:12px; text-align:center;}
  .stat-box{background:var(--paper-card2); padding:16px; border-radius:8px; border:1px solid var(--line); cursor:pointer; transition:transform 0.1s;}
  .stat-box:hover{transform:translateY(-2px);}
  .stat-box.active{outline:2px solid var(--plan);}
  .stat-box .num{font-size:24px; font-weight:bold; font-family:'IBM Plex Mono', monospace; color:var(--actual);}
  .filter-row{display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end; margin:12px 0;}
  .filter-row > div{min-width:140px;}
  .chip{display:inline-block; padding:4px 10px; border-radius:999px; border:1px solid var(--line); font-size:12px; cursor:pointer; margin-right:6px; background:#fff;}
  .chip.active{background:var(--plan); color:#fff; border-color:var(--plan);}
  .modal-overlay{position:fixed; inset:0; background:rgba(0,0,0,0.45); display:none; align-items:center; justify-content:center; z-index:50;}
  .modal-overlay.open{display:flex;}
  .modal{background:var(--paper-card); border-radius:var(--radius); padding:22px; width:min(440px, 92vw); box-shadow:0 8px 30px rgba(0,0,0,0.25);}
  .modal h3{margin-bottom:14px;}
  .modal .row{margin-bottom:10px;}
  .plan-history-item{border-left:3px solid var(--line); padding:6px 10px; margin-bottom:6px; font-size:13px; color:var(--ink-soft);}
  .carried{background:#EAF2ED; border:1px solid var(--good); border-radius:8px; padding:10px 12px; font-size:13px; margin-bottom:12px;}
  .schema-block{font-family:'IBM Plex Mono', monospace; font-size:11px; background:var(--paper-card2); border:1px solid var(--line); border-radius:8px; padding:12px; max-height:220px; overflow:auto; white-space:pre-wrap;}
</style>
</head>
<body>
<div class="wrap">

<h1 class="page-title">플랜두씨 다이어리 — Plan-Do-See</h1>

<div class="notice-banner">
    📢 지금은 로그인이 없어 링크를 아는 사람은 누구나 볼 수 있습니다. 남이 봐도 괜찮은 내용만 넣으세요. 데이터는 이 브라우저(localStorage)에만 저장되며, 아직 서버 데이터베이스와는 연결되지 않았습니다.
  </div>

  <h2>1. 계획 세우기 (Plan)</h2>
  <div class="card">
    <div id="carriedArea"></div>
    <form id="planForm">
      <div class="form-grid">
        <div><label>계획명</label><input type="text" id="p_title" required placeholder="예: JAVA 풀스택 과정 완수"></div>
        <div><label>시작일</label><input type="date" id="p_start" required></div>
        <div><label>종료일</label><input type="date" id="p_end" required></div>
        <div><label>우선순위</label><select id="p_priority"><option>HIGH</option><option selected>MEDIUM</option><option>LOW</option></select></div>
        <div><label>예상 시간(h)</label><input type="number" id="p_hours" step="0.5" required placeholder="80"></div>
      </div>
      <div><label>성공 기준</label><textarea id="p_criteria" rows="2" required placeholder="모든 일일 과제 수행 및 프로젝트 완료"></textarea></div>
      <button type="submit" class="btn" style="margin-top:10px;">계획 저장/수정</button>
    </form>
    <div id="planHistoryArea" style="margin-top:15px;"></div>
  </div>

  <h2>2. 할 일 다루기 & 실제 한 일 (Do)</h2>
  <div class="card">
    <h3 id="todoFormTitle">할 일 추가</h3>
    <form id="todoForm">
      <input type="hidden" id="t_editing_id" value="">
      <div class="form-grid">
        <div><label>할 일 내용</label><input type="text" id="t_title" required placeholder="과제 6 체크리스트 구현"></div>
        <div><label>마감일</label><input type="date" id="t_due" required></div>
        <div><label>우선순위</label><select id="t_priority"><option>HIGH</option><option selected>MEDIUM</option><option>LOW</option></select></div>
        <div><label>태그</label><input type="text" id="t_tags" placeholder="백엔드, 과제"></div>
        <div><label>예상 시간(h)</label><input type="number" id="t_hours" step="0.5" required placeholder="2"></div>
      </div>
      <button type="submit" class="btn" id="todoSubmitBtn">할 일 등록</button>
      <button type="button" class="btn btn-ghost" id="todoCancelEditBtn" style="display:none;">수정 취소</button>
    </form>

    <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <h3 style="margin:0;">할 일 목록</h3>
      <input type="text" id="todoSearch" placeholder="제목·태그 검색..." style="width:200px;">
    </div>
    <div class="hint">정렬 기준: 마감일 오름차순 · 마감일이 같으면 우선순위 높은 순(HIGH → MEDIUM → LOW) · 정렬과 거르기는 모두 이 화면(브라우저)에서 계산됩니다.</div>
    <div class="filter-row">
      <div>
        <label>상태</label>
        <select id="f_status">
          <option value="ALL">전체</option>
          <option value="TODO">진행중</option>
          <option value="DONE">완료</option>
          <option value="DELAYED">지연</option>
          <option value="OBSTACLE">막힘 기록 있음</option>
        </select>
      </div>
      <div>
        <label>우선순위</label>
        <select id="f_priority">
          <option value="ALL">전체</option>
          <option>HIGH</option><option>MEDIUM</option><option>LOW</option>
        </select>
      </div>
    </div>
    <table>
      <thead>
        <tr><th>상태</th><th>할 일</th><th>마감일</th><th>우선순위</th><th>태그</th><th>예상시간</th><th>실제시간</th><th>기록</th><th>작업</th></tr>
      </thead>
      <tbody id="todoTableBody"></tbody>
    </table>
  </div>

  <h2>3. 돌아보기 (See)</h2>
  <div class="card">
    <div class="filter-row">
      <div><label>기간 시작(마감일 기준)</label><input type="date" id="rv_start"></div>
      <div><label>기간 종료(마감일 기준)</label><input type="date" id="rv_end"></div>
      <div><button class="btn btn-ghost btn-sm" onclick="clearReviewPeriod()" type="button">기간 초기화</button></div>
    </div>
    <div class="hint" id="periodLabel">집계 기간: 전체</div>
    <div class="stat-grid">
      <div class="stat-box" data-type="ALL" onclick="filterTodoList('ALL')"><div class="num" id="statPlan">0</div><div>계획 수</div></div>
      <div class="stat-box" data-type="DONE" onclick="filterTodoList('DONE')"><div class="num" id="statDone">0</div><div>완료 수</div></div>
      <div class="stat-box" data-type="DELAYED" onclick="filterTodoList('DELAYED')"><div class="num" id="statDelayed">0</div><div>지연 수</div></div>
      <div class="stat-box" data-type="OBSTACLE" onclick="filterTodoList('OBSTACLE')"><div class="num" id="statObstacle">0</div><div>막힘 수</div></div>
      <div class="stat-box"><div class="num" id="statDiff">0h</div><div>시간 격차(실제-예상)</div></div>
    </div>
    <div class="hint">숫자를 클릭하면 위 할 일 목록이 해당 조건으로 걸러지고 그 기록으로 화면이 이동합니다.</div>
    <div style="margin-top:20px;">
      <label><b>다음 계획으로 넘길 고칠 점 (Action Item)</b></label>
      <div style="display:flex; gap:8px;">
        <input type="text" id="actionItem" placeholder="예: 예상 시간을 1.5배 보수적으로 설정하기">
        <button class="btn" type="button" onclick="carryActionItem()">다음 계획으로 넘기기</button>
      </div>
      <div class="hint" id="pendingActionHint"></div>
    </div>
  </div>

  <h2>4. 백업 및 서버 연동 스키마</h2>
  <div class="card">
    <button class="btn" onclick="exportData()">JSON 파일 내보내기</button>
    
    <!-- JSON 파일 가져오기 버튼 및 숨김 input 추가 -->
    <input type="file" id="importFileInput" accept=".json" style="display:none;" onchange="importData(event)">
    <button class="btn btn-actual" onclick="document.getElementById('importFileInput').click()">JSON 파일 가져오기</button>
    
    <button class="btn btn-ghost" onclick="exportSchema()">contracts/pds-schema-v2.json 보기/내보내기</button>
    <button class="btn btn-danger" onclick="resetData()">전체 초기화</button>
    <div class="hint" style="margin-top:10px;">아래는 서버 DB 전환 시 사용할 표·항목·관계·날짜 규칙 정의입니다. 지금은 이 정의를 기준으로 브라우저(localStorage)에만 저장하고 있습니다.</div>
    <div class="schema-block" id="schemaPreview"></div>
  </div>
</div>

<div class="modal-overlay" id="completeModal">
  <div class="modal">
    <h3>완료 기록 남기기</h3>
    <div class="row"><label>시작 시각</label><input type="datetime-local" id="m_start"></div>
    <div class="row"><label>종료 시각</label><input type="datetime-local" id="m_end"></div>
    <div class="row"><label>실제로 걸린 시간(h) — 시작/종료를 넣으면 자동 계산됩니다</label><input type="number" step="0.25" id="m_actual"></div>
    <div class="row"><label>막혔던 이유(없으면 비워두기)</label><textarea id="m_obstacle" rows="2"></textarea></div>
    <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:10px;">
      <button class="btn btn-ghost" type="button" onclick="closeCompleteModal()">취소</button>
      <button class="btn btn-actual" type="button" onclick="confirmComplete()">완료 저장</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="recordModal">
  <div class="modal">
    <h3>실행 기록 보기</h3>
    <div id="recordModalBody" style="font-size:14px; line-height:1.7;"></div>
    <div style="display:flex; justify-content:flex-end; margin-top:10px;">
      <button class="btn btn-ghost" type="button" onclick="closeRecordModal()">닫기</button>
    </div>
  </div>
</div>

<script>
  // ---- contracts/pds-schema-v2.json 에 대응하는 스키마 정의 ----
  const PDS_SCHEMA_V2 = {
    "$schema": "pds-schema-v2",
    "dateRules": {
      "timezone": "Asia/Seoul",
      "storedFormat": "ISO 8601 (UTC) for timestamps, YYYY-MM-DD for dates",
      "today기준": "모든 '오늘' 판정(지연 등)은 Asia/Seoul 자정 기준으로 계산한다"
    },
    "tables": {
      "plan": {
        "columns": {
          "id": "string(uuid), PK",
          "title": "string",
          "start": "date",
          "end": "date",
          "priority": "enum(HIGH,MEDIUM,LOW)",
          "hours": "number",
          "criteria": "string",
          "carriedActionItem": "string, nullable — 이전 돌아보기에서 넘어온 고칠 점",
          "created_at": "timestamp"
        }
      },
      "plan_history": {
        "columns": {
          "id": "string(uuid), PK",
          "plan_id": "string, FK -> plan.id (수정 전 계획이 속했던 plan)",
          "title": "string", "start": "date", "end": "date",
          "priority": "enum(HIGH,MEDIUM,LOW)", "hours": "number", "criteria": "string",
          "modified_at": "timestamp — 이 값으로 덮어쓰기 직전 상태를 남긴다"
        },
        "relation": "plan 1 --- N plan_history (계획을 고칠 때마다 고치기 전 값을 여기 적재, 원본은 삭제하지 않는다)"
      },
      "todo": {
        "columns": {
          "id": "string(uuid), PK",
          "plan_id": "string, FK -> plan.id",
          "title": "string",
          "dueDate": "date",
          "priority": "enum(HIGH,MEDIUM,LOW)",
          "tags": "string (comma-separated)",
          "estimatedHours": "number",
          "status": "enum(TODO,DONE)",
          "updated_at": "timestamp"
        },
        "relation": "plan 1 --- N todo"
      },
      "execution_record": {
        "columns": {
          "id": "string(uuid), PK",
          "todo_id": "string, FK -> todo.id",
          "idempotencyKey": "string, UNIQUE — 동일 완료 요청 중복 저장 방지",
          "startedAt": "timestamp, nullable",
          "endedAt": "timestamp, nullable",
          "actualHours": "number",
          "obstacleReason": "string, nullable",
          "completedAt": "timestamp"
        },
        "relation": "todo 1 --- N execution_record (원본 todo.estimatedHours는 덮어쓰지 않는다)"
      },
      "review_action_item": {
        "columns": {
          "id": "string(uuid), PK",
          "text": "string",
          "created_at": "timestamp",
          "applied_to_plan_id": "string, nullable, FK -> plan.id — 다음 계획에 반영된 시점"
        }
      }
    }
  };

  let db = {
    plan: null,
    planHistories: [],
    todos: [],
    executionRecords: [],
    pendingActionItem: "",
    actionItemLog: []
  };

  let filterState = { status: "ALL", priority: "ALL" };
  let reviewPeriod = { start: "", end: "" };
  let editingTodoId = null;
  let pendingCompleteId = null;

  const STORAGE_KEY = "pds_diary_v2";

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function getSeoulToday() {
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });
    return fmt.format(new Date());
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { db = JSON.parse(saved); } catch (e) { console.error("저장된 데이터를 읽지 못했습니다.", e); }
    }
    if (!db.pendingActionItem) db.pendingActionItem = "";
    if (!db.actionItemLog) db.actionItemLog = [];
    document.getElementById("schemaPreview").textContent = JSON.stringify(PDS_SCHEMA_V2, null, 2);
    renderAll();
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    renderAll();
  }

  // ---- 카드 1: 계획 관리 및 변경 이력 ----
  document.getElementById("planForm").onsubmit = function (e) {
    e.preventDefault();
    const newPlan = {
      id: db.plan ? db.plan.id : uid(),
      title: document.getElementById("p_title").value,
      start: document.getElementById("p_start").value,
      end: document.getElementById("p_end").value,
      priority: document.getElementById("p_priority").value,
      hours: parseFloat(document.getElementById("p_hours").value),
      criteria: document.getElementById("p_criteria").value,
      carriedActionItem: db.pendingActionItem || null
    };

    if (db.plan) {
      db.planHistories.push({ ...db.plan, modified_at: new Date().toISOString() });
      newPlan.id = uid();
    }

    if (db.pendingActionItem) {
      db.actionItemLog.push({ text: db.pendingActionItem, applied_at: new Date().toISOString() });
      db.pendingActionItem = "";
    }

    db.plan = newPlan;
    saveData();
    alert("계획이 저장되었습니다.");
  };

  function carryActionItem() {
    const val = document.getElementById("actionItem").value.trim();
    if (!val) { alert("먼저 고칠 점을 입력하세요."); return; }
    db.pendingActionItem = val;
    document.getElementById("actionItem").value = "";
    saveData();
    alert("다음 계획을 저장할 때 이 고칠 점이 함께 반영됩니다.");
  }

  // ---- 카드 2: 할 일 등록 / 수정 ----
  document.getElementById("todoForm").onsubmit = function (e) {
    e.preventDefault();
    const title = document.getElementById("t_title").value;
    const dueDate = document.getElementById("t_due").value;
    const priority = document.getElementById("t_priority").value;
    const tags = document.getElementById("t_tags").value;
    const hours = parseFloat(document.getElementById("t_hours").value);

    if (editingTodoId) {
      const todo = db.todos.find(t => t.id === editingTodoId);
      if (todo) {
        todo.title = title; todo.dueDate = dueDate; todo.priority = priority;
        todo.tags = tags; todo.estimatedHours = hours;
      }
      cancelEditTodo();
    } else {
      db.todos.push({
        id: uid(), title, dueDate, priority, tags,
        estimatedHours: hours, status: "TODO"
      });
      this.reset();
    }
    saveData();
  };

  function editTodo(id) {
    const todo = db.todos.find(t => t.id === id);
    if (!todo) return;
    editingTodoId = id;
    document.getElementById("t_title").value = todo.title;
    document.getElementById("t_due").value = todo.dueDate;
    document.getElementById("t_priority").value = todo.priority;
    document.getElementById("t_tags").value = todo.tags;
    document.getElementById("t_hours").value = todo.estimatedHours;
    document.getElementById("todoFormTitle").innerText = "할 일 수정";
    document.getElementById("todoSubmitBtn").innerText = "수정 저장";
    document.getElementById("todoCancelEditBtn").style.display = "inline-block";
    document.getElementById("todoForm").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function cancelEditTodo() {
    editingTodoId = null;
    document.getElementById("todoForm").reset();
    document.getElementById("todoFormTitle").innerText = "할 일 추가";
    document.getElementById("todoSubmitBtn").innerText = "할 일 등록";
    document.getElementById("todoCancelEditBtn").style.display = "none";
  }
  document.getElementById("todoCancelEditBtn").onclick = cancelEditTodo;

  // ---- 카드 2: 완료 처리(중복 방지) / 되돌리기 / 삭제 ----
  function completeTodo(id) {
    const todo = db.todos.find(t => t.id === id);
    if (!todo || todo.status === "DONE") return;
    pendingCompleteId = id;
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById("m_start").value = localNow;
    document.getElementById("m_end").value = localNow;
    document.getElementById("m_actual").value = todo.estimatedHours;
    document.getElementById("m_obstacle").value = "";
    document.getElementById("completeModal").classList.add("open");
  }

  function closeCompleteModal() {
    pendingCompleteId = null;
    document.getElementById("completeModal").classList.remove("open");
  }

  ["m_start", "m_end"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => {
      const s = document.getElementById("m_start").value;
      const e = document.getElementById("m_end").value;
      if (s && e) {
        const diffH = (new Date(e) - new Date(s)) / 3600000;
        if (diffH >= 0) document.getElementById("m_actual").value = Math.round(diffH * 100) / 100;
      }
    });
  });

  function confirmComplete() {
    const id = pendingCompleteId;
    const todo = db.todos.find(t => t.id === id);
    if (!todo || todo.status === "DONE") { closeCompleteModal(); return; }

    const started = document.getElementById("m_start").value;
    const ended = document.getElementById("m_end").value;
    const actual = parseFloat(document.getElementById("m_actual").value) || 0;
    const obstacle = document.getElementById("m_obstacle").value.trim();

    todo.status = "DONE";
    db.executionRecords.push({
      id: uid(),
      todoId: id,
      idempotencyKey: `todo_${id}_done`,
      startedAt: started ? new Date(started).toISOString() : "",
      endedAt: ended ? new Date(ended).toISOString() : "",
      actualHours: actual,
      obstacleReason: obstacle,
      completedAt: new Date().toISOString()
    });
    closeCompleteModal();
    saveData();
  }

  function revertTodo(id) {
    const todo = db.todos.find(t => t.id === id);
    if (!todo || todo.status === "TODO") return;
    todo.status = "TODO";
    db.executionRecords = db.executionRecords.filter(r => r.todoId !== id);
    saveData();
  }

  function deleteTodo(id) {
    if (!confirm("이 할 일을 삭제하시겠습니까? 관련 실행 기록도 함께 삭제됩니다.")) return;
    db.todos = db.todos.filter(t => t.id !== id);
    db.executionRecords = db.executionRecords.filter(r => r.todoId !== id);
    saveData();
  }

  function showRecord(todoId) {
    const exec = db.executionRecords.find(r => r.todoId === todoId);
    const todo = db.todos.find(t => t.id === todoId);
    if (!exec) return;
    const fmt = t => t ? new Date(t).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "-";
    document.getElementById("recordModalBody").innerHTML = `
      <div><b>할 일:</b> ${escapeHtml(todo ? todo.title : "")}</div>
      <div><b>시작 시각:</b> ${fmt(exec.startedAt)}</div>
      <div><b>종료 시각:</b> ${fmt(exec.endedAt)}</div>
      <div><b>실제 걸린 시간:</b> ${escapeHtml(exec.actualHours)}h</div>
      <div><b>막혔던 이유:</b> ${exec.obstacleReason ? escapeHtml(exec.obstacleReason) : "(없음)"}</div>
      <div><b>완료 처리 시각:</b> ${fmt(exec.completedAt)}</div>`;
    document.getElementById("recordModal").classList.add("open");
  }
  function closeRecordModal() { document.getElementById("recordModal").classList.remove("open"); }

  // ---- 필터 / 정렬 ----
  function todoMatchesStatusFilter(t, today) {
    switch (filterState.status) {
      case "DONE": return t.status === "DONE";
      case "DELAYED": return t.status === "TODO" && t.dueDate < today;
      case "OBSTACLE": {
        const exec = db.executionRecords.find(r => r.todoId === t.id);
        return !!(exec && exec.obstacleReason && exec.obstacleReason.trim() !== "");
      }
      default: return true;
    }
  }

  function filterTodoList(type) {
    filterState.status = type;
    document.getElementById("f_status").value = type;
    renderAll();
    document.getElementById("todoTableBody").scrollIntoView({ behavior: "smooth", block: "center" });
    const rows = document.querySelectorAll("#todoTableBody tr");
    rows.forEach(r => { r.classList.remove("hl"); void r.offsetWidth; r.classList.add("hl"); });
  }

  document.getElementById("f_status").onchange = function () { filterState.status = this.value; renderAll(); };
  document.getElementById("f_priority").onchange = function () { filterState.priority = this.value; renderAll(); };
  document.getElementById("todoSearch").oninput = renderAll;

  // ---- 돌아보기 기간 ----
  document.getElementById("rv_start").onchange = function () { reviewPeriod.start = this.value; renderAll(); };
  document.getElementById("rv_end").onchange = function () { reviewPeriod.end = this.value; renderAll(); };
  function clearReviewPeriod() {
    reviewPeriod = { start: "", end: "" };
    document.getElementById("rv_start").value = "";
    document.getElementById("rv_end").value = "";
    renderAll();
  }

  function inReviewPeriod(t) {
    if (reviewPeriod.start && t.dueDate < reviewPeriod.start) return false;
    if (reviewPeriod.end && t.dueDate > reviewPeriod.end) return false;
    return true;
  }

  // ---- 렌더링 ----
  function renderAll() {
    if (db.plan) {
      document.getElementById("p_title").value = db.plan.title;
      document.getElementById("p_start").value = db.plan.start;
      document.getElementById("p_end").value = db.plan.end;
      document.getElementById("p_priority").value = db.plan.priority;
      document.getElementById("p_hours").value = db.plan.hours;
      document.getElementById("p_criteria").value = db.plan.criteria;
    } else {
      document.getElementById("planForm").reset();
    }

    const carriedArea = document.getElementById("carriedArea");
    if (db.plan && db.plan.carriedActionItem) {
      carriedArea.innerHTML = `<div class="carried">🔁 이전 돌아보기에서 넘어온 고칠 점: <b>${escapeHtml(db.plan.carriedActionItem)}</b></div>`;
    } else if (db.pendingActionItem) {
      carriedArea.innerHTML = `<div class="carried">⏳ 다음 계획 저장 시 반영될 고칠 점: <b>${escapeHtml(db.pendingActionItem)}</b></div>`;
    } else {
      carriedArea.innerHTML = "";
    }

    const histArea = document.getElementById("planHistoryArea");
    if (db.planHistories && db.planHistories.length > 0) {
      histArea.innerHTML = "<b>계획 변경 이력 (고치기 전 값, 처음 계획부터 그대로 보존됨):</b>" +
        db.planHistories.map(h =>
          `<div class="plan-history-item">[${escapeHtml((h.modified_at || "").slice(0, 10))}] ${escapeHtml(h.title)} · 기간 ${escapeHtml(h.start)}~${escapeHtml(h.end)} · 우선순위 ${escapeHtml(h.priority)} · ${escapeHtml(h.hours)}h — ${escapeHtml(h.criteria)}</div>`
        ).join("");
    } else histArea.innerHTML = "";

    document.getElementById("pendingActionHint").innerText = db.pendingActionItem
      ? `대기 중: "${db.pendingActionItem}" (다음 계획 저장 시 반영)`
      : "";

    const today = getSeoulToday();
    const search = document.getElementById("todoSearch").value.toLowerCase();
    let visibleTodos = (db.todos || []).filter(t =>
      (t.title.toLowerCase().includes(search) || t.tags.toLowerCase().includes(search)) &&
      (filterState.priority === "ALL" || t.priority === filterState.priority) &&
      todoMatchesStatusFilter(t, today)
    );
    visibleTodos.sort((a, b) => {
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return order[a.priority] - order[b.priority];
    });

    const tbody = document.getElementById("todoTableBody");
    tbody.innerHTML = visibleTodos.map(t => {
      const exec = (db.executionRecords || []).find(r => r.todoId === t.id);
      const isDelayed = t.status === "TODO" && t.dueDate < today;
      return `<tr>
        <td>${t.status === "DONE" ? "✅ 완료" : (isDelayed ? "⚠️ 지연" : "⏳ 진행중")}</td>
        <td><b>${escapeHtml(t.title)}</b></td>
        <td>${escapeHtml(t.dueDate)}</td>
        <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
        <td>${escapeHtml(t.tags)}</td>
        <td>${escapeHtml(t.estimatedHours)}h</td>
        <td>${exec ? escapeHtml(exec.actualHours) + "h" : "-"}</td>
        <td>${exec ? `<button class="btn btn-ghost btn-sm" onclick="showRecord('${t.id}')">보기</button>` : "-"}</td>
        <td style="white-space:nowrap;">
          ${t.status === "TODO" ? `<button class="btn btn-actual btn-sm" onclick="completeTodo('${t.id}')">완료</button>` : `<button class="btn btn-sm" onclick="revertTodo('${t.id}')">되돌리기</button>`}
          <button class="btn btn-ghost btn-sm" onclick="editTodo('${t.id}')">수정</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTodo('${t.id}')">삭제</button>
        </td>
      </tr>`;
    }).join("") || `<tr><td colspan="9" style="text-align:center; color:var(--ink-soft);">조건에 맞는 할 일이 없습니다.</td></tr>`;

    document.querySelectorAll(".stat-box[data-type]").forEach(b => {
      b.classList.toggle("active", b.dataset.type === filterState.status);
    });

    const periodTodos = (db.todos || []).filter(inReviewPeriod);
    const totalPlan = periodTodos.length;
    const totalDone = periodTodos.filter(t => t.status === "DONE").length;
    const totalDelayed = periodTodos.filter(t => t.status === "TODO" && t.dueDate < today).length;
    const periodIds = new Set(periodTodos.map(t => t.id));
    const periodExec = (db.executionRecords || []).filter(r => periodIds.has(r.todoId));
    const totalObstacle = periodTodos.filter(t => {
      const exec = (db.executionRecords || []).find(r => r.todoId === t.id);
      return !!(exec && exec.obstacleReason && exec.obstacleReason.trim() !== "");
    }).length;

    const totalEst = periodTodos.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
    const totalAct = periodExec.reduce((acc, r) => acc + (r.actualHours || 0), 0);
    const diff = totalAct - totalEst;

    document.getElementById("statPlan").innerText = totalPlan;
    document.getElementById("statDone").innerText = totalDone;
    document.getElementById("statDelayed").innerText = totalDelayed;
    document.getElementById("statObstacle").innerText = totalObstacle;
    document.getElementById("statDiff").innerText = `${diff >= 0 ? "+" : ""}${Math.round(diff * 100) / 100}h`;

    document.getElementById("periodLabel").innerText =
      (reviewPeriod.start || reviewPeriod.end)
        ? `집계 기간: ${reviewPeriod.start || "처음"} ~ ${reviewPeriod.end || "지금"} (할 일 마감일 기준)`
        : "집계 기간: 전체";
  }

  // ---- 내보내기 / 가져오기 / 초기화 ----
  function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `pds-diary-${getSeoulToday()}.json`);
    dlAnchor.click();
  }

  // JSON 파일 읽어서 데이터 불러오기 기능
  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);
        if (confirm("기존 데이터가 파일 데이터로 대체됩니다. 불러오시겠습니까?")) {
          db = {
            plan: importedData.plan || null,
            planHistories: importedData.planHistories || [],
            todos: importedData.todos || [],
            executionRecords: importedData.executionRecords || [],
            pendingActionItem: importedData.pendingActionItem || "",
            actionItemLog: importedData.actionItemLog || []
          };
          cancelEditTodo();
          saveData();
          alert("성공적으로 데이터를 불러왔습니다.");
        }
      } catch (err) {
        alert("올바른 JSON 파일 형식이 아닙니다.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // 동일한 파일 연속 선택 가능하도록 초기화
  }

  function exportSchema() {
    const dataStr = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(PDS_SCHEMA_V2, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "pds-schema-v2.json");
    dlAnchor.click();
  }

  function resetData() {
    if (confirm("모든 데이터를 삭제하시겠습니까?")) {
      localStorage.removeItem(STORAGE_KEY);
      db = { plan: null, planHistories: [], todos: [], executionRecords: [], pendingActionItem: "", actionItemLog: [] };
      cancelEditTodo();
      renderAll();
    }
  }

  init();
</script>
</body>
</html>
