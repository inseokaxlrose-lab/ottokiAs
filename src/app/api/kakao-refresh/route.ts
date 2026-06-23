import { NextRequest, NextResponse } from 'next/server'
import { keepAliveKakaoToken } from '@/lib/kakao'
import { sendSlackAlert } from '@/lib/slack'

// Vercel Cron이 주기적으로 호출 → 카카오 토큰을 미리 갱신해 만료 방지
// (만료 1개월 전부터 카카오가 새 토큰을 내주고, 그 값을 DB에 저장함)
export async function GET(request: NextRequest) {
  // Vercel Cron만 호출하도록 보호 (CRON_SECRET 설정 시)
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const ok = await keepAliveKakaoToken()

  if (!ok) {
    // 갱신 실패 = 토큰이 이미 죽었을 수 있음 → 살아있는 Slack으로 경고
    await sendSlackAlert(
      '⚠️ 카카오 알림 토큰 자동 갱신 실패! 터미널에서 `node scripts/get-kakao-token.mjs`를 실행해 재발급이 필요합니다.'
    )
  }

  return NextResponse.json({ ok })
}
