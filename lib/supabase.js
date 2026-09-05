// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Vercel 환경변수에서 설정했던 주소와 키를 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabase와 통신할 수 있는 전화기(client)를 만듭니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)