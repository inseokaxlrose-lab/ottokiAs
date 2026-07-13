// 텔레그램 봇으로 알림 발송
// 카카오 "나에게 보내기"는 푸시 알림이 약해서, 푸시가 확실한 텔레그램으로 발송

const ADMIN_URL = process.env.TELEGRAM_LINK_URL || 'https://ainc-service.vercel.app/admin'

async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      // 메시지 아래에 "관리자 페이지 바로가기" 버튼 표시
      reply_markup: {
        inline_keyboard: [[{ text: '관리자 페이지 바로가기', url: ADMIN_URL }]],
      },
    }),
  })
}

// AS 접수 알림 (텔레그램)
export async function notifyAsSubmitTelegram(params: {
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
    `증상: ${params.symptom.slice(0, 100)}${params.symptom.length > 100 ? '...' : ''}`,
  ].join('\n')

  await sendTelegramMessage(text)
}

// 신규구매 접수 알림 (텔레그램)
export async function notifyPurchaseSubmitTelegram(params: {
  customerName: string
  phone: string
  email: string
  productName: string
  quantity: number
  inquiry: string
}) {
  const lines = [
    '🛒 새 신규구매가 등록되었습니다',
    `고객명: ${params.customerName} (${params.phone})`,
    `이메일: ${params.email}`,
    `제품: ${params.productName} / ${params.quantity}개`,
  ]

  // 문의내용은 있을 때만, 너무 길면 100자까지만 표시
  if (params.inquiry) {
    lines.push(`문의: ${params.inquiry.slice(0, 100)}${params.inquiry.length > 100 ? '...' : ''}`)
  }

  await sendTelegramMessage(lines.join('\n'))
}
