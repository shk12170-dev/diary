<<<<<<< HEAD
# diary
=======
# 공개주소 : https://github.com/shk12170-dev/plan_diary
# 배포주소 : https://plan-diary-iota.vercel.app
# 소스주소 : https://github.com/shk12170-dev/plan_diary/tree/206e43bc2d4ae7d7cd3d564eb1c8ea2b04ef099e

# 플랜두씨 다이어리 — Plan-Do-See

과제 6 규격 (`contracts/pds-schema-v2.json`)을 준수하여 Plan(계획) → Do(실행) → See(돌아보기) 구조로 구현된 일기/다이어리 웹 애플리케이션입니다.

---

## 전체 프론트엔드 소스 코드 (`index.html`)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>플랜두씨 다이어리 — Plan-Do-See</title>
  <!-- Supabase JS CDN -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    body { font-family: sans-serif; margin: 20px; line-height: 1.6; background-color: #f9f9f6; }
    .banner { background-color: #eab308; color: #fff; padding: 10px 15px; border-radius: 6px; font-weight: bold; margin-bottom: 20px; }
    .card { background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; font-weight: bold; margin-bottom: 5px; }
    input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
    button { background-color: #4f46e5; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
    button:hover { background-color: #4338ca; }
    .carried { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px; margin-bottom: 10px; }
    .plan-history-item { font-size: 0.9em; color: #6b7280; }
  </style>
</head>
<body>

  <div class="banner">
    📢 로그인 없이 누구나 볼 수 있습니다. 남이 봐도 괜찮은 내용만 넣으세요. 데이터는 Supabase DB에 저장됩니다.
  </div>

  <!-- 1. 계획 세우기 (Plan) -->
  <section class="card">
    <h2>1. 계획 세우기 (Plan)</h2>
    <div id="carriedArea"></div>
    <form id="planForm">
      <div class="form-group">
        <label>계획명</label>
        <input type="text" id="p_title" placeholder="예: JAVA 풀스택 과정 완수" required>
      </div>
      <div class="form-group" style="display:flex; gap:10px;">
        <div style="flex:1;">
          <label>시작일</label>
          <input type="date" id="p_start" required>
        </div>
        <div style="flex:1;">
          <label>종료일</label>
          <input type="date" id="p_end" required>
        </div>
        <div style="flex:1;">
          <label>우선순위</label>
          <select id="p_priority">
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM" selected>MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
        <div style="flex:1;">
          <label>예상 시간(h)</label>
          <input type="number" id="p_hours" placeholder="80">
        </div>
      </div>
      <div class="form-group">
        <label>성공 기준</label>
        <textarea id="p_criteria" rows="3" placeholder="모든 일일 과제 수행 및 프로젝트 완료"></textarea>
      </div>
      <button type="submit">계획 저장/수정</button>
    </form>
    <div id="planHistoryArea" style="margin-top: 15px;"></div>
  </section>

  <!-- Action Item 이월 섹션 -->
  <section class="card">
    <h3>이전 돌아보기 반영 (Action Item 이월)</h3>
    <input type="text" id="actionItem" placeholder="다음 계획에 반영할 피드백/고칠 점 입력">
    <button type="button" onclick="carryActionItem()" style="margin-top:10px;">Action Item 이월 등록</button>
    <p id="pendingActionHint" style="color: #6b7280; font-size: 0.9em;"></p>
  </section>

  <script>
    // ----------------------------------------------------
    // 1. Supabase Client 설정 (Storage 차단 방지 옵션 적용)
    // ----------------------------------------------------
    const SUPABASE_URL = "https://xidftozzvlclrscqtkgr.supabase.co"; 
    const SUPABASE_KEY = "sb_publishable_HwkhvkiH0vrc-J_4OFq4-w_e00inI7f"; 
    
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // 앱 내부 상태 메모리
    let db = {
      plan: null,
      pendingActionItem: "",
      planHistories: [],
      actionItemLog: []
    };

    function uid() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function escapeHtml(str) {
      if (!str) return "";
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // ----------------------------------------------------
    // 2. 초기화 및 DB 데이터 로드
    // ----------------------------------------------------
    window.addEventListener("DOMContentLoaded", async () => {
      await loadPlanFromDB();
    });

    async function loadPlanFromDB() {
      const { data, error } = await supabaseClient
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error("DB 로드 실패:", error.message);
        return;
      }

      if (data && data.length > 0) {
        const row = data[0];
        db.plan = {
          id: row.id,
          title: row.title,
          start: row.start_date,
          end: row.end_date,
          priority: row.priority,
          hours: row.hours,
          criteria: row.criteria,
          carriedActionItem: row.carried_action_item
        };
        db.pendingActionItem = row.pending_action_item || "";
      }

      renderAll();
    }

    // ----------------------------------------------------
    // 3. 폼 입력값 채우기 및 렌더링 (renderAll)
    // ----------------------------------------------------
    function renderAll() {
      if (db.plan) {
        document.getElementById("p_title").value = db.plan.title || "";
        document.getElementById("p_start").value = db.plan.start || "";
        document.getElementById("p_end").value = db.plan.end || "";
        document.getElementById("p_priority").value = db.plan.priority || "MEDIUM";
        document.getElementById("p_hours").value = db.plan.hours || "";
        document.getElementById("p_criteria").value = db.plan.criteria || "";
      }

      const carriedArea = document.getElementById("carriedArea");
      if (db.plan && db.plan.carriedActionItem) {
        carriedArea.innerHTML = `<div class="carried">🔄 이전 돌아보기 반영사항: <b>${escapeHtml(db.plan.carriedActionItem)}</b></div>`;
      } else if (db.pendingActionItem) {
        carriedArea.innerHTML = `<div class="carried">⏳ 다음 계획 반영 예정: <b>${escapeHtml(db.pendingActionItem)}</b></div>`;
      } else {
        carriedArea.innerHTML = "";
      }

      const histArea = document.getElementById("planHistoryArea");
      if (db.planHistories && db.planHistories.length > 0) {
        histArea.innerHTML = "<b>계획 변경 이력:</b> " + 
          db.planHistories.map(h => `<div class="plan-history-item">[${escapeHtml((h.modified_at || "").slice(0, 16))}] ${escapeHtml(h.title)}</div>`).join("");
      } else {
        histArea.innerHTML = "";
      }

      document.getElementById("pendingActionHint").innerText = db.pendingActionItem ? `대기 중: "${db.pendingActionItem}"` : "";
    }

    // ----------------------------------------------------
    // 4. Plan Management (Plan Form 저장/수정 핸들러)
    // ----------------------------------------------------
    document.getElementById("planForm").onsubmit = async function (e) {
      e.preventDefault();

      const planId = db.plan ? db.plan.id : uid();

      const planPayload = {
        id: planId,
        title: document.getElementById("p_title").value,
        start_date: document.getElementById("p_start").value,
        end_date: document.getElementById("p_end").value,
        priority: document.getElementById("p_priority").value,
        hours: parseFloat(document.getElementById("p_hours").value) || 0,
        criteria: document.getElementById("p_criteria").value,
        carried_action_item: db.pendingActionItem || (db.plan ? db.plan.carriedActionItem : null),
        pending_action_item: db.pendingActionItem || null
      };

      const { error } = await supabaseClient
        .from('plans')
        .upsert([planPayload]);

      if (error) {
        alert("Supabase 계획 저장 오류: " + error.message);
        return;
      }

      if (db.plan) {
        db.planHistories.push({ ...db.plan, modified_at: new Date().toISOString() });
      }

      if (db.pendingActionItem) {
        db.actionItemLog.push({ text: db.pendingActionItem, applied_at: new Date().toISOString() });
        db.pendingActionItem = "";
      }

      db.plan = {
        id: planPayload.id,
        title: planPayload.title,
        start: planPayload.start_date,
        end: planPayload.end_date,
        priority: planPayload.priority,
        hours: planPayload.hours,
        criteria: planPayload.criteria,
        carriedActionItem: planPayload.carried_action_item
      };

      alert("계획이 DB에 저장되었습니다.");
      renderAll();
    };

    // ----------------------------------------------------
    // 5. Action Item 이월 처리
    // ----------------------------------------------------
    async function carryActionItem() {
      const val = document.getElementById("actionItem").value.trim();
      if (!val) { alert("고칠 점을 입력해주세요."); return; }
      
      db.pendingActionItem = val;
      document.getElementById("actionItem").value = "";

      if (db.plan && db.plan.id) {
        const { error } = await supabaseClient
          .from('plans')
          .update({ pending_action_item: val })
          .eq('id', db.plan.id);

        if (error) {
          alert("Action Item DB 업데이트 실패: " + error.message);
          return;
        }
      }

      alert("다음 계획 저장 시 반영되도록 등록되었습니다.");
      renderAll();
    }
  </script>
</body>
</html>
>>>>>>> 91c2e4d (과제 6)
