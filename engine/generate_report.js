/**
 * 엔진 결과 리포트 생성
 * 
 * 실제 엔진 실행 결과를 리포트 형식으로 출력
 */

const { calculate: calculateDecision } = require('./decision');
const { calculate: calculateFinance } = require('./finance');
const { getBrandForEngine } = require('./data_local/brandLoader');

async function generateReport() {
  console.log('='.repeat(80));
  console.log('StartSmart 창업 분석 리포트');
  console.log('='.repeat(80));
  console.log('');

  // 브랜드 데이터 로드
  const brand = await getBrandForEngine('brand_mega');
  if (!brand) {
    console.error('❌ 브랜드를 찾을 수 없습니다.');
    return;
  }

  // 입력 조건
  const conditions = {
    initialInvestment: 200000000,  // 초기 투자금 2억원
    monthlyRent: 4000000,          // 월세 400만원
    area: 10,                      // 10평
    ownerWorking: true,            // 점주 근무
    // Exit Plan 입력값 (예시)
    exitInputs: {
      keyMoney: 50000000,          // 권리금 5천만원
      pyeong: 10,                  // 평수
      demolitionBase: 15000000,    // 철거 기본비
      demolitionPerPyeong: 1000000 // 평당 철거비
    }
  };

  const market = {
    expectedDailySales: 256,       // 상권 평균 일 판매량
    radiusM: 500,
    marketScore: 70,
    competitors: { total: 5, density: "high" }
  };

  const roadview = {
    overallRisk: "medium",
    riskScore: 65
  };

  const targetDailySales = 300;  // 목표 일 판매량

  // Finance 계산
  const finance = calculateFinance({
    brand,
    conditions,
    market,
    targetDailySales
  });

  // Decision 계산
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions,
    brand,
    targetDailySales
  });

  // ============================================
  // 리포트 출력
  // ============================================

  // 1. Executive Summary (최종 판정)
  console.log('📋 1. EXECUTIVE SUMMARY (최종 판정)');
  console.log('-'.repeat(80));
  console.log(`신호등: ${decision.finalJudgement.signal.toUpperCase()} - ${decision.finalJudgement.label}`);
  console.log(`판정 요약: ${decision.finalJudgement.summary}`);
  console.log(`시스템 판정 (컨설팅으로 변경 불가): ${decision.finalJudgement.nonNegotiable ? '예' : '아니오'}`);
  if (decision.finalJudgement.primaryReason) {
    console.log(`주요 판정 사유: ${decision.finalJudgement.primaryReason}`);
  }
  console.log('');

  // 2. 핵심 지표
  console.log('📊 2. 핵심 지표');
  console.log('-'.repeat(80));
  console.log(`종합 점수: ${decision.score}점 (성공 확률: ${(decision.successProbability * 100).toFixed(1)}%)`);
  console.log(`예상 생존 기간: ${decision.survivalMonths}개월`);
  console.log(`리스크 레벨: ${decision.riskLevel.toUpperCase()}`);
  
  // Exit Plan KPI 추가
  if (decision.exitPlan) {
    const { exitTiming } = decision.exitPlan;
    console.log(`최적 손절 시점: ${exitTiming.optimalExitMonth}개월`);
    console.log(`최적 손절 총손실: ${(exitTiming.optimalExitTotalLoss / 10000).toFixed(0)}만원`);
    console.log(`트랩존 시작: ${exitTiming.trapZoneStartMonth}개월`);
  }
  console.log('');

  // 3. 손익 분석
  console.log('💰 3. 손익 분석');
  console.log('-'.repeat(80));
  console.log(`월 매출: ${(finance.monthlyRevenue / 10000).toFixed(0)}만원`);
  console.log(`월 순이익: ${(finance.monthlyProfit / 10000).toFixed(0)}만원`);
  console.log(`회수 기간: ${finance.paybackMonths}개월`);
  console.log(`손익분기점: ${finance.breakEvenDailySales}잔/일`);
  console.log(`목표 vs 기대 GAP: ${(finance.expected.gapPctVsTarget * 100).toFixed(1)}%`);
  console.log('');

  // 4. 하드컷 판정 근거
  if (decision.hardCutReasons.length > 0) {
    console.log('⚠️ 4. 하드컷 판정 근거 (Hard Cut Reasons)');
    console.log('-'.repeat(80));
    decision.hardCutReasons.forEach(reason => {
      console.log(`  - ${reason}`);
    });
    console.log('');
  }

  // 5. 실패 트리거 (Failure Triggers)
  if (decision.failureTriggers.length > 0) {
    console.log('🚨 5. 실패 트리거 (Failure Triggers)');
    console.log('-'.repeat(80));
    decision.failureTriggers.forEach(trigger => {
      console.log(`트리거: ${trigger.trigger}`);
      console.log(`  → 결과: ${trigger.outcome}`);
      console.log(`  → 영향도: ${trigger.impact.toUpperCase()}`);
      console.log(`  → 예상 실패 시점: ${trigger.estimatedFailureWindow}`);
      
      // 손실/ExitCost 추가
      if (decision.exitPlan && decision.exitPlan.exitTiming.totalLossSeries) {
        const series = decision.exitPlan.exitTiming.totalLossSeries;
        // estimatedFailureWindow에서 중간 개월 추정 (예: "18~24개월" → 21개월)
        const midMonth = trigger.estimatedFailureWindow.includes('~') 
          ? Math.floor((parseInt(trigger.estimatedFailureWindow) + parseInt(trigger.estimatedFailureWindow.split('~')[1])) / 2)
          : parseInt(trigger.estimatedFailureWindow) || 18;
        const monthIndex = Math.min(midMonth - 1, series.length - 1);
        const lossAtFailure = series[monthIndex]?.totalLoss || 0;
        const exitCostAtFailure = series[monthIndex]?.exitCostTotal || 0;
        console.log(`  → 그때 총손실: ${(lossAtFailure / 10000).toFixed(0)}만원`);
        console.log(`  → 그때 Exit 비용: ${(exitCostAtFailure / 10000).toFixed(0)}만원`);
      }
      console.log('');
    });
  }

  // 6. 리스크 카드
  if (decision.riskCards.length > 0) {
    console.log('⚠️ 6. 주요 리스크');
    console.log('-'.repeat(80));
    decision.riskCards.forEach((card, idx) => {
      console.log(`${idx + 1}. ${card.title} [${card.severity.toUpperCase()}]`);
      console.log(`   ${card.narrative}`);
      console.log('');
    });
  }

  // 7. 개선 시뮬레이션
  if (decision.improvementSimulations.length > 0) {
    console.log('📈 7. 개선 시뮬레이션');
    console.log('-'.repeat(80));
    const baseOptimalLoss = decision.exitPlan?.exitTiming?.optimalExitTotalLoss || 0;
    
    decision.improvementSimulations.forEach(sim => {
      console.log(`변경: ${sim.delta}`);
      console.log(`  → 생존 기간: ${sim.survivalMonths}개월`);
      console.log(`  → 신호등: ${sim.signal} ${sim.signalChange ? `(${sim.signalChange})` : ''}`);
      if (sim.thresholdCrossed && sim.thresholdCrossed.length > 0) {
        console.log(`  → 임계값 교차: ${sim.thresholdCrossed.join(', ')}`);
      }
      
      // 절감액 추가 (MVP에서는 baseOptimalLoss와 비교, 향후 시뮬레이션별 exitPlan 계산 가능)
      if (sim.optimalExitTotalLoss !== undefined) {
        const savings = baseOptimalLoss - sim.optimalExitTotalLoss;
        if (savings > 0) {
          console.log(`  → 최적 손절 총손실 절감: ${(savings / 10000).toFixed(0)}만원`);
        }
      }
      console.log('');
    });
  }

  // 8. 손절 타이밍 설계 (Exit Timing Plan) - 신규 섹션
  if (decision.exitPlan) {
    console.log('⏰ 8. 손절 타이밍 설계 (Exit Timing Plan)');
    console.log('-'.repeat(80));
    console.log('이 분석은 "성공하면 얼마를 버는가" 뿐 아니라, **실패 시 손실을 최소화하는 손절 타이밍**을 함께 제시합니다.');
    console.log('');
    
    const { exitTiming } = decision.exitPlan;
    const series = exitTiming.totalLossSeries || [];
    
    // lossAtWarning, lossAtTrap 계산
    const lossAtWarning = series[exitTiming.warningMonth - 1]?.totalLoss || 0;
    const lossAtTrap = series[exitTiming.trapZoneStartMonth - 1]?.totalLoss || 0;
    
    console.log('| 구분 | 시점(개월) | 의미 | 그 시점 총손실 |');
    console.log('|------|-----------:|------|---------------:|');
    console.log(`| 경고 구간 | ${exitTiming.warningMonth} | 적자 구조 고착 신호 | ${(lossAtWarning / 10000).toFixed(0)}만원 |`);
    console.log(`| **최적 손절** | **${exitTiming.optimalExitMonth}** | **손실 최소** | **${(exitTiming.optimalExitTotalLoss / 10000).toFixed(0)}만원** |`);
    console.log(`| 손실 폭증 | ${exitTiming.trapZoneStartMonth} | 지연 손절 리스크 | ${(lossAtTrap / 10000).toFixed(0)}만원 |`);
    console.log('');
    console.log(`- 결론: 이 조건에서는 **${exitTiming.optimalExitMonth}개월 시점이 손실이 최소**입니다.`);
    console.log(`- 주의: **${exitTiming.trapZoneStartMonth}개월 이후** 손절이 지연되면 손실이 가속될 가능성이 큽니다.`);
    console.log(`- 비교: 최적 손절 이후 6개월 더 운영 시 **추가 손실 +${(exitTiming.keepGoingDeltaLoss_6m / 10000).toFixed(0)}만원**이 발생할 수 있습니다.`);
    console.log('');
  }

  // 9. 폐업(Exit) 비용 상세 (Exit Cost Breakdown) - 신규 섹션
  if (decision.exitPlan) {
    console.log('💸 9. 폐업(Exit) 비용 상세 (Exit Cost Breakdown)');
    console.log('-'.repeat(80));
    const { exitScenario } = decision.exitPlan;
    console.log(`폐업은 "그만두는 선택"이 아니라 **추가 비용이 발생하는 이벤트**입니다. 아래는 ${exitScenario.assumedExitMonth}개월에 폐업한다고 가정했을 때의 비용 구조입니다.`);
    console.log('');
    
    console.log('| 항목 | 금액 |');
    console.log('|------|------:|');
    console.log(`| 가맹 위약금 | ${(exitScenario.breakdown.penaltyCost / 10000).toFixed(0)}만원 |`);
    console.log(`| 철거/원상복구 | ${(exitScenario.breakdown.demolitionCost / 10000).toFixed(0)}만원 |`);
    console.log(`| 인테리어/설비 손실(비회수) | ${(exitScenario.breakdown.interiorLoss / 10000).toFixed(0)}만원 |`);
    console.log(`| 권리금 회수(감액) | -${(exitScenario.breakdown.goodwillRecovered / 10000).toFixed(0)}만원 |`);
    console.log(`| **Exit Cost 합계** | **${(exitScenario.exitCostTotal / 10000).toFixed(0)}만원** |`);
    console.log(`| 운영손실 누적(폐업 시점까지) | ${(exitScenario.operatingLossUntilExit / 10000).toFixed(0)}만원 |`);
    console.log(`| **최종 총손실** | **${(exitScenario.finalTotalLoss / 10000).toFixed(0)}만원** |`);
    console.log('');
  }

  // 10. 판정 신뢰도
  console.log('🔍 10. 판정 신뢰도 (Decision Confidence)');
  console.log('-'.repeat(80));
  console.log(`데이터 커버리지: ${decision.decisionConfidence.dataCoverage.toUpperCase()}`);
  console.log(`가정 리스크: ${decision.decisionConfidence.assumptionRisk.toUpperCase()}`);
  console.log(`판정 안정성: ${decision.decisionConfidence.judgementStability.toUpperCase()}`);
  console.log('');

  // 11. 점수 Breakdown
  console.log('📊 11. 점수 Breakdown');
  console.log('-'.repeat(80));
  const breakdown = decision.breakdown;
  console.log(`회수 기간 점수: ${breakdown.payback}점`);
  console.log(`수익성 점수: ${breakdown.profitability}점`);
  console.log(`GAP 점수: ${breakdown.gap}점`);
  console.log(`민감도 점수: ${breakdown.sensitivity}점`);
  console.log(`고정비 점수: ${breakdown.fixedCost}점`);
  if (breakdown.dscr) {
    console.log(`DSCR 점수: ${breakdown.dscr}점`);
  }
  console.log(`상권 점수: ${breakdown.market}점`);
  console.log(`로드뷰 점수: ${breakdown.roadview}점`);
  console.log('');

  // 12. 결론
  console.log('='.repeat(80));
  console.log('결론');
  console.log('='.repeat(80));
  console.log(decision.finalJudgement.summary);
  console.log('');
  console.log(`이 리포트는 StartSmart Decision Engine의 시스템 판정입니다.`);
  console.log(`AI 컨설팅 코멘트는 별도로 제공됩니다.`);
  console.log('');
}

// 실행
generateReport().catch(console.error);
