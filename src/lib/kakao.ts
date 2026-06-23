// 카카오톡 "나에게 보내기"로 알림 발송
// Slack을 놓칠 때를 대비해, 접수 알림을 본인 카카오톡으로도 보냄
import { createServerClient } from '@/lib/supabase'

// refresh token은 약 2개월마다 만료되지만, 만료 1개월 전부터 갱신하면
// 카카오가 새 토큰을 내줌. 그 새 토큰을 DB(app_secrets)에 저장해 자동 연장함.
const TOKEN_KEY = 'kakao_refresh_token'

// DB에서 refresh token을 읽음 (없으면 환경변수로 폴백)
async function readRefreshToken(): Promise<string | null> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('app_secrets')
      .select('value')
      .eq('key', TOKEN_KEY)
      .single()
    if (data?.value) return data.value
  } catch {
    // 테이블이 아직 없거나 조회 실패 → 환경변수 값 사용
  }
  return process.env.KAKAO_REFRESH_TOKEN || null
}

// 새로 발급받은 refresh token을 DB에 저장 (다음부터 이 값을 사용)
async function saveRefreshToken(token: string): Promise<void> {
  try {
    const supabase = createServerClient()
    await supabase
      .from('app_secrets')
      .upsert({ key: TOKEN_KEY, value: token, updated_at: new Date().toISOString() })
  } catch (err) {
    console.error('카카오 refresh token 저장 실패:', err)
  }
}

// refresh token으로 access token을 새로 발급받음
// (access token은 약 6시간만 유효하므로 보낼 때마다 새로 받음)
async function getAccessToken(): Promise<string | null> {
  const restApiKey = process.env.KAKAO_REST_API_KEY
  const clientSecret = process.env.KAKAO_CLIENT_SECRET
  const refreshToken = await readRefreshToken()
  if (!restApiKey || !refreshToken) return null

  const res = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: restApiKey,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
      refresh_token: refreshToken,
    }),
  })

  const data = await res.json()
  if (!data.access_token) {
    console.error('카카오 access token 발급 실패:', data)
    return null
  }
  // 카카오가 새 refresh token을 주면(만료 1개월 전부터) 저장해서 자동 연장
  if (data.refresh_token) await saveRefreshToken(data.refresh_token)
  return data.access_token
}

// Cron용: 토큰을 강제로 한 번 갱신 (만료 임박 시 새 토큰이 자동 저장됨)
// 성공하면 true, 실패(재발급 필요)하면 false
export async function keepAliveKakaoToken(): Promise<boolean> {
  const token = await getAccessToken()
  return token !== null
}

// "나에게 보내기" 기본 텍스트 템플릿으로 메시지 발송
async function sendKakaoMemo(text: string): Promise<void> {
  const accessToken = await getAccessToken()
  if (!accessToken) return

  // 텍스트 템플릿은 최대 200자 + link 객체가 필수
  // button_title로 버튼 이름 지정 → 누르면 link(관리자 페이지)로 이동
  const linkUrl = process.env.KAKAO_LINK_URL || 'https://ainc-service.vercel.app/admin'
  const templateObject = {
    object_type: 'text',
    text: text.slice(0, 200),
    link: { web_url: linkUrl, mobile_web_url: linkUrl },
    button_title: '관리자 페이지 바로가기',
  }

  const res = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ template_object: JSON.stringify(templateObject) }),
  })

  if (!res.ok) {
    console.error('카카오 메시지 발송 실패:', await res.text())
  }
}

// AS 접수 알림 (카카오톡)
export async function notifyAsSubmitKakao(params: {
  receiptNumber: string
  customerName: string
  phone: string
  productName: string
  symptom: string
}) {
  const text = [
    '🔧 새 AS 접수가 등록되었습니다',
    `접수번호: ${params.receiptNumber}`,
    `고객명: ${params.customerName} (${params.phone})`,
    `제품: ${params.productName}`,
    `증상: ${params.symptom.slice(0, 60)}${params.symptom.length > 60 ? '...' : ''}`,
  ].join('\n')

  await sendKakaoMemo(text)
}
