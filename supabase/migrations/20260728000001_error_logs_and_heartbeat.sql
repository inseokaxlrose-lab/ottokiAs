-- ============================================================
-- 1) 오류 로그 테이블(error_logs)
--    앱에서 오류가 발생하면 이 테이블에 기록합니다.
--    관리자 대시보드 "오류 로그" 탭에서 조회합니다.
-- 2) DB 헬스체크 테이블(db_heartbeat)
--    Supabase 무료 플랜은 일정 기간 접속이 없으면 일시정지되므로
--    5일마다 Cron이 이 테이블에 값을 넣었다 지워 DB를 깨웁니다.
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- ============================================================

-- 1) 오류 로그 테이블
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context text,                       -- 오류 발생 위치 (예: 'POST /api/submit')
  message text NOT NULL,              -- 오류 메시지
  stack text,                         -- 스택 트레이스 (있을 때만)
  meta jsonb,                         -- 추가 정보 (있을 때만)
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 최신순 조회 성능용 인덱스
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at
  ON error_logs(created_at DESC);

-- 2) DB 헬스체크(연결 유지)용 테이블
CREATE TABLE IF NOT EXISTS db_heartbeat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
