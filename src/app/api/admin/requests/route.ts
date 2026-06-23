import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Supabase가 one-to-one 관계를 단일 객체로 반환할 때 배열로 정규화
// partners 조인 컬럼명을 partner로 변환 (Supabase는 테이블명 그대로 반환)
function normalizeResults(rows: Record<string, unknown>[]) {
  return rows.map((r) => {
    const { partners, ...rest } = r
    return {
      ...rest,
      partner: partners ?? null,
      as_results: r.as_results == null ? [] : Array.isArray(r.as_results) ? r.as_results : [r.as_results],
      as_status_history: r.as_status_history == null ? [] : Array.isArray(r.as_status_history) ? r.as_status_history : [r.as_status_history],
    }
  })
}

// 전체 AS 접수 목록 조회 (관리자용)
export async function GET() {
  const supabase = createServerClient()

  let { data, error } = await supabase
    .from('as_requests')
    .select('*, as_results(*), as_status_history(*), partners!partner_id(id,name,phone)')
    .order('created_at', { ascending: false })

  // history 테이블이 없으면 없이 재시도
  if (error) {
    const retry = await supabase
      .from('as_requests')
      .select('*, as_results(*), partners!partner_id(id,name,phone)')
      .order('created_at', { ascending: false })
    data = retry.data
    error = retry.error
  }

  if (error) {
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }

  // 삭제된 접수(deleted_at 값 있음)는 목록에서 제외
  // (컬럼이 아직 없으면 deleted_at은 undefined이므로 모두 표시됨)
  const rows = ((data ?? []) as Record<string, unknown>[]).filter((r) => r.deleted_at == null)

  return NextResponse.json({ data: normalizeResults(rows) })
}
