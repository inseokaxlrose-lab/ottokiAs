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
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'reviewing', 'repairing', 'completed', 'cancelled')),
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

-- Supabase Storage 버킷 생성 (SQL Editor에서는 아래 주석 처리된 코드를 참고)
-- Storage > Buckets에서 'as-photos'와 'business-docs' 버킷을 직접 생성하세요.
-- as-photos: AS 접수 사진 저장용 (Public)
-- business-docs: 사업자등록증 저장용 (Private)
