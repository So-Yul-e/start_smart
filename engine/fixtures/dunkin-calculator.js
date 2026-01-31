/**
 * 던킨도너츠 창업 계산기
 * 
 * 사용자 입력을 받아 던킨도너츠 창업 시뮬레이션 실행
 */

const { getBrandForEngine } = require('../data_local/brandLoader');
const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');

/**
 * 던킨도너츠 창업 계산 실행
 * @param {Object} userInput - 사용자 입력값
 */
async function calculateDunkin(userInput) {
  console.log('\n=== 던킨도너츠 창업 시뮬레이션 ===\n');
  
  // 던킨도너츠 브랜드 데이터 로드 (DB → data_local fallback)
  const brandDunkin = await getBrandForEngine('brand_dunkin');
  
  if (!brandDunkin) {
    console.error('❌ 브랜드를 찾을 수 없습니다: brand_dunkin');
    return null;
  }
  
  // 브랜드 정보 출력
  console.log('📌 브랜드 정보:');
  console.log(`- 브랜드: ${brandDunkin.name}`);
  console.log(`- 평균 단가: ${brandDunkin.defaults.avgPrice.toLocaleString()}원`);
  console.log(`- 원가율: ${(brandDunkin.defaults.cogsRate * 100).toFixed(0)}%`);
  console.log(`- 인건비율: ${(brandDunkin.defaults.laborRate * 100).toFixed(0)}%\n`);
  
  // 입력값 확인
  const conditions = {
    initialInvestment: userInput.initialInvestment || 200000000,
    monthlyRent: userInput.monthlyRent || 4000000,
    area: userInput.area || 10,
    ownerWorking: userInput.ownerWorking !== undefined ? userInput.ownerWorking : true
  };
  
  const market = {
    expectedDailySales: userInput.expectedDailySales || null,
    radiusM: userInput.radiusM || 500,
    marketScore: userInput.marketScore || 65,
    competitors: userInput.competitors || { total: 5, density: "high" }
  };
  
  const roadview = {
    overallRisk: userInput.roadviewRisk || "medium",
    riskScore: userInput.roadviewScore || 60
  };
  
  const targetDailySales = userInput.targetDailySales || 300;
  const scenarios = userInput.scenarios || [200, 250, 300];
  
  console.log('📋 입력 조건:');
  console.log(`- 초기 투자금: ${(conditions.initialInvestment / 10000).toFixed(0)}만원`);
  console.log(`- 월세: ${(conditions.monthlyRent / 10000).toFixed(0)}만원`);
  console.log(`- 평수: ${conditions.area}평`);
  console.log(`- 점주 근무: ${conditions.ownerWorking ? '예' : '아니오'}`);
  console.log(`- 목표 일 판매량: ${targetDailySales}잔`);
  if (market.expectedDailySales) {
    console.log(`- 상권 기대 판매량: ${market.expectedDailySales}잔`);
  }
  console.log('');
  
  // 1. 손익 계산
  const financeResult = calculateFinance({
    brand: brandDunkin,
    conditions: conditions,
    market: market,
    targetDailySales: targetDailySales,
    scenarios: scenarios
  });
  
  console.log('📊 손익 계산 결과:');
  console.log(`- 월 매출: ${(financeResult.monthlyRevenue / 10000).toFixed(0)}만원`);
  console.log(`- 월 순이익: ${(financeResult.monthlyProfit / 10000).toFixed(0)}만원`);
  console.log(`- 회수 기간: ${financeResult.paybackMonths !== null ? financeResult.paybackMonths.toFixed(1) : 'N/A'}개월`);
  console.log(`- 손익분기점: ${financeResult.breakEvenDailySales !== null ? financeResult.breakEvenDailySales.toFixed(0) : 'N/A'}잔/일`);
  
  if (financeResult.expected) {
    console.log(`- 기대 판매량: ${financeResult.expected.expectedDailySales}잔`);
    console.log(`- 기대 월 매출: ${(financeResult.expected.expectedMonthlyRevenue / 10000).toFixed(0)}만원`);
    console.log(`- GAP (목표 vs 기대): ${(financeResult.expected.gapPctVsTarget * 100).toFixed(1)}%`);
    if (financeResult.expected.gapWarning) {
      console.log(`  ⚠️ 경고: GAP 계산에 fallback이 사용되었습니다.`);
    }
  }
  
  console.log('\n📈 시나리오 테이블:');
  if (financeResult.scenarioTable && financeResult.scenarioTable.length > 0) {
    financeResult.scenarioTable.forEach(scenario => {
      const payback = scenario.paybackMonths !== null ? `${scenario.paybackMonths.toFixed(1)}개월` : 'N/A';
      console.log(`  ${scenario.daily}잔: 순이익 ${(scenario.profit / 10000).toFixed(0)}만원, 회수 ${payback}`);
    });
  }
  
  // 2. 판단 계산
  const decisionResult = calculateDecision({
    finance: financeResult,
    market: market,
    roadview: roadview,
    conditions: conditions,
    brand: brandDunkin,
    targetDailySales: targetDailySales
  });
  
  console.log('\n🎯 판단 결과:');
  console.log(`- 점수: ${decisionResult.score}점`);
  console.log(`- 성공 확률: ${(decisionResult.successProbability * 100).toFixed(1)}%`);
  console.log(`- 신호등: ${decisionResult.signal === 'green' ? '🟢 초록' : decisionResult.signal === 'yellow' ? '🟡 노랑' : '🔴 빨강'}`);
  console.log(`- 생존 개월: ${decisionResult.survivalMonths}개월`);
  console.log(`- 리스크 레벨: ${decisionResult.riskLevel}`);
  
  if (decisionResult.riskCards && decisionResult.riskCards.length > 0) {
    console.log('\n⚠️ 리스크 카드:');
    decisionResult.riskCards.forEach((risk, idx) => {
      console.log(`  ${idx + 1}. ${risk.title} (${risk.severity})`);
      console.log(`     ${risk.narrative}`);
    });
  }
  
  if (decisionResult.improvementSimulations && decisionResult.improvementSimulations.length > 0) {
    console.log('\n💡 개선 시뮬레이션:');
    decisionResult.improvementSimulations.forEach(sim => {
      const signalEmoji = sim.signal === 'green' ? '🟢' : sim.signal === 'yellow' ? '🟡' : '🔴';
      console.log(`  - ${sim.delta}: 생존 ${sim.survivalMonths}개월 (${signalEmoji} ${sim.signal})`);
    });
  }
  
  return {
    finance: financeResult,
    decision: decisionResult
  };
}

// 직접 실행 시 (예제)
if (require.main === module) {
  // 기본 예제 (사용자가 입력값을 제공하지 않은 경우)
  console.log('⚠️ 사용자 입력값이 필요합니다.');
  console.log('\n필요한 입력값:');
  console.log('1. initialInvestment: 초기 투자금 (원)');
  console.log('2. monthlyRent: 월세 (원)');
  console.log('3. area: 평수 (평)');
  console.log('4. ownerWorking: 점주 근무 여부 (true/false)');
  console.log('5. targetDailySales: 목표 일 판매량 (잔)');
  console.log('6. expectedDailySales: 상권 기대 판매량 (잔, 선택적)');
  console.log('7. scenarios: 시나리오 배열 (선택적, 예: [200, 250, 300])');
  console.log('\n사용 예시:');
  console.log('calculateDunkin({');
  console.log('  initialInvestment: 200000000,');
  console.log('  monthlyRent: 4000000,');
  console.log('  area: 10,');
  console.log('  ownerWorking: true,');
  console.log('  targetDailySales: 300,');
  console.log('  expectedDailySales: 250');
  console.log('}).then(result => {');
  console.log('  console.log(result);');
  console.log('});');
}

module.exports = {
  calculateDunkin
};
