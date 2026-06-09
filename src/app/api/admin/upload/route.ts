import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// 관리자용 파일 업로드 (사업자등록증 등)
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const bucket = (formData.get('bucket') as string) || 'partner-docs'

  if (!file || file.size === 0) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  const arrayBuffer = await file.arrayBuffer()

  const supabase = createServerClient()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, arrayBuffer, { contentType: file.type })

  if (error) return NextResponse.json({ error: `업로드 실패: ${error.message}` }, { status: 500 })

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return NextResponse.json({ url: urlData.publicUrl })
}
