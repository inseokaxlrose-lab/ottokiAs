// Slack Incoming Webhook으로 알림 발송
async function sendSlackMessage(text: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl || webhookUrl === 'https://hooks.slack.com/services/PLACEHOLDER') return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}

// 일반 경고/알림 (예: 카카오 토큰 갱신 실패)
export async function sendSlackAlert(text: string) {
  await sendSlackMessage(text)
}

// AS 접수 알림
export async function notifyAsSubmit(params: {
  receiptNumber: string
  customerName: string
  phone: string
  productName: string
  symptom: string
}) {
  const text = [
    '🔧 *새 AS 접수가 등록되었습니다*',
    `• 접수번호: ${params.receiptNumber}`,
    `• 고객명: ${params.customerName} (${params.phone})`,
    `• 제품: ${params.productName}`,
    `• 증상: ${params.symptom.slice(0, 80)}${params.symptom.length > 80 ? '...' : ''}`,
  ].join('\n')

  await sendSlackMessage(text)
}

// 신규구매 접수 알림
export async function notifyPurchaseSubmit(params: {
  customerName: string
  phone: string
  productName: string
  quantity: number
}) {
  const text = [
    '🛒 *새 구매 문의가 접수되었습니다*',
    `• 고객명: ${params.customerName} (${params.phone})`,
    `• 제품: ${params.productName} × ${params.quantity}개`,
  ].join('\n')

  await sendSlackMessage(text)
}
