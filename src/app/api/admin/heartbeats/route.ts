import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/adminAuth'

// DB 헬스체크 실행 이력 조회 (관리자 전용)
export async function GET() {
  // 로그인한 관리자만 접근 허용
  if (!(await isAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('db_heartbeat')
    .select('id, note, created_at')
    .order('created_at', { ascending: false })
    .limit(50)  // 최근 50건까지만 조회

  if (error) {
    return NextResponse.json(
      { error: '조회 실패. Supabase에 db_heartbeat 테이블 SQL을 먼저 실행해주세요.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ data: data ?? [] })
}
