/**
 * 브랜드별 계산 테스트
 * 
 * 각 프랜차이즈 선택 후 계산 시 그에 따른 결과값이 나오는지 테스트
 */

const { getBrandForEngine, getAllBrands } = require('../data_local/brandLoader');
const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');

// 테스트 조건 (강남구 기준)
const testConditions = {
  initialInvestment: 200000000,  // 초기 투자금 2억원
  monthlyRent: 4000000,          // 월세 400만원
  area: 10,                      // 10평
  ownerWorking: true             // 점주 근무
};

const testMarket = {
  expectedDailySales: 256,       // 상권 평균 일 판매량
  radiusM: 500,
  marketScore: 65,
  competitors: { total: 5, density: "high" }
};

const testRoadview = {
  overallRisk: "medium",
  riskScore: 60
};

const targetDailySales = 300;

/**
 * 단일 브랜드 테스트
 */
async function testBrand(brandId) {
  console.log(`\n=== ${brandId} 테스트 ===`);
  
  // 브랜드 데이터 로드 (DB → data_local fallback)
  const brand = await getBrandForEngine(brandId);
  
  if (!brand) {
    console.error(`❌ 브랜드를 찾을 수 없습니다: ${brandId}`);
    return null;
  }
  
  console.log(`브랜드: ${brand.name}`);
  console.log(`평균 단가: ${brand.defaults.avgPrice}원`);
  console.log(`원가율: ${(brand.defaults.cogsRate * 100).toFixed(0)}%`);
  
  // 손익 계산
  const financeResult = calculateFinance({
    brand: brand,
    conditions: testConditions,
    market: testMarket,
    targetDailySales: targetDailySales,
    scenarios: [200, 250, 300]
  });
  
  console.log(`\n📊 손익 계산 결과:`);
  console.log(`- 월 매출: ${(financeResult.monthlyRevenue / 10000).toFixed(0)}만원`);
  console.log(`- 월 순이익: ${(financeResult.monthlyProfit / 10000).toFixed(0)}만원`);
  console.log(`- 회수 기간: ${financeResult.paybackMonths}개월`);
  console.log(`- GAP: ${(financeResult.expected.gapPctVsTarget * 100).toFixed(1)}%`);
  
  // 판단 계산
  const decisionResult = calculateDecision({
    finance: financeResult,
    market: testMarket,
    roadview: testRoadview,
    conditions: testConditions,
    brand: brand,
    targetDailySales: targetDailySales
  });
  
  console.log(`\n🎯 판단 결과:`);
  console.log(`- 점수: ${decisionResult.score}`);
  console.log(`- 성공 확률: ${(decisionResult.successProbability * 100).toFixed(1)}%`);
  console.log(`- 신호등: ${decisionResult.signal}`);
  console.log(`- 생존 개월: ${decisionResult.survivalMonths}개월`);
  console.log(`- 리스크 레벨: ${decisionResult.riskLevel}`);
  
  if (decisionResult.riskCards && decisionResult.riskCards.length > 0) {
    console.log(`\n⚠️ 리스크 카드: ${decisionResult.riskCards.length}개`);
  }
  
  return {
    brand: brand,
    finance: financeResult,
    decision: decisionResult
  };
}

/**
 * 모든 브랜드 테스트
 */
async function testAllBrands() {
  console.log('=== 모든 브랜드 계산 테스트 ===\n');
  
  const brands = await getAllBrands();
  const results = [];
  
  for (const brand of brands) {
    const result = await testBrand(brand.id);
    if (result) {
      results.push({
        brandId: brand.id,
        brandName: brand.name,
        score: result.decision.score,
        signal: result.decision.signal,
        paybackMonths: result.finance.paybackMonths,
        monthlyProfit: result.finance.monthlyProfit
      });
    }
  }
  
  // 결과 요약
  console.log('\n=== 브랜드별 결과 요약 ===');
  console.log('\n| 브랜드 | 점수 | 신호등 | 회수기간 | 월순이익 |');
  console.log('|--------|------|--------|----------|----------|');
  
  results.forEach(r => {
    const payback = r.paybackMonths === null ? 'N/A' : `${r.paybackMonths}개월`;
    const profit = `${(r.monthlyProfit / 10000).toFixed(0)}만원`;
    console.log(`| ${r.brandName} | ${r.score} | ${r.signal} | ${payback} | ${profit} |`);
  });
  
  return results;
}

// 직접 실행 시
if (require.main === module) {
  // 단일 브랜드 테스트
  if (process.argv[2]) {
    testBrand(process.argv[2]).catch(error => {
      console.error('에러 발생:', error);
      process.exit(1);
    });
  } else {
    // 모든 브랜드 테스트
    testAllBrands().catch(error => {
      console.error('에러 발생:', error);
      process.exit(1);
    });
  }
}

module.exports = {
  testBrand,
  testAllBrands
};
