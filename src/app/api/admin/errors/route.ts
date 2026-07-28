import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/adminAuth'

// 오류 로그 목록 조회 (관리자 전용)
export async function GET() {
  // 로그인한 관리자만 접근 허용
  if (!(await isAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)  // 최근 200건까지만 조회

  if (error) {
    // error_logs 테이블이 아직 없으면 안내
    return NextResponse.json(
      { error: '조회 실패. Supabase에 error_logs 테이블 SQL을 먼저 실행해주세요.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ data: data ?? [] })
}

// 오류 로그 전체 비우기 (관리자 전용)
export async function DELETE() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
  }

  const supabase = createServerClient()
  // 모든 행 삭제 (neq 조건은 "항상 참"이라 전체 삭제 효과)
  const { error } = await supabase
    .from('error_logs')
    .delete()
    .not('id', 'is', null)

  if (error) {
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
