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

  return NextResponse.json({ data })
}
