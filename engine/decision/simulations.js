/**
 * 개선 시뮬레이션 생성
 * 
 * PDF 8p용 개선 시뮬레이션 데이터 생성
 */

const { calculateFinance } = require('../finance/calculator');
const { calculateScore, determineSignal, estimateSurvivalMonths } = require('./scorer');

/**
 * 개선 시뮬레이션 생성
 * 
 * @param {Object} finance - 현재 손익 계산 결과
 * @param {Object} conditions - 조건
 * @param {Object} brand - 브랜드 정보
 * @param {Object} market - 상권 분석 결과
 * @param {Object} roadview - 로드뷰 분석 결과
 * @param {Number} targetDailySales - 목표 일 판매량
 * @returns {Array<Object>} 개선 시뮬레이션 배열
 */
function generateImprovementSimulations(finance, conditions, brand, market, roadview, targetDailySales) {
  const simulations = [];

  // 시뮬레이션 1: 임대료 -10%
  const rentMinus10 = conditions.monthlyRent * 0.9;
  const sim1Conditions = { ...conditions, monthlyRent: rentMinus10 };
  const sim1Finance = calculateFinance({
    brand,
    conditions: sim1Conditions,
    market,
    targetDailySales
  });
  const sim1ScoreResult = calculateScore(sim1Finance, market, roadview);
  const sim1SurvivalResult = estimateSurvivalMonths(sim1Finance, market, roadview);
  const sim1Survival = sim1SurvivalResult.survivalMonths || sim1SurvivalResult;
  
  simulations.push({
    id: "rent_minus_10",
    delta: "rent -10%",
    survivalMonths: sim1Survival,
    signal: determineSignal(sim1ScoreResult.score, sim1Finance)
  });

  // 시뮬레이션 2: 목표 판매량 -10%
  const salesMinus10 = targetDailySales * 0.9;
  const sim2Finance = calculateFinance({
    brand,
    conditions,
    market,                 // ✅ 그대로 유지
    targetDailySales: salesMinus10
  });
  
  const sim2ScoreResult = calculateScore(sim2Finance, market, roadview);
  const sim2SurvivalResult = estimateSurvivalMonths(sim2Finance, market, roadview);
  const sim2Survival = sim2SurvivalResult.survivalMonths || sim2SurvivalResult;
  
  simulations.push({
    id: "sales_minus_10",
    delta: "target -10%",
    survivalMonths: sim2Survival,
    signal: determineSignal(sim2ScoreResult.score, sim2Finance)
  });

  // 시뮬레이션 3: 목표 판매량 +10% (선택적)
  const salesPlus10 = targetDailySales * 1.1;
  const sim3Finance = calculateFinance({
    brand,
    conditions,
    market,                 // ✅ 그대로 유지
    targetDailySales: salesPlus10
  });
  
  const sim3ScoreResult = calculateScore(sim3Finance, market, roadview);
  const sim3SurvivalResult = estimateSurvivalMonths(sim3Finance, market, roadview);
  const sim3Survival = sim3SurvivalResult.survivalMonths || sim3SurvivalResult;
  
  simulations.push({
    id: "sales_plus_10",
    delta: "target +10%",
    survivalMonths: sim3Survival,
    signal: determineSignal(sim3ScoreResult.score, sim3Finance)
  });

  // 시뮬레이션 4: 대출금 -20% (대출이 있는 경우만)
  if (conditions.loans && conditions.loans.length > 0) {
    const loansMinus20 = conditions.loans.map(loan => ({
      ...loan,
      principal: loan.principal * 0.8
    }));
    const sim4Conditions = { ...conditions, loans: loansMinus20 };
    const sim4Finance = calculateFinance({
      brand,
      conditions: sim4Conditions,
      market,                 // ✅ 그대로 유지
      targetDailySales
    });
    const sim4ScoreResult = calculateScore(sim4Finance, market, roadview);
    const sim4SurvivalResult = estimateSurvivalMonths(sim4Finance, market, roadview);
    const sim4Survival = sim4SurvivalResult.survivalMonths || sim4SurvivalResult;
    
    simulations.push({
      id: "loan_principal_minus_20",
      delta: "대출금 -20%",
      survivalMonths: sim4Survival,
      signal: determineSignal(sim4ScoreResult.score, sim4Finance)
    });
  }

  // 시뮬레이션 5: 이자율 -1%p (대출이 있는 경우만)
  if (conditions.loans && conditions.loans.length > 0) {
    const loansRateMinus1 = conditions.loans.map(loan => ({
      ...loan,
      apr: Math.max(0, loan.apr - 0.01)  // 최소 0%
    }));
    const sim5Conditions = { ...conditions, loans: loansRateMinus1 };
    const sim5Finance = calculateFinance({
      brand,
      conditions: sim5Conditions,
      market,                 // ✅ 그대로 유지
      targetDailySales
    });
    const sim5ScoreResult = calculateScore(sim5Finance, market, roadview);
    const sim5SurvivalResult = estimateSurvivalMonths(sim5Finance, market, roadview);
    const sim5Survival = sim5SurvivalResult.survivalMonths || sim5SurvivalResult;
    
    simulations.push({
      id: "loan_rate_minus_1p",
      delta: "이자율 -1%p",
      survivalMonths: sim5Survival,
      signal: determineSignal(sim5ScoreResult.score, sim5Finance)
    });
  }

  // 시뮬레이션 6: 현실 기대 매출 기준 재계산 (브랜드 점포 감소 추세 반영)
  const adjustedExpectedDailySales = finance.expected?.adjustedExpectedDailySales;
  if (adjustedExpectedDailySales !== null && adjustedExpectedDailySales !== undefined && 
      targetDailySales > adjustedExpectedDailySales) {
    // adjustedExpectedDailySales를 targetDailySales로 사용하여 재계산
    // ⚠️ 중요: expectedDailySales는 finance 내부에서 계산되므로 건드리지 않음
    const sim6Finance = calculateFinance({
      brand,
      conditions,
      market,                 // ✅ 그대로 유지
      targetDailySales: Math.round(adjustedExpectedDailySales)  // 보정된 기대값을 목표로 설정
    });
    
    const sim6ScoreResult = calculateScore(sim6Finance, market, roadview);
    const sim6SurvivalResult = estimateSurvivalMonths(sim6Finance, market, roadview);
    const sim6Survival = sim6SurvivalResult.survivalMonths || sim6SurvivalResult;
    
    const revenueAdjustmentFactor = finance.expected?.revenueAdjustmentFactor || 1.0;
    simulations.push({
      id: "adjusted_expected_sales",
      delta: `현실 기대 매출 기준 (보정계수 ${Math.round(revenueAdjustmentFactor * 100) / 100})`,
      survivalMonths: sim6Survival,
      signal: determineSignal(sim6ScoreResult.score, sim6Finance)
    });
  }

  return simulations;
}

module.exports = {
  generateImprovementSimulations
};
