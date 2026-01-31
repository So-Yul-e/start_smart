/**
 * Exit Plan 계산 모듈
 * 
 * 손절 타이밍 및 폐업 비용 계산
 */

/**
 * 곡선 룩업 함수 (salvageRate 또는 recoveryRate 반환)
 * @param {Array} curve - 곡선 배열 [{ from, to, salvageRate/recoveryRate }]
 * @param {Number} month - 개월 수
 * @returns {Number} 비율 (0-1)
 */
function curveLookup(curve, month) {
  if (!curve || curve.length === 0) return 0;
  
  const x = Math.max(0, month);
  const row = curve.find(r => x >= r.from && x < r.to) || curve[curve.length - 1];
  return row?.salvageRate ?? row?.recoveryRate ?? 0;
}

/**
 * 특정 개월에 폐업할 때의 Exit Cost 계산
 * @param {Object} params
 * @param {Number} params.month - 폐업 개월
 * @param {Number} params.initialInvestment - 초기 투자금
 * @param {Object} params.brandExitDefaults - 브랜드 Exit 기본값
 * @param {Object} params.conditionsExitInputs - 조건 Exit 입력값
 * @returns {Object} Exit Cost 상세
 */
function computeExitCostAtMonth({
  month,
  initialInvestment,
  brandExitDefaults,
  conditionsExitInputs
}) {
  const {
    contractYears = 3,
    penaltyRule = "remaining_months",
    monthlyRoyalty = 300000,
    fixedPenalty = 0,
    interiorCostRatio = 0.35,
    interiorSalvageCurve = [],
    goodwillRecoveryCurve = []
  } = brandExitDefaults || {};

  const {
    keyMoney = 0,
    pyeong = 10,
    demolitionBase = 15000000,
    demolitionPerPyeong = 1000000
  } = conditionsExitInputs || {};

  // 1) 위약금 (Penalty)
  const contractMonths = contractYears * 12;
  const remainingMonths = Math.max(0, contractMonths - month);
  const penaltyCost = (penaltyRule === "remaining_months")
    ? remainingMonths * monthlyRoyalty
    : fixedPenalty;

  // 2) 철거/원복 (Demolition)
  const demolitionCost = demolitionBase + pyeong * demolitionPerPyeong;

  // 3) 인테리어/설비 손실 (Interior Loss)
  const interiorCost = initialInvestment * interiorCostRatio;
  const salvageRate = curveLookup(interiorSalvageCurve, month);
  const interiorRecovered = interiorCost * salvageRate;
  const interiorLoss = Math.max(0, interiorCost - interiorRecovered);

  // 4) 권리금 회수 (Goodwill Recovered)
  const goodwillRate = curveLookup(goodwillRecoveryCurve, month);
  const goodwillRecovered = Math.max(0, keyMoney * goodwillRate);

  // 5) Exit Cost 합계
  const exitCostTotal = penaltyCost + demolitionCost + interiorLoss - goodwillRecovered;

  return {
    penaltyCost: Math.round(penaltyCost),
    demolitionCost: Math.round(demolitionCost),
    interiorLoss: Math.round(interiorLoss),
    goodwillRecovered: Math.round(goodwillRecovered),
    exitCostTotal: Math.round(exitCostTotal)
  };
}

/**
 * Exit Plan 계산 메인 함수
 * @param {Object} params
 * @param {Number} params.horizonMonths - 분석 기간 (기본 36개월)
 * @param {Number} params.initialInvestment - 초기 투자금
 * @param {Array<Number>} params.monthlyNetProfitSeries - 월별 순이익 배열
 * @param {Object} params.brandExitDefaults - 브랜드 Exit 기본값
 * @param {Object} params.conditionsExitInputs - 조건 Exit 입력값
 * @returns {Object} Exit Plan 결과
 */
function computeExitPlan({
  horizonMonths = 36,
  initialInvestment,
  monthlyNetProfitSeries = [],
  brandExitDefaults = {},
  conditionsExitInputs = {}
}) {
  const totalLossSeries = [];
  const cumOperatingLossSeries = [];

  let cum = 0;

  // 월별 총손실 계산
  for (let m = 1; m <= horizonMonths; m++) {
    // 월별 순이익 (시리즈가 없으면 마지막 값 또는 0 사용)
    const monthlyNetProfit = monthlyNetProfitSeries[m - 1] 
      ?? monthlyNetProfitSeries[monthlyNetProfitSeries.length - 1] 
      ?? 0;
    
    // 월별 운영손실 (적자만 누적, 보수적 접근)
    const monthlyOperatingLoss = Math.max(0, -monthlyNetProfit);
    cum += monthlyOperatingLoss;

    // Exit Cost 계산
    const exitCost = computeExitCostAtMonth({
      month: m,
      initialInvestment,
      brandExitDefaults,
      conditionsExitInputs
    });

    // 총손실 = 누적 운영손실 + Exit Cost
    const totalLoss = cum + exitCost.exitCostTotal;

    cumOperatingLossSeries.push(cum);
    totalLossSeries.push({
      month: m,
      totalLoss: Math.round(totalLoss),
      cumOperatingLoss: Math.round(cum),
      ...exitCost
    });
  }

  // 최적 손절 개월 (totalLoss 최소값)
  let optimalExitMonth = 1;
  let optimalExitTotalLoss = totalLossSeries[0]?.totalLoss || 0;

  for (const row of totalLossSeries) {
    if (row.totalLoss < optimalExitTotalLoss) {
      optimalExitTotalLoss = row.totalLoss;
      optimalExitMonth = row.month;
    }
  }

  // 경고 개월 계산
  let warningMonth = null;
  
  // 규칙 1: 누적 운영손실 >= 초기투자금의 20%
  const warnByCum = totalLossSeries.find(r => 
    r.cumOperatingLoss >= initialInvestment * 0.2
  )?.month ?? null;
  
  // 규칙 2: 순이익 <= 0이 3개월 연속
  let warnByStreak = null;
  let streak = 0;
  for (let i = 0; i < horizonMonths; i++) {
    const np = monthlyNetProfitSeries[i] ?? monthlyNetProfitSeries[monthlyNetProfitSeries.length - 1] ?? 0;
    if (np <= 0) {
      streak += 1;
    } else {
      streak = 0;
    }
    if (streak >= 3) {
      warnByStreak = i + 1;
      break;
    }
  }
  
  // 두 규칙 중 가장 빠른 시점
  const candidates = [warnByCum, warnByStreak].filter(v => v !== null);
  warningMonth = candidates.length > 0 
    ? Math.min(...candidates)
    : Math.max(1, Math.floor(optimalExitMonth * 0.6));

  // 트랩존 시작 개월 (최적 손절 이후 손실이 10% 이상 증가하는 첫 시점)
  const trapZoneStartMonth = totalLossSeries.find(r => 
    r.month > optimalExitMonth && 
    (r.totalLoss - optimalExitTotalLoss) >= initialInvestment * 0.10
  )?.month ?? Math.min(horizonMonths, optimalExitMonth + 6);

  // 최적 손절 이후 6개월 더 버틸 때 추가 손실
  const after6 = Math.min(horizonMonths, optimalExitMonth + 6);
  const keepGoingDeltaLoss_6m = totalLossSeries[after6 - 1]?.totalLoss 
    ? totalLossSeries[after6 - 1].totalLoss - optimalExitTotalLoss
    : 0;

  // Exit Scenario (최적 손절 시점 기준)
  const assumedExitMonth = optimalExitMonth;
  const atExit = totalLossSeries[assumedExitMonth - 1];

  const exitScenario = {
    assumedExitMonth,
    breakdown: {
      penaltyCost: atExit?.penaltyCost || 0,
      demolitionCost: atExit?.demolitionCost || 0,
      interiorLoss: atExit?.interiorLoss || 0,
      goodwillRecovered: atExit?.goodwillRecovered || 0
    },
    exitCostTotal: atExit?.exitCostTotal || 0,
    operatingLossUntilExit: atExit?.cumOperatingLoss || 0,
    finalTotalLoss: atExit?.totalLoss || 0
  };

  return {
    exitTiming: {
      warningMonth,
      optimalExitMonth,
      trapZoneStartMonth,
      optimalExitTotalLoss,
      keepGoingDeltaLoss_6m,
      totalLossSeries // 리포트 표/차트용 (옵션)
    },
    exitScenario
  };
}

module.exports = {
  computeExitPlan,
  computeExitCostAtMonth,
  curveLookup
};
