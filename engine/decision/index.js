/**
 * Decision 판단 메인 로직
 * 
 * 입력: finance, market, roadview
 * 출력: score, successProbability, signal, survivalMonths, riskFactors, ...
 */

const { calculateScore, determineSignal, estimateSurvivalMonths, generateRiskFactors } = require('./scorer');
const { generateImprovementSimulations } = require('./simulations');
const { validateDecisionOutputSimple } = require('./validator');

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
      targetDailySales
    );
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
    improvementSimulations: improvementSimulations
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

module.exports = {
  calculate
};
