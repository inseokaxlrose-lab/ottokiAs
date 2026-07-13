-- ============================================================
-- 신규구매(purchase_requests) 기능 보강
--   1) 상태값 정리 + '상품 준비중'(preparing) 추가
--   2) 소프트 삭제용 deleted_at 컬럼 추가
--   3) 상태 이력 테이블(purchase_status_history) 생성
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- ============================================================

-- 1) 상태값 CHECK 제약 갱신
--    기존 제약은 'pending, confirmed, cancelled'만 허용했으나
--    실제 앱은 waiting_payment / shipped 를 사용 중이라 불일치 상태였습니다.
--    여기에 preparing(상품 준비중)까지 포함해서 다시 만듭니다.

-- (a) 예전 값 'confirmed'가 DB에 남아 있으면 새 제약에 걸리므로 먼저 변환
UPDATE purchase_requests
  SET status = 'waiting_payment'
  WHERE status = 'confirmed';

-- (b) 기존 제약 제거 후 새 제약 추가
ALTER TABLE purchase_requests
  DROP CONSTRAINT IF EXISTS purchase_requests_status_check;

ALTER TABLE purchase_requests
  ADD CONSTRAINT purchase_requests_status_check
  CHECK (status IN ('pending', 'waiting_payment', 'preparing', 'shipped', 'cancelled'));

-- 2) 소프트 삭제용 컬럼: 값이 있으면 삭제된 건 (목록에 표시 안 함)
ALTER TABLE purchase_requests
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 3) 신규구매 상태 변경 이력 테이블
--    코드(types.ts, dashboard)가 changed_at 컬럼명을 사용하므로 그대로 맞춥니다.
CREATE TABLE IF NOT EXISTS purchase_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- 조회 성능용 인덱스
CREATE INDEX IF NOT EXISTS idx_purchase_status_history_request_id
  ON purchase_status_history(request_id);
