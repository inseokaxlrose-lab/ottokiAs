import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// 신규구매 접수 조회 (사용자용) - 이름+연락처로 조회
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const name = searchParams.get('name')?.trim()
  const phone = searchParams.get('phone')?.trim()

  if (!name || !phone) {
    return NextResponse.json({ error: '이름과 연락처를 입력해 주세요.' }, { status: 400 })
  }

  const supabase = createServerClient()

  let { data, error } = await supabase
    .from('purchase_requests')
    .select('*, purchase_status_history(*)')
    .eq('customer_name', name)
    .eq('phone', phone)
    .order('created_at', { ascending: false })

  // history 테이블 없으면 폴백
  if (error) {
    const retry = await supabase
      .from('purchase_requests')
      .select('*')
      .eq('customer_name', name)
      .eq('phone', phone)
      .order('created_at', { ascending: false })
    data = retry.data
    error = retry.error
  }

  if (error) {
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: '일치하는 접수 내역을 찾을 수 없습니다.' }, { status: 404 })
  }

  // 발송완료 후 7일 지난 건은 조회에서 제외
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const filtered = data.filter((item: Record<string, unknown>) => {
    if (item.status !== 'shipped') return true

    // 이력이 있으면 발송완료 처리 날짜 기준
    const history = item.purchase_status_history as Array<{ status: string; changed_at: string }> | undefined
    if (history && history.length > 0) {
      const shippedEntry = history.filter((h) => h.status === 'shipped').at(-1)
      if (shippedEntry) return new Date(shippedEntry.changed_at) > sevenDaysAgo
    }

    // 이력 테이블 없는 경우: 접수일 기준 폴백
    return new Date(item.created_at as string) > sevenDaysAgo
  })

  if (filtered.length === 0) {
    return NextResponse.json({ error: '일치하는 접수 내역을 찾을 수 없습니다.' }, { status: 404 })
  }

  return NextResponse.json({ data: filtered })
}
