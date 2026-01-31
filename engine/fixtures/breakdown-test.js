/**
 * Breakdown 테스트
 * 
 * 점수 breakdown이 제대로 출력되는지 확인
 */

const { getBrandForEngine } = require('../data_local/brandLoader');
const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');

// 테스트 브랜드
const brandIds = ['brand_ediya', 'brand_mega', 'brand_dunkin'];

const conditions = {
  initialInvestment: 200000000,
  monthlyRent: 4000000,
  area: 10,
  ownerWorking: true
};

const market = {
  expectedDailySales: 250,
  radiusM: 500,
  marketScore: 65
};

const roadview = {
  overallRisk: "medium",
  riskScore: 60
};

const targetDailySales = 300;

async function testBreakdown() {
  console.log('='.repeat(80));
  console.log('점수 Breakdown 테스트');
  console.log('='.repeat(80));

  for (const brandId of brandIds) {
    const brand = await getBrandForEngine(brandId);
    
    if (!brand) {
      console.error(`❌ 브랜드를 찾을 수 없습니다: ${brandId}`);
      continue;
    }
    
    const finance = calculateFinance({
      brand,
      conditions,
      market,
      targetDailySales: targetDailySales
    });
    
    const decision = calculateDecision({
      finance,
      market,
      roadview,
      conditions,
      brand,
      targetDailySales
    });
    
    console.log(`\n${brand.name}`);
    console.log('-'.repeat(80));
    console.log(`최종 점수: ${decision.score}점`);
    console.log(`성공 확률: ${(decision.successProbability * 100).toFixed(1)}%`);
    console.log(`신호등: ${decision.signal}`);
    console.log(`생존 개월: ${decision.survivalMonths}개월`);
    
    if (decision.breakdown) {
      console.log('\n📊 Breakdown:');
      console.log(`  - 회수 기간: ${decision.breakdown.payback}점`);
      console.log(`  - 수익성: ${decision.breakdown.profitability}점`);
      console.log(`  - GAP: ${decision.breakdown.gap}점`);
      console.log(`  - 민감도: ${decision.breakdown.sensitivity}점`);
      console.log(`  - 고정비: ${decision.breakdown.fixedCost}점`);
      console.log(`  - 상권: ${decision.breakdown.market}점`);
      console.log(`  - 로드뷰: ${decision.breakdown.roadview}점`);
      
      // 약점 분석
      const breakdown = decision.breakdown;
      const weaknesses = [];
      if (breakdown.payback < 70) weaknesses.push(`회수기간(${breakdown.payback}점)`);
      if (breakdown.profitability < 70) weaknesses.push(`수익성(${breakdown.profitability}점)`);
      if (breakdown.gap < 70) weaknesses.push(`GAP(${breakdown.gap}점)`);
      if (breakdown.sensitivity < 70) weaknesses.push(`민감도(${breakdown.sensitivity}점)`);
      if (breakdown.fixedCost < 70) weaknesses.push(`고정비(${breakdown.fixedCost}점)`);
      
      if (weaknesses.length > 0) {
        console.log(`\n⚠️ 약점: ${weaknesses.join(', ')}`);
      } else {
        console.log(`\n✅ 모든 항목 양호`);
      }
    }
  }
}
