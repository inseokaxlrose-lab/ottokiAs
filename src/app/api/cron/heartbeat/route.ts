import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { logError } from '@/lib/errorLog'

// ============================================================
// DB 헬스체크 Cron (5일마다 실행)
//
// 목적: Supabase 무료 플랜은 일정 기간 접속이 없으면 일시정지됩니다.
//       5일마다 이 API가 DB에 값을 넣었다 지워서 "접속"을 만들어
//       DB가 잠들지 않게 합니다.
//
// 보안: Vercel Cron은 요청에 Authorization: Bearer <CRON_SECRET> 헤더를
//       자동으로 붙여 보냅니다. 이 값이 맞아야만 실행됩니다.
// ============================================================
export async function GET(req: NextRequest) {
  // 1) 비밀키 검증 — CRON_SECRET이 설정된 경우에만 검사
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
    }
  }

  const supabase = createServerClient()

  try {
    // 2) 테스트 데이터 저장 (DB 쓰기 활동 발생)
    const { data: inserted, error: insertError } = await supabase
      .from('db_heartbeat')
      .insert({ note: 'cron heartbeat' })
      .select('id')
      .single()

    if (insertError) throw insertError

    // 3) 방금 넣은 테스트 데이터 삭제 (흔적을 남기지 않음)
    if (inserted?.id) {
      await supabase.from('db_heartbeat').delete().eq('id', inserted.id)
    }

    // 4) 30일이 지난 오래된 오류 로그 정리 (선택된 보관 정책)
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('error_logs').delete().lt('created_at', cutoff)

    return NextResponse.json({ ok: true, at: new Date().toISOString() })
  } catch (err) {
    // 헬스체크 실패도 오류 로그로 남김
    await logError('GET /api/cron/heartbeat', err)
    return NextResponse.json({ error: '헬스체크 실패' }, { status: 500 })
  }
}
