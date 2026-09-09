'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthForms() {
  const [tab, setTab] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null) // { type: 'ok' | 'err', text }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setMsg({ type: 'err', text: `로그인 실패: ${error.message}` })
      return
    }
    // 성공 시 onAuthStateChange가 상위 컴포넌트에서 자동으로 감지해 화면을 전환한다.
  }

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setMsg({ type: 'err', text: `회원가입 실패: ${error.message}` })
      return
    }
    if (data.session) {
      setMsg({ type: 'ok', text: '가입 완료! 자동으로 로그인됩니다.' })
    } else {
      setMsg({
        type: 'ok',
        text: '가입 완료. 이메일 인증이 켜져 있는 프로젝트라면 받은 메일함에서 인증 링크를 확인한 뒤 로그인 탭에서 로그인하세요.',
      })
      setTab('login')
    }
  }

  return (
    <div id="auth-container">
      <div className="auth-box">
        <h1>플랜두씨 다이어리</h1>
        <div className="sub">로그인 후에만 나만의 계획/할 일을 볼 수 있습니다.</div>

        <div className="tabs">
          <button type="button" className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setMsg(null) }}>
            로그인
          </button>
          <button type="button" className={`tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setMsg(null) }}>
            회원가입
          </button>
        </div>

        {tab === 'login' ? (
          <form className="auth-form active" onSubmit={handleLogin}>
            <label>이메일</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <label>비밀번호</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? '처리 중...' : '로그인'}</button>
          </form>
        ) : (
          <form className="auth-form active" onSubmit={handleSignup}>
            <label>이메일</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <label>비밀번호 (6자 이상)</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
            <button type="submit" className="auth-btn" disabled={loading}>{loading ? '처리 중...' : '회원가입'}</button>
          </form>
        )}

        {msg && <div className={`msg ${msg.type === 'err' ? 'err' : 'ok'}`}>{msg.text}</div>}

        <div className="hint-auth">
          비밀번호는 Supabase Auth(GoTrue)가 자체적으로 단방향 해시로 저장하며, 이 앱의 코드나 DB 어디에도 평문으로 남지 않습니다.
        </div>
      </div>
    </div>
  )
}
