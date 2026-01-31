/**
 * 브랜드 점포 감소율 테스트
 * 
 * 1. 브랜드 감소율 없음 (기존 결과 유지)
 * 2. 브랜드 감소율 10% (중간 리스크)
 * 3. 브랜드 감소율 20% (높은 리스크, yellow 강제)
 * 4. 브랜드 감소율 30% (최고 리스크, red 강제)
 */

const { getBrandForEngine } = require('../data_local/brandLoader');
const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');

// 테스트 조건
const baseConditions = {
  initialInvestment: 200000000,  // 2억원
  monthlyRent: 4000000,          // 400만원
  area: 10,
  ownerWorking: true
};

const market = {
  expectedDailySales: 250,  // 상권 기대값 (이것은 변경되지 않음)
  radiusM: 500,
  marketScore: 65
};

const roadview = {
  overallRisk: "medium",
  riskScore: 60
};

const targetDailySales = 300;

async function testNoDecline() {
  console.log('\n=== 테스트 1: 브랜드 감소율 없음 (기존 결과 유지) ===');
  
  const brand = await getBrandForEngine('brand_mega');
  const finance = calculateFinance({
    brand,
    conditions: baseConditions,
    market,
    targetDailySales
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions: baseConditions,
    brand,
    targetDailySales
  });
  
  console.log(`기대 판매량: ${finance.expected.expectedDailySales}잔`);
  console.log(`브랜드 감소율: ${finance.expected.brandDeclineRate || 'N/A'}`);
  console.log(`GAP: ${(finance.expected.gapPctVsTarget * 100).toFixed(1)}%`);
  console.log(`신호등: ${decision.signal}`);
  console.log(`점수: ${decision.score}`);
}

async function testDecline10() {
  console.log('\n=== 테스트 2: 브랜드 감소율 10% (중간 리스크) ===');
  
  const brand = await getBrandForEngine('brand_mega');
  // 브랜드 데이터 추가
  const brandWithDecline = {
    ...brand,
    brandDeclineRate: 0.10,
    avgMonthlySales: 30000000,  // 월 3천만원
    avgSalesPerPyeong: 3000000   // 평당 300만원
  };
  
  const finance = calculateFinance({
    brand: brandWithDecline,
    conditions: baseConditions,
    market,
    targetDailySales
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions: baseConditions,
    brand: brandWithDecline,
    targetDailySales
  });
  
  console.log(`원시 기대 판매량: ${finance.expected.rawExpectedDailySales || 'N/A'}잔`);
  console.log(`보정 계수: ${finance.expected.revenueAdjustmentFactor || 'N/A'}`);
  console.log(`보정된 기대 판매량: ${finance.expected.adjustedExpectedDailySales || 'N/A'}잔`);
  console.log(`브랜드 감소율: ${(finance.expected.brandDeclineRate * 100).toFixed(1)}%`);
  console.log(`GAP: ${(finance.expected.gapPctVsTarget * 100).toFixed(1)}%`);
  console.log(`신호등: ${decision.signal}`);
  console.log(`점수: ${decision.score}`);
  
  // 리스크 카드 확인
  const brandDeclineRisk = decision.riskCards.find(card => card.id === 'brand_decline');
  if (brandDeclineRisk) {
    console.log(`\n리스크 카드: ${brandDeclineRisk.title}`);
    console.log(`  심각도: ${brandDeclineRisk.severity}`);
    console.log(`  설명: ${brandDeclineRisk.narrative}`);
  }
}

async function testDecline20() {
  console.log('\n=== 테스트 3: 브랜드 감소율 20% (높은 리스크, yellow 강제) ===');
  
  const brand = await getBrandForEngine('brand_mega');
  const brandWithDecline = {
    ...brand,
    brandDeclineRate: 0.20,
    avgMonthlySales: 30000000,
    avgSalesPerPyeong: 3000000
  };
  
  const finance = calculateFinance({
    brand: brandWithDecline,
    conditions: baseConditions,
    market,
    targetDailySales
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions: baseConditions,
    brand: brandWithDecline,
    targetDailySales
  });
  
  console.log(`보정된 기대 판매량: ${finance.expected.adjustedExpectedDailySales || 'N/A'}잔`);
  console.log(`브랜드 감소율: ${(finance.expected.brandDeclineRate * 100).toFixed(1)}%`);
  console.log(`신호등: ${decision.signal} ${decision.signal === 'yellow' ? '✅' : '❌'}`);
  console.log(`점수: ${decision.score}`);
}

async function testDecline30() {
  console.log('\n=== 테스트 4: 브랜드 감소율 30% (최고 리스크, red 강제) ===');
  
  const brand = await getBrandForEngine('brand_mega');
  const brandWithDecline = {
    ...brand,
    brandDeclineRate: 0.30,
    avgMonthlySales: 30000000,
    avgSalesPerPyeong: 3000000
  };
  
  const finance = calculateFinance({
    brand: brandWithDecline,
    conditions: baseConditions,
    market,
    targetDailySales
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions: baseConditions,
    brand: brandWithDecline,
    targetDailySales
  });
  
  console.log(`보정된 기대 판매량: ${finance.expected.adjustedExpectedDailySales || 'N/A'}잔`);
  console.log(`브랜드 감소율: ${(finance.expected.brandDeclineRate * 100).toFixed(1)}%`);
  console.log(`신호등: ${decision.signal} ${decision.signal === 'red' ? '✅' : '❌'}`);
  console.log(`점수: ${decision.score}`);
}

async function runAllTests() {
  console.log('='.repeat(80));
  console.log('브랜드 점포 감소율 테스트');
  console.log('='.repeat(80));
  
  try {
    await testNoDecline();
    await testDecline10();
    await testDecline20();
    await testDecline30();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 모든 테스트 완료');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testNoDecline,
  testDecline10,
  testDecline20,
  testDecline30
};
