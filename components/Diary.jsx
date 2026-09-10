'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

function getSeoulToday() {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })
  return fmt.format(new Date())
}

function toSeoulDate(iso) {
  if (!iso) return null
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })
  return fmt.format(new Date(iso))
}

function fmtDateTime(t) {
  return t ? new Date(t).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '-'
}

// [2026-09-10 규칙 변경] 완료는 했지만 완료 시점이 마감일을 넘긴 경우도 "지연"으로 집계한다.
// 기존에는 미완료(TODO)이면서 마감일이 지난 경우만 지연으로 셌는데, 이러면 마감을 넘겨
// 완료 처리한 항목이 통계에서 전혀 안 잡혀 실제 지연이 감춰지는 문제가 있었다.
function isLateCompletion(todo, execRecords) {
  if (todo.status !== 'DONE') return false
  const exec = execRecords.find((r) => r.todo_id === todo.id)
  if (!exec) return false
  const finishedDate = toSeoulDate(exec.ended_at || exec.completed_at)
  return !!finishedDate && finishedDate > todo.due_date
}

const emptyPlanForm = { title: '', start_date: '', end_date: '', priority: 'MEDIUM', hours: '', criteria: '' }
const emptyTodoForm = { title: '', due_date: '', priority: 'MEDIUM', tags: '', estimated_hours: '' }

export default function Diary({ user }) {
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [planHistories, setPlanHistories] = useState([])
  const [todos, setTodos] = useState([])
  const [execRecords, setExecRecords] = useState([])
  const [pendingAction, setPendingAction] = useState(null) // review_action_items row not yet applied

  const [planForm, setPlanForm] = useState(emptyPlanForm)
  const [todoForm, setTodoForm] = useState(emptyTodoForm)
  const [editingTodoId, setEditingTodoId] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [reviewStart, setReviewStart] = useState('')
  const [reviewEnd, setReviewEnd] = useState('')
  const [actionItemInput, setActionItemInput] = useState('')

  const [completeModal, setCompleteModal] = useState(null) // { todoId, start, end, actual, obstacle }
  const [recordModal, setRecordModal] = useState(null) // execution record to show
  const [importing, setImporting] = useState(false)
  const importFileRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: plans }, { data: histories }, { data: todoRows }, { data: execRows }, { data: actionRows }] = await Promise.all([
      supabase.from('plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('plan_histories').select('*').eq('user_id', user.id).order('modified_at', { ascending: true }),
      supabase.from('todos').select('*').eq('user_id', user.id).order('due_date', { ascending: true }),
      supabase.from('execution_records').select('*').eq('user_id', user.id),
      supabase.from('review_action_items').select('*').eq('user_id', user.id).is('applied_to_plan_id', null).order('created_at', { ascending: false }).limit(1),
    ])
    setPlan(plans && plans[0] ? plans[0] : null)
    setPlanHistories(histories || [])
    setTodos(todoRows || [])
    setExecRecords(execRows || [])
    setPendingAction(actionRows && actionRows[0] ? actionRows[0] : null)
    setLoading(false)
  }, [user.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (plan) {
      setPlanForm({
        title: plan.title, start_date: plan.start_date, end_date: plan.end_date,
        priority: plan.priority, hours: plan.hours, criteria: plan.criteria,
      })
    } else {
      setPlanForm(emptyPlanForm)
    }
  }, [plan])

  async function handlePlanSubmit(e) {
    e.preventDefault()
    if (plan) {
      // plan_histories 테이블에는 carried_action_item 컬럼이 없으므로 반드시 제외하고 스프레드해야 한다.
      // (포함하면 PostgREST가 "unknown column" 에러를 내는데, 이 insert의 반환값을 확인하지 않으면
      //  실패가 조용히 묻히고 계획 변경 이력이 저장 안 된 채로 다음 계획만 생성돼버린다.)
      const { id, user_id, created_at, carried_action_item, ...rest } = plan
      const { error: historyError } = await supabase.from('plan_histories').insert({ user_id: user.id, plan_id: id, ...rest, modified_at: new Date().toISOString() })
      if (historyError) { alert('이전 계획 이력 저장 실패: ' + historyError.message); return }
    }
    const carried = pendingAction ? pendingAction.text : null
    const { data: inserted, error } = await supabase.from('plans').insert({
      user_id: user.id,
      title: planForm.title,
      start_date: planForm.start_date,
      end_date: planForm.end_date,
      priority: planForm.priority,
      hours: parseFloat(planForm.hours),
      criteria: planForm.criteria,
      carried_action_item: carried,
    }).select().single()

    if (error) { alert('계획 저장 실패: ' + error.message); return }

    if (pendingAction) {
      await supabase.from('review_action_items').update({ applied_to_plan_id: inserted.id }).eq('id', pendingAction.id)
    }
    await load()
    alert('계획이 저장되었습니다.')
  }

  async function carryActionItem() {
    const val = actionItemInput.trim()
    if (!val) { alert('먼저 고칠 점을 입력하세요.'); return }
    const { error } = await supabase.from('review_action_items').insert({ user_id: user.id, text: val })
    if (error) { alert('저장 실패: ' + error.message); return }
    setActionItemInput('')
    await load()
    alert('다음 계획을 저장할 때 이 고칠 점이 함께 반영됩니다.')
  }

  function startEditTodo(todo) {
    setEditingTodoId(todo.id)
    setTodoForm({
      title: todo.title, due_date: todo.due_date, priority: todo.priority,
      tags: todo.tags || '', estimated_hours: todo.estimated_hours,
    })
  }

  function cancelEditTodo() {
    setEditingTodoId(null)
    setTodoForm(emptyTodoForm)
  }

  async function handleTodoSubmit(e) {
    e.preventDefault()
    const payload = {
      title: todoForm.title,
      due_date: todoForm.due_date,
      priority: todoForm.priority,
      tags: todoForm.tags,
      estimated_hours: parseFloat(todoForm.estimated_hours),
    }
    if (editingTodoId) {
      const { error } = await supabase.from('todos').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingTodoId).eq('user_id', user.id)
      if (error) { alert('수정 실패: ' + error.message); return }
      cancelEditTodo()
    } else {
      const { error } = await supabase.from('todos').insert({
        ...payload, user_id: user.id, plan_id: plan ? plan.id : null, status: 'TODO',
      })
      if (error) { alert('등록 실패: ' + error.message); return }
      setTodoForm(emptyTodoForm)
    }
    await load()
  }

  async function deleteTodo(id) {
    if (!confirm('이 할 일을 삭제하시겠습니까? 관련 실행 기록도 함께 삭제됩니다.')) return
    await supabase.from('execution_records').delete().eq('todo_id', id).eq('user_id', user.id)
    await supabase.from('todos').delete().eq('id', id).eq('user_id', user.id)
    await load()
  }

  function openCompleteModal(todo) {
    const now = new Date()
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setCompleteModal({ todoId: todo.id, start: local, end: local, actual: String(todo.estimated_hours), obstacle: '' })
  }

  function onCompleteTimeChange(field, value) {
    setCompleteModal((m) => {
      const next = { ...m, [field]: value }
      if (next.start && next.end) {
        const diffH = (new Date(next.end) - new Date(next.start)) / 3600000
        if (diffH >= 0) next.actual = String(Math.round(diffH * 100) / 100)
      }
      return next
    })
  }

  async function confirmComplete() {
    const { todoId, start, end, actual, obstacle } = completeModal
    const { error: updateErr } = await supabase.from('todos').update({ status: 'DONE', updated_at: new Date().toISOString() }).eq('id', todoId).eq('user_id', user.id)
    if (updateErr) { alert('완료 처리 실패: ' + updateErr.message); return }
    const { error: insertErr } = await supabase.from('execution_records').insert({
      user_id: user.id,
      todo_id: todoId,
      idempotency_key: `todo_${todoId}_done`,
      started_at: start ? new Date(start).toISOString() : null,
      ended_at: end ? new Date(end).toISOString() : null,
      actual_hours: parseFloat(actual) || 0,
      obstacle_reason: obstacle ? obstacle.trim() : null,
    })
    if (insertErr && !String(insertErr.message).includes('duplicate')) {
      alert('실행 기록 저장 실패: ' + insertErr.message)
    }
    setCompleteModal(null)
    await load()
  }

  async function revertTodo(id) {
    await supabase.from('execution_records').delete().eq('todo_id', id).eq('user_id', user.id)
    await supabase.from('todos').update({ status: 'TODO', updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id)
    await load()
  }

  const today = getSeoulToday()

  const visibleTodos = useMemo(() => {
    const q = search.toLowerCase()
    let list = todos.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(q) || (t.tags || '').toLowerCase().includes(q)
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter
      let matchesStatus = true
      if (statusFilter === 'DONE') matchesStatus = t.status === 'DONE'
      else if (statusFilter === 'DELAYED') matchesStatus = (t.status === 'TODO' && t.due_date < today) || isLateCompletion(t, execRecords)
      else if (statusFilter === 'OBSTACLE') {
        const exec = execRecords.find((r) => r.todo_id === t.id)
        matchesStatus = !!(exec && exec.obstacle_reason && exec.obstacle_reason.trim() !== '')
      }
      return matchesSearch && matchesPriority && matchesStatus
    })
    list.sort((a, b) => {
      if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date)
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
      return order[a.priority] - order[b.priority]
    })
    return list
  }, [todos, execRecords, search, statusFilter, priorityFilter, today])

  const stats = useMemo(() => {
    const inPeriod = (t) => {
      if (reviewStart && t.due_date < reviewStart) return false
      if (reviewEnd && t.due_date > reviewEnd) return false
      return true
    }
    const periodTodos = todos.filter(inPeriod)
    const totalDone = periodTodos.filter((t) => t.status === 'DONE').length
    const totalDelayed = periodTodos.filter((t) => (t.status === 'TODO' && t.due_date < today) || isLateCompletion(t, execRecords)).length
    const totalObstacle = periodTodos.filter((t) => {
      const exec = execRecords.find((r) => r.todo_id === t.id)
      return !!(exec && exec.obstacle_reason && exec.obstacle_reason.trim() !== '')
    }).length
    const periodIds = new Set(periodTodos.map((t) => t.id))
    const periodExec = execRecords.filter((r) => periodIds.has(r.todo_id))
    const totalEst = periodTodos.reduce((acc, t) => acc + (Number(t.estimated_hours) || 0), 0)
    const totalAct = periodExec.reduce((acc, r) => acc + (Number(r.actual_hours) || 0), 0)
    return { total: periodTodos.length, done: totalDone, delayed: totalDelayed, obstacle: totalObstacle, diff: totalAct - totalEst }
  }, [todos, execRecords, reviewStart, reviewEnd, today])

  function exportData() {
    const payload = { plan, planHistories, todos, executionRecords: execRecords, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pds-diary-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importData(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    if (!confirm('파일의 계획/할 일/실행기록을 현재 계정에 새로 추가합니다. 계속할까요?')) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      // 과제6 내보내기(camelCase: dueDate, estimatedHours ...)와
      // 과제7 내보내기(snake_case: due_date, estimated_hours ...) 둘 다 지원한다.
      const legacy = !!(data.todos && data.todos.length > 0 && 'dueDate' in data.todos[0])

      let newPlanId = null
      if (data.plan) {
        const p = data.plan
        const { data: inserted, error } = await supabase.from('plans').insert({
          user_id: user.id,
          title: p.title,
          start_date: legacy ? p.start : p.start_date,
          end_date: legacy ? p.end : p.end_date,
          priority: p.priority,
          hours: p.hours,
          criteria: p.criteria,
          carried_action_item: (legacy ? p.carriedActionItem : p.carried_action_item) || null,
        }).select().single()
        if (error) throw error
        newPlanId = inserted.id
      }

      for (const h of data.planHistories || []) {
        await supabase.from('plan_histories').insert({
          user_id: user.id,
          plan_id: newPlanId,
          title: h.title,
          start_date: legacy ? h.start : h.start_date,
          end_date: legacy ? h.end : h.end_date,
          priority: h.priority,
          hours: h.hours,
          criteria: h.criteria,
          modified_at: h.modified_at || new Date().toISOString(),
        })
      }

      const idMap = {}
      for (const t of data.todos || []) {
        const { data: inserted, error } = await supabase.from('todos').insert({
          user_id: user.id,
          plan_id: newPlanId,
          title: t.title,
          due_date: legacy ? t.dueDate : t.due_date,
          priority: t.priority,
          tags: t.tags || '',
          estimated_hours: legacy ? t.estimatedHours : t.estimated_hours,
          status: t.status || 'TODO',
        }).select().single()
        if (error) throw error
        idMap[t.id] = inserted.id
      }

      for (const r of data.executionRecords || []) {
        const oldTodoId = legacy ? r.todoId : r.todo_id
        const newTodoId = idMap[oldTodoId]
        if (!newTodoId) continue
        await supabase.from('execution_records').insert({
          user_id: user.id,
          todo_id: newTodoId,
          idempotency_key: `import_${newTodoId}_${Date.now()}`,
          started_at: legacy ? r.startedAt : r.started_at,
          ended_at: legacy ? r.endedAt : r.ended_at,
          actual_hours: (legacy ? r.actualHours : r.actual_hours) || 0,
          obstacle_reason: (legacy ? r.obstacleReason : r.obstacle_reason) || null,
          completed_at: (legacy ? r.completedAt : r.completed_at) || new Date().toISOString(),
        })
      }

      const pendingText = legacy ? data.pendingActionItem : null
      if (pendingText) {
        await supabase.from('review_action_items').insert({ user_id: user.id, text: pendingText })
      }

      await load()
      alert('가져오기가 완료되었습니다.')
    } catch (err) {
      alert('가져오기 실패: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return <div className="center-loading">불러오는 중...</div>

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="who">로그인: <b>{user.email}</b></div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>로그아웃</button>
      </div>

      <h1 className="page-title">플랜두씨 다이어리 — Plan-Do-See</h1>

      <div className="notice-banner">
        🔒 로그인한 본인 계정의 자료만 보이고 저장됩니다. 데이터는 Supabase(Postgres) DB에 저장되며, 행 단위 보안 정책(RLS)으로 다른 계정과 격리됩니다.
      </div>

      <h2>1. 계획 세우기 (Plan)</h2>
      <div className="card">
        {plan && plan.carried_action_item && (
          <div className="carried">🔁 이전 돌아보기에서 넘어온 고칠 점: <b>{plan.carried_action_item}</b></div>
        )}
        {!plan?.carried_action_item && pendingAction && (
          <div className="carried">⏳ 다음 계획 저장 시 반영될 고칠 점: <b>{pendingAction.text}</b></div>
        )}
        <form onSubmit={handlePlanSubmit}>
          <div className="form-grid">
            <div><label>계획명</label><input required value={planForm.title} onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })} placeholder="예: JAVA 풀스택 과정 완수" /></div>
            <div><label>시작일</label><input type="date" required value={planForm.start_date} onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })} /></div>
            <div><label>종료일</label><input type="date" required value={planForm.end_date} onChange={(e) => setPlanForm({ ...planForm, end_date: e.target.value })} /></div>
            <div>
              <label>우선순위</label>
              <select value={planForm.priority} onChange={(e) => setPlanForm({ ...planForm, priority: e.target.value })}>
                <option>HIGH</option><option>MEDIUM</option><option>LOW</option>
              </select>
            </div>
            <div><label>예상 시간(h)</label><input type="number" step="0.5" required value={planForm.hours} onChange={(e) => setPlanForm({ ...planForm, hours: e.target.value })} placeholder="80" /></div>
          </div>
          <div><label>성공 기준</label><textarea rows={2} required value={planForm.criteria} onChange={(e) => setPlanForm({ ...planForm, criteria: e.target.value })} placeholder="모든 일일 과제 수행 및 프로젝트 완료" /></div>
          <button type="submit" className="btn" style={{ marginTop: 10 }}>계획 저장/수정</button>
        </form>

        {planHistories.length > 0 && (
          <div style={{ marginTop: 15 }}>
            <b>계획 변경 이력 (고치기 전 값, 처음 계획부터 그대로 보존됨):</b>
            {planHistories.map((h) => (
              <div key={h.id} className="plan-history-item">
                [{(h.modified_at || '').slice(0, 10)}] {h.title} · 기간 {h.start_date}~{h.end_date} · 우선순위 {h.priority} · {h.hours}h — {h.criteria}
              </div>
            ))}
          </div>
        )}
      </div>

      <h2>2. 할 일 다루기 & 실제 한 일 (Do)</h2>
      <div className="card">
        <h3>{editingTodoId ? '할 일 수정' : '할 일 추가'}</h3>
        <form onSubmit={handleTodoSubmit}>
          <div className="form-grid">
            <div><label>할 일 내용</label><input required value={todoForm.title} onChange={(e) => setTodoForm({ ...todoForm, title: e.target.value })} placeholder="과제 7 인증 붙이기" /></div>
            <div><label>마감일</label><input type="date" required value={todoForm.due_date} onChange={(e) => setTodoForm({ ...todoForm, due_date: e.target.value })} /></div>
            <div>
              <label>우선순위</label>
              <select value={todoForm.priority} onChange={(e) => setTodoForm({ ...todoForm, priority: e.target.value })}>
                <option>HIGH</option><option>MEDIUM</option><option>LOW</option>
              </select>
            </div>
            <div><label>태그</label><input value={todoForm.tags} onChange={(e) => setTodoForm({ ...todoForm, tags: e.target.value })} placeholder="백엔드, 과제" /></div>
            <div><label>예상 시간(h)</label><input type="number" step="0.5" required value={todoForm.estimated_hours} onChange={(e) => setTodoForm({ ...todoForm, estimated_hours: e.target.value })} placeholder="2" /></div>
          </div>
          <button type="submit" className="btn">{editingTodoId ? '수정 저장' : '할 일 등록'}</button>
          {editingTodoId && <button type="button" className="btn btn-ghost" style={{ marginLeft: 8 }} onClick={cancelEditTodo}>수정 취소</button>}
        </form>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0 }}>할 일 목록</h3>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="제목·태그 검색..." style={{ width: 200 }} />
        </div>
        <div className="hint">정렬 기준: 마감일 오름차순 · 마감일이 같으면 우선순위 높은 순(HIGH → MEDIUM → LOW)</div>
        <div className="filter-row">
          <div>
            <label>상태</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">전체</option>
              <option value="TODO">진행중</option>
              <option value="DONE">완료</option>
              <option value="DELAYED">지연</option>
              <option value="OBSTACLE">막힘 기록 있음</option>
            </select>
          </div>
          <div>
            <label>우선순위</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="ALL">전체</option>
              <option>HIGH</option><option>MEDIUM</option><option>LOW</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr><th>상태</th><th>할 일</th><th>마감일</th><th>우선순위</th><th>태그</th><th>예상시간</th><th>실제시간</th><th>기록</th><th>작업</th></tr>
          </thead>
          <tbody>
            {visibleTodos.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>조건에 맞는 할 일이 없습니다.</td></tr>
            )}
            {visibleTodos.map((t) => {
              const exec = execRecords.find((r) => r.todo_id === t.id)
              const isDelayed = t.status === 'TODO' && t.due_date < today
              const isLate = isLateCompletion(t, execRecords)
              const statusLabel = t.status === 'DONE' ? (isLate ? '⚠️ 지연완료' : '✅ 완료') : (isDelayed ? '⚠️ 지연' : '⏳ 진행중')
              return (
                <tr key={t.id}>
                  <td>{statusLabel}</td>
                  <td><b>{t.title}</b></td>
                  <td>{t.due_date}</td>
                  <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                  <td>{t.tags}</td>
                  <td>{t.estimated_hours}h</td>
                  <td>{exec ? `${exec.actual_hours}h` : '-'}</td>
                  <td>{exec ? <button className="btn btn-ghost btn-sm" onClick={() => setRecordModal({ ...exec, todoTitle: t.title })}>보기</button> : '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {t.status === 'TODO'
                      ? <button className="btn btn-actual btn-sm" onClick={() => openCompleteModal(t)}>완료</button>
                      : <button className="btn btn-sm" onClick={() => revertTodo(t.id)}>되돌리기</button>}
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 4 }} onClick={() => startEditTodo(t)}>수정</button>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft: 4 }} onClick={() => deleteTodo(t.id)}>삭제</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h2>3. 돌아보기 (See)</h2>
      <div className="card">
        <div className="filter-row">
          <div><label>기간 시작(마감일 기준)</label><input type="date" value={reviewStart} onChange={(e) => setReviewStart(e.target.value)} /></div>
          <div><label>기간 종료(마감일 기준)</label><input type="date" value={reviewEnd} onChange={(e) => setReviewEnd(e.target.value)} /></div>
          <div><button className="btn btn-ghost btn-sm" type="button" onClick={() => { setReviewStart(''); setReviewEnd('') }}>기간 초기화</button></div>
        </div>
        <div className="hint">{(reviewStart || reviewEnd) ? `집계 기간: ${reviewStart || '처음'} ~ ${reviewEnd || '지금'} (할 일 마감일 기준)` : '집계 기간: 전체'}</div>
        <div className="stat-grid">
          <div className={`stat-box ${statusFilter === 'ALL' ? 'active' : ''}`} onClick={() => setStatusFilter('ALL')}><div className="num">{stats.total}</div><div>계획 수</div></div>
          <div className={`stat-box ${statusFilter === 'DONE' ? 'active' : ''}`} onClick={() => setStatusFilter('DONE')}><div className="num">{stats.done}</div><div>완료 수</div></div>
          <div className={`stat-box ${statusFilter === 'DELAYED' ? 'active' : ''}`} onClick={() => setStatusFilter('DELAYED')}><div className="num">{stats.delayed}</div><div>지연 수</div></div>
          <div className={`stat-box ${statusFilter === 'OBSTACLE' ? 'active' : ''}`} onClick={() => setStatusFilter('OBSTACLE')}><div className="num">{stats.obstacle}</div><div>막힘 수</div></div>
          <div className="stat-box"><div className="num">{stats.diff >= 0 ? '+' : ''}{Math.round(stats.diff * 100) / 100}h</div><div>시간 격차(실제-예상)</div></div>
        </div>
        <div className="hint">숫자를 클릭하면 위 할 일 목록이 해당 조건으로 걸러집니다.</div>
        <div style={{ marginTop: 20 }}>
          <label><b>다음 계획으로 넘길 고칠 점 (Action Item)</b></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={actionItemInput} onChange={(e) => setActionItemInput(e.target.value)} placeholder="예: 예상 시간을 1.5배 보수적으로 설정하기" />
            <button className="btn" type="button" onClick={carryActionItem}>다음 계획으로 넘기기</button>
          </div>
          <div className="hint">{pendingAction ? `대기 중: "${pendingAction.text}" (다음 계획 저장 시 반영)` : ''}</div>
        </div>
      </div>

      <h2>4. 백업</h2>
      <div className="card">
        <button className="btn" onClick={exportData}>JSON 파일 내보내기</button>
        <input type="file" accept=".json" ref={importFileRef} style={{ display: 'none' }} onChange={importData} />
        <button className="btn btn-actual" style={{ marginLeft: 8 }} disabled={importing} onClick={() => importFileRef.current.click()}>
          {importing ? '가져오는 중...' : 'JSON 파일 가져오기'}
        </button>
        <div className="hint" style={{ marginTop: 10 }}>
          내보내기: plans / todos / execution_records / plan_histories 테이블의 내 자료를 파일 하나로 내려받습니다.<br />
          가져오기: 과제6 `index.html`에서 내보낸 파일이나, 이 화면에서 내보낸 파일을 현재 계정에 추가로 불러옵니다(기존 자료는 지워지지 않고 더해집니다).
        </div>
      </div>

      {completeModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h3>완료 기록 남기기</h3>
            <div className="row"><label>시작 시각</label><input type="datetime-local" value={completeModal.start} onChange={(e) => onCompleteTimeChange('start', e.target.value)} /></div>
            <div className="row"><label>종료 시각</label><input type="datetime-local" value={completeModal.end} onChange={(e) => onCompleteTimeChange('end', e.target.value)} /></div>
            <div className="row"><label>실제로 걸린 시간(h)</label><input type="number" step="0.25" value={completeModal.actual} onChange={(e) => setCompleteModal({ ...completeModal, actual: e.target.value })} /></div>
            <div className="row"><label>막혔던 이유(없으면 비워두기)</label><textarea rows={2} value={completeModal.obstacle} onChange={(e) => setCompleteModal({ ...completeModal, obstacle: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn btn-ghost" type="button" onClick={() => setCompleteModal(null)}>취소</button>
              <button className="btn btn-actual" type="button" onClick={confirmComplete}>완료 저장</button>
            </div>
          </div>
        </div>
      )}

      {recordModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h3>실행 기록 보기</h3>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              <div><b>할 일:</b> {recordModal.todoTitle}</div>
              <div><b>시작 시각:</b> {fmtDateTime(recordModal.started_at)}</div>
              <div><b>종료 시각:</b> {fmtDateTime(recordModal.ended_at)}</div>
              <div><b>실제 걸린 시간:</b> {recordModal.actual_hours}h</div>
              <div><b>막혔던 이유:</b> {recordModal.obstacle_reason || '(없음)'}</div>
              <div><b>완료 처리 시각:</b> {fmtDateTime(recordModal.completed_at)}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn btn-ghost" type="button" onClick={() => setRecordModal(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
