/**
 * 다중 브랜드 비교 계산기
 * 
 * 동일한 조건으로 여러 브랜드의 창업 시뮬레이션을 비교
 */

const { getBrandForEngine } = require('../data_local/brandLoader');
const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');

// 비동기 함수로 변경
async function getBrandForEngineAsync(brandId) {
  return await getBrandForEngine(brandId);
}

// 비교할 브랜드 목록
const brandIds = [
  'brand_dunkin',      // 던킨도너츠
  'brand_manleap',    // 만렙커피
  'brand_ediya',      // 이디야커피
  'brand_mega',       // 메가커피
  'brand_banapresso'  // 바나프레소
];

// 공통 입력 조건 (예시)
const commonConditions = {
  initialInvestment: 200000000,  // 2억원
  monthlyRent: 4000000,          // 400만원
  area: 10,                      // 10평
  ownerWorking: true             // 점주 근무
};

const commonMarket = {
  expectedDailySales: 250,       // 상권 기대 판매량 250잔
  radiusM: 500,
  marketScore: 65,
  competitors: { total: 5, density: "high" }
};

const commonRoadview = {
  overallRisk: "medium",
  riskScore: 60
};

const targetDailySales = 300;    // 목표 일 판매량 300잔
const scenarios = [200, 250, 300]; // 시나리오

/**
 * 단일 브랜드 계산
 */
async function calculateBrand(brandId) {
  const brand = await getBrandForEngineAsync(brandId);
  
  if (!brand) {
    console.error(`❌ 브랜드를 찾을 수 없습니다: ${brandId}`);
    return null;
  }
  
  // 손익 계산
  const financeResult = calculateFinance({
    brand: brand,
    conditions: commonConditions,
    market: commonMarket,
    targetDailySales: targetDailySales,
    scenarios: scenarios
  });
  
  // 판단 계산
  const decisionResult = calculateDecision({
    finance: financeResult,
    market: commonMarket,
    roadview: commonRoadview,
    conditions: commonConditions,
    brand: brand,
    targetDailySales: targetDailySales
  });
  
  return {
    brand: brand,
    finance: financeResult,
    decision: decisionResult
  };
}

/**
 * 모든 브랜드 계산 및 비교
 */
async function compareAllBrands() {
  console.log('='.repeat(80));
  console.log('다중 브랜드 창업 시뮬레이션 비교');
  console.log('='.repeat(80));
  
  console.log('\n📋 공통 입력 조건:');
  console.log(`- 초기 투자금: ${(commonConditions.initialInvestment / 10000).toFixed(0)}만원`);
  console.log(`- 월세: ${(commonConditions.monthlyRent / 10000).toFixed(0)}만원`);
  console.log(`- 평수: ${commonConditions.area}평`);
  console.log(`- 점주 근무: ${commonConditions.ownerWorking ? '예' : '아니오'}`);
  console.log(`- 목표 일 판매량: ${targetDailySales}잔`);
  console.log(`- 상권 기대 판매량: ${commonMarket.expectedDailySales}잔\n`);
  
  const results = [];
  
  // 각 브랜드 계산
  for (const brandId of brandIds) {
    const result = await calculateBrand(brandId);
    if (result) {
      results.push(result);
    }
  }
  
  // 개별 결과 출력
  console.log('\n' + '='.repeat(80));
  console.log('개별 브랜드 상세 결과');
  console.log('='.repeat(80));
  
  results.forEach((result, idx) => {
    const brand = result.brand;
    const finance = result.finance;
    const decision = result.decision;
    
    console.log(`\n${idx + 1}. ${brand.name} (${brand.position})`);
    console.log('-'.repeat(80));
    
    console.log('\n📊 손익 계산:');
    console.log(`  - 평균 단가: ${brand.defaults.avgPrice.toLocaleString()}원`);
    console.log(`  - 월 매출: ${(finance.monthlyRevenue / 10000).toFixed(0)}만원`);
    console.log(`  - 월 순이익: ${(finance.monthlyProfit / 10000).toFixed(0)}만원`);
    console.log(`  - 회수 기간: ${finance.paybackMonths !== null ? finance.paybackMonths.toFixed(1) : 'N/A'}개월`);
    console.log(`  - 손익분기점: ${finance.breakEvenDailySales !== null ? finance.breakEvenDailySales.toFixed(0) : 'N/A'}잔/일`);
    
    if (finance.expected) {
      console.log(`  - GAP (목표 vs 기대): ${(finance.expected.gapPctVsTarget * 100).toFixed(1)}%`);
    }
    
    console.log('\n🎯 판단 결과:');
    const signalEmoji = decision.signal === 'green' ? '🟢' : decision.signal === 'yellow' ? '🟡' : '🔴';
    console.log(`  - 점수: ${decision.score}점`);
    console.log(`  - 성공 확률: ${(decision.successProbability * 100).toFixed(1)}%`);
    console.log(`  - 신호등: ${signalEmoji} ${decision.signal}`);
    console.log(`  - 생존 개월: ${decision.survivalMonths}개월`);
    console.log(`  - 리스크 레벨: ${decision.riskLevel}`);
    
    if (decision.riskCards && decision.riskCards.length > 0) {
      console.log(`  - 리스크 카드: ${decision.riskCards.length}개`);
      decision.riskCards.forEach((risk, i) => {
        console.log(`    ${i + 1}. ${risk.title} (${risk.severity})`);
      });
    }
  });
  
  // 비교 테이블 출력
  console.log('\n' + '='.repeat(80));
  console.log('브랜드별 비교 테이블');
  console.log('='.repeat(80));
  
  console.log('\n| 브랜드 | 단가 | 월매출 | 월순이익 | 회수기간 | 점수 | 신호등 | 생존개월 |');
  console.log('|--------|------|--------|----------|----------|------|--------|----------|');
  
  results.forEach(result => {
    const brand = result.brand;
    const finance = result.finance;
    const decision = result.decision;
    
    const avgPrice = `${(brand.defaults.avgPrice / 1000).toFixed(1)}천원`;
    const revenue = `${(finance.monthlyRevenue / 10000).toFixed(0)}만원`;
    const profit = `${(finance.monthlyProfit / 10000).toFixed(0)}만원`;
    const payback = finance.paybackMonths !== null ? `${finance.paybackMonths.toFixed(1)}개월` : 'N/A';
    const score = decision.score;
    const signal = decision.signal === 'green' ? '🟢' : decision.signal === 'yellow' ? '🟡' : '🔴';
    const survival = `${decision.survivalMonths}개월`;
    
    console.log(`| ${brand.name} | ${avgPrice} | ${revenue} | ${profit} | ${payback} | ${score} | ${signal} | ${survival} |`);
  });
  
  // 순위별 정렬
  console.log('\n' + '='.repeat(80));
  console.log('회수 기간 순위 (빠른 순)');
  console.log('='.repeat(80));
  
  const sortedByPayback = [...results].sort((a, b) => {
    if (a.finance.paybackMonths === null) return 1;
    if (b.finance.paybackMonths === null) return -1;
    return a.finance.paybackMonths - b.finance.paybackMonths;
  });
  
  sortedByPayback.forEach((result, idx) => {
    const brand = result.brand;
    const finance = result.finance;
    const payback = finance.paybackMonths !== null ? `${finance.paybackMonths.toFixed(1)}개월` : 'N/A';
    console.log(`${idx + 1}. ${brand.name}: ${payback}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('점수 순위 (높은 순)');
  console.log('='.repeat(80));
  
  const sortedByScore = [...results].sort((a, b) => b.decision.score - a.decision.score);
  
  sortedByScore.forEach((result, idx) => {
    const brand = result.brand;
    const decision = result.decision;
    const signalEmoji = decision.signal === 'green' ? '🟢' : decision.signal === 'yellow' ? '🟡' : '🔴';
    console.log(`${idx + 1}. ${brand.name}: ${decision.score}점 ${signalEmoji} (성공확률 ${(decision.successProbability * 100).toFixed(1)}%)`);
  });
  
  return results;
}

// 실행
if (require.main === module) {
  compareAllBrands().catch(error => {
    console.error('에러 발생:', error);
    process.exit(1);
  });
}

module.exports = {
  compareAllBrands,
  calculateBrand
};
