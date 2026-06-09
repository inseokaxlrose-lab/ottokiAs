import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// 사용자가 시리얼번호(model_name) 수정 — 접수번호로 본인 확인
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { model_name, receipt_number } = await req.json()

  if (!receipt_number?.trim()) {
    return NextResponse.json({ error: '접수번호가 필요합니다.' }, { status: 400 })
  }

  const supabase = createServerClient()

  // 접수번호 일치 여부 확인 (본인 검증)
  const { data: existing, error: fetchError } = await supabase
    .from('as_requests')
    .select('id')
    .eq('id', id)
    .eq('receipt_number', receipt_number)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: '접수 정보를 확인할 수 없습니다.' }, { status: 403 })
  }

  const { error } = await supabase
    .from('as_requests')
    .update({ model_name: model_name?.trim() ?? '' })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: '수정에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
