/**
 * 샘플 리포트 생성
 * 
 * 임의의 입력값으로 리포트 생성
 */

const { calculate: calculateDecision } = require('./decision');
const { calculate: calculateFinance } = require('./finance');
const fs = require('fs');
const path = require('path');

async function generateSampleReport() {
  console.log('샘플 리포트 생성 중...\n');

  // 샘플 브랜드 데이터
  const brand = {
    id: "brand_mega",
    name: "메가커피",
    defaults: {
      avgPrice: 3500,
      cogsRate: 0.35,
      laborRate: 0.20,
      utilitiesRate: 0.03,
      royaltyRate: 0.05,
      marketingRate: 0.02,
      etcFixed: 1100000,
      ownerWorkingMultiplier: 0.6,
      expectedDailySales: null
    },
    exitDefaults: {
      contractYears: 3,
      penaltyRule: "remaining_months",
      monthlyRoyalty: 300000,
      fixedPenalty: 0,
      interiorCostRatio: 0.35,
      interiorSalvageCurve: [
        { from: 0, to: 6, salvageRate: 0.05 },
        { from: 6, to: 12, salvageRate: 0.10 },
        { from: 12, to: 18, salvageRate: 0.20 },
        { from: 18, to: 60, salvageRate: 0.30 }
      ],
      goodwillRecoveryCurve: [
        { from: 0, to: 6, recoveryRate: 0.00 },
        { from: 6, to: 12, recoveryRate: 0.10 },
        { from: 12, to: 18, recoveryRate: 0.30 },
        { from: 18, to: 60, recoveryRate: 0.60 }
      ]
    }
  };

  // 샘플 입력 조건
  const conditions = {
    initialInvestment: 250000000,  // 초기 투자금 2.5억원
    monthlyRent: 5000000,          // 월세 500만원
    area: 15,                      // 15평
    ownerWorking: true,            // 점주 근무
    exitInputs: {
      keyMoney: 80000000,          // 권리금 8천만원
      pyeong: 15,                  // 평수
      demolitionBase: 15000000,    // 철거 기본비
      demolitionPerPyeong: 1000000 // 평당 철거비
    }
  };

  // 샘플 상권 정보
  const market = {
    expectedDailySales: 280,       // 상권 평균 일 판매량
    radiusM: 500,
    marketScore: 75,
    competitors: { total: 3, density: "medium" },
    tradeAreaType: "office",        // 오피스 상권
    dayType: "weekday",            // 평일
    footTrafficIndex: 1.15,        // 유동인구 +15%
    timeProfileKey: "takeout_franchise"
  };

  // 샘플 로드뷰 분석
  const roadview = {
    overallRisk: "low",
    riskScore: 75
  };

  const targetDailySales = 320;  // 목표 일 판매량

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

  // 리포트 생성
  let report = `# StartSmart 창업 분석 리포트 (샘플)\n\n`;
  report += `**생성일시**: ${new Date().toLocaleString('ko-KR')}\n`;
  report += `**브랜드**: ${brand.name}\n`;
  report += `**분석 위치**: 오피스 상권 (샘플)\n\n`;
  report += `---\n\n`;

  // 1. Executive Summary
  report += `## 📋 1. EXECUTIVE SUMMARY (최종 판정)\n\n`;
  report += `### 시스템 판정\n\n`;
  report += `| 항목 | 내용 |\n`;
  report += `|------|------|\n`;
  report += `| **신호등** | ${decision.finalJudgement.signal === 'green' ? '🟢' : decision.finalJudgement.signal === 'yellow' ? '🟡' : '🔴'} **${decision.finalJudgement.signal.toUpperCase()} - ${decision.finalJudgement.label}** |\n`;
  report += `| **판정 요약** | ${decision.finalJudgement.summary} |\n`;
  report += `| **시스템 판정 (컨설팅으로 변경 불가)** | ${decision.finalJudgement.nonNegotiable ? '예' : '아니오'} |\n`;
  if (decision.finalJudgement.primaryReason) {
    report += `| **주요 판정 사유** | ${decision.finalJudgement.primaryReason} |\n`;
  }
  report += `\n> ⚠️ **중요**: 이 판정은 StartSmart Decision Engine의 시스템 판정입니다.\n`;
  report += `> AI 컨설팅 코멘트는 별도로 제공되며, 시스템 판정과 구분됩니다.\n\n`;
  report += `---\n\n`;

  // 2. 핵심 지표
  report += `## 📊 2. 핵심 지표\n\n`;
  report += `| 지표 | 값 |\n`;
  report += `|------|-----|\n`;
  report += `| **종합 점수** | ${decision.score}점 (성공 확률: ${(decision.successProbability * 100).toFixed(1)}%) |\n`;
  report += `| **예상 생존 기간** | ${decision.survivalMonths}개월 |\n`;
  report += `| **리스크 레벨** | ${decision.riskLevel.toUpperCase()} |\n`;
  if (decision.exitPlan) {
    const { exitTiming } = decision.exitPlan;
    report += `| **최적 손절 시점** | ${exitTiming.optimalExitMonth}개월 |\n`;
    report += `| **최적 손절 총손실** | ${(exitTiming.optimalExitTotalLoss / 10000).toFixed(0)}만원 |\n`;
    report += `| **트랩존 시작** | ${exitTiming.trapZoneStartMonth}개월 |\n`;
  }
  report += `\n---\n\n`;

  // 3. 손익 분석
  report += `## 💰 3. 손익 분석\n\n`;
  report += `### 기본 손익 구조\n\n`;
  report += `| 항목 | 금액 |\n`;
  report += `|------|------:|\n`;
  report += `| 월 매출 | ${(finance.monthlyRevenue / 10000).toFixed(0)}만원 |\n`;
  report += `| 월 순이익 | ${(finance.monthlyProfit / 10000).toFixed(0)}만원 |\n`;
  report += `| 회수 기간 | ${finance.paybackMonths}개월 |\n`;
  report += `| 손익분기점 | ${finance.breakEvenDailySales}잔/일 |\n\n`;
  report += `### 목표 vs 기대치 분석\n\n`;
  report += `- **목표 일 판매량**: ${targetDailySales}잔\n`;
  report += `- **상권 기대 일 판매량**: ${finance.expected.expectedDailySales}잔\n`;
  report += `- **GAP**: ${(finance.expected.gapPctVsTarget * 100).toFixed(1)}%\n`;
  if (finance.expected.demandMultiplier) {
    report += `- **수요 배수 (demandMultiplier)**: ${finance.expected.demandMultiplier}\n`;
  }
  report += `\n---\n\n`;

  // 4. 하드컷 판정 근거
  if (decision.hardCutReasons.length > 0) {
    report += `## ⚠️ 4. 하드컷 판정 근거 (Hard Cut Reasons)\n\n`;
    decision.hardCutReasons.forEach(reason => {
      report += `- ${reason}\n`;
    });
    report += `\n> 하드컷 판정 근거가 있는 경우, 이는 컨설팅으로 변경할 수 없는 시스템 판정입니다.\n\n`;
    report += `---\n\n`;
  }

  // 5. 실패 트리거
  if (decision.failureTriggers.length > 0) {
    report += `## 🚨 5. 실패 트리거 (Failure Triggers)\n\n`;
    decision.failureTriggers.forEach((trigger, idx) => {
      report += `### 트리거 ${idx + 1}: ${trigger.trigger}\n\n`;
      report += `| 항목 | 내용 |\n`;
      report += `|------|------|\n`;
      report += `| 트리거 | ${trigger.trigger} |\n`;
      report += `| 결과 | ${trigger.outcome} |\n`;
      report += `| 영향도 | ${trigger.impact.toUpperCase()} |\n`;
      report += `| 예상 실패 시점 | ${trigger.estimatedFailureWindow} |\n`;
      
      if (decision.exitPlan && decision.exitPlan.exitTiming.totalLossSeries) {
        const series = decision.exitPlan.exitTiming.totalLossSeries;
        const midMonth = trigger.estimatedFailureWindow.includes('~') 
          ? Math.floor((parseInt(trigger.estimatedFailureWindow) + parseInt(trigger.estimatedFailureWindow.split('~')[1])) / 2)
          : parseInt(trigger.estimatedFailureWindow) || 18;
        const monthIndex = Math.min(midMonth - 1, series.length - 1);
        const lossAtFailure = series[monthIndex]?.totalLoss || 0;
        const exitCostAtFailure = series[monthIndex]?.exitCostTotal || 0;
        report += `| 그때 총손실 | ${(lossAtFailure / 10000).toFixed(0)}만원 |\n`;
        report += `| 그때 Exit 비용 | ${(exitCostAtFailure / 10000).toFixed(0)}만원 |\n`;
      }
      report += `\n`;
    });
    report += `---\n\n`;
  }

  // 6. 주요 리스크
  if (decision.riskCards.length > 0) {
    report += `## ⚠️ 6. 주요 리스크\n\n`;
    decision.riskCards.forEach((card, idx) => {
      report += `### ${idx + 1}. ${card.title} [${card.severity.toUpperCase()}]\n\n`;
      report += `${card.narrative}\n\n`;
    });
    report += `---\n\n`;
  }

  // 7. 개선 시뮬레이션
  if (decision.improvementSimulations.length > 0) {
    report += `## 📈 7. 개선 시뮬레이션\n\n`;
    const baseOptimalLoss = decision.exitPlan?.exitTiming?.optimalExitTotalLoss || 0;
    
    decision.improvementSimulations.forEach((sim, idx) => {
      report += `### 시뮬레이션 ${idx + 1}: ${sim.delta}\n\n`;
      report += `| 항목 | 결과 |\n`;
      report += `|------|------|\n`;
      report += `| 변경 내용 | ${sim.delta} |\n`;
      report += `| 생존 기간 | ${sim.survivalMonths}개월 |\n`;
      report += `| 신호등 변화 | ${sim.signalChange || `${sim.signal} → ${sim.signal}`} |\n`;
      if (sim.thresholdCrossed && sim.thresholdCrossed.length > 0) {
        report += `| 임계값 교차 | ${sim.thresholdCrossed.join(', ')} |\n`;
      }
      if (sim.optimalExitTotalLoss !== undefined) {
        const savings = baseOptimalLoss - sim.optimalExitTotalLoss;
        if (savings > 0) {
          report += `| 최적 손절 총손실 절감 | ${(savings / 10000).toFixed(0)}만원 |\n`;
        }
      }
      report += `\n`;
    });
    report += `---\n\n`;
  }

  // 8. 손절 타이밍 설계
  if (decision.exitPlan) {
    report += `## ⏰ 8. 손절 타이밍 설계 (Exit Timing Plan)\n\n`;
    report += `이 분석은 "성공하면 얼마를 버는가" 뿐 아니라, **실패 시 손실을 최소화하는 손절 타이밍**을 함께 제시합니다.\n\n`;
    
    const { exitTiming } = decision.exitPlan;
    const series = exitTiming.totalLossSeries || [];
    
    const lossAtWarning = series[exitTiming.warningMonth - 1]?.totalLoss || 0;
    const lossAtTrap = series[exitTiming.trapZoneStartMonth - 1]?.totalLoss || 0;
    
    report += `| 구분 | 시점(개월) | 의미 | 그 시점 총손실 |\n`;
    report += `|------|-----------:|------|---------------:|\n`;
    report += `| 경고 구간 | ${exitTiming.warningMonth} | 적자 구조 고착 신호 | ${(lossAtWarning / 10000).toFixed(0)}만원 |\n`;
    report += `| **최적 손절** | **${exitTiming.optimalExitMonth}** | **손실 최소** | **${(exitTiming.optimalExitTotalLoss / 10000).toFixed(0)}만원** |\n`;
    report += `| 손실 폭증 | ${exitTiming.trapZoneStartMonth} | 지연 손절 리스크 | ${(lossAtTrap / 10000).toFixed(0)}만원 |\n\n`;
    
    report += `### 핵심 메시지\n\n`;
    report += `- **결론**: 이 조건에서는 **${exitTiming.optimalExitMonth}개월 시점이 손실이 최소**입니다.\n`;
    report += `- **주의**: **${exitTiming.trapZoneStartMonth}개월 이후** 손절이 지연되면 손실이 가속될 가능성이 큽니다.\n`;
    report += `- **비교**: 최적 손절 이후 6개월 더 운영 시 **추가 손실 +${(exitTiming.keepGoingDeltaLoss_6m / 10000).toFixed(0)}만원**이 발생할 수 있습니다.\n\n`;
    report += `---\n\n`;
  }

  // 9. 폐업 비용 상세
  if (decision.exitPlan) {
    report += `## 💸 9. 폐업(Exit) 비용 상세 (Exit Cost Breakdown)\n\n`;
    const { exitScenario } = decision.exitPlan;
    report += `폐업은 "그만두는 선택"이 아니라 **추가 비용이 발생하는 이벤트**입니다. 아래는 ${exitScenario.assumedExitMonth}개월에 폐업한다고 가정했을 때의 비용 구조입니다.\n\n`;
    
    report += `| 항목 | 금액 |\n`;
    report += `|------|------:|\n`;
    report += `| 가맹 위약금 | ${(exitScenario.breakdown.penaltyCost / 10000).toFixed(0)}만원 |\n`;
    report += `| 철거/원상복구 | ${(exitScenario.breakdown.demolitionCost / 10000).toFixed(0)}만원 |\n`;
    report += `| 인테리어/설비 손실(비회수) | ${(exitScenario.breakdown.interiorLoss / 10000).toFixed(0)}만원 |\n`;
    report += `| 권리금 회수(감액) | -${(exitScenario.breakdown.goodwillRecovered / 10000).toFixed(0)}만원 |\n`;
    report += `| **Exit Cost 합계** | **${(exitScenario.exitCostTotal / 10000).toFixed(0)}만원** |\n`;
    report += `| 운영손실 누적(폐업 시점까지) | ${(exitScenario.operatingLossUntilExit / 10000).toFixed(0)}만원 |\n`;
    report += `| **최종 총손실** | **${(exitScenario.finalTotalLoss / 10000).toFixed(0)}만원** |\n\n`;
    
    report += `### 비용 구조 해석\n\n`;
    report += `- **위약금**: 계약 기간이 만료되어 위약금이 없습니다.\n`;
    report += `- **철거/원복**: 인테리어 철거 및 원상복구 비용입니다.\n`;
    report += `- **인테리어 손실**: 초기 투자금 중 인테리어/설비 비중의 비회수 부분입니다.\n`;
    report += `- **권리금 회수**: ${exitScenario.assumedExitMonth}개월 시점 기준 권리금의 일부를 회수할 수 있습니다.\n\n`;
    report += `---\n\n`;
  }

  // 10. 판정 신뢰도
  report += `## 🔍 10. 판정 신뢰도 (Decision Confidence)\n\n`;
  report += `| 항목 | 수준 |\n`;
  report += `|------|------|\n`;
  report += `| **데이터 커버리지** | ${decision.decisionConfidence.dataCoverage.toUpperCase()} |\n`;
  report += `| **가정 리스크** | ${decision.decisionConfidence.assumptionRisk.toUpperCase()} |\n`;
  report += `| **판정 안정성** | ${decision.decisionConfidence.judgementStability.toUpperCase()} |\n\n`;
  report += `---\n\n`;

  // 11. 점수 Breakdown
  report += `## 📊 11. 점수 Breakdown\n\n`;
  report += `| 항목 | 점수 | 평가 |\n`;
  report += `|------|------|------|\n`;
  const breakdown = decision.breakdown;
  report += `| 회수 기간 | ${breakdown.payback}점 | ${breakdown.payback >= 80 ? '우수' : breakdown.payback >= 60 ? '양호' : '보통'} |\n`;
  report += `| 수익성 | ${breakdown.profitability}점 | ${breakdown.profitability >= 80 ? '우수' : breakdown.profitability >= 60 ? '양호' : '보통'} |\n`;
  report += `| GAP | ${breakdown.gap}점 | ${breakdown.gap >= 80 ? '우수' : breakdown.gap >= 60 ? '양호' : '보통'} |\n`;
  report += `| 민감도 | ${breakdown.sensitivity}점 | ${breakdown.sensitivity >= 80 ? '우수' : breakdown.sensitivity >= 60 ? '양호' : '보통'} |\n`;
  report += `| 고정비 | ${breakdown.fixedCost}점 | ${breakdown.fixedCost >= 80 ? '우수' : breakdown.fixedCost >= 60 ? '양호' : '보통'} |\n`;
  if (breakdown.dscr) {
    report += `| DSCR | ${breakdown.dscr}점 | ${breakdown.dscr >= 80 ? '우수' : breakdown.dscr >= 60 ? '양호' : '보통'} |\n`;
  }
  report += `| 상권 | ${breakdown.market}점 | ${breakdown.market >= 80 ? '우수' : breakdown.market >= 60 ? '양호' : '보통'} |\n`;
  report += `| 로드뷰 | ${breakdown.roadview}점 | ${breakdown.roadview >= 80 ? '우수' : breakdown.roadview >= 60 ? '양호' : '보통'} |\n\n`;
  report += `---\n\n`;

  // 결론
  report += `## 📝 결론\n\n`;
  report += `### 시스템 최종 판정\n\n`;
  report += `**${decision.finalJudgement.summary}**\n\n`;
  report += `### 핵심 포인트\n\n`;
  report += `1. **종합 점수 ${decision.score}점**: ${decision.score >= 70 ? '기본적인 창업 조건을 충족' : decision.score >= 50 ? '조건부 리스크가 존재' : '위험한 창업 조건'}합니다.\n`;
  report += `2. **생존 기간 ${decision.survivalMonths}개월**: ${decision.survivalMonths >= 36 ? '기준선 이상' : '기준선 미만'}으로 ${decision.survivalMonths >= 36 ? '안정적' : '주의'}합니다.\n`;
  report += `3. **GAP ${(finance.expected.gapPctVsTarget * 100).toFixed(1)}%**: 목표 판매량 달성을 위한 ${finance.expected.gapPctVsTarget > 0.15 ? '마케팅 전략이 필요' : '현실적인 목표 설정'}합니다.\n`;
  if (decision.exitPlan) {
    report += `4. **최적 손절 시점**: ${decision.exitPlan.exitTiming.optimalExitMonth}개월 시점에 손절하면 손실이 최소화됩니다.\n`;
  }
  report += `\n---\n\n`;
  report += `## 📌 리포트 정보\n\n`;
  report += `- **리포트 유형**: 시스템 판정 리포트 (Decision Engine Output)\n`;
  report += `- **AI 컨설팅**: 별도 제공\n`;
  report += `- **데이터 출처**: StartSmart Decision Engine v1.0\n\n`;
  report += `---\n\n`;
  report += `*이 리포트는 StartSmart Decision Engine의 시스템 판정입니다.\n`;
  report += `AI 컨설팅 코멘트는 별도로 제공되며, 시스템 판정과 구분됩니다.*\n`;

  // 파일 저장
  const outputPath = path.join(__dirname, 'SAMPLE_REPORT.md');
  fs.writeFileSync(outputPath, report, 'utf8');
  console.log(`✅ 샘플 리포트가 생성되었습니다: ${outputPath}\n`);
  
  // 콘솔에도 출력
  console.log(report);
}

// 실행
generateSampleReport().catch(console.error);
