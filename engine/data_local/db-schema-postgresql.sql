-- 브랜드 데이터베이스 스키마 (PostgreSQL)

CREATE DATABASE startsmart;

\c startsmart;

CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(50) NOT NULL,
  
  -- 기본값 (defaults)
  avg_price DECIMAL(10, 2) NOT NULL,
  cogs_rate DECIMAL(5, 4) NOT NULL,
  labor_rate DECIMAL(5, 4) NOT NULL,
  utilities_rate DECIMAL(5, 4) DEFAULT 0.03,
  etc_fixed INTEGER NOT NULL,
  royalty_rate DECIMAL(5, 4) NOT NULL,
  marketing_rate DECIMAL(5, 4) NOT NULL,
  owner_working_multiplier DECIMAL(5, 4) DEFAULT 0.6,
  expected_daily_sales INTEGER DEFAULT NULL,
  
  -- 초기 투자금 범위
  initial_investment_min BIGINT NOT NULL,
  initial_investment_max BIGINT DEFAULT NULL,
  
  -- 메타데이터
  pdf_file VARCHAR(255) DEFAULT NULL,
  source VARCHAR(50) DEFAULT 'database',
  last_updated VARCHAR(10) DEFAULT NULL,
  
  -- 상태
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 샘플 데이터 삽입 (메가커피 예시)
INSERT INTO brands (
  id, name, position,
  avg_price, cogs_rate, labor_rate, utilities_rate, etc_fixed,
  royalty_rate, marketing_rate, owner_working_multiplier, expected_daily_sales,
  initial_investment_min, initial_investment_max,
  pdf_file, source, last_updated, active
) VALUES (
  'brand_mega', '메가커피', '저가형',
  3500, 0.35, 0.20, 0.03, 1100000,
  0.05, 0.02, 0.6, NULL,
  76000000, 76000000,
  '메가커피.pdf', '정보공개서', '2024', TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  avg_price = EXCLUDED.avg_price,
  cogs_rate = EXCLUDED.cogs_rate,
  labor_rate = EXCLUDED.labor_rate;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(active);
CREATE INDEX IF NOT EXISTS idx_brands_position ON brands(position);
