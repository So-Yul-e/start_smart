/**
 * 브랜드 데이터 사용 예제
 * 
 * PDF 데이터를 기반으로 각 프랜차이즈별 계산하는 방법
 */

const { getBrandForEngine, getAllBrands, validateBrandDefaults } = require('./brandLoader');
const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');

// ============================================
// 예제 1: 특정 브랜드로 계산하기
// ============================================

function example1_singleBrand() {
  console.log('=== 예제 1: 메가커피로 계산하기 ===\n');
  
  // 1. 브랜드 데이터 로드
  const brand = getBrandForEngine('brand_mega');
  
  if (!brand) {
    console.error('브랜드를 찾을 수 없습니다.');
    return;
  }
  
  console.log(`브랜드: ${brand.name}`);
  console.log(`평균 단가: ${brand.defaults.avgPrice}원`);
  
  // 2. 손익 계산
  const financeResult = calculateFinance({
    brand: brand,
    conditions: {
      initialInvestment: 200000000,
      monthlyRent: 4000000,
      area: 10,
      ownerWorking: true
    },
    market: {
      expectedDailySales: 256,
      radiusM: 500
    },
    targetDailySales: 300,
    scenarios: [200, 250, 300]
  });
  
  console.log(`\n월 순이익: ${(financeResult.monthlyProfit / 10000).toFixed(0)}만원`);
  console.log(`회수 기간: ${financeResult.paybackMonths}개월`);
}

// ============================================
// 예제 2: 모든 브랜드 비교하기
// ============================================

function example2_compareAllBrands() {
  console.log('\n=== 예제 2: 모든 브랜드 비교 ===\n');
  
  const brands = getAllBrands();
  const conditions = {
    initialInvestment: 200000000,
    monthlyRent: 4000000,
    area: 10,
    ownerWorking: true
  };
  
  const results = brands.map(brandInfo => {
    const brand = getBrandForEngine(brandInfo.id);
    if (!brand) return null;
    
    const finance = calculateFinance({
      brand: brand,
      conditions: conditions,
      market: { expectedDailySales: 256, radiusM: 500 },
      targetDailySales: 300
    });
    
    return {
      name: brand.name,
      avgPrice: brand.defaults.avgPrice,
      monthlyProfit: finance.monthlyProfit,
      paybackMonths: finance.paybackMonths
    };
  }).filter(r => r !== null);
  
  // 결과 정렬 (회수 기간 순)
  results.sort((a, b) => {
    if (a.paybackMonths === null) return 1;
    if (b.paybackMonths === null) return -1;
    return a.paybackMonths - b.paybackMonths;
  });
  
  console.log('브랜드별 회수 기간 비교:');
  results.forEach((r, idx) => {
    const payback = r.paybackMonths === null ? 'N/A' : `${r.paybackMonths.toFixed(1)}개월`;
    console.log(`${idx + 1}. ${r.name} (${r.avgPrice}원): ${payback}`);
  });
}

// ============================================
// 예제 3: 브랜드 데이터 검증
// ============================================

function example3_validateBrand() {
  console.log('\n=== 예제 3: 브랜드 데이터 검증 ===\n');
  
  const brand = getBrandForEngine('brand_mega');
  const validation = validateBrandDefaults(brand);
  
  if (validation.valid) {
    console.log('✅ 브랜드 데이터 검증 통과');
  } else {
    console.error('❌ 브랜드 데이터 검증 실패:');
    validation.errors.forEach(err => console.error(`  - ${err}`));
  }
}

// ============================================
// 예제 4: 브랜드별 최적 조건 찾기
// ============================================

function example4_findOptimalConditions() {
  console.log('\n=== 예제 4: 브랜드별 최적 조건 찾기 ===\n');
  
  const brand = getBrandForEngine('brand_mega');
  const targetPaybackMonths = 24;  // 목표: 24개월 이내 회수
  
  // 월세를 변경하며 테스트
  const rentOptions = [3000000, 3500000, 4000000, 4500000];
  
  console.log(`목표 회수 기간: ${targetPaybackMonths}개월 이내\n`);
  
  rentOptions.forEach(rent => {
    const finance = calculateFinance({
      brand: brand,
      conditions: {
        initialInvestment: 200000000,
        monthlyRent: rent,
        area: 10,
        ownerWorking: true
      },
      market: { expectedDailySales: 256, radiusM: 500 },
      targetDailySales: 300
    });
    
    const payback = finance.paybackMonths;
    const status = payback !== null && payback <= targetPaybackMonths ? '✅' : '❌';
    
    console.log(`${status} 월세 ${(rent / 10000).toFixed(0)}만원: 회수 ${payback !== null ? payback.toFixed(1) : 'N/A'}개월`);
  });
}

// ============================================
// 실행
// ============================================

if (require.main === module) {
  example1_singleBrand();
  example2_compareAllBrands();
  example3_validateBrand();
  example4_findOptimalConditions();
}

module.exports = {
  example1_singleBrand,
  example2_compareAllBrands,
  example3_validateBrand,
  example4_findOptimalConditions
};
