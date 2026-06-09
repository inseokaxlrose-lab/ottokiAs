import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendPurchaseConfirmedEmail } from '@/lib/email'

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

  // 주문 확인 상태 시 고객 이메일 발송
  if (status === 'confirmed') {
    const { data: purchase } = await supabase
      .from('purchase_requests')
      .select('email, customer_name')
      .eq('id', id)
      .single()
    if (purchase?.email) {
      await Promise.allSettled([
        sendPurchaseConfirmedEmail({
          email: purchase.email,
          customerName: purchase.customer_name,
        }),
      ])
    }
  }

  return NextResponse.json({ success: true })
}
