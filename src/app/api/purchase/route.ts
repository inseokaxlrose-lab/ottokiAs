import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendPurchaseConfirmEmail, sendPurchaseAdminAlert } from '@/lib/email'
import { notifyPurchaseSubmit } from '@/lib/slack'
import { notifyPurchaseSubmitTelegram } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const customerName = formData.get('customer_name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const productName = formData.get('product_name') as string
    const quantity = Number(formData.get('quantity') ?? 1)
    const inquiry = (formData.get('inquiry') as string) || ''
    const docFile = formData.get('business_doc') as File | null
    const zipcode = formData.get('zipcode') as string
    const address = formData.get('address') as string
    const addressDetail = formData.get('address_detail') as string

    if (!customerName || !phone || !email || !productName) {
      return NextResponse.json({ error: '필수 항목을 모두 입력해 주세요.' }, { status: 400 })
    }

    const supabase = createServerClient()
    let businessDocUrl: string | null = null

    // 사업자등록증 파일 업로드
    if (docFile && docFile.size > 0) {
      const fileExt = docFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const arrayBuffer = await docFile.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from('business-docs')
        .upload(fileName, arrayBuffer, { contentType: docFile.type })

      if (!uploadError) {
        // 비공개 버킷이므로 서명된 URL 생성 (1년 유효)
        const { data: signedData } = await supabase.storage
          .from('business-docs')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365)
        businessDocUrl = signedData?.signedUrl ?? null
      }
    }

    const basePayload = {
      customer_name: customerName,
      phone,
      email,
      product_name: productName,
      quantity,
      inquiry,
      business_doc_url: businessDocUrl,
      status: 'pending',
    }

    let { data: purchaseData, error } = await supabase
      .from('purchase_requests')
      .insert({ ...basePayload, zipcode: zipcode || null, address: address || null, address_detail: addressDetail || null })
      .select()
      .single()

    if (error?.message?.includes('column') && error.message.includes('address')) {
      const retry = await supabase.from('purchase_requests').insert(basePayload).select().single()
      purchaseData = retry.data
      error = retry.error
    }

    if (error) throw error

    // 초기 상태 이력 기록 (테이블 없으면 무시)
    if (purchaseData) {
      try {
        await supabase.from('purchase_status_history').insert({ request_id: purchaseData.id, status: 'pending' })
      } catch { /* 테이블 미생성 시 무시 */ }
    }

    // 고객 확인 이메일 + 관리자 알림(이메일/Slack/텔레그램) 발송
    // allSettled: 하나가 실패해도 나머지는 계속 발송하고, 접수 자체는 성공 처리
    await Promise.allSettled([
      sendPurchaseConfirmEmail({ email, customerName }),
      sendPurchaseAdminAlert({ customerName, phone, email, productName, quantity, inquiry, businessDocUrl }),
      notifyPurchaseSubmit({ customerName, phone, productName, quantity }),
      notifyPurchaseSubmitTelegram({ customerName, phone, email, productName, quantity, inquiry }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('구매 요청 오류:', err)
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
