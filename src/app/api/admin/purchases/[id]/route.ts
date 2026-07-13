import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// 신규구매 상태 변경
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { status } = await req.json()
  const supabase = createServerClient()

  const { error } = await supabase
    .from('purchase_requests')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: '상태 변경 실패' }, { status: 500 })

  // 상태 이력 기록 (테이블 없으면 무시)
  try {
    await supabase.from('purchase_status_history').insert({ request_id: id, status })
  } catch { /* 테이블 미생성 시 무시 */ }

  return NextResponse.json({ success: true })
}

// 신규구매 삭제 (소프트 삭제: 실제로 지우지 않고 deleted_at에 시각만 기록)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  const { error } = await supabase
    .from('purchase_requests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json(
      { error: '삭제 실패. Supabase에 deleted_at 컬럼 SQL을 먼저 실행해주세요.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
