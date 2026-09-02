<<<<<<< HEAD
# diary
=======
# 공개주소 : https://github.com/shk12170-dev/plan_diary
# 배포주소 : https://plan-diary-iota.vercel.app
# 소스주소 : https://github.com/shk12170-dev/plan_diary/tree/206e43bc2d4ae7d7cd3d564eb1c8ea2b04ef099e

# 플랜두씨 다이어리 1 — Plan-Do-See

과제 6 규격 (`contracts/pds-schema-v2.json`)을 준수하여 Plan(계획) → Do(실행) → See(돌아보기) 구조로 구현된 일기/다이어리 웹 애플리케이션입니다.

---

## 전체 프론트엔드 소스 코드 (`index.html`)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>플랜두씨 다이어리 1 — Plan-Do-See</title>
<link href="[https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap](https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap)" rel="stylesheet">
<style>
  :root{
    --paper:#EFF1E6; --paper-card:#FBFAF3; --paper-card2:#F5F6EC; --ink:#2B2A28;
    --ink-soft:#63604F; --line:rgba(43,42,40,0.14); --plan:#6B7FA3; --actual:#C1512E;
    --good:#4C7A5E; --amber:#E0A23D; --danger:#B23A3A; --radius:12px;
  }
  *{box-sizing:border-box;} body{margin:0; padding:20px; background:var(--paper); color:var(--ink); font-family:'Noto Sans KR', sans-serif;}
  .wrap{max-width:960px; margin:0 auto;}
  .page-title {
    font-family: 'Gowun Batang', serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--ink);
    margin-top: 10px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--line);
  }
  .notice-banner{background:var(--amber); color:#fff; padding:12px 16px; border-radius:var(--radius); font-weight:600; margin-bottom:20px;}
  .card{background:var(--paper-card); border:1px solid var(--line); border-radius:var(--radius); padding:20px; margin-bottom:24px; box-shadow:0 2px 8px rgba(0,0,0,0.05);}
  h1, h2, h3{font-family:'Gowun Batang', serif; margin-top:0;}
  .form-grid{display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:12px;}
  label{display:block; font-size:12px; font-weight:600; color:var(--ink-soft); margin-bottom:4px;}
  input, select, textarea{width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; font-family:inherit;}
  .btn{padding:8px 16px; border-radius:6px; font-weight:600; border:none; cursor:pointer; background:var(--plan); color:#fff;}
  .btn-actual{background:var(--actual);}
  .btn-danger{background:var(--danger);}
  table{width:100%; border-collapse:collapse; margin-top:10px; font-size:14px;}
  th, td{border-bottom:1px solid var(--line); padding:10px 8px; text-align:left;}
  th{background:var(--paper-card2); font-size:12px; color:var(--ink-soft);}
  .badge{padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; color:#fff;}
  .badge-HIGH{background:var(--danger);} .badge-MEDIUM{background:var(--amber);} .badge-LOW{background:var(--good);}
  .stat-grid{display:grid; grid-template-columns:repeat(5, 1fr); gap:12px; text-align:center;}
  .stat-box{background:var(--paper-card2); padding:16px; border-radius:8px; border:1px solid var(--line); cursor:pointer; transition:transform 0.1s;}
  .stat-box:hover{transform:translateY(-2px);}
  .stat-box .num{font-size:24px; font-weight:bold; font-family:'IBM Plex Mono', monospace; color:var(--actual);}
</style>
</head>
<body>
<div class="wrap">
  
  <h1 class="page-title">플랜두씨 다이어리 1 — Plan-Do-See</h1>

  <div class="notice-banner">
    📢 지금은 로그인이 없어 링크를 아는 사람은 누구나 볼 수 있습니다. 남이 봐도 괜찮은 내용만 넣으세요.
  </div>

  <h2>1. 계획 세우기 (Plan)</h2>
  <div class="card">
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
    <h3>할 일 추가</h3>
    <form id="todoForm">
      <div class="form-grid">
        <div><label>할 일 내용</label><input type="text" id="t_title" required placeholder="과제 6 체크리스트 구현"></div>
        <div><label>마감일</label><input type="date" id="t_due" required></div>
        <div><label>우선순위</label><select id="t_priority"><option>HIGH</option><option selected>MEDIUM</option><option>LOW</option></select></div>
        <div><label>태그</label><input type="text" id="t_tags" placeholder="백엔드, 과제"></div>
        <div><label>예상 시간(h)</label><input type="number" id="t_hours" step="0.5" required placeholder="2"></div>
      </div>
      <button type="submit" class="btn">할 일 등록</button>
    </form>

    <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
      <h3>할 일 목록 <span style="font-size:12px; color:var(--ink-soft);">(정렬 기준: 마감일 오름차순)</span></h3>
      <input type="text" id="todoSearch" placeholder="검색..." style="width:200px;">
    </div>
    <table>
      <thead>
        <tr><th>상태</th><th>할 일</th><th>마감일</th><th>우선순위</th><th>태그</th><th>예상시간</th><th>실제시간</th><th>작업</th></tr>
      </thead>
      <tbody id="todoTableBody"></tbody>
    </table>
  </div>

  <h2>3. 돌아보기 (See)</h2>
  <div class="card">
    <div class="stat-grid">
      <div class="stat-box" onclick="filterTodoList('ALL')"><div class="num" id="statPlan">0</div><div>계획 수</div></div>
      <div class="stat-box" onclick="filterTodoList('DONE')"><div class="num" id="statDone">0</div><div>완료 수</div></div>
      <div class="stat-box" onclick="filterTodoList('DELAYED')"><div class="num" id="statDelayed">0</div><div>지연 수</div></div>
      <div class="stat-box" onclick="filterTodoList('OBSTACLE')"><div class="num" id="statObstacle">0</div><div>막힘 수</div></div>
      <div class="stat-box"><div class="num" id="statDiff">0h</div><div>시간 격차(실제-예상)</div></div>
    </div>
    <div style="margin-top:20px;">
      <label><b>다음 계획으로 넘길 고칠 점 (Action Item)</b></label>
      <input type="text" id="actionItem" placeholder="예: 예상 시간을 1.5배 보수적으로 설정하기" style="margin-top:6px;">
    </div>
  </div>

  <h2>4. 백업 및 서버 연동 스키마</h2>
  <div class="card">
    <button class="btn" onclick="exportData()">JSON 파일 내보내기</button>
    <button class="btn btn-danger" onclick="resetData()">전체 초기화</button>
  </div>
</div>

<script>
  let db = {
    plan: null,
    planHistories: [],
    todos: [],
    executionRecords: [],
    reflection: ""
  };

  function init() {
    const saved = localStorage.getItem("pds_diary_v2");
    if (saved) db = JSON.parse(saved);
    renderAll();
  }

  function saveData() {
    localStorage.setItem("pds_diary_v2", JSON.stringify(db));
    renderAll();
  }

  document.getElementById("planForm").onsubmit = function(e) {
    e.preventDefault();
    const newPlan = {
      title: document.getElementById("p_title").value,
      start: document.getElementById("p_start").value,
      end: document.getElementById("p_end").value,
      priority: document.getElementById("p_priority").value,
      hours: parseFloat(document.getElementById("p_hours").value),
      criteria: document.getElementById("p_criteria").value
    };

    if (db.plan) {
      db.planHistories.push({ ...db.plan, modified_at: new Date().toISOString() });
    }
    db.plan = newPlan;
    saveData();
    alert("계획이 저장되었습니다.");
  };

  document.getElementById("todoForm").onsubmit = function(e) {
    e.preventDefault();
    const newTodo = {
      id: Date.now(),
      title: document.getElementById("t_title").value,
      dueDate: document.getElementById("t_due").value,
      priority: document.getElementById("t_priority").value,
      tags: document.getElementById("t_tags").value,
      estimatedHours: parseFloat(document.getElementById("t_hours").value),
      status: "TODO"
    };
    db.todos.push(newTodo);
    saveData();
    this.reset();
  };

  function completeTodo(id) {
    const todo = db.todos.find(t => t.id === id);
    if (!todo || todo.status === "DONE") return;

    const actual = prompt("실제로 걸린 시간(시간 단위)을 입력하세요:", todo.estimatedHours);
    if (actual === null) return;
    const obstacle = prompt("막혔던 이유가 있다면 입력하세요 (없으면 빈칸):", "");

    todo.status = "DONE";
    db.executionRecords.push({
      todoId: id,
      idempotencyKey: `todo_${id}_done`,
      actualHours: parseFloat(actual) || 0,
      obstacleReason: obstacle || "",
      completedAt: new Date().toISOString()
    });
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
    db.todos = db.todos.filter(t => t.id !== id);
    db.executionRecords = db.executionRecords.filter(r => r.todoId !== id);
    saveData();
  }

  function renderAll() {
    if (db.plan) {
      document.getElementById("p_title").value = db.plan.title;
      document.getElementById("p_start").value = db.plan.start;
      document.getElementById("p_end").value = db.plan.end;
      document.getElementById("p_priority").value = db.plan.priority;
      document.getElementById("p_hours").value = db.plan.hours;
      document.getElementById("p_criteria").value = db.plan.criteria;
    }
    
    const histArea = document.getElementById("planHistoryArea");
    if (db.planHistories.length > 0) {
      histArea.innerHTML = "<b>계획 변경 이력:</b><br>" + db.planHistories.map(h => 
        `<small>[${h.modified_at.slice(0,10)}] ${h.title} (${h.hours}h) - ${h.criteria}</small>`
      ).join("<br>");
    } else histArea.innerHTML = "";

    const search = document.getElementById("todoSearch").value.toLowerCase();
    const sortedTodos = [...db.todos]
      .filter(t => t.title.toLowerCase().includes(search) || t.tags.toLowerCase().includes(search))
      .sort((a,b) => a.dueDate.localeCompare(b.dueDate));

    const tbody = document.getElementById("todoTableBody");
    tbody.innerHTML = sortedTodos.map(t => {
      const exec = db.executionRecords.find(r => r.todoId === t.id);
      return `<tr>
        <td>${t.status === 'DONE' ? '✅ 완료' : '⏳ 진행중'}</td>
        <td><b>${t.title}</b></td>
        <td>${t.dueDate}</td>
        <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
        <td>${t.tags}</td>
        <td>${t.estimatedHours}h</td>
        <td>${exec ? exec.actualHours + 'h' : '-'}</td>
        <td>
          ${t.status === 'TODO' 
            ? `<button class="btn btn-actual" onclick="completeTodo(${t.id})">완료</button>` 
            : `<button class="btn" onclick="revertTodo(${t.id})">되돌리기</button>`}
          <button class="btn btn-danger" onclick="deleteTodo(${t.id})">삭제</button>
        </td>
      </tr>`;
    }).join("");

    const today = new Date().toISOString().slice(0,10);
    const totalPlan = db.todos.length;
    const totalDone = db.todos.filter(t => t.status === "DONE").length;
    const totalDelayed = db.todos.filter(t => t.status === "TODO" && t.dueDate < today).length;
    const totalObstacle = db.executionRecords.filter(r => r.obstacleReason && r.obstacleReason.trim() !== "").length;

    const totalEst = db.todos.reduce((acc, t) => acc + t.estimatedHours, 0);
    const totalAct = db.executionRecords.reduce((acc, r) => acc + r.actualHours, 0);
    const diff = totalAct - totalEst;

    document.getElementById("statPlan").innerText = totalPlan;
    document.getElementById("statDone").innerText = totalDone;
    document.getElementById("statDelayed").innerText = totalDelayed;
    document.getElementById("statObstacle").innerText = totalObstacle;
    document.getElementById("statDiff").innerText = `${diff >= 0 ? '+' : ''}${diff}h`;
  }

  function filterTodoList(type) {
    alert(`집계 클릭: [${type}] 항목 필터링 보기로 이동합니다.`);
  }

  function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `pds-diary-${new Date().toISOString().slice(0,10)}.json`);
    dlAnchor.click();
  }

  function resetData() {
    if (confirm("모든 데이터를 삭제하시겠습니까?")) {
      localStorage.removeItem("pds_diary_v2");
      db = { plan: null, planHistories: [], todos: [], executionRecords: [], reflection: "" };
      renderAll();
    }
  }

  document.getElementById("todoSearch").oninput = renderAll;
  init();
</script>
</body>
</html>
>>>>>>> 91c2e4d (과제 6)
