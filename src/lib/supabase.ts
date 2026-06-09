import { createClient } from '@supabase/supabase-js'

// 클라이언트 컴포넌트용 브라우저 클라이언트 생성 함수
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// API Route / Server Component 전용 서비스 역할 클라이언트 (더 높은 권한)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
