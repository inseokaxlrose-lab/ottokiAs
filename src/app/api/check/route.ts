import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Supabase가 one-to-one 관계를 단일 객체로 반환할 때 배열로 정규화
function normalizeResults(rows: Record<string, unknown>[]) {
  return rows.map((r) => ({
    ...r,
    as_results: r.as_results == null ? [] : Array.isArray(r.as_results) ? r.as_results : [r.as_results],
    as_status_history: r.as_status_history == null ? [] : Array.isArray(r.as_status_history) ? r.as_status_history : [r.as_status_history],
  }))
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const receiptNumber = searchParams.get('receipt_number')?.trim()
  const name = searchParams.get('name')?.trim()
  const phone = searchParams.get('phone')?.trim()

  if (!receiptNumber && !(name && phone)) {
    return NextResponse.json(
      { error: '접수번호 또는 이름+연락처를 입력해 주세요.' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  let query = supabase
    .from('as_requests')
    .select('*, as_results(*), as_status_history(*)')

  // 접수번호로 조회
  if (receiptNumber) {
    query = query.eq('receipt_number', receiptNumber)
  } else {
    // 이름 + 연락처로 조회
    query = query.eq('customer_name', name!).eq('phone', phone!)
  }

  let { data, error } = await query.order('created_at', { ascending: false })

  // history 테이블 없으면 재시도
  if (error) {
    let fallback = supabase.from('as_requests').select('*, as_results(*)')
    if (receiptNumber) fallback = fallback.eq('receipt_number', receiptNumber)
    else fallback = fallback.eq('customer_name', name!).eq('phone', phone!)
    const retry = await fallback.order('created_at', { ascending: false })
    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error('접수내역 조회 오류:', error)
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: '일치하는 접수 내역을 찾을 수 없습니다.' }, { status: 404 })
  }

  return NextResponse.json({ data: normalizeResults(data as Record<string, unknown>[]) })
}
