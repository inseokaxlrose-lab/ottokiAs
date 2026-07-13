import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// 신규구매 접수 목록 조회 (관리자용)
export async function GET() {
  const supabase = createServerClient()

  let { data, error } = await supabase
    .from('purchase_requests')
    .select('*, purchase_status_history(*)')
    .order('created_at', { ascending: false })

  // history 테이블이 없으면 없이 재시도
  if (error) {
    const retry = await supabase
      .from('purchase_requests')
      .select('*')
      .order('created_at', { ascending: false })
    data = retry.data
    error = retry.error
  }

  if (error) {
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }

  // 소프트 삭제된 건은 목록에서 제외 (deleted_at 에 값이 있으면 삭제된 것)
  const rows = ((data ?? []) as Record<string, unknown>[]).filter((r) => r.deleted_at == null)

  return NextResponse.json({ data: rows })
}
