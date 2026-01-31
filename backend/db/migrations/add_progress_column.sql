-- 분석 테이블에 progress 컬럼 추가
-- 진행 상태 추적을 위한 JSONB 컬럼

ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT NULL;

-- 인덱스 추가 (progress 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_analyses_progress 
ON analyses USING GIN (progress);

-- 컬럼 설명 추가
COMMENT ON COLUMN analyses.progress IS '분석 진행 상태 추적 (step, total, message, timestamp)';
