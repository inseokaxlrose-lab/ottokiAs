// AS 접수 상태값 타입
export type AsStatus =
  | 'received'           // 접수
  | 'delivery_received'  // 택배수령
  | 'symptom_checked'    // 증상확인
  | 'quote_sent'         // 접수결과
  | 'payment_confirmed'  // 입금요청
  | 'repairing'          // 수리진행
  | 'cancelled'          // 수리취소
  | 'completed'          // 수리완료
  | 'shipped'            // 발송완료

// 상태값을 한글로 변환하는 맵
export const statusLabel: Record<AsStatus, string> = {
  received:          '접수',
  delivery_received: '택배수령',
  symptom_checked:   '증상확인중',
  quote_sent:        '접수결과',
  payment_confirmed: '입금요청',
  repairing:         '수리진행',
  cancelled:         '수리취소',
  completed:         '수리완료',
  shipped:           '발송완료',
}

// 신규구매 상태값
// 진행 순서: 접수완료 → 입금대기 → 상품 준비중 → 발송완료 (cancelled는 별도 취소 상태)
export type PurchaseStatus =
  | 'pending'          // 접수완료
  | 'waiting_payment'  // 입금대기
  | 'preparing'        // 상품 준비중
  | 'shipped'          // 발송완료
  | 'cancelled'        // 취소

export const purchaseStatusLabel: Record<PurchaseStatus, string> = {
  pending:         '접수완료',
  waiting_payment: '입금대기',
  preparing:       '상품 준비중',
  shipped:         '발송완료',
  cancelled:       '취소',
}

// 계좌 정보 (수리비 및 신규구매 입금용)
export const BANK_INFO = {
  bank: '우리은행',
  account: '1005-801-905739',
  holder: '박은정(에이아이시스템)',
}

// 거래처 타입
export interface Partner {
  id: string
  name: string
  phone: string
  address: string
  address_detail: string | null
  zipcode: string | null
  business_number: string | null
  business_type: string | null
  business_category: string | null
  representative: string | null
  email: string | null
  note: string | null
  business_doc_url: string | null
  created_at: string
  updated_at: string
}

// AS 접수 테이블 타입
export interface AsRequest {
  id: string
  receipt_number: string
  customer_name: string
  phone: string
  email: string
  product_name: string
  model_name: string
  purchase_date: string | null
  symptom: string
  photo_url: string | null
  zipcode: string | null
  address: string | null
  address_detail: string | null
  status: AsStatus
  partner_id: string | null
  partner?: Pick<Partner, 'id' | 'name' | 'phone'> | null
  courier_company: string | null
  tracking_number: string | null
  created_at: string
  updated_at: string
  as_results?: AsResult[]
  as_status_history?: AsStatusHistory[]
}

// AS 처리 결과 테이블 타입
export interface AsResult {
  id: string
  request_id: string
  repair_detail: string
  cost: number | null
  completed_at: string | null
  note: string | null
}

// AS 상태 이력
export interface AsStatusHistory {
  id: string
  request_id: string
  status: AsStatus
  changed_at: string
}

// 신규구매 요청 테이블 타입
export interface PurchaseRequest {
  id: string
  customer_name: string
  phone: string
  email: string
  product_name: string
  quantity: number
  inquiry: string | null
  business_doc_url: string | null
  zipcode: string | null
  address: string | null
  address_detail: string | null
  status: PurchaseStatus
  created_at: string
  purchase_status_history?: PurchaseStatusHistory[]
}

// 신규구매 상태 이력
export interface PurchaseStatusHistory {
  id: string
  request_id: string
  status: PurchaseStatus
  changed_at: string
}

// DB 헬스체크 실행 이력 타입
export interface Heartbeat {
  id: string
  note: string | null
  created_at: string
}

// 오류 로그 테이블 타입
export interface ErrorLog {
  id: string
  context: string | null       // 오류 발생 위치
  message: string              // 오류 메시지
  stack: string | null         // 스택 트레이스
  meta: Record<string, unknown> | null  // 추가 정보
  created_at: string
}
