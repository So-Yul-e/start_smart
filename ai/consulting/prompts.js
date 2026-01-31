/**
 * AI 컨설팅 프롬프트 템플릿
 * Claude API에 전달할 프롬프트 생성
 */

/**
 * 판매량 시나리오 추론 프롬프트 생성
 */
function createSalesScenarioPrompt({ brand, location, conditions, market, finance }) {
  return `당신은 프랜차이즈 카페 창업 컨설턴트입니다.

다음 정보를 바탕으로 현실적인 판매량 시나리오를 제안해주세요:

브랜드: ${brand.name}
입지: ${location.address}
조건:
- 초기 투자금: ${conditions.initialInvestment.toLocaleString()}원
- 월세: ${conditions.monthlyRent.toLocaleString()}원
- 평수: ${conditions.area}평
- 점주 근무: ${conditions.ownerWorking ? '예' : '아니오'}

상권 분석:
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}
- 같은 브랜드: ${market.competitors.sameBrand}개
- 유동인구: 평일 ${market.footTraffic?.weekday || 'medium'}, 주말 ${market.footTraffic?.weekend || 'medium'}

손익 분석:
- 월 순이익: ${finance.monthlyProfit?.toLocaleString() || 0}원
- 회수 개월: ${finance.paybackMonths || 'N/A'}개월

다음 형식으로 JSON만 응답해주세요 (설명 없이):
{
  "conservative": 숫자,
  "expected": 숫자,
  "optimistic": 숫자,
  "reason": "한국어로 간단한 이유 설명"
}`;
}

/**
 * 리스크 분석 프롬프트 생성
 */
function createRiskAnalysisPrompt({ brand, location, conditions, finance, market, roadview }) {
  return `당신은 프랜차이즈 카페 창업 리스크 분석 전문가입니다.

다음 정보를 바탕으로 주요 리스크를 최대 3개까지 식별하고, 각 리스크의 영향도를 평가해주세요:

브랜드: ${brand.name}
입지: ${location.address}
조건:
- 초기 투자금: ${conditions.initialInvestment.toLocaleString()}원
- 월세: ${conditions.monthlyRent.toLocaleString()}원
- 평수: ${conditions.area}평

손익 분석:
- 월 순이익: ${finance.monthlyProfit?.toLocaleString() || 0}원
- 회수 개월: ${finance.paybackMonths || 'N/A'}개월

상권 분석:
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}
- 상권 점수: ${market.marketScore}/100

로드뷰 분석:
- 전체 리스크: ${roadview.overallRisk}
- 리스크 점수: ${roadview.riskScore}/100

다음 형식으로 JSON만 응답해주세요 (설명 없이):
{
  "topRisks": [
    {
      "title": "리스크 제목",
      "description": "상세 설명",
      "impact": "high" 또는 "medium" 또는 "low"
    }
  ]
}`;
}

/**
 * 개선 제안 프롬프트 생성
 */
function createImprovementPrompt({ brand, location, conditions, finance, market, roadview, targetDailySales }) {
  return `당신은 프랜차이즈 카페 창업 개선 컨설턴트입니다.

다음 정보를 바탕으로 실현 가능한 개선 방안을 최대 3개까지 제안해주세요:

브랜드: ${brand.name}
입지: ${location.address}
조건:
- 초기 투자금: ${conditions.initialInvestment.toLocaleString()}원
- 월세: ${conditions.monthlyRent.toLocaleString()}원
- 평수: ${conditions.area}평
- 점주 근무: ${conditions.ownerWorking ? '예' : '아니오'}
- 목표 일 판매량: ${targetDailySales}잔

손익 분석:
- 월 순이익: ${finance.monthlyProfit?.toLocaleString() || 0}원
- 회수 개월: ${finance.paybackMonths || 'N/A'}개월

상권 분석:
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}

다음 형식으로 JSON만 응답해주세요 (설명 없이):
{
  "improvements": [
    {
      "title": "개선 방안 제목",
      "description": "상세 설명",
      "expectedImpact": "예상 효과 (예: paybackMonths: 50 → 45)"
    }
  ]
}`;
}

/**
 * 경쟁 환경 분석 프롬프트 생성
 */
function createCompetitiveAnalysisPrompt({ brand, market }) {
  return `당신은 프랜차이즈 카페 경쟁 환경 분석 전문가입니다.

다음 정보를 바탕으로 경쟁 환경을 분석해주세요:

브랜드: ${brand.name}
상권 분석:
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}
- 같은 브랜드: ${market.competitors.sameBrand}개
- 상권 점수: ${market.marketScore}/100

다음 형식으로 JSON만 응답해주세요 (설명 없이):
{
  "intensity": "low" 또는 "medium" 또는 "high",
  "differentiation": "possible" 또는 "difficult" 또는 "impossible",
  "priceStrategy": "premium" 또는 "standard" 또는 "budget"
}`;
}

module.exports = {
  createSalesScenarioPrompt,
  createRiskAnalysisPrompt,
  createImprovementPrompt,
  createCompetitiveAnalysisPrompt
};
