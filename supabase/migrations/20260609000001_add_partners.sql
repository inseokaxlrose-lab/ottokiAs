-- ============================================================
-- 거래처 관리 추가 마이그레이션
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- ============================================================

-- 1. 거래처 테이블 생성
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

-- 2. partners updated_at 트리거
CREATE TRIGGER set_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. partners RLS 활성화
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- 4. as_requests에 거래처 / 택배정보 컬럼 추가
ALTER TABLE as_requests
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES partners(id) ON DELETE SET NULL;

ALTER TABLE as_requests
  ADD COLUMN IF NOT EXISTS courier_company text;

ALTER TABLE as_requests
  ADD COLUMN IF NOT EXISTS tracking_number text;

-- 5. 상태 이력 테이블 생성
CREATE TABLE IF NOT EXISTS as_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES as_requests(id) ON DELETE CASCADE,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Supabase Storage 버킷 생성 (Storage 탭에서 직접 만들어도 됩니다)
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-docs', 'partner-docs', true)
ON CONFLICT DO NOTHING;
