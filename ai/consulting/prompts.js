/**
 * AI Consulting - 프롬프트 템플릿
 * 
 * 프롬프트를 별도 파일로 분리하여 관리합니다.
 * 토큰 비용 최적화를 위해 프롬프트를 간결하게 유지합니다.
 */

/**
 * 판매량 시나리오 추론 프롬프트
 * @param {Object} data - 입력 데이터
 * @param {Object} data.brand - 브랜드 정보
 * @param {Object} data.location - 위치 정보
 * @param {Object} data.conditions - 창업 조건
 * @param {Object} data.market - 상권 분석 결과
 * @param {Object} data.roadview - 로드뷰 분석 결과
 * @returns {string} 프롬프트 텍스트
 */
function getSalesScenarioPrompt(data) {
  const { brand, location, conditions, market, roadview } = data;

  return `당신은 프랜차이즈 카페 창업 컨설턴트입니다.

다음 정보를 바탕으로 현실적인 판매량 시나리오를 제안해주세요:

【사용자 입력 조건】
브랜드: ${brand.name}
입지: ${location.address}
조건:
- 초기 투자금: ${conditions.initialInvestment}원
- 월세: ${conditions.monthlyRent}원
- 평수: ${conditions.area}평
- 점주 근무: ${conditions.ownerWorking ? '예' : '아니오'}

【시스템 분석 결과 (참고용)】
상권 분석:
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}
- 평일 유동인구: ${market.footTraffic.weekday}
- 주말 유동인구: ${market.footTraffic.weekend}

물리적 리스크:
- 전체 리스크: ${roadview.overallRisk}
- 리스크 점수: ${roadview.riskScore}/100

다음 형식으로 JSON을 반환해주세요:
{
  "conservative": 숫자,  // 보수적 판매량 (잔/일)
  "expected": 숫자,      // 기대 판매량 (잔/일)
  "optimistic": 숫자,    // 낙관적 판매량 (잔/일)
  "reason": "이유 설명"
}`;
}

/**
 * 리스크 분석 및 개선 제안 프롬프트
 * @param {Object} data - 입력 데이터
 * @param {Object} data.finance - 재무 분석 결과
 * @param {number} data.targetDailySales - 목표 일 판매량
 * @param {Object} data.market - 상권 분석 결과
 * @param {Object} data.roadview - 로드뷰 분석 결과
 * @returns {string} 프롬프트 텍스트
 */
function getRiskAnalysisPrompt(data) {
  const { finance, targetDailySales, market, roadview } = data;

  return `당신은 프랜차이즈 카페 창업 컨설턴트입니다.
다음 재무 분석 결과를 바탕으로 핵심 리스크 Top 3를 식별하고 개선 제안을 해주세요:

재무 결과:
- 월 순이익: ${finance.monthlyProfit}원
- 회수 개월: ${finance.paybackMonths}개월
- 목표 판매량: ${targetDailySales}잔/일

상권 정보:
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}

물리적 리스크:
- 전체 리스크: ${roadview.overallRisk}
- 리스크 점수: ${roadview.riskScore}/100

【리스크 판단 기준】
다음 기준을 반드시 고려하여 리스크를 식별해주세요:

⚠️ 중요: 회수 기간은 월 순이익이 0원보다 큰 양수일 때만 의미가 있습니다.
월 순이익이 0원 이하면 회수 기간을 계산할 수 없으므로, 월 순이익 기준을 우선 확인하세요.

1. 월 순이익 기준 (최우선 확인):
   - 월 순이익 ≤ 0원 → "high" 리스크 (적자 위험, 회수 불가능)
   - 월 순이익 < 500만원 → "medium" 리스크
   - 월 순이익 ≥ 500만원 → "low" 리스크

2. 회수 기간 기준 (월 순이익이 양수일 때만 적용):
   - 회수 기간 ≥ 36개월 → "high" 리스크 (구조적 위험)
   - 회수 기간 > 24개월 → "medium" 리스크
   - 회수 기간 ≤ 24개월 → "low" 리스크

3. 상권 경쟁도:
   【경쟁 밀도 판단 기준】
   경쟁 밀도는 반경 내 경쟁 카페 수에 따라 결정됩니다:
   - "high": 경쟁 카페 수가 많음 (일반적으로 반경 500m 기준 7개 이상)
   - "medium": 경쟁 카페 수가 보통 (일반적으로 반경 500m 기준 4-6개)
   - "low": 경쟁 카페 수가 적음 (일반적으로 반경 500m 기준 0-3개)
   
   리스크 판단:
   - 경쟁 밀도가 "high"이고 경쟁 카페 수가 많을수록 리스크 증가
   - 경쟁 밀도가 "high" → "high" 또는 "medium" 리스크
   - 경쟁 밀도가 "medium" → "medium" 또는 "low" 리스크
   - 경쟁 밀도가 "low" → "low" 리스크

4. 물리적 리스크:
   - 로드뷰 리스크 점수가 낮을수록(60점 미만) 리스크 증가

위 기준을 종합하여 가장 심각한 리스크부터 우선순위를 매겨주세요.

【우선순위 정렬 기준】
1. impact 레벨 우선: "high" > "medium" > "low"
2. 같은 impact 레벨 내에서는:
   - 월 순이익 리스크 (적자 위험) → 최우선
   - 회수 기간 리스크 → 2순위
   - 상권 경쟁도 리스크 → 3순위
   - 물리적 리스크 → 4순위

다음 형식으로 JSON을 반환해주세요:
⚠️ 매우 중요: JSON 문자열 값 내부에는 절대 따옴표(")를 사용하지 마세요!
- "medium", "high", "low" 같은 단어는 따옴표 없이 medium, high, low로 작성하세요
- 예시: "description": "월 순이익이 500만원 미만으로 medium 리스크 수준입니다" (O)
- 잘못된 예시: "description": "월 순이익이 500만원 미만으로 "medium" 리스크 수준입니다" (X)

{
  "topRisks": [
    {
      "title": "리스크 제목",
      "description": "상세 설명 (medium, high, low 같은 단어는 따옴표 없이 작성)",
      "impact": "high"
    }
  ],
  "improvements": [
    {
      "title": "개선 제안 제목",
      "description": "상세 설명",
      "expectedImpact": "기대 효과 (구체적 수치 포함)"
    }
  ]
}`;
}

/**
 * 경쟁 환경 분석 프롬프트
 * @param {Object} data - 입력 데이터
 * @param {Object} data.brand - 브랜드 정보
 * @param {Object} data.market - 상권 분석 결과
 * @returns {string} 프롬프트 텍스트
 */
function getCompetitiveAnalysisPrompt(data) {
  const { brand, market } = data;

  return `당신은 프랜차이즈 카페 창업 컨설턴트입니다.
다음 상권 정보를 바탕으로 경쟁 환경을 분석해주세요:

경쟁 정보:
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}
- 브랜드: ${brand.name}

【경쟁 밀도 판단 기준】
경쟁 밀도는 반경 내 경쟁 카페 수에 따라 결정됩니다:
- "high": 경쟁 카페 수가 많음 (일반적으로 반경 500m 기준 7개 이상)
- "medium": 경쟁 카페 수가 보통 (일반적으로 반경 500m 기준 4-6개)
- "low": 경쟁 카페 수가 적음 (일반적으로 반경 500m 기준 0-3개)

경쟁 밀도와 경쟁 카페 수를 종합하여 다음을 판단해주세요:
- intensity: 경쟁 밀도가 "high"이면 "high", "medium"이면 "medium", "low"이면 "low"
- differentiation: 경쟁 밀도가 "high"일수록 차별화가 어려움
- priceStrategy: 경쟁 밀도가 "high"일수록 가격 경쟁이 치열하므로 "budget" 또는 "standard" 고려

다음 형식으로 JSON을 반환해주세요:
{
  "intensity": "high",           // low | medium | high
  "differentiation": "possible", // possible | difficult | impossible
  "priceStrategy": "premium"     // premium | standard | budget
}`;
}

module.exports = {
  getSalesScenarioPrompt,
  getRiskAnalysisPrompt,
  getCompetitiveAnalysisPrompt
};

