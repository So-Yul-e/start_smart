/**
 * 통합 테스트: 다양한 브랜드/지역/조건 조합 시나리오
 * 
 * 테스트 시나리오:
 * 1. 저가형 브랜드 + 저렴한 지역 (메가커피 + 노원)
 * 2. 프리미엄 브랜드 + 강남 (투썸플레이스 + 강남)
 * 3. 적자 시나리오 (낮은 판매량)
 * 4. 최적 조건 시나리오 (높은 판매량, 낮은 임대료)
 */

const { getBrandForEngine } = require('../data_local/brandLoader');
const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');

/**
 * 숫자 포맷팅
 */
function formatNumber(num) {
  if (num === null || num === undefined) return 'N/A';
  if (typeof num === 'number') {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}만원`;
    }
    return `${num.toLocaleString()}원`;
  }
  return num.toString();
}

function formatPercent(num) {
  if (num === null || num === undefined) return 'N/A';
  return `${(num * 100).toFixed(1)}%`;
}

/**
 * 시나리오 결과 출력
 */
function printScenarioResult(scenarioName, result) {
  const { brand, finance, decision } = result;
  
  console.log('\n' + '='.repeat(80));
  console.log(`📋 ${scenarioName}`);
  console.log('='.repeat(80));
  
  console.log(`\n브랜드: ${brand.name} (${brand.position || 'N/A'})`);
  console.log(`평균 단가: ${formatNumber(brand.defaults.avgPrice)}`);
  
  console.log(`\n💰 손익 계산:`);
  console.log(`  - 월 매출: ${formatNumber(finance.monthlyRevenue)}`);
  console.log(`  - 월 순이익: ${formatNumber(finance.monthlyProfit)}`);
  console.log(`  - 회수 기간: ${finance.paybackMonths === null ? 'N/A' : finance.paybackMonths.toFixed(1) + '개월'}`);
  console.log(`  - 손익분기점: ${finance.breakEvenDailySales === null ? 'N/A' : finance.breakEvenDailySales.toFixed(0) + '잔'}`);
  
  if (finance.debt && finance.debt.monthlyPayment) {
    console.log(`  - 대출 월 상환액: ${formatNumber(finance.debt.monthlyPayment)}`);
    if (finance.debt.dscr !== null) {
      console.log(`  - DSCR: ${finance.debt.dscr.toFixed(2)}`);
    }
  }
  
  if (finance.expected) {
    console.log(`\n📈 기대 판매량 분석:`);
    console.log(`  - 상권 기대 판매량: ${finance.expected.expectedDailySales}잔`);
    console.log(`  - GAP: ${formatPercent(finance.expected.gapPctVsTarget)}`);
  }
  
  console.log(`\n🎯 판단 결과:`);
  const signal = decision.signal === 'green' ? '🟢 초록' : decision.signal === 'yellow' ? '🟡 노랑' : '🔴 빨강';
  console.log(`  - 점수: ${decision.score}점`);
  console.log(`  - 성공 확률: ${formatPercent(decision.successProbability)}`);
  console.log(`  - 신호등: ${signal}`);
  console.log(`  - 생존 개월: ${decision.survivalMonths}개월`);
  console.log(`  - 리스크 레벨: ${decision.riskLevel === 'low' ? '🟢 낮음' : decision.riskLevel === 'medium' ? '🟡 중간' : '🔴 높음'}`);
  
  if (decision.riskCards && decision.riskCards.length > 0) {
    console.log(`\n⚠️  리스크 카드: ${decision.riskCards.length}개`);
    decision.riskCards.slice(0, 3).forEach((card, idx) => {
      const severity = card.severity === 'high' ? '🔴' : card.severity === 'medium' ? '🟡' : '🟢';
      console.log(`  ${idx + 1}. ${severity} ${card.title}`);
    });
  }
}

/**
 * 시나리오 1: 저가형 브랜드 + 저렴한 지역
 * 메가커피 + 노원구 (임대료 낮음, 상권 점수 낮음)
 */
async function scenario1_LowPriceBrand_LowRentArea() {
  const brand = await getBrandForEngine('brand_mega');
  
  const conditions = {
    initialInvestment: 150_000_000,  // 1.5억원 (저렴한 지역)
    monthlyRent: 2_500_000,         // 월세 250만원 (저렴)
    area: 10,
    ownerWorking: true
  };
  
  const market = {
    expectedDailySales: 200,         // 낮은 기대 판매량
    radiusM: 500,
    marketScore: 50,                // 낮은 상권 점수
    competitors: { total: 3, density: "medium" }
  };
  
  const roadview = {
    overallRisk: "low",
    riskScore: 70                   // 로드뷰 리스크 낮음
  };
  
  const targetDailySales = 250;
  
  const finance = calculateFinance({
    brand,
    conditions,
    market,
    targetDailySales,
    scenarios: [200, 250, 300]
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions,
    brand,
    targetDailySales
  });
  
  return {
    brand,
    finance,
    decision
  };
}

/**
 * 시나리오 2: 프리미엄 브랜드 + 강남
 * 투썸플레이스 + 강남구 (임대료 높음, 상권 점수 높음)
 */
async function scenario2_PremiumBrand_Gangnam() {
  const brand = await getBrandForEngine('brand_twosome');
  
  const conditions = {
    initialInvestment: 250_000_000,  // 2.5억원 (프리미엄 브랜드)
    monthlyRent: 6_000_000,          // 월세 600만원 (강남)
    area: 15,
    ownerWorking: false             // 점주 미근무
  };
  
  const market = {
    expectedDailySales: 300,         // 높은 기대 판매량
    radiusM: 500,
    marketScore: 85,                 // 높은 상권 점수
    competitors: { total: 8, density: "high" }
  };
  
  const roadview = {
    overallRisk: "medium",
    riskScore: 65
  };
  
  const targetDailySales = 350;
  
  const finance = calculateFinance({
    brand,
    conditions,
    market,
    targetDailySales,
    scenarios: [250, 300, 350]
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions,
    brand,
    targetDailySales
  });
  
  return {
    brand,
    finance,
    decision
  };
}

/**
 * 시나리오 3: 적자 시나리오
 * 낮은 판매량으로 적자 전환
 */
async function scenario3_LossScenario() {
  const brand = await getBrandForEngine('brand_ediya');
  
  const conditions = {
    initialInvestment: 200_000_000,
    monthlyRent: 5_000_000,          // 높은 임대료
    area: 10,
    ownerWorking: false             // 점주 미근무
  };
  
  const market = {
    expectedDailySales: 150,         // 매우 낮은 기대 판매량
    radiusM: 500,
    marketScore: 40,                 // 낮은 상권 점수
    competitors: { total: 10, density: "very_high" }
  };
  
  const roadview = {
    overallRisk: "high",
    riskScore: 40                    // 높은 로드뷰 리스크
  };
  
  const targetDailySales = 180;      // 낮은 목표 판매량
  
  const finance = calculateFinance({
    brand,
    conditions,
    market,
    targetDailySales,
    scenarios: [150, 180, 200]
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions,
    brand,
    targetDailySales
  });
  
  return {
    brand,
    finance,
    decision
  };
}

/**
 * 시나리오 4: 최적 조건 시나리오
 * 높은 판매량, 낮은 임대료, 좋은 상권
 */
async function scenario4_OptimalConditions() {
  const brand = await getBrandForEngine('brand_ediya');
  
  const conditions = {
    initialInvestment: 180_000_000,  // 적당한 투자금
    monthlyRent: 3_000_000,          // 낮은 임대료
    area: 12,
    ownerWorking: true               // 점주 근무
  };
  
  const market = {
    expectedDailySales: 320,         // 매우 높은 기대 판매량
    radiusM: 500,
    marketScore: 90,                 // 매우 높은 상권 점수
    competitors: { total: 4, density: "low" }
  };
  
  const roadview = {
    overallRisk: "low",
    riskScore: 85                    // 낮은 로드뷰 리스크
  };
  
  const targetDailySales = 350;
  
  const finance = calculateFinance({
    brand,
    conditions,
    market,
    targetDailySales,
    scenarios: [300, 350, 400]
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions,
    brand,
    targetDailySales
  });
  
  return {
    brand,
    finance,
    decision
  };
}

/**
 * 시나리오 5: 대출 포함 시나리오
 * 대출을 활용한 창업
 */
async function scenario5_WithLoan() {
  const brand = await getBrandForEngine('brand_mega');
  
  const conditions = {
    initialInvestment: 200_000_000,
    monthlyRent: 4_000_000,
    area: 10,
    ownerWorking: true,
    loans: [
      {
        type: "startup",
        principal: 100_000_000,      // 창업대출 1억
        apr: 0.045,                  // 연 4.5%
        termMonths: 60,              // 5년
        repaymentType: "equal_payment"
      }
    ]
  };
  
  const market = {
    expectedDailySales: 250,
    radiusM: 500,
    marketScore: 70,
    competitors: { total: 5, density: "high" }
  };
  
  const roadview = {
    overallRisk: "medium",
    riskScore: 65
  };
  
  const targetDailySales = 300;
  
  const finance = calculateFinance({
    brand,
    conditions,
    market,
    targetDailySales,
    scenarios: [200, 250, 300]
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions,
    brand,
    targetDailySales
  });
  
  return {
    brand,
    finance,
    decision
  };
}

/**
 * 모든 시나리오 실행
 */
async function runAllScenarios() {
  console.log('🚀 통합 테스트: 다양한 브랜드/지역/조건 조합 시나리오\n');
  
  try {
    // 시나리오 1
    const result1 = await scenario1_LowPriceBrand_LowRentArea();
    printScenarioResult('시나리오 1: 저가형 브랜드 + 저렴한 지역 (메가커피 + 노원)', result1);
    
    // 시나리오 2
    const result2 = await scenario2_PremiumBrand_Gangnam();
    printScenarioResult('시나리오 2: 프리미엄 브랜드 + 강남 (투썸플레이스 + 강남)', result2);
    
    // 시나리오 3
    const result3 = await scenario3_LossScenario();
    printScenarioResult('시나리오 3: 적자 시나리오 (낮은 판매량)', result3);
    
    // 시나리오 4
    const result4 = await scenario4_OptimalConditions();
    printScenarioResult('시나리오 4: 최적 조건 시나리오 (높은 판매량, 낮은 임대료)', result4);
    
    // 시나리오 5
    const result5 = await scenario5_WithLoan();
    printScenarioResult('시나리오 5: 대출 포함 시나리오', result5);
    
    // 비교 테이블
    console.log('\n' + '='.repeat(100));
    console.log('📊 시나리오 비교 테이블');
    console.log('='.repeat(100));
    
    const scenarios = [
      { name: '저가형+저렴지역', result: result1 },
      { name: '프리미엄+강남', result: result2 },
      { name: '적자 시나리오', result: result3 },
      { name: '최적 조건', result: result4 },
      { name: '대출 포함', result: result5 }
    ];
    
    console.log('\n시나리오'.padEnd(20) + 
                '브랜드'.padEnd(12) + 
                '점수'.padEnd(8) + 
                '신호등'.padEnd(8) + 
                '월순이익'.padEnd(12) + 
                '회수기간'.padEnd(12) + 
                '생존개월'.padEnd(12) + 
                '리스크');
    
    console.log('-'.repeat(100));
    
    scenarios.forEach(scenario => {
      const { brand, finance, decision } = scenario.result;
      const signal = decision.signal === 'green' ? '🟢' : decision.signal === 'yellow' ? '🟡' : '🔴';
      const risk = decision.riskLevel === 'low' ? '🟢' : decision.riskLevel === 'medium' ? '🟡' : '🔴';
      const profit = finance.monthlyProfit ? `${(finance.monthlyProfit / 10000).toFixed(0)}만` : 'N/A';
      const payback = finance.paybackMonths ? `${finance.paybackMonths.toFixed(1)}개월` : 'N/A';
      
      console.log(
        scenario.name.padEnd(20) +
        brand.name.padEnd(12) +
        `${decision.score}점`.padEnd(8) +
        signal.padEnd(8) +
        profit.padEnd(12) +
        payback.padEnd(12) +
        `${decision.survivalMonths}개월`.padEnd(12) +
        risk
      );
    });
    
    console.log('='.repeat(100));
    
    // 검증 결과
    console.log('\n✅ 검증 결과:');
    console.log(`  - 총 ${scenarios.length}개 시나리오 테스트 완료`);
    console.log(`  - 적자 시나리오: ${result3.finance.monthlyProfit <= 0 ? '✅ 적자 확인' : '❌ 적자 아님'}`);
    console.log(`  - 최적 조건: ${result4.decision.signal === 'green' ? '✅ 초록 신호' : '⚠️  초록 아님'}`);
    console.log(`  - 대출 포함: ${result5.finance.debt && result5.finance.debt.monthlyPayment > 0 ? '✅ 대출 계산 확인' : '❌ 대출 계산 실패'}`);
    
  } catch (error) {
    console.error('❌ 시나리오 실행 중 오류 발생:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  runAllScenarios();
}

module.exports = {
  scenario1_LowPriceBrand_LowRentArea,
  scenario2_PremiumBrand_Gangnam,
  scenario3_LossScenario,
  scenario4_OptimalConditions,
  scenario5_WithLoan,
  runAllScenarios
};
