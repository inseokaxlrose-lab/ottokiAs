import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
// import { sendAsConfirmEmail } from '@/lib/email'
import { notifyAsSubmit } from '@/lib/slack'

// 접수번호 생성: AS-YYYYMMDD-NNNN 형식
async function generateReceiptNumber(supabase: ReturnType<typeof createServerClient>): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

  // 오늘 날짜의 접수 건수 조회
  const { count } = await supabase
    .from('as_requests')
    .select('*', { count: 'exact', head: true })
    .like('receipt_number', `AS-${dateStr}-%`)

  const seq = String((count ?? 0) + 1).padStart(4, '0')
  return `AS-${dateStr}-${seq}`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    // 폼 데이터 추출
    const customerName = formData.get('customer_name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const productName = formData.get('product_name') as string
    const modelName = formData.get('model_name') as string
    const purchaseDate = formData.get('purchase_date') as string
    const symptom = formData.get('symptom') as string
    const photoFile = formData.get('photo') as File | null
    const zipcode = formData.get('zipcode') as string
    const address = formData.get('address') as string
    const addressDetail = formData.get('address_detail') as string

    // 필수값 검증
    if (!customerName || !phone || !email || !productName || !symptom) {
      return NextResponse.json({ error: '필수 항목을 모두 입력해 주세요.' }, { status: 400 })
    }

    const supabase = createServerClient()
    let photoUrl: string | null = null

    // 사진 파일이 있으면 Supabase Storage에 업로드
    if (photoFile && photoFile.size > 0) {
      const fileExt = photoFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const arrayBuffer = await photoFile.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from('as-photos')
        .upload(fileName, arrayBuffer, { contentType: photoFile.type })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('as-photos').getPublicUrl(fileName)
        photoUrl = urlData.publicUrl
      }
    }

    // 접수번호 생성
    const receiptNumber = await generateReceiptNumber(supabase)

    // DB에 저장 (주소 컬럼이 없는 경우 폴백)
    const basePayload = {
      receipt_number: receiptNumber,
      customer_name: customerName,
      phone,
      email,
      product_name: productName,
      model_name: modelName || null,
      purchase_date: purchaseDate || null,
      symptom,
      photo_url: photoUrl,
      status: 'received',
    }

    let { data, error } = await supabase
      .from('as_requests')
      .insert({ ...basePayload, zipcode: zipcode || null, address: address || null, address_detail: addressDetail || null })
      .select()
      .single()

    // 주소 컬럼이 아직 없으면 주소 없이 재시도
    if (error?.message?.includes('column') && error.message.includes('address')) {
      const retry = await supabase.from('as_requests').insert(basePayload).select().single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error

    // 초기 상태 이력 기록
    await supabase.from('as_status_history').insert({ request_id: data.id, status: 'received' })

    // 접수 완료 이메일 + Slack 알림 발송 (실패해도 접수 자체는 성공으로 처리)
    await Promise.allSettled([
      // sendAsConfirmEmail({ email, customerName, receiptNumber, productName }),
      notifyAsSubmit({ receiptNumber, customerName, phone, productName, symptom }),
    ])

    return NextResponse.json({ success: true, receipt_number: receiptNumber, id: data.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err)
    console.error('AS 접수 오류:', msg)
    // Supabase 연결 오류 → 환경변수 미설정 안내
    if (msg.includes('fetch failed') || msg.includes('ENOTFOUND')) {
      return NextResponse.json({ error: 'DB 연결에 실패했습니다. Supabase 환경변수를 확인해 주세요.' }, { status: 500 })
    }
    return NextResponse.json({ error: '접수 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
