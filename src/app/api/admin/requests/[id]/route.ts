import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendAsPaymentConfirmedEmail, sendAsShippedEmail } from '@/lib/email'

// 접수 상태 변경 및 AS 결과 등록
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const supabase = createServerClient()

  const { status, result, model_name, partner_id, courier_company, tracking_number } = body

  // 시리얼번호(model_name) 수정
  if (model_name !== undefined) {
    const { error } = await supabase
      .from('as_requests')
      .update({ model_name: model_name ?? '' })
      .eq('id', id)
    if (error) return NextResponse.json({ error: '시리얼번호 수정 실패' }, { status: 500 })
  }

  // 거래처 / 택배정보 수정
  if (partner_id !== undefined || courier_company !== undefined || tracking_number !== undefined) {
    const updates: Record<string, unknown> = {}
    if (partner_id !== undefined) updates.partner_id = partner_id || null
    if (courier_company !== undefined) updates.courier_company = courier_company || null
    if (tracking_number !== undefined) updates.tracking_number = tracking_number || null

    const { error } = await supabase.from('as_requests').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: '정보 수정 실패' }, { status: 500 })
  }

  // 상태 변경 + 이력 기록 + 이메일 발송
  if (status) {
    const { error } = await supabase
      .from('as_requests')
      .update({ status })
      .eq('id', id)

    if (error) return NextResponse.json({ error: '상태 변경 실패' }, { status: 500 })

    // 상태 이력 기록 (테이블 없으면 무시)
    try {
      await supabase.from('as_status_history').insert({ request_id: id, status })
    } catch { /* 테이블 미생성 시 무시 */ }

    // 특정 상태 변경 시 고객 이메일 발송
    if (status === 'payment_confirmed' || status === 'shipped') {
      const { data: reqData } = await supabase
        .from('as_requests')
        .select('email, customer_name, receipt_number, courier_company, tracking_number')
        .eq('id', id)
        .single()
      if (reqData?.email) {
        if (status === 'payment_confirmed') {
          await Promise.allSettled([
            sendAsPaymentConfirmedEmail({
              email: reqData.email,
              customerName: reqData.customer_name,
              receiptNumber: reqData.receipt_number,
            }),
          ])
        } else if (status === 'shipped') {
          await Promise.allSettled([
            sendAsShippedEmail({
              email: reqData.email,
              customerName: reqData.customer_name,
              receiptNumber: reqData.receipt_number,
              courierCompany: reqData.courier_company ?? null,
              trackingNumber: reqData.tracking_number ?? null,
            }),
          ])
        }
      }
    }
  }

  // AS 결과 등록/수정 — 기존 행 모두 삭제 후 새로 삽입 (중복 행 방지)
  if (result) {
    const { repair_detail, cost, completed_at, note } = result
    const payload = {
      repair_detail: repair_detail || null,
      cost: cost != null && cost !== '' ? Number(cost) : null,
      completed_at: completed_at || null,
      note: note || null,
    }

    // 기존 결과 행 전부 삭제 (없어도 에러 없음)
    await supabase.from('as_results').delete().eq('request_id', id)

    const { error } = await supabase.from('as_results').insert({ request_id: id, ...payload })
    if (error) {
      console.error('AS 결과 저장 오류:', error)
      return NextResponse.json({ error: `AS 결과 저장 실패: ${error.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
