/**
 * Fixture: 메가커피 강남/역삼 시나리오
 * 
 * PDF 느낌 재현 테스트용
 * 목표: score 60대 / survival 30대 / gap 10~20%
 */

const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');
const { getBrandForEngine } = require('../data_local/brandLoader');

// 메가커피 브랜드 데이터 로드 (PDF 데이터 기반)
// 비동기 로드 필요 - runTest 함수 내에서 처리
let brandMega = null;

// 강남구 조건 (docs/초기 투자비 참고)
// 생존 30대 목표를 위해 회수 기간을 약간 늘림
const conditionsGangnam = {
  initialInvestment: 220000000,  // 초기 투자금 2.2억원 (약간 증가)
  monthlyRent: 4000000,          // 월세 400만원
  area: 10,                      // 10평
  ownerWorking: true             // 점주 근무
};

// 상권 정보 (강남/역삼 느낌 - 경쟁 치열, 리스크 높음)
const marketGangnam = {
  expectedDailySales: 256,       // 상권 평균 일 판매량 (AI 기대치)
  radiusM: 500,                  // 반경 500m
  competitors: {
    total: 5,
    density: "high"
  },
  marketScore: 55               // 상권 점수 (경쟁 과밀로 낮음, 점수 60대 목표)
};

// 로드뷰 분석 결과
const roadviewGangnam = {
  overallRisk: "medium",
  riskScore: 55                 // 로드뷰 리스크 점수 (점수 60대 목표)
};

// 목표 일 판매량
const targetDailySales = 300;

// 시나리오 배열
const scenarios = [200, 250, 300];

/**
 * 테스트 실행
 */
async function runTest() {
  console.log('=== 메가커피 강남/역삼 시나리오 테스트 ===\n');
  
  // 브랜드 데이터 로드 (DB → data_local fallback)
  brandMega = await getBrandForEngine('brand_mega');
  
  if (!brandMega) {
    console.error('❌ 브랜드를 찾을 수 없습니다: brand_mega');
    return;
  }

  // 1. 손익 계산
  const financeInput = {
    brand: brandMega,
    conditions: conditionsGangnam,
    market: marketGangnam,
    targetDailySales: targetDailySales,
    scenarios: scenarios
  };

  const financeResult = calculateFinance(financeInput);

  console.log('📊 손익 계산 결과:');
  console.log(`- 월 매출: ${(financeResult.monthlyRevenue / 10000).toFixed(0)}만원`);
  console.log(`- 월 순이익: ${(financeResult.monthlyProfit / 10000).toFixed(0)}만원`);
  console.log(`- 회수 기간: ${financeResult.paybackMonths}개월`);
  console.log(`- 기대 판매량: ${financeResult.expected.expectedDailySales}잔`);
  console.log(`- GAP: ${(financeResult.expected.gapPctVsTarget * 100).toFixed(1)}%`);
  console.log('\n📈 시나리오 테이블:');
  financeResult.scenarioTable.forEach(scenario => {
    console.log(`  ${scenario.daily}잔: 순이익 ${(scenario.profit / 10000).toFixed(0)}만원, 회수 ${scenario.paybackMonths}개월`);
  });

  // 2. 판단 계산
  const decisionInput = {
    finance: financeResult,
    market: marketGangnam,
    roadview: roadviewGangnam,
    conditions: conditionsGangnam,
    brand: brandMega,
    targetDailySales: targetDailySales
  };

  const decisionResult = calculateDecision(decisionInput);

  console.log('\n🎯 판단 결과:');
  console.log(`- 점수: ${decisionResult.score}`);
  console.log(`- 성공 확률: ${(decisionResult.successProbability * 100).toFixed(1)}%`);
  console.log(`- 신호등: ${decisionResult.signal}`);
  console.log(`- 생존 개월: ${decisionResult.survivalMonths}개월`);
  console.log(`- 리스크 레벨: ${decisionResult.riskLevel}`);

  console.log('\n⚠️ 리스크 카드:');
  if (decisionResult.riskCards && decisionResult.riskCards.length > 0) {
    decisionResult.riskCards.forEach((risk, idx) => {
      console.log(`  ${idx + 1}. ${risk.title} (${risk.severity})`);
      console.log(`     ${risk.narrative}`);
    });
  } else if (decisionResult.riskFactors && decisionResult.riskFactors.length > 0) {
    // 레거시 fallback
    decisionResult.riskFactors.forEach((risk, idx) => {
      console.log(`  ${idx + 1}. ${risk}`);
    });
  }

  console.log('\n💡 개선 시뮬레이션:');
  decisionResult.improvementSimulations.forEach(sim => {
    console.log(`  - ${sim.delta}: 생존 ${sim.survivalMonths}개월 (${sim.signal})`);
  });

  // 3. 검증
  console.log('\n✅ 검증:');
  const scoreOk = decisionResult.score >= 60 && decisionResult.score < 70;
  const survivalOk = decisionResult.survivalMonths >= 30 && decisionResult.survivalMonths < 40;
  const gapOk = financeResult.expected.gapPctVsTarget >= 0.10 && financeResult.expected.gapPctVsTarget <= 0.20;

  console.log(`- 점수 60대: ${scoreOk ? '✅' : '❌'} (${decisionResult.score})`);
  console.log(`- 생존 30대: ${survivalOk ? '✅' : '❌'} (${decisionResult.survivalMonths})`);
  console.log(`- GAP 10~20%: ${gapOk ? '✅' : '❌'} (${(financeResult.expected.gapPctVsTarget * 100).toFixed(1)}%)`);

  if (scoreOk && survivalOk && gapOk) {
    console.log('\n🎉 모든 검증 통과! PDF 느낌 재현 성공!');
  } else {
    console.log('\n⚠️ 일부 검증 실패. 파라미터 조정 필요.');
  }

  return {
    finance: financeResult,
    decision: decisionResult,
    validation: {
      scoreOk,
      survivalOk,
      gapOk
    }
  };
}

// 직접 실행 시
if (require.main === module) {
  runTest().catch(error => {
    console.error('에러 발생:', error);
    process.exit(1);
  });
}

module.exports = {
  brandMega,
  conditionsGangnam,
  marketGangnam,
  roadviewGangnam,
  targetDailySales,
  scenarios,
  runTest
};
