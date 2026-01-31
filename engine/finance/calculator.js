/**
 * Finance 계산식 구현
 * 
 * 하드코딩 제거: 모든 기본값은 brand.defaults에서 주입받음
 * 대출 상환 계산 포함
 */

const { amortizeLoans } = require('./loan/amortize');
const { validateLoans } = require('./loan/validator');

/**
 * 손익 계산 핵심 로직
 * @param {Object} params
 * @param {Object} params.brand - 브랜드 정보 (defaults 필수)
 * @param {Object} params.conditions - 조건
 * @param {Object} params.market - 상권 정보
 * @param {Number} params.targetDailySales - 목표 일 판매량
 * @returns {Object} 손익 계산 결과
 */
function calculateFinance({ brand, conditions, market, targetDailySales }) {
  // 입력 검증
  if (!brand?.defaults) {
    throw new Error('brand.defaults가 필요합니다. avgPrice, cogsRate, laborRate 등을 포함해야 합니다.');
  }
  
  const requiredDefaults = ['avgPrice', 'cogsRate', 'laborRate'];
  for (const key of requiredDefaults) {
    if (brand.defaults[key] === undefined || brand.defaults[key] === null) {
      throw new Error(`brand.defaults.${key}가 필요합니다.`);
    }
  }
  
  if (!conditions?.initialInvestment || !conditions?.monthlyRent) {
    throw new Error('conditions.initialInvestment와 conditions.monthlyRent가 필요합니다.');
  }
  
  if (!targetDailySales || targetDailySales <= 0) {
    throw new Error('targetDailySales는 0보다 큰 값이어야 합니다.');
  }

  // 대출 입력 검증
  if (conditions.loans) {
    const loanValidation = validateLoans(conditions.loans);
    if (!loanValidation.valid) {
      throw new Error(`대출 입력 검증 실패: ${loanValidation.errors.join(', ')}`);
    }
  }

  const defaults = brand.defaults;
  const avgPrice = defaults.avgPrice;  // 하드코딩 제거: 입력에서 받음
  const cogsRate = defaults.cogsRate;
  const laborRate = defaults.laborRate;
  const utilitiesRate = defaults.utilitiesRate || 0.03;
  const royaltyRate = defaults.royaltyRate || 0.05;
  const marketingRate = defaults.marketingRate || 0.02;
  const etcFixed = defaults.etcFixed || 0;

  // 월 매출 계산 (목표 기준)
  const monthlyRevenue = targetDailySales * avgPrice * 30;

  // ============================================
  // 기대 판매량 계산 (브랜드 데이터 기반)
  // ============================================
  
  // 1. 원시 기대 판매량 계산 (브랜드 평균 매출 기반)
  let rawExpectedDailySales = null;
  if (brand?.avgMonthlySales && brand.avgMonthlySales > 0 && avgPrice > 0) {
    rawExpectedDailySales = brand.avgMonthlySales / avgPrice / 30;
  }
  
  // 2. 브랜드 리스크 점수 계산 (점포 감소율 기반)
  let brandRiskScore = 0.2;  // 기본값: 낮은 리스크
  const brandDeclineRate = brand?.brandDeclineRate || 0;
  
  if (brandDeclineRate >= 0.30) {
    brandRiskScore = 1.0;  // 30% 이상 감소: 최고 리스크
  } else if (brandDeclineRate >= 0.20) {
    brandRiskScore = 0.8;  // 20-30% 감소: 높은 리스크
  } else if (brandDeclineRate >= 0.10) {
    brandRiskScore = 0.5;  // 10-20% 감소: 중간 리스크
  }
  
  // 3. 매출 보정 계수 계산
  const revenueAdjustmentFactor = 1 - (brandRiskScore * 0.4);
  
  // 4. 보정된 기대 판매량 계산
  let adjustedExpectedDailySales = null;
  if (rawExpectedDailySales !== null) {
    adjustedExpectedDailySales = rawExpectedDailySales * revenueAdjustmentFactor;
  }
  
  // 5. Fallback 규칙: adjustedExpectedDailySales → market.expectedDailySales → brand.defaults.expectedDailySales → targetDailySales
  let expectedDailySales;
  let gapWarning = false;  // 최후 fallback 시 경고 플래그
  
  if (adjustedExpectedDailySales !== null && adjustedExpectedDailySales > 0) {
    expectedDailySales = adjustedExpectedDailySales;
  } else if (market?.expectedDailySales && market.expectedDailySales > 0) {
    expectedDailySales = market.expectedDailySales;
  } else if (brand?.defaults?.expectedDailySales && brand.defaults.expectedDailySales > 0) {
    expectedDailySales = brand.defaults.expectedDailySales;
  } else {
    expectedDailySales = targetDailySales;  // 최후 fallback
    gapWarning = true;  // GAP=0%가 되는 경우 경고
  }
  
  const expectedMonthlyRevenue = expectedDailySales * avgPrice * 30;

  // GAP 비율 계산: (target - adjustedExpectedDailySales) / adjustedExpectedDailySales
  // adjustedExpectedDailySales가 없으면 기존 expectedDailySales 사용
  const gapBase = adjustedExpectedDailySales !== null ? adjustedExpectedDailySales : expectedDailySales;
  const gapPctVsTarget = gapWarning ? 0 : (targetDailySales - gapBase) / gapBase;

  // 월 비용 계산
  const monthlyCosts = {
    rent: conditions.monthlyRent,
    labor: monthlyRevenue * laborRate,
    materials: monthlyRevenue * cogsRate,
    utilities: monthlyRevenue * utilitiesRate,
    royalty: monthlyRevenue * royaltyRate,
    marketing: monthlyRevenue * marketingRate,
    etc: etcFixed
  };

  // 점주 근무 시 인건비 감소 (감산 계수 적용)
  if (conditions.ownerWorking) {
    // ownerWorking 감산 계수: 0.6 (40% 절감)
    const ownerWorkingMultiplier = defaults.ownerWorkingMultiplier || 0.6;
    monthlyCosts.labor *= ownerWorkingMultiplier;
  }

  // 대출 상환 계산
  const loans = conditions.loans || [];
  const debtInfo = amortizeLoans(loans);
  const monthlyDebtPayment = debtInfo.totalMonthlyPayment;

  // 영업 이익 계산 (대출 상환 전)
  const totalCosts = Object.values(monthlyCosts).reduce((a, b) => a + b, 0);
  const operatingProfit = monthlyRevenue - totalCosts;

  // 월 순이익 계산 (대출 상환 후)
  const monthlyProfit = operatingProfit - monthlyDebtPayment;

  // DSCR 계산 (Debt Service Coverage Ratio)
  const dscr = monthlyDebtPayment > 0 
    ? operatingProfit / monthlyDebtPayment 
    : null; // 대출이 없으면 null

  // 회수 개월 수 계산 (대출 상환 후 순이익 기준)
  // ⚠️ 중요: monthlyProfit <= 0일 때 null 반환 (Infinity 대신)
  // Infinity/NaN이 decision 점수와 신호등을 망가뜨리는 1순위 원인 방지
  const paybackMonths = monthlyProfit > 0 
    ? conditions.initialInvestment / monthlyProfit 
    : null;

  // 손익분기점 일 판매량 계산
  // ⚠️ 중요: avgPrice=0 같은 엣지 케이스 방어
  const breakEvenDailySales = (totalCosts > 0 && avgPrice > 0)
    ? totalCosts / (avgPrice * 30)
    : null;

  // 민감도 분석 (±10%)
  const debtPayment = monthlyDebtPayment;  // 대출 상환액 재사용
  const sensitivity = {
    plus10: calculateSensitivity(
      targetDailySales * 1.1,
      avgPrice,
      monthlyCosts,
      conditions.initialInvestment,
      conditions.ownerWorking,
      defaults,
      debtPayment
    ),
    minus10: calculateSensitivity(
      targetDailySales * 0.9,
      avgPrice,
      monthlyCosts,
      conditions.initialInvestment,
      conditions.ownerWorking,
      defaults,
      debtPayment
    )
  };

  return {
    monthlyRevenue: Math.round(monthlyRevenue),
    expected: {
      expectedDailySales: expectedDailySales,  // 최종 사용된 기대 판매량
      expectedMonthlyRevenue: Math.round(expectedMonthlyRevenue),
      gapPctVsTarget: Math.round(gapPctVsTarget * 1000) / 1000,  // 소수점 셋째자리까지
      gapWarning: gapWarning,  // 최후 fallback 시 true (GAP=0% 경고)
      // 브랜드 데이터 기반 파생 지표
      rawExpectedDailySales: rawExpectedDailySales !== null ? Math.round(rawExpectedDailySales * 10) / 10 : null,
      adjustedExpectedDailySales: adjustedExpectedDailySales !== null ? Math.round(adjustedExpectedDailySales * 10) / 10 : null,
      revenueAdjustmentFactor: Math.round(revenueAdjustmentFactor * 1000) / 1000,
      brandDeclineRate: Math.round(brandDeclineRate * 1000) / 1000
    },
    monthlyCosts: {
      rent: Math.round(monthlyCosts.rent),
      labor: Math.round(monthlyCosts.labor),
      materials: Math.round(monthlyCosts.materials),
      utilities: Math.round(monthlyCosts.utilities),
      royalty: Math.round(monthlyCosts.royalty),
      marketing: Math.round(monthlyCosts.marketing),
      etc: Math.round(monthlyCosts.etc)
    },
    operatingProfit: Math.round(operatingProfit),  // 대출 상환 전 이익
    monthlyProfit: Math.round(monthlyProfit),  // 대출 상환 후 순이익
    paybackMonths: paybackMonths === null ? null : Math.round(paybackMonths * 10) / 10,  // null 처리
    breakEvenDailySales: breakEvenDailySales === null ? null : Math.round(breakEvenDailySales * 10) / 10,  // null 처리
    debt: {
      monthlyPayment: debtInfo.totalMonthlyPayment,
      monthlyInterest: debtInfo.totalMonthlyInterest,
      monthlyPrincipal: debtInfo.totalMonthlyPrincipal,
      balanceAfterMonth: debtInfo.balanceAfterMonth,
      dscr: dscr !== null ? Math.round(dscr * 100) / 100 : null,  // 소수점 둘째자리까지
      debtSchedulePreview: debtInfo.debtSchedulePreview
    },
    sensitivity: {
      plus10: {
        monthlyProfit: Math.round(sensitivity.plus10.monthlyProfit),
        paybackMonths: sensitivity.plus10.paybackMonths === null ? null : Math.round(sensitivity.plus10.paybackMonths * 10) / 10
      },
      minus10: {
        monthlyProfit: Math.round(sensitivity.minus10.monthlyProfit),
        paybackMonths: sensitivity.minus10.paybackMonths === null ? null : Math.round(sensitivity.minus10.paybackMonths * 10) / 10
      }
    }
  };
}

/**
 * 민감도 분석 계산 (판매량 변화 시)
 * @param {Number} dailySales - 시나리오 일 판매량
 * @param {Number} avgPrice - 평균 단가
 * @param {Object} baseCosts - 기본 비용 구조
 * @param {Number} initialInvestment - 초기 투자금
 * @param {Boolean} ownerWorking - 점주 근무 여부
 * @param {Object} defaults - 브랜드 기본값
 * @param {Number} debtPayment - 월 대출 상환액
 * @returns {Object} { monthlyProfit, paybackMonths }
 */
function calculateSensitivity(dailySales, avgPrice, baseCosts, initialInvestment, ownerWorking, defaults, debtPayment = 0) {
  const scenarioRevenue = dailySales * avgPrice * 30;
  
  // 비용 재계산 (매출 비례 항목만 변경, 대출 상환액 제외)
  const scenarioCosts = {
    rent: baseCosts.rent,  // 고정비
    labor: scenarioRevenue * defaults.laborRate,
    materials: scenarioRevenue * defaults.cogsRate,
    utilities: scenarioRevenue * (defaults.utilitiesRate || 0.03),
    royalty: scenarioRevenue * (defaults.royaltyRate || 0.05),
    marketing: scenarioRevenue * (defaults.marketingRate || 0.02),
    etc: baseCosts.etc  // 고정비
  };

  // 점주 근무 시 인건비 감소
  if (ownerWorking) {
    const ownerWorkingMultiplier = defaults.ownerWorkingMultiplier || 0.6;
    scenarioCosts.labor *= ownerWorkingMultiplier;
  }

  // 영업 이익 계산 (대출 상환 전)
  const totalCostsWithoutDebt = Object.values(scenarioCosts).reduce((a, b) => a + b, 0);
  const operatingProfitScenario = scenarioRevenue - totalCostsWithoutDebt;
  
  // 월 순이익 계산 (대출 상환 후)
  const monthlyProfitScenario = operatingProfitScenario - debtPayment;
  
  // ⚠️ 중요: monthlyProfit <= 0일 때 null 반환 (Infinity 대신)
  const paybackMonths = monthlyProfitScenario > 0 
    ? initialInvestment / monthlyProfitScenario 
    : null;

  return {
    monthlyProfit: monthlyProfitScenario,
    paybackMonths
  };
}

module.exports = {
  calculateFinance
};
