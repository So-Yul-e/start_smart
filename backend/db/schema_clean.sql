-- StartSmart 데이터베이스 스키마 (현재 DB 상태 기준)
-- 생성일: 2025-01-27

-- 브랜드 테이블
CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(20) NOT NULL,
  initial_investment BIGINT NOT NULL,
  monthly_royalty DECIMAL(5, 2) NOT NULL,
  monthly_marketing DECIMAL(5, 2) NOT NULL,
  avg_daily_sales INTEGER NOT NULL,
  pdf_source TEXT, -- PDF 원본 텍스트 (참고용)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- 매장 평균 데이터 (예측에 사용)
  avg_monthly_revenue BIGINT, -- 평균 월 매출액 (원)
  avg_revenue_per_area DECIMAL(10, 2), -- 면적(3.3㎡)당 평균 매출액 (원)
  avg_store_count INTEGER -- 평균 가맹점 수
);

-- 분석 결과 테이블
CREATE TABLE IF NOT EXISTS analyses (
  id VARCHAR(100) PRIMARY KEY,
  brand_id VARCHAR(50) NOT NULL REFERENCES brands(id),
  location_lat DECIMAL(10, 7) NOT NULL,
  location_lng DECIMAL(10, 7) NOT NULL,
  location_address TEXT,
  radius INTEGER NOT NULL,
  initial_investment BIGINT NOT NULL,
  monthly_rent BIGINT NOT NULL,
  area INTEGER NOT NULL,
  owner_working BOOLEAN NOT NULL,
  target_daily_sales INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  result JSONB, -- 전체 분석 결과 JSON
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_analyses_brand_id ON analyses(brand_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
