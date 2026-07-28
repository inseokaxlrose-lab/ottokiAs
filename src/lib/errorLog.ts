import { createServerClient } from '@/lib/supabase'

// 오류를 DB(error_logs 테이블)에 기록하는 유틸 함수
//
// 사용법:  await logError('POST /api/submit', err)
//
// 중요: 로깅 자체가 실패하더라도 앱이 멈추면 안 되므로
//       이 함수는 어떤 경우에도 예외(throw)를 밖으로 내보내지 않습니다.
export async function logError(
  context: string,                 // 어디서 난 오류인지 (예: 'POST /api/submit')
  error: unknown,                  // catch로 잡은 오류 객체
  meta?: Record<string, unknown>,  // 추가로 남기고 싶은 정보 (선택)
) {
  // 오류 객체에서 메시지와 스택을 안전하게 추출
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : (error as { message?: string })?.message ?? String(error)
  const stack = error instanceof Error ? error.stack ?? null : null

  // 1) Vercel 실행 로그에서도 바로 볼 수 있도록 콘솔에 출력
  console.error(`[${context}]`, message)

  // 2) DB(error_logs)에 저장 — 실패해도 무시 (무한 루프 방지)
  try {
    const supabase = createServerClient()
    await supabase.from('error_logs').insert({
      context,
      message,
      stack,
      meta: meta ?? null,
    })
  } catch (e) {
    // 로그 저장까지 실패한 경우엔 콘솔에만 남기고 조용히 넘어감
    console.error('error_logs 기록 실패:', e)
  }
}
