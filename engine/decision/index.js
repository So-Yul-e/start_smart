/**
 * Decision 판단 메인 로직
 * 
 * 입력: finance, market, roadview
 * 출력: score, successProbability, signal, survivalMonths, riskFactors, ...
 */

const { calculateScore, determineSignal, estimateSurvivalMonths, generateRiskFactors, generateHardCutReasons, HARD_CUT_REASONS } = require('./scorer');
const { generateImprovementSimulations } = require('./simulations');
const { validateDecisionOutputSimple } = require('./validator');
const { computeExitPlan } = require('./exitPlan');
const { DEFAULT_EXIT_DEFAULTS, DEFAULT_EXIT_INPUTS } = require('../../shared/constants');

/**
 * 판단 메인 함수
 * @param {Object} input - 입력 데이터
 * @param {Object} input.finance - 손익 계산 결과
 * @param {Object} input.market - 상권 분석 결과
 * @param {Object} input.roadview - 로드뷰 분석 결과
 * @param {Object} [input.conditions] - 조건 (개선 시뮬레이션용)
 * @param {Object} [input.brand] - 브랜드 정보 (개선 시뮬레이션용)
 * @param {Number} [input.targetDailySales] - 목표 판매량 (개선 시뮬레이션용)
 * @returns {Object} 판단 결과
 */
function calculate(input) {
  const {
    finance,
    market,
    roadview,
    conditions,
    brand,
    targetDailySales
  } = input;

  // 점수 및 성공 확률 계산
  const scoreResult = calculateScore(finance, market, roadview);

  // 신호등 판단
  const signal = determineSignal(scoreResult.score, finance);

  // 생존 개월 수 추정 (36 기준선 감점형)
  const survivalResult = estimateSurvivalMonths(finance, market, roadview);
  const survivalMonths = survivalResult.survivalMonths || survivalResult;  // 하위 호환성
  const survivalRiskSentences = survivalResult.survivalRiskSentences || [];

  // 리스크 레벨 판단
  const riskLevel = determineRiskLevel(scoreResult.score, finance, survivalMonths);

  // 하드컷 판정 근거 코드 생성
  const hardCutReasons = generateHardCutReasons(finance, survivalMonths, signal);

  // 리스크 카드 생성 (구조화)
  const riskCards = generateRiskFactors(finance, market, roadview, targetDailySales, survivalMonths);
  
  // 레거시 riskFactors (문자열 배열) 생성 - Backward Compatibility
  // 생존 임계치 리스크 문장도 포함
  const riskFactorsLegacy = [
    ...riskCards.map(card => card.narrative || card.title),
    ...survivalRiskSentences
  ];

  // 개선 시뮬레이션 생성 (조건이 있는 경우)
  let improvementSimulations = [];
  if (conditions && brand && targetDailySales) {
    improvementSimulations = generateImprovementSimulations(
      finance,
      conditions,
      brand,
      market,
      roadview,
      targetDailySales,
      signal  // 이전 signal 전달 (signalChange 계산용)
    );
  }

  // 최종 판정 (Final Judgement) 생성
  const finalJudgement = generateFinalJudgement(signal, survivalMonths, hardCutReasons);

  // 실패 트리거 (Failure Triggers) 생성
  const failureTriggers = generateFailureTriggers(finance, survivalMonths);

  // 판정 신뢰도 (Decision Confidence) 계산
  const decisionConfidence = calculateDecisionConfidence(finance, signal, scoreResult.score);

  // Exit Plan 계산 (조건과 브랜드가 있는 경우)
  let exitPlan = null;
  if (conditions && brand) {
    // 월별 순이익 시리즈 생성 (36개월)
    // MVP: 현재 monthlyProfit을 상수로 사용 (향후 민감도 분석 기반 확장 가능)
    const horizonMonths = 36;
    const monthlyNetProfitSeries = Array(horizonMonths).fill(finance.monthlyProfit);
    
    // 브랜드 Exit 기본값 (없으면 DEFAULT 사용)
    const brandExitDefaults = brand.exitDefaults || DEFAULT_EXIT_DEFAULTS;
    
    // 조건 Exit 입력값 (없으면 DEFAULT 사용)
    const conditionsExitInputs = conditions.exitInputs || DEFAULT_EXIT_INPUTS;
    
    exitPlan = computeExitPlan({
      horizonMonths,
      initialInvestment: conditions.initialInvestment,
      monthlyNetProfitSeries,
      brandExitDefaults,
      conditionsExitInputs
    });
  }

  const result = {
    score: scoreResult.score,
    successProbability: scoreResult.successProbability,
    breakdown: scoreResult.breakdown,  // 신규: 점수 breakdown 추가
    signal: signal,
    survivalMonths: survivalMonths,
    riskLevel: riskLevel,
    riskFactors: riskFactorsLegacy,  // 레거시: 문자열 배열 (유지)
    riskCards: riskCards,             // 신규: 객체 배열 (추가)
    improvementSimulations: improvementSimulations,
    // 신규: 최종 판정자 필드들
    finalJudgement: finalJudgement,
    hardCutReasons: hardCutReasons,
    failureTriggers: failureTriggers,
    decisionConfidence: decisionConfidence,
    // 신규: Exit Plan
    exitPlan: exitPlan
  };

  // 출력 형식 검증 (개발 환경에서만)
  if (process.env.NODE_ENV !== 'production') {
    validateDecisionOutputSimple(result, false);
  }

  return result;
}

/**
 * 리스크 레벨 판단
 */
function determineRiskLevel(score, finance, survivalMonths) {
  // paybackMonths가 null인 경우도 high 리스크로 처리
  if (score < 40 || 
      finance.paybackMonths === null || 
      (isFinite(finance.paybackMonths) && finance.paybackMonths >= 36) || 
      finance.monthlyProfit <= 0) {
    return "high";
  } else if (score < 60 || survivalMonths < 24) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * 최종 판정 (Final Judgement) 생성
 * 
 * 리포트 1페이지 / Executive Summary에 그대로 출력
 * "AI 의견"이 아니라 시스템 판정임을 명확히
 * 
 * @param {String} signal - 신호등 ("green" | "yellow" | "red")
 * @param {Number} survivalMonths - 생존 개월 수
 * @param {Array<String>} hardCutReasons - 하드컷 판정 근거 코드 배열
 * @returns {Object} 최종 판정 객체
 */
function generateFinalJudgement(signal, survivalMonths, hardCutReasons) {
  // 신호등에 따른 라벨 결정
  let label;
  if (signal === "green") {
    label = "LOW RISK";
  } else if (signal === "yellow") {
    label = "CONDITIONAL RISK";
  } else {
    label = "HIGH RISK";
  }

  // 대표 판정 사유 코드 결정 (우선순위: 하드컷 > 생존기간)
  let primaryReason = null;
  if (hardCutReasons.length > 0) {
    // 우선순위: NEGATIVE_PROFIT > DSCR_FAIL > PAYBACK_TOO_LONG > SURVIVAL_LT_36 > 기타
    if (hardCutReasons.includes("NEGATIVE_PROFIT")) {
      primaryReason = "NEGATIVE_PROFIT";
    } else if (hardCutReasons.includes("DSCR_FAIL")) {
      primaryReason = "DSCR_FAIL";
    } else if (hardCutReasons.includes("PAYBACK_TOO_LONG")) {
      primaryReason = "PAYBACK_TOO_LONG";
    } else if (hardCutReasons.includes("SURVIVAL_LT_36")) {
      primaryReason = "SURVIVAL_LT_36";
    } else {
      primaryReason = hardCutReasons[0];
    }
  } else if (survivalMonths < 36) {
    primaryReason = "SURVIVAL_LT_36";
  }

  // 요약 문구 생성
  let summary;
  if (signal === "red") {
    if (primaryReason === "NEGATIVE_PROFIT") {
      summary = "월 순이익이 0 이하로 적자 상태입니다. 즉시 개선이 필요합니다.";
    } else if (primaryReason === "DSCR_FAIL") {
      summary = "대출 상환 능력이 부족하여 영업 이익으로 대출 상환액을 감당하기 어렵습니다.";
    } else if (primaryReason === "PAYBACK_TOO_LONG") {
      summary = "회수 기간이 36개월을 초과하여 구조적 리스크가 존재합니다.";
    } else if (primaryReason === "SURVIVAL_LT_36") {
      summary = "예상 생존 기간이 기준선(36개월) 미만으로 구조적 리스크가 존재합니다.";
    } else {
      summary = "고위험 상태로 창업을 권장하지 않습니다.";
    }
  } else if (signal === "yellow") {
    if (primaryReason === "SURVIVAL_LT_36") {
      summary = "예상 생존 기간이 기준선(36개월) 미만으로 구조적 리스크가 존재합니다.";
    } else if (primaryReason === "SENSITIVITY_FAIL") {
      summary = "매출 변동에 취약하여 매출이 10% 하락 시 적자 전환 위험이 있습니다.";
    } else if (primaryReason === "FIXED_COST_HIGH") {
      summary = "고정비 구조가 취약하여 매출 변동에 민감합니다.";
    } else {
      summary = "조건부 리스크가 존재하여 신중한 검토가 필요합니다.";
    }
  } else {
    summary = "기본적인 창업 조건을 충족하여 진행 가능합니다.";
  }

  // nonNegotiable 판정: red 신호등이거나 하드컷 근거가 있는 경우
  const nonNegotiable = signal === "red" || hardCutReasons.length > 0;

  return {
    signal: signal,
    label: label,
    nonNegotiable: nonNegotiable,
    primaryReason: primaryReason,
    summary: summary
  };
}

/**
 * 실패 트리거 (Failure Triggers) 생성
 * 
 * 리포트 7페이지용 핵심 데이터
 * "리스크 설명" → "실패 조건 명시"로 격상
 * 
 * @param {Object} finance - 손익 계산 결과
 * @param {Number} survivalMonths - 생존 개월 수
 * @returns {Array<Object>} 실패 트리거 배열
 */
function generateFailureTriggers(finance, survivalMonths) {
  const triggers = [];

  // 트리거 1: 매출 -10% 시 적자 전환
  const minus10Profit = finance.sensitivity?.minus10?.monthlyProfit || finance.monthlyProfit;
  if (minus10Profit <= 0) {
    triggers.push({
      trigger: "sales -10%",
      outcome: "monthlyProfit < 0",
      impact: "critical",
      estimatedFailureWindow: "12~18개월"
    });
  } else if (minus10Profit < finance.monthlyProfit * 0.5) {
    triggers.push({
      trigger: "sales -10%",
      outcome: "monthlyProfit < 50%",
      impact: "high",
      estimatedFailureWindow: "18~24개월"
    });
  }

  // 트리거 2: 생존 기간 36개월 미만
  if (survivalMonths < 36) {
    triggers.push({
      trigger: "survival threshold",
      outcome: "survivalMonths < 36",
      impact: survivalMonths < 24 ? "critical" : "high",
      estimatedFailureWindow: `${survivalMonths}개월 이내`
    });
  }

  // 트리거 3: 고정비 압박 (임대료 고정 시)
  const fixedCostShare = (finance.monthlyCosts.rent + finance.monthlyCosts.labor) / finance.monthlyRevenue;
  if (fixedCostShare >= 0.35) {
    triggers.push({
      trigger: "rent fixed",
      outcome: "survivalMonths < 36",
      impact: "high",
      estimatedFailureWindow: "24~36개월"
    });
  }

  // 트리거 4: 회수 기간 36개월 초과
  if (finance.paybackMonths !== null && isFinite(finance.paybackMonths) && finance.paybackMonths >= 36) {
    triggers.push({
      trigger: "payback threshold",
      outcome: "paybackMonths >= 36",
      impact: "high",
      estimatedFailureWindow: "36개월 이후"
    });
  }

  // 트리거 5: DSCR < 1.0
  const dscr = finance.debt?.dscr;
  if (dscr !== null && dscr !== undefined && dscr < 1.0) {
    triggers.push({
      trigger: "debt service",
      outcome: "DSCR < 1.0",
      impact: "critical",
      estimatedFailureWindow: "즉시"
    });
  }

  return triggers;
}

/**
 * 판정 신뢰도 (Decision Confidence) 계산
 * 
 * 판단의 안정성을 시스템이 직접 명시
 * 
 * @param {Object} finance - 손익 계산 결과
 * @param {String} signal - 신호등 ("green" | "yellow" | "red")
 * @param {Number} score - 종합 점수 (0-100)
 * @returns {Object} 판정 신뢰도 객체
 */
function calculateDecisionConfidence(finance, signal, score) {
  // 데이터 커버리지 평가
  let dataCoverage = "high";
  if (!finance.expected || !finance.sensitivity) {
    dataCoverage = "medium";
  }
  if (!finance.expected?.expectedDailySales) {
    dataCoverage = "low";
  }

  // 가정 리스크 평가
  let assumptionRisk = "low";
  const gap = finance.expected?.gapPctVsTarget || 0;
  const decline = finance.expected?.brandDeclineRate || 0;
  
  if (gap > 0.25 || decline >= 0.30) {
    assumptionRisk = "high";
  } else if (gap > 0.15 || decline >= 0.20) {
    assumptionRisk = "medium";
  }

  // 판정 안정성 평가 (±10% 변동에도 signal 유지 여부)
  // 주의: determineSignal을 정확히 재현하려면 score 재계산이 필요하므로,
  // sensitivity 결과를 기반으로 간접적으로 평가
  let judgementStability = "high";
  
  const plus10Profit = finance.sensitivity?.plus10?.monthlyProfit;
  const minus10Profit = finance.sensitivity?.minus10?.monthlyProfit;
  const plus10Payback = finance.sensitivity?.plus10?.paybackMonths;
  const minus10Payback = finance.sensitivity?.minus10?.paybackMonths;

  // ±10% 변동 시에도 주요 지표가 안정적인지 확인
  if (plus10Profit !== undefined && minus10Profit !== undefined) {
    // -10% 시 적자 전환이면 안정성 낮음
    if (minus10Profit <= 0) {
      judgementStability = "low";
    } else if (minus10Profit < finance.monthlyProfit * 0.5) {
      judgementStability = "medium";
    }
    
    // +10% 시에도 paybackMonths가 36개월 이상이면 안정성 낮음
    if (plus10Payback !== undefined && plus10Payback >= 36) {
      judgementStability = "medium";
    }
  }
  
  // red 신호등이면 안정성 낮음
  if (signal === "red") {
    judgementStability = "low";
  }

  return {
    dataCoverage: dataCoverage,        // low | medium | high
    assumptionRisk: assumptionRisk,     // low | medium | high
    judgementStability: judgementStability  // low | medium | high
  };
}

module.exports = {
  calculate
};
