import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// 전체 거래처 목록 조회
export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .order('name')

  if (error) return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

// 거래처 신규 등록
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    name, phone, address, address_detail, zipcode,
    business_number, business_type, business_category,
    representative, email, note, business_doc_url,
  } = body

  if (!name || !phone || !address) {
    return NextResponse.json({ error: '거래처명, 연락처, 주소는 필수입니다.' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('partners')
    .insert({
      name, phone, address,
      address_detail: address_detail || null,
      zipcode: zipcode || null,
      business_number: business_number || null,
      business_type: business_type || null,
      business_category: business_category || null,
      representative: representative || null,
      email: email || null,
      note: note || null,
      business_doc_url: business_doc_url || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: `거래처 등록 실패: ${error.message}` }, { status: 500 })
  return NextResponse.json({ data })
}
