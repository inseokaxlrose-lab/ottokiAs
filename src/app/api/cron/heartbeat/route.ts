import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { logError } from '@/lib/errorLog'

// ============================================================
// DB 헬스체크 Cron (매일 실행)
//
// 목적: Supabase 무료 플랜은 일정 기간 접속이 없으면 일시정지됩니다.
//       매일 이 API가 db_heartbeat 테이블에 실행 기록을 남겨서
//       "접속(쓰기 활동)"을 만들어 DB가 잠들지 않게 합니다.
//
// 실행 이력: 넣은 기록을 지우지 않고 남겨두어, 언제 정상 실행됐는지
//            확인할 수 있게 합니다. (30일 지난 기록은 자동 정리)
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
    // 2) 실행 기록 저장 (DB 쓰기 활동 발생 + 실행 이력으로 보존)
    const { data: inserted, error: insertError } = await supabase
      .from('db_heartbeat')
      .insert({ note: 'cron heartbeat ok' })
      .select('id, created_at')
      .single()

    if (insertError) throw insertError

    // 3) 30일이 지난 오래된 기록 정리 (헬스체크 이력 + 오류 로그)
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('db_heartbeat').delete().lt('created_at', cutoff)
    await supabase.from('error_logs').delete().lt('created_at', cutoff)

    return NextResponse.json({ ok: true, at: inserted?.created_at ?? new Date().toISOString() })
  } catch (err) {
    // 헬스체크 실패도 오류 로그로 남김
    await logError('GET /api/cron/heartbeat', err)
    return NextResponse.json({ error: '헬스체크 실패' }, { status: 500 })
  }
}
