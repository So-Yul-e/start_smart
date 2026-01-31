/**
 * Finance 계산 메인 로직
 * 
 * 입력: brand, conditions, market, targetDailySales, scenarios
 * 출력: monthlyRevenue, expected, monthlyCosts, monthlyProfit, paybackMonths, ...
 */

const { calculateFinance } = require('./calculator');
const { validateFinanceOutputSimple } = require('./validator');

/**
 * 손익 계산 메인 함수
 * @param {Object} input - 입력 데이터
 * @param {Object} input.brand - 브랜드 정보 (defaults 포함)
 * @param {Object} input.conditions - 조건 (투자금, 월세, 평수 등)
 * @param {Object} input.market - 상권 정보 (기대 판매량 등)
 * @param {Number} input.targetDailySales - 목표 일 판매량
 * @param {Array<Number>} [input.scenarios] - 시나리오별 일 판매량 배열
 * @returns {Object} 손익 계산 결과
 */
function calculate(input) {
  const {
    brand,
    conditions,
    market,
    targetDailySales,
    scenarios = []
  } = input;

  // 기본 손익 계산 (목표 판매량 기준)
  const result = calculateFinance({
    brand,
    conditions,
    market,
    targetDailySales
  });

  // 시나리오 테이블 생성 (scenarios가 있는 경우)
  // ⚠️ 중요: scenarioTable 계산 시 변경되는 것은 targetDailySales(=daily)만이며,
  //          market.expectedDailySales는 원래 값을 유지한다.
  //          (expected가 시나리오에 따라 바뀌면 "기대치 vs 목표치" 비교 의미가 붕괴됨)
  if (scenarios.length > 0) {
    result.scenarioTable = scenarios
      .filter(daily => daily > 0)  // 0 이하 값 필터링
      .map(daily => {
        const scenarioResult = calculateFinance({
          brand,
          conditions,
          market: market,  // expectedDailySales는 원래 값 유지
          targetDailySales: daily  // 시나리오별로 변경되는 것은 targetDailySales만
        });
        
        return {
          daily: daily,
          profit: Math.round(scenarioResult.monthlyProfit),
          paybackMonths: scenarioResult.paybackMonths === null 
            ? null 
            : Math.round(scenarioResult.paybackMonths * 10) / 10
        };
      });
  } else {
    result.scenarioTable = [];  // 명시적으로 빈 배열 설정
  }

  // 출력 형식 검증 (개발 환경에서만)
  if (process.env.NODE_ENV !== 'production') {
    validateFinanceOutputSimple(result, false);
  }

  return result;
}

module.exports = {
  calculate,
  calculateFinance  // 직접 호출 가능하도록 export
};
