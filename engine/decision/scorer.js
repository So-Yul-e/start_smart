/**
 * 점수 산출 및 판단 로직
 * 
 * - 점수 계산
 * - 신호등 판단
 * - 생존 개월 수 추정 (36 기준선 감점형)
 * - 리스크 카드 생성
 */

/**
 * 하드컷 판정 근거 코드 (Hard Cut Reason Codes)
 * 
 * 판정 근거를 코드로 명시하여 리포트/대시보드/AI 설명에 공통 사용
 */
const HARD_CUT_REASONS = {
  SURVIVAL_LT_36: "생존기간 36개월 미만",
  PAYBACK_TOO_LONG: "회수 기간 과다 (36개월 이상)",
  FIXED_COST_HIGH: "고정비 구조 취약 (35% 이상)",
  SALES_GAP_HIGH: "목표 대비 매출 GAP 과다 (25% 이상)",
  SENSITIVITY_FAIL: "매출 변동 민감도 과다 (-10% 시 적자 전환)",
  NEGATIVE_PROFIT: "월 순이익 0 이하 (적자 상태)",
  DSCR_FAIL: "대출 상환 능력 부족 (DSCR < 1.0)",
  BRAND_DECLINE_HIGH: "브랜드 점포 감소율 과다 (30% 이상)"
};

/**
 * 점수 및 성공 확률 계산 (breakdown 포함)
 * @param {Object} finance - 손익 계산 결과
 * @param {Object} market - 상권 분석 결과
 * @param {Object} roadview - 로드뷰 분석 결과
 * @returns {Object} { score, successProbability, breakdown }
 */
function calculateScore(finance, market, roadview) {
  let score = 100;

  // ============================================
  // Breakdown 계산 (각 항목별 점수 0-100)
  // ============================================
  
  // 1. 회수 기간 점수 (paybackScore)
  let paybackScore = 100;
  let profitabilityScore = 100;
  let gapScore = 100;
  let sensitivityScore = 100;
  let fixedCostScore = 100;
  let dscrScore = 100;
  
  if (finance.paybackMonths !== null && isFinite(finance.paybackMonths)) {
    if (finance.paybackMonths > 36) {
      paybackScore = 50;  // 36개월 초과 시 50점
      score -= 30;
    } else if (finance.paybackMonths > 24) {
      paybackScore = 70;  // 24-36개월 시 70점
      score -= 15;
    } else if (finance.paybackMonths < 18) {
      paybackScore = 100; // 18개월 미만 시 만점
    } else {
      paybackScore = 85;  // 18-24개월 시 85점
    }
  } else {
    paybackScore = 0;  // null/Infinity인 경우 0점
    score -= 50;
  }

  // 2. 수익성 점수 (profitabilityScore)
  if (finance.monthlyProfit <= 0) {
    profitabilityScore = 0;  // 적자 시 0점
    score -= 50;
  } else if (finance.monthlyProfit < 5000000) {
    profitabilityScore = 60;  // 500만원 미만 시 60점
    score -= 20;
  } else {
    profitabilityScore = 100; // 500만원 이상 시 만점
  }

  // 3. GAP 점수 (gapScore) - adjustedExpectedDailySales 기준
  // adjustedExpectedDailySales가 있으면 그것을 기준으로, 없으면 기존 expectedDailySales 사용
  const adjustedExpected = finance.expected?.adjustedExpectedDailySales || finance.expected?.expectedDailySales;
  const gap = finance.expected?.gapPctVsTarget || 0;
  
  if (gap > 0.25) {
    gapScore = 50;  // GAP 25% 초과 시 50점
    score -= 20;
  } else if (gap > 0.15) {
    gapScore = 70;  // GAP 15-25% 시 70점
    score -= 10;
  } else if (gap > 0.10) {
    gapScore = 85;  // GAP 10-15% 시 85점
    score -= 5;
  } else {
    gapScore = 100; // GAP 10% 이하 시 만점
  }
  
  // 브랜드 점포 감소율 기반 점수 감점 (추가 감점은 아래에서 처리)

  // 4. 민감도 점수 (sensitivityScore)
  const minus10Profit = finance.sensitivity?.minus10?.monthlyProfit || finance.monthlyProfit;
  if (minus10Profit <= 0) {
    sensitivityScore = 30;  // -10%에 적자 전환 시 30점
  } else if (minus10Profit < finance.monthlyProfit * 0.5) {
    sensitivityScore = 60;  // 수익 급감 시 60점
  } else {
    sensitivityScore = 100; // 안정적 시 만점
  }

  // 5. 고정비 점수 (fixedCostScore)
  const fixedCostShare = (finance.monthlyCosts.rent + finance.monthlyCosts.labor) / finance.monthlyRevenue;
  if (fixedCostShare > 0.35) {
    fixedCostScore = 50;  // 고정비 비중 35% 초과 시 50점
    score -= 10;
  } else if (fixedCostShare > 0.30) {
    fixedCostScore = 70;  // 고정비 비중 30-35% 시 70점
    score -= 5;
  } else {
    fixedCostScore = 100; // 고정비 비중 30% 이하 시 만점
  }

  // 6. 대출 상환 능력 점수 (DSCR)
  const dscr = finance.debt?.dscr;
  if (dscr !== null && dscr !== undefined) {
    if (dscr < 1.0) {
      dscrScore = 0;  // DSCR < 1.0: 0점
    } else if (dscr < 1.2) {
      dscrScore = 50;  // 1.0 ≤ DSCR < 1.2: 50점
    } else if (dscr < 1.5) {
      dscrScore = 80;   // 1.2 ≤ DSCR < 1.5: 80점
    } else {
      dscrScore = 100;  // DSCR ≥ 1.5: 만점
    }
  }

  // --- ADD: DSCR score penalty ---
  const dscrPenalty = finance?.debt?.dscr ?? null;
  if (dscrPenalty !== null) {
    if (dscrPenalty < 1.0) score -= 35;
    else if (dscrPenalty < 1.2) score -= 15;
  }

  // --- ADD: Brand decline score penalty ---
  const decline = finance?.expected?.brandDeclineRate ?? 0;
  if (decline >= 0.30) score -= 30;
  else if (decline >= 0.20) score -= 15;
  else if (decline >= 0.10) score -= 7;

  // 7. 상권 점수 (marketScore)
  const marketScore = market?.marketScore || 70;

  // 8. 로드뷰 점수 (roadviewScore)
  const roadviewScore = roadview?.riskScore || 70;

  // ============================================
  // 최종 점수 계산
  // ============================================
  
  // 상권 점수 반영 (0-30점)
  score = score * 0.7 + marketScore * 0.3;

  // 로드뷰 리스크 반영
  score -= (100 - roadviewScore) * 0.2;

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  // 성공 확률 = 점수 / 100
  const successProbability = finalScore / 100;

  return {
    score: finalScore,
    successProbability,
    breakdown: {
      payback: Math.round(paybackScore),
      profitability: Math.round(profitabilityScore),
      gap: Math.round(gapScore),
      sensitivity: Math.round(sensitivityScore),
      fixedCost: Math.round(fixedCostScore),
      dscr: Math.round(dscrScore),
      market: Math.round(marketScore),
      roadview: Math.round(roadviewScore)
    }
  };
}

/**
 * 신호등 판단 (GAP/민감도/고정비 반영)
 * @param {Number} score - 점수 (0-100)
 * @param {Object} finance - 손익 계산 결과
 * @returns {String} "green" | "yellow" | "red"
 */
function determineSignal(score, finance) {
  // 🔴 하드컷 규칙
  // ⚠️ 중요: monthlyProfit <= 0일 때 paybackMonths = null이므로 null 체크 필요
  
  // --- ADD: DSCR hardcut ---
  const dscr2 = finance?.debt?.dscr ?? null;
  if (dscr2 !== null && dscr2 < 1.0) return "red";

  // --- ADD: Brand decline hardcut ---
  const decline2 = finance?.expected?.brandDeclineRate ?? 0;
  if (decline2 >= 0.30) return "red";
  
  if (
    finance.paybackMonths === null ||
    (isFinite(finance.paybackMonths) && finance.paybackMonths >= 36) ||
    finance.monthlyProfit <= 0
  ) {
    return "red";
  }

  // 🟡 주의 구간 (GAP/민감도/고정비/브랜드 감소율 반영)
  const gap = finance.expected?.gapPctVsTarget ?? 0;
  const minus10Profit = finance.sensitivity?.minus10?.monthlyProfit ?? finance.monthlyProfit;
  const fixedCostShare = (finance.monthlyCosts.rent + finance.monthlyCosts.labor) / finance.monthlyRevenue;

  // --- ADD: Brand decline soft downgrade ---
  if (decline2 >= 0.20 && score >= 70) {
    // 기존이 green으로 나올 상황이라도 decline이 크면 yellow로 하향
    // (이미 red로 return되는 케이스는 위에서 처리)
    return "yellow";
  }

  if (
    gap >= 0.15 ||                 // 목표가 상권 평균보다 15%↑
    minus10Profit <= 0 ||          // -10%에 적자
    fixedCostShare >= 0.35 ||      // 고정비 압박
    decline2 >= 0.20               // 브랜드 점포 20% 이상 감소
  ) {
    return "yellow";
  }

  // 🟢 안정
  if (score >= 70) return "green";
  if (score >= 50) return "yellow";
  return "red";
}  

/**
 * 생존 개월 수 추정 (36 기준선 감점형)
 * 
 * 기준선: 36개월
 * 감점 요인:
 * 1. paybackMonths (회수 기간)
 * 2. profitMargin (순이익률)
 * 3. revenue -10% 시 적자 전환 여부
 * 4. fixedCostShare (고정비 비중)
 * 
 * @param {Object} finance - 손익 계산 결과
 * @param {Object} market - 상권 분석 결과
 * @param {Object} roadview - 로드뷰 분석 결과
 * @returns {Number} 예상 생존 개월 수
 */
function estimateSurvivalMonths(finance, market, roadview) {
  // 기준선: 36개월
  const baseMonths = 36;
  let survivalMonths = baseMonths;

  // 감점 요인 1: 회수 기간이 길수록 감점 (null/Infinity 처리)
  if (finance.paybackMonths !== null && isFinite(finance.paybackMonths)) {
    if (finance.paybackMonths > 36) {
      survivalMonths -= (finance.paybackMonths - 36) * 1.5;  // 36개월 초과 시 강한 감점
    } else if (finance.paybackMonths > 24) {
      survivalMonths -= (finance.paybackMonths - 24) * 0.5;  // 24-36개월 구간 중간 감점
    }
  } else {
    survivalMonths -= 20;  // null/Infinity인 경우 강한 감점
  }

  // 감점 요인 2: 매출 -10% 시 적자 전환이면 큰 감점
  const minus10Profit = finance.sensitivity?.minus10?.monthlyProfit || finance.monthlyProfit;
  if (minus10Profit <= 0) {
    survivalMonths -= 15;  // 적자 전환 시 강한 감점
  } else if (minus10Profit < finance.monthlyProfit * 0.5) {
    survivalMonths -= 8;   // 수익 급감 시 중간 감점
  }

  // 감점 요인 3: 고정비 비중(임대+인건비)/매출이 높으면 감점
  const fixedCostShare = (finance.monthlyCosts.rent + finance.monthlyCosts.labor) / finance.monthlyRevenue;
  if (fixedCostShare > 0.35) {
    survivalMonths -= 10;  // 고정비 비중 35% 초과 시 감점
  } else if (fixedCostShare > 0.30) {
    survivalMonths -= 5;   // 고정비 비중 30-35% 시 경미한 감점
  }

  // 감점 요인 4: 순이익률이 낮으면 감점
  const profitMargin = finance.monthlyProfit / finance.monthlyRevenue;
  if (profitMargin < 0.10) {
    survivalMonths -= 5;   // 순이익률 10% 미만 시 감점
  } else if (profitMargin < 0.15) {
    survivalMonths -= 2;   // 순이익률 15% 미만 시 경미한 감점
  }

  // 감점 요인 5: 경쟁/로드뷰 점수 (MVP에서는 가볍게)
  const marketScore = market?.marketScore || 70;
  if (marketScore < 50) {
    survivalMonths -= 3;   // 상권 점수 낮을 시 경미한 감점
  }

  const riskScore = roadview?.riskScore || 70;
  if (riskScore < 50) {
    survivalMonths -= 2;   // 로드뷰 리스크 시 경미한 감점
  }

  // 보너스: payback이 매우 짧은 경우 (18개월 미만)
  if (finance.paybackMonths !== null && isFinite(finance.paybackMonths) && finance.paybackMonths < 18) {
    survivalMonths += 6;   // 회수 기간이 매우 짧으면 생존 개월 수 보너스
  }

  // 감점 요인 6: 대출 상환 능력 (DSCR)
  const dscr = finance.debt?.dscr;
  if (dscr !== null && dscr !== undefined) {
    if (dscr < 1.0) {
      survivalMonths -= 12;  // DSCR < 1.0: 강한 감점
    } else if (dscr < 1.2) {
      survivalMonths -= 6;   // 1.0 ≤ DSCR < 1.2: 중간 감점
    } else if (dscr < 1.5) {
      survivalMonths -= 3;   // 1.2 ≤ DSCR < 1.5: 작은 감점
    }
  }

  const finalSurvivalMonths = Math.max(12, Math.round(survivalMonths));

  // 생존 임계치 리스크 문장 추가
  const survivalRiskSentences = [];
  if (finalSurvivalMonths <= 12) {
    survivalRiskSentences.push("생존 가능 기간이 12개월 이하로 매우 위험합니다.");
  } else if (finalSurvivalMonths <= 24) {
    survivalRiskSentences.push("생존 가능 기간이 24개월 이하로 위험합니다.");
  } else if (finalSurvivalMonths <= 36) {
    survivalRiskSentences.push("생존 가능 기간이 36개월 이하로 주의가 필요합니다.");
  }

  // --- ADD: Survival threshold warnings ---
  const survivalRiskCards = [];
  if (finalSurvivalMonths <= 12) {
    survivalRiskCards.push({
      id: "survival_12",
      title: "초기 12개월 폐업 위험 구간",
      severity: "high",
      evidence: { survivalMonths: finalSurvivalMonths },
      narrative: "초기 12개월은 폐업이 집중되는 구간으로, 현금흐름 방어 전략이 필요합니다.",
      relatedMetricKeys: ["survivalMonths"]
    });
  } else if (finalSurvivalMonths <= 24) {
    survivalRiskCards.push({
      id: "survival_24",
      title: "24개월 내 안정화 실패 위험",
      severity: "medium",
      evidence: { survivalMonths: finalSurvivalMonths },
      narrative: "24개월 내 매출/비용 구조가 안정화되지 않으면 지속 운영이 어려워질 수 있습니다.",
      relatedMetricKeys: ["survivalMonths"]
    });
  } else if (finalSurvivalMonths <= 36) {
    survivalRiskCards.push({
      id: "survival_36",
      title: "36개월 이전 리스크 구간",
      severity: "low",
      evidence: { survivalMonths: finalSurvivalMonths },
      narrative: "36개월은 생존 분기점으로, 이 구간을 넘길 수 있는 운영 계획이 필요합니다.",
      relatedMetricKeys: ["survivalMonths"]
    });
  }

  return {
    survivalMonths: finalSurvivalMonths,
    survivalRiskSentences,
    survivalRiskCards
  };
}

/**
 * 리스크 카드 생성 (템플릿 기반)
 * 
 * @param {Object} finance - 손익 계산 결과
 * @param {Object} market - 상권 분석 결과
 * @param {Object} roadview - 로드뷰 분석 결과
 * @param {Number} targetDailySales - 목표 일 판매량
 * @param {Number} [survivalMonths] - 생존 개월 수 (선택)
 * @returns {Array<Object>} 리스크 카드 배열
 */
function generateRiskFactors(finance, market, roadview, targetDailySales, survivalMonths) {
  const riskFactors = [];

  // 리스크 1: 임대료 대비 매출 민감도
  const rentShare = finance.monthlyCosts.rent / finance.monthlyRevenue;
  if (rentShare > 0.15) {
    riskFactors.push({
      id: "rent_sensitivity",
      title: "임대료 대비 매출 민감도 높음",
      severity: rentShare > 0.20 ? "high" : "medium",
      evidence: {
        rentShare: Math.round(rentShare * 100) / 100,
        profitMargin: Math.round((finance.monthlyProfit / finance.monthlyRevenue) * 100) / 100,
        breakEvenDailySales: finance.breakEvenDailySales
      },
      narrative: `임대료가 매출의 ${Math.round(rentShare * 100)}%를 차지합니다. 매출이 10% 하락하면 손익분기 도달이 어려워집니다.`
    });
  }

  // 리스크 2: 회수 기간 (null 체크)
  if (finance.paybackMonths !== null && isFinite(finance.paybackMonths) && finance.paybackMonths > 30) {
    riskFactors.push({
      id: "payback_period",
      title: "회수 기간이 기준선(36개월)에 근접",
      severity: finance.paybackMonths >= 36 ? "high" : "medium",
      evidence: {
        paybackMonths: finance.paybackMonths,
        thresholdMonths: 36
      },
      narrative: `현재 회수 기간은 ${Math.round(finance.paybackMonths)}개월이나, 매출 하락 시 위험 구간에 진입할 수 있습니다.`
    });
  }
  
  // 리스크 5: 적자 상태 (paybackMonths가 null인 경우)
  if (finance.paybackMonths === null) {
    riskFactors.push({
      id: "negative_profit",
      title: "월 순이익이 0 이하로 적자 상태",
      severity: "high",
      evidence: {
        monthlyProfit: finance.monthlyProfit
      },
      narrative: "월 순이익이 0 이하여서 회수 기간을 계산할 수 없습니다. 즉시 개선이 필요합니다."
    });
  }

  // 리스크 3: 목표 vs 기대 GAP
  if (finance.expected?.gapPctVsTarget > 0.15) {
    const gapPct = Math.round(finance.expected.gapPctVsTarget * 100);
    riskFactors.push({
      id: "sales_gap",
      title: "목표 판매량과 상권 기대치 간 GAP 큼",
      severity: finance.expected.gapPctVsTarget > 0.25 ? "high" : "medium",
      evidence: {
        targetDailySales: targetDailySales || Math.round(finance.monthlyRevenue / (finance.expected.expectedMonthlyRevenue / finance.expected.expectedDailySales) / 30),
        expectedDailySales: finance.expected.expectedDailySales,
        gapPct: gapPct
      },
      narrative: `목표 판매량(${targetDailySales || 'N/A'}잔)이 상권 평균(${finance.expected.expectedDailySales}잔)보다 ${gapPct}% 높아 달성 난이도가 있습니다.`
    });
  }

  // 리스크 4: 순이익률 낮음
  const profitMargin = finance.monthlyProfit / finance.monthlyRevenue;
  if (profitMargin < 0.10) {
    riskFactors.push({
      id: "low_profit_margin",
      title: "순이익률이 낮아 수익성 취약",
      severity: profitMargin < 0.05 ? "high" : "medium",
      evidence: {
        profitMargin: Math.round(profitMargin * 100) / 100,
        monthlyProfit: finance.monthlyProfit
      },
      narrative: `순이익률이 ${Math.round(profitMargin * 100)}%로 낮아 매출 변동에 취약합니다.`
    });
  }

  // 리스크 6: 대출 상환 스트레스 (DSCR)
  const dscr = finance.debt?.dscr;
  if (dscr !== null && dscr !== undefined) {
    if (dscr < 1.0) {
      riskFactors.push({
        id: "debt_service_stress",
        title: "대출 상환 스트레스 (DSCR < 1.0)",
        severity: "high",
        evidence: {
          dscr: Math.round(dscr * 100) / 100,
          operatingProfit: finance.operatingProfit,
          monthlyDebtPayment: finance.debt.monthlyPayment
        },
        narrative: `DSCR이 ${Math.round(dscr * 100) / 100}로 1.0 미만입니다. 영업 이익으로 대출 상환액을 감당하기 어려워 위험합니다.`
      });
    } else if (dscr < 1.2) {
      riskFactors.push({
        id: "debt_service_stress",
        title: "대출 상환 여유 부족 (1.0 ≤ DSCR < 1.2)",
        severity: "medium",
        evidence: {
          dscr: Math.round(dscr * 100) / 100,
          operatingProfit: finance.operatingProfit,
          monthlyDebtPayment: finance.debt.monthlyPayment
        },
        narrative: `DSCR이 ${Math.round(dscr * 100) / 100}로 1.2 미만입니다. 매출 하락 시 대출 상환에 부담이 될 수 있습니다.`
      });
    }
  }

  // --- ADD: DSCR risk card ---
  if (finance?.debt?.dscr !== null && finance?.debt?.dscr < 1.2) {
    riskFactors.push({
      id: "dscr_stress",
      title: "대출 상환 스트레스(DSCR) 위험",
      severity: finance.debt.dscr < 1.0 ? "high" : "medium",
      evidence: {
        dscr: finance.debt.dscr,
        monthlyDebtPayment: finance.debt.monthlyPayment
      },
      narrative: `대출 상환 여력(DSCR=${finance.debt.dscr.toFixed(2)})이 낮아 현금흐름 리스크가 큽니다.`,
      relatedMetricKeys: ["dscr", "monthlyDebtPayment"]
    });
  }

  // --- ADD: Brand decline risk card ---
  const decline3 = finance?.expected?.brandDeclineRate ?? 0;
  if (decline3 >= 0.10) {
    riskFactors.push({
      id: "brand_decline",
      title: "브랜드 점포 감소 추세 리스크",
      severity: decline3 >= 0.30 ? "high" : (decline3 >= 0.20 ? "medium" : "low"),
      evidence: { brandDeclineRate: decline3 },
      narrative: `서울 3년 점포수 감소율 ${Math.round(decline3 * 100)}%로, 평균 매출 대비 실제 매출이 낮아질 가능성이 있습니다.`,
      relatedMetricKeys: ["brandDeclineRate"]
    });
  }

  // --- ADD: Survival threshold warnings ---
  if (survivalMonths !== undefined && survivalMonths !== null) {
    if (survivalMonths <= 12) {
      riskFactors.push({
        id: "survival_12",
        title: "초기 12개월 폐업 위험 구간",
        severity: "high",
        evidence: { survivalMonths },
        narrative: "초기 12개월은 폐업이 집중되는 구간으로, 현금흐름 방어 전략이 필요합니다.",
        relatedMetricKeys: ["survivalMonths"]
      });
    } else if (survivalMonths <= 24) {
      riskFactors.push({
        id: "survival_24",
        title: "24개월 내 안정화 실패 위험",
        severity: "medium",
        evidence: { survivalMonths },
        narrative: "24개월 내 매출/비용 구조가 안정화되지 않으면 지속 운영이 어려워질 수 있습니다.",
        relatedMetricKeys: ["survivalMonths"]
      });
    } else if (survivalMonths <= 36) {
      riskFactors.push({
        id: "survival_36",
        title: "36개월 이전 리스크 구간",
        severity: "low",
        evidence: { survivalMonths },
        narrative: "36개월은 생존 분기점으로, 이 구간을 넘길 수 있는 운영 계획이 필요합니다.",
        relatedMetricKeys: ["survivalMonths"]
      });
    }
  }

  return riskFactors;
}

/**
 * 하드컷 판정 근거 코드 배열 생성
 * 
 * @param {Object} finance - 손익 계산 결과
 * @param {Number} survivalMonths - 생존 개월 수
 * @param {String} signal - 신호등 ("green" | "yellow" | "red")
 * @returns {Array<String>} 하드컷 판정 근거 코드 배열
 */
function generateHardCutReasons(finance, survivalMonths, signal) {
  const reasons = [];

  // 생존 기간 36개월 미만
  if (survivalMonths < 36) {
    reasons.push("SURVIVAL_LT_36");
  }

  // 회수 기간 36개월 이상
  if (finance.paybackMonths !== null && isFinite(finance.paybackMonths) && finance.paybackMonths >= 36) {
    reasons.push("PAYBACK_TOO_LONG");
  }

  // 월 순이익 0 이하
  if (finance.monthlyProfit <= 0) {
    reasons.push("NEGATIVE_PROFIT");
  }

  // 고정비 비중 35% 이상
  const fixedCostShare = (finance.monthlyCosts.rent + finance.monthlyCosts.labor) / finance.monthlyRevenue;
  if (fixedCostShare >= 0.35) {
    reasons.push("FIXED_COST_HIGH");
  }

  // 목표 대비 매출 GAP 25% 이상
  const gap = finance.expected?.gapPctVsTarget || 0;
  if (gap >= 0.25) {
    reasons.push("SALES_GAP_HIGH");
  }

  // 매출 -10% 시 적자 전환
  const minus10Profit = finance.sensitivity?.minus10?.monthlyProfit || finance.monthlyProfit;
  if (minus10Profit <= 0) {
    reasons.push("SENSITIVITY_FAIL");
  }

  // DSCR < 1.0
  const dscr = finance.debt?.dscr;
  if (dscr !== null && dscr !== undefined && dscr < 1.0) {
    reasons.push("DSCR_FAIL");
  }

  // 브랜드 점포 감소율 30% 이상
  const decline = finance.expected?.brandDeclineRate || 0;
  if (decline >= 0.30) {
    reasons.push("BRAND_DECLINE_HIGH");
  }

  return reasons;
}

module.exports = {
  calculateScore,
  determineSignal,
  estimateSurvivalMonths,
  generateRiskFactors,
  generateHardCutReasons,
  HARD_CUT_REASONS
};
