-- 브랜드 데이터베이스 스키마 (MySQL 예시)
-- PostgreSQL 사용 시는 약간의 문법 차이가 있을 수 있음

CREATE DATABASE IF NOT EXISTS startsmart;
USE startsmart;

CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(50) NOT NULL,
  
  -- 기본값 (defaults)
  avg_price DECIMAL(10, 2) NOT NULL COMMENT '평균 단가 (원)',
  cogs_rate DECIMAL(5, 4) NOT NULL COMMENT '원가율 (0-1)',
  labor_rate DECIMAL(5, 4) NOT NULL COMMENT '인건비율 (0-1)',
  utilities_rate DECIMAL(5, 4) DEFAULT 0.03 COMMENT '공과금 비율 (0-1)',
  etc_fixed INT NOT NULL COMMENT '기타 고정비 (원)',
  royalty_rate DECIMAL(5, 4) NOT NULL COMMENT '로열티율 (0-1)',
  marketing_rate DECIMAL(5, 4) NOT NULL COMMENT '마케팅비율 (0-1)',
  owner_working_multiplier DECIMAL(5, 4) DEFAULT 0.6 COMMENT '점주 근무 시 인건비 감산 계수',
  expected_daily_sales INT DEFAULT NULL COMMENT '기본 기대 판매량 (잔)',
  
  -- 초기 투자금 범위
  initial_investment_min BIGINT NOT NULL COMMENT '초기 투자금 최소값 (원)',
  initial_investment_max BIGINT DEFAULT NULL COMMENT '초기 투자금 최대값 (원)',
  
  -- 메타데이터
  pdf_file VARCHAR(255) DEFAULT NULL COMMENT 'PDF 파일명',
  source VARCHAR(50) DEFAULT 'database' COMMENT '데이터 출처',
  last_updated VARCHAR(10) DEFAULT NULL COMMENT '업데이트 날짜 (YYYY)',
  
  -- 상태
  active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  position = VALUES(position),
  avg_price = VALUES(avg_price),
  cogs_rate = VALUES(cogs_rate),
  labor_rate = VALUES(labor_rate);

-- 인덱스 추가
CREATE INDEX idx_brands_active ON brands(active);
CREATE INDEX idx_brands_position ON brands(position);
