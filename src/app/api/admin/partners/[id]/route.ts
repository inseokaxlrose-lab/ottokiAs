import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// 거래처 정보 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const supabase = createServerClient()

  // 허용 필드만 추출 (보안)
  const allowed = [
    'name', 'phone', 'address', 'address_detail', 'zipcode',
    'business_number', 'business_type', 'business_category',
    'representative', 'email', 'note', 'business_doc_url',
  ]
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] || null
  }

  const { error } = await supabase.from('partners').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: `수정 실패: ${error.message}` }, { status: 500 })
  return NextResponse.json({ success: true })
}

// 거래처 삭제
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  const { error } = await supabase.from('partners').delete().eq('id', id)
  if (error) return NextResponse.json({ error: `삭제 실패: ${error.message}` }, { status: 500 })
  return NextResponse.json({ success: true })
}
