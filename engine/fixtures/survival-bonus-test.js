/**
 * Survival Months 보너스 테스트
 * 
 * payback이 18개월 미만일 때 +6개월 보너스가 적용되는지 확인
 */

const { getBrandForEngine } = require('../data_local/brandLoader');
const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');

// 18개월 미만이 나오도록 조건 조정
const conditions = {
  initialInvestment: 150000000,  // 1.5억원 (낮춤)
  monthlyRent: 3000000,          // 300만원 (낮춤)
  area: 10,
  ownerWorking: true
};

const market = {
  expectedDailySales: 250,
  radiusM: 500,
  marketScore: 70
};

const roadview = {
  overallRisk: "low",
  riskScore: 80
};

const targetDailySales = 350;  // 높은 판매량

async function testSurvivalBonus() {
  console.log('='.repeat(80));
  console.log('Survival Months 보너스 테스트 (payback < 18개월)');
  console.log('='.repeat(80));

  const brandIds = ['brand_ediya', 'brand_mega', 'brand_twosome'];

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
      targetDailySales
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
    console.log(`회수 기간: ${finance.paybackMonths !== null ? finance.paybackMonths.toFixed(1) : 'N/A'}개월`);
    console.log(`생존 개월: ${decision.survivalMonths}개월`);
    
    if (finance.paybackMonths !== null && finance.paybackMonths < 18) {
      console.log(`✅ 보너스 적용됨! (회수 기간 ${finance.paybackMonths.toFixed(1)}개월 < 18개월)`);
      console.log(`   → 생존 개월: 36개월 (기준) + 6개월 (보너스) = 42개월 예상`);
    } else {
      console.log(`보너스 미적용 (회수 기간 ${finance.paybackMonths !== null ? finance.paybackMonths.toFixed(1) : 'N/A'}개월)`);
    }
  }
}
