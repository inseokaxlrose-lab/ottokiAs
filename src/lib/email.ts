import { Resend } from 'resend'

// Resend 인스턴스를 함수 호출 시점에 생성 (빌드 타임 환경변수 오류 방지)
function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = () => process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const ADMIN_EMAIL = () => process.env.ADMIN_EMAIL ?? ''

// AS 접수 완료 확인 이메일 (고객용)
export async function sendAsConfirmEmail(params: {
  email: string
  customerName: string
  receiptNumber: string
  productName: string
}) {
  const { email, customerName, receiptNumber, productName } = params

  await getResend().emails.send({
    from: FROM(),
    to: email,
    subject: `[AINC] AS 접수가 완료되었습니다 — ${receiptNumber}`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #f8fafc;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
          <h1 style="color: #2563eb; font-size: 22px; margin: 0 0 8px;">AINC 서비스 센터</h1>
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 24px;">AS 접수가 완료되었습니다</h2>

          <p style="color: #475569; margin: 0 0 24px; line-height: 1.7;">
            <strong>${customerName}</strong>님, 접수해 주셔서 감사합니다.<br>
            담당자가 검토 후 빠른 시일 내에 연락드리겠습니다.
          </p>

          <div style="background: #f1f5f9; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">접수번호</p>
            <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 700; letter-spacing: 1px;">${receiptNumber}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">제품명</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${productName}</td>
            </tr>
          </table>

          <p style="color: #94a3b8; font-size: 13px; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            접수 현황은 AINC 서비스 센터에서 접수번호로 확인하실 수 있습니다.
          </p>
        </div>
      </div>
    `,
  })
}

// 신규구매 접수 완료 이메일 (고객용)
export async function sendPurchaseConfirmEmail(params: {
  email: string
  customerName: string
}) {
  const { email, customerName } = params

  await getResend().emails.send({
    from: FROM(),
    to: email,
    subject: '[AINC] 구매 문의가 접수되었습니다',
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #f8fafc;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
          <h1 style="color: #7c3aed; font-size: 22px; margin: 0 0 8px;">AINC 서비스 센터</h1>
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 24px;">구매 문의가 접수되었습니다</h2>

          <p style="color: #475569; margin: 0 0 24px; line-height: 1.7;">
            <strong>${customerName}</strong>님, 문의해 주셔서 감사합니다.<br>
            담당자가 확인 후 입력하신 연락처로 안내드리겠습니다.
          </p>

          <p style="color: #94a3b8; font-size: 13px; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            본 메일은 자동 발송된 메일입니다.
          </p>
        </div>
      </div>
    `,
  })
}

// AS 입금 확인 이메일 (고객용) — payment_confirmed 상태 시 발송
export async function sendAsPaymentConfirmedEmail(params: {
  email: string
  customerName: string
  receiptNumber: string
}) {
  const { email, customerName, receiptNumber } = params

  await getResend().emails.send({
    from: FROM(),
    to: email,
    subject: `[AINC] 수리비 입금이 확인되었습니다 — ${receiptNumber}`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #f8fafc;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
          <h1 style="color: #2563eb; font-size: 22px; margin: 0 0 8px;">AINC 서비스 센터</h1>
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 24px;">수리비 입금이 확인되었습니다</h2>

          <p style="color: #475569; margin: 0 0 24px; line-height: 1.7;">
            <strong>${customerName}</strong>님, 수리비 입금을 확인하였습니다.<br>
            빠른 시일 내에 수리를 진행하겠습니다.
          </p>

          <div style="background: #f1f5f9; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">접수번호</p>
            <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 700; letter-spacing: 1px;">${receiptNumber}</p>
          </div>

          <p style="color: #94a3b8; font-size: 13px; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            수리 완료 후 별도 안내 메일을 발송해 드립니다.
          </p>
        </div>
      </div>
    `,
  })
}

// AS 발송 완료 이메일 (고객용) — shipped 상태 시 발송
export async function sendAsShippedEmail(params: {
  email: string
  customerName: string
  receiptNumber: string
  courierCompany: string | null
  trackingNumber: string | null
}) {
  const { email, customerName, receiptNumber, courierCompany, trackingNumber } = params

  const trackingHtml = (courierCompany || trackingNumber)
    ? `
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; color: #16a34a; font-size: 13px; font-weight: 600;">배송 정보</p>
        ${courierCompany ? `<p style="margin: 0 0 6px; color: #1e293b; font-size: 14px;">택배사: <strong>${courierCompany}</strong></p>` : ''}
        ${trackingNumber ? `<p style="margin: 0; color: #1e293b; font-size: 14px;">송장번호: <strong>${trackingNumber}</strong></p>` : ''}
      </div>
    `
    : '<p style="color: #475569; margin: 0 0 24px;">배송 정보는 담당자에게 문의해 주세요.</p>'

  await getResend().emails.send({
    from: FROM(),
    to: email,
    subject: `[AINC] 제품이 발송되었습니다 — ${receiptNumber}`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #f8fafc;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
          <h1 style="color: #2563eb; font-size: 22px; margin: 0 0 8px;">AINC 서비스 센터</h1>
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 24px;">수리 완료 후 제품이 발송되었습니다</h2>

          <p style="color: #475569; margin: 0 0 24px; line-height: 1.7;">
            <strong>${customerName}</strong>님, 수리가 완료되어 제품을 발송하였습니다.<br>
            아래 배송 정보로 배송 현황을 확인하실 수 있습니다.
          </p>

          <div style="background: #f1f5f9; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">접수번호</p>
            <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 700; letter-spacing: 1px;">${receiptNumber}</p>
          </div>

          ${trackingHtml}

          <p style="color: #94a3b8; font-size: 13px; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            이용해 주셔서 감사합니다. 문의사항이 있으시면 담당자에게 연락해 주세요.
          </p>
        </div>
      </div>
    `,
  })
}

// 신규구매 주문 확인 이메일 (고객용) — confirmed 상태 시 발송
export async function sendPurchaseConfirmedEmail(params: {
  email: string
  customerName: string
}) {
  const { email, customerName } = params

  await getResend().emails.send({
    from: FROM(),
    to: email,
    subject: '[AINC] 구매 주문이 확인되었습니다',
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #f8fafc;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
          <h1 style="color: #7c3aed; font-size: 22px; margin: 0 0 8px;">AINC 서비스 센터</h1>
          <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 24px;">구매 주문이 확인되었습니다</h2>

          <p style="color: #475569; margin: 0 0 24px; line-height: 1.7;">
            <strong>${customerName}</strong>님, 구매 주문을 확인하였습니다.<br>
            담당자가 배송 일정 등 상세 안내를 위해 별도로 연락드리겠습니다.
          </p>

          <p style="color: #94a3b8; font-size: 13px; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            이용해 주셔서 감사합니다.
          </p>
        </div>
      </div>
    `,
  })
}

// 신규구매 접수 알림 이메일 (관리자용)
export async function sendPurchaseAdminAlert(params: {
  customerName: string
  phone: string
  email: string
  productName: string
  quantity: number
  inquiry: string
  businessDocUrl: string | null
}) {
  const adminEmail = ADMIN_EMAIL()
  if (!adminEmail) return

  const { customerName, phone, email, productName, quantity, inquiry, businessDocUrl } = params

  await getResend().emails.send({
    from: FROM(),
    to: adminEmail,
    subject: '[AINC 관리] 신규 구매 문의가 접수되었습니다',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7c3aed;">신규 구매 문의 접수 알림</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #64748b; width: 100px;">이름</td><td>${customerName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">연락처</td><td>${phone}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">이메일</td><td>${email}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">구매 제품</td><td>${productName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">구매 수량</td><td>${quantity}개</td></tr>
          ${inquiry ? `<tr><td style="padding: 8px 0; color: #64748b;">문의내용</td><td style="white-space: pre-wrap;">${inquiry}</td></tr>` : ''}
          ${businessDocUrl ? `<tr><td style="padding: 8px 0; color: #64748b;">사업자등록증</td><td><a href="${businessDocUrl}">파일 확인</a></td></tr>` : ''}
        </table>
      </div>
    `,
  })
}
