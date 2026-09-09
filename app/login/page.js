'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import AuthForms from '../../components/AuthForms'

export default function LoginPage() {
  const router = useRouter()
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // 이미 로그인된 상태로 /login에 오면 다이어리 메인 화면으로 보낸다.
    if (session) router.replace('/')
  }, [session, router])

  if (session === undefined || session) {
    return <div className="center-loading">확인 중...</div>
  }

  return <AuthForms />
}
