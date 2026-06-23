-- ============================================================
-- OTTOKI AS 서비스 센터 - Supabase DB 스키마
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- ============================================================

-- AS 접수 테이블
CREATE TABLE IF NOT EXISTS as_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text UNIQUE NOT NULL,      -- 예: AS-20240608-0001
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  product_name text NOT NULL,
  model_name text,
  purchase_date date,
  symptom text NOT NULL,
  photo_url text,
  zipcode text,
  address text,
  address_detail text,
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'delivery_received', 'symptom_checked', 'quote_sent', 'payment_confirmed', 'repairing', 'cancelled', 'completed', 'shipped')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- AS 처리 결과 테이블
CREATE TABLE IF NOT EXISTS as_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES as_requests(id) ON DELETE CASCADE,
  repair_detail text,
  cost integer,
  completed_at date,
  note text
);

-- 신규구매 요청 테이블
CREATE TABLE IF NOT EXISTS purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  product_name text NOT NULL DEFAULT 'KDC280',
  quantity integer NOT NULL DEFAULT 1,
  inquiry text,
  business_doc_url text,
  zipcode text,
  address text,
  address_detail text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 (as_requests에만 적용)
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON as_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security(RLS) 설정: 외부에서 읽기/쓰기 허용
ALTER TABLE as_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE as_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- 익명 사용자도 INSERT 가능 (접수 등록)
CREATE POLICY "anyone can insert as_requests"
  ON as_requests FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anyone can insert purchase_requests"
  ON purchase_requests FOR INSERT TO anon WITH CHECK (true);

-- 접수번호 또는 이름+전화번호로만 본인 건 조회 가능
CREATE POLICY "select own as_request by receipt_number"
  ON as_requests FOR SELECT TO anon
  USING (true);

CREATE POLICY "select as_results"
  ON as_results FOR SELECT TO anon
  USING (true);

-- ============================================================
-- 거래처 관리 테이블 (partners)
-- ============================================================
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  address_detail text,
  zipcode text,
  business_number text,
  business_type text,
  business_category text,
  representative text,
  email text,
  note text,
  business_doc_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- partners updated_at 트리거
CREATE TRIGGER set_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- partners RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- as_requests 컬럼 추가 (거래처, 택배정보)
-- 이미 컬럼이 있으면 오류 없이 건너뜁니다
-- ============================================================
ALTER TABLE as_requests
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES partners(id) ON DELETE SET NULL;

ALTER TABLE as_requests
  ADD COLUMN IF NOT EXISTS courier_company text;

ALTER TABLE as_requests
  ADD COLUMN IF NOT EXISTS tracking_number text;

-- 소프트 삭제용: 값이 있으면 삭제된 접수 (화면에 표시 안 함)
ALTER TABLE as_requests
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ============================================================
-- as_status_history 테이블 (상태 변경 이력)
-- ============================================================
CREATE TABLE IF NOT EXISTS as_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES as_requests(id) ON DELETE CASCADE,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Supabase Storage 버킷 생성 (SQL Editor에서는 아래 주석 처리된 코드를 참고)
-- Storage > Buckets에서 'as-photos', 'partner-docs' 버킷을 직접 생성하세요.
-- as-photos: AS 접수 사진 저장용 (Public)
-- partner-docs: 사업자등록증 저장용 (Public)

