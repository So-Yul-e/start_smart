/**
 * 데이터베이스 초기화 스크립트
 * node backend/db/init.js
 */

const pool = require('./connection');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    console.log('🗄️  데이터베이스 초기화 시작...\n');
    
    // 스키마 파일 읽기
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // 스키마 실행
    await pool.query(schema);
    console.log('✅ 스키마 생성 완료\n');
    
    // 브랜드 데이터 삽입
    const brands = [
      { id: 'brand_1', name: '스타벅스', position: '프리미엄', initialInvestment: 500000000, monthlyRoyalty: 5, monthlyMarketing: 2, avgDailySales: 250 },
      { id: 'brand_2', name: '이디야커피', position: '스탠다드', initialInvestment: 200000000, monthlyRoyalty: 3, monthlyMarketing: 1, avgDailySales: 200 },
      { id: 'brand_3', name: '투썸플레이스', position: '프리미엄', initialInvestment: 450000000, monthlyRoyalty: 4, monthlyMarketing: 2, avgDailySales: 230 },
      { id: 'brand_4', name: '컴포즈커피', position: '스탠다드', initialInvestment: 150000000, monthlyRoyalty: 2, monthlyMarketing: 1, avgDailySales: 180 },
      { id: 'brand_5', name: '메가커피', position: '스탠다드', initialInvestment: 180000000, monthlyRoyalty: 2.5, monthlyMarketing: 1, avgDailySales: 190 },
      { id: 'brand_6', name: '할리스커피', position: '프리미엄', initialInvestment: 400000000, monthlyRoyalty: 4, monthlyMarketing: 2, avgDailySales: 220 },
      { id: 'brand_7', name: '카페베네', position: '스탠다드', initialInvestment: 220000000, monthlyRoyalty: 3, monthlyMarketing: 1.5, avgDailySales: 200 },
      { id: 'brand_8', name: '빽다방', position: '스탠다드', initialInvestment: 120000000, monthlyRoyalty: 2, monthlyMarketing: 1, avgDailySales: 170 },
      { id: 'brand_9', name: '탐앤탐스', position: '프리미엄', initialInvestment: 380000000, monthlyRoyalty: 4, monthlyMarketing: 2, avgDailySales: 210 },
      { id: 'brand_10', name: '카페드롭탑', position: '스탠다드', initialInvestment: 160000000, monthlyRoyalty: 2.5, monthlyMarketing: 1, avgDailySales: 185 },
      { id: 'brand_11', name: '엔젤리너스', position: '프리미엄', initialInvestment: 420000000, monthlyRoyalty: 4.5, monthlyMarketing: 2, avgDailySales: 240 },
      { id: 'brand_12', name: '더벤티', position: '스탠다드', initialInvestment: 140000000, monthlyRoyalty: 2, monthlyMarketing: 1, avgDailySales: 175 }
    ];
    
    // 기존 데이터 삭제 후 삽입
    await pool.query('DELETE FROM brands');
    
    for (const brand of brands) {
      await pool.query(
        `INSERT INTO brands (id, name, position, initial_investment, monthly_royalty, monthly_marketing, avg_daily_sales)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           position = EXCLUDED.position,
           initial_investment = EXCLUDED.initial_investment,
           monthly_royalty = EXCLUDED.monthly_royalty,
           monthly_marketing = EXCLUDED.monthly_marketing,
           avg_daily_sales = EXCLUDED.avg_daily_sales,
           updated_at = CURRENT_TIMESTAMP`,
        [
          brand.id,
          brand.name,
          brand.position,
          brand.initialInvestment,
          brand.monthlyRoyalty,
          brand.monthlyMarketing,
          brand.avgDailySales
        ]
      );
    }
    
    console.log(`✅ 브랜드 데이터 ${brands.length}개 삽입 완료\n`);
    console.log('🎉 데이터베이스 초기화 완료!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    process.exit(1);
  }
}

initDatabase();
