// app/page.js
'use client' // 브라우저에서 화면을 바꿀 수 있게 설정

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase' // 1단계에서 만든 전화기 불러오기

export default function Home() {
  // DB에서 가져온 할 일 목록을 담아둘 바구니(state)
  const [todos, setTodos] = useState([])

  // 화면이 켜지자마자 실행되는 부분
  useEffect(() => {
    async function getTodos() {
      // Supabase의 'todos' 테이블에서 모든 데이터(*)를 가져와라!
      const { data, error } = await supabase.from('todos').select('*')
      
      if (error) {
        console.error('에러가 발생했습니다:', error)
      } else {
        // 가져온 데이터를 바구니에 담기
        setTodos(data)
      }
    }

    getTodos()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>내 할 일 목록 (Supabase 연동)</h1>
      
      <ul>
        {/* 바구니에 담긴 할 일들을 하나씩 화면에 글자로 뽑아내기 */}
        {todos.map((todo) => (
          <li key={todo.id} style={{ marginBottom: '10px' }}>
            <strong>{todo.title}</strong> (우선순위: {todo.priority})
          </li>
        ))}
      </ul>
    </div>
  )
}