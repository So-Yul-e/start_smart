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
  
  // 반경 정보 추출 (radiusM 또는 location.radius)
  const radiusM = market.radiusM || market.location?.radius || 500;

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
- 경쟁 카페 수: ${market.competitors.total}개 (주소지 기준 반경 ${radiusM}m 내)
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
  const { finance, targetDailySales, market, roadview, conditions, brand } = data;
  
  // 반경 정보 추출 (radiusM 또는 location.radius)
  const radiusM = market.radiusM || market.location?.radius || 500;

  // 초기 투자비용 추출
  const initialInvestment = conditions?.initialInvestment || 0;
  
  // 평균 단가 추출 (아메리카노 판매금액)
  const avgPrice = brand?.defaults?.avgPrice || 3500; // 기본값 3,500원

  // 월 지출 비용 상세 정보 추출
  const monthlyCosts = finance.monthlyCosts || {};
  const totalMonthlyCosts = Object.values(monthlyCosts).reduce((sum, val) => sum + (Number(val) || 0), 0);
  
  // 지출 항목별 상세 정보 문자열 생성
  const costDetails = monthlyCosts ? `
월 지출 비용 상세 (총 ${(totalMonthlyCosts / 10000).toFixed(0)}만원):
${monthlyCosts.rent ? `- 월세 (rent): ${(monthlyCosts.rent / 10000).toFixed(0)}만원` : ''}
${monthlyCosts.labor ? `- 인건비 (labor): ${(monthlyCosts.labor / 10000).toFixed(0)}만원` : ''}
${monthlyCosts.materials ? `- 원재료비 (materials): ${(monthlyCosts.materials / 10000).toFixed(0)}만원` : ''}
${monthlyCosts.utilities ? `- 공과금 (utilities): ${(monthlyCosts.utilities / 10000).toFixed(0)}만원` : ''}
${monthlyCosts.royalty ? `- 로열티 (royalty): ${(monthlyCosts.royalty / 10000).toFixed(0)}만원` : ''}
${monthlyCosts.marketing ? `- 마케팅비 (marketing): ${(monthlyCosts.marketing / 10000).toFixed(0)}만원` : ''}
${monthlyCosts.etc ? `- 기타 고정비 (etc): ${(monthlyCosts.etc / 10000).toFixed(0)}만원` : ''}` : '';

  return `당신은 프랜차이즈 카페 창업 컨설턴트입니다.
다음 재무 분석 결과를 바탕으로 핵심 리스크 Top 3를 식별하고 개선 제안을 해주세요:

재무 결과:
- 초기 투자비용: ${(initialInvestment / 100000000).toFixed(1)}억원
- 평균 단가(아메리카노 판매금액): ${avgPrice}원/잔
- 월 매출: ${finance.monthlyRevenue ? (finance.monthlyRevenue / 10000).toFixed(0) + '만원' : '정보 없음'}
  (계산식: 판매량(${targetDailySales}잔/일) × 아메리카노 판매금액(${avgPrice}원) × 30일 = ${targetDailySales * avgPrice * 30}원)
- 총 지출 금액: ${(totalMonthlyCosts / 10000).toFixed(0)}만원
  (계산식: 월세 + 인건비 + 원재료비 + 공과금 + 로열티 + 마케팅비 + 기타고정비)${costDetails}
- 월 순수익: ${(finance.monthlyProfit / 10000).toFixed(0)}만원
  (계산식: 월 매출 - 총 지출금액 = ${finance.monthlyRevenue ? (finance.monthlyRevenue / 10000).toFixed(0) : '0'}만원 - ${(totalMonthlyCosts / 10000).toFixed(0)}만원)
- 회수 개월: ${finance.paybackMonths}개월
  (계산식: 초기 투자비용(${(initialInvestment / 100000000).toFixed(1)}억원) - (월순수익(${(finance.monthlyProfit / 10000).toFixed(0)}만원) × N) ≤ 0이 되는 최소 정수 N)
- 목표 판매량: ${targetDailySales}잔/일
  (계산식: 월 매출 - 총지출금액이 30% 이상인 수량, 즉 (월 매출 - 총 지출금액) / 월 매출 ≥ 0.3)

⚠️ 중요 계산식:
1. 월 매출 = 판매량(잔/일) × 아메리카노 판매금액(원/잔) × 30일
   예시: ${targetDailySales}잔/일 × ${avgPrice}원 × 30일 = ${targetDailySales * avgPrice * 30}원

2. 총 지출금액 = 월세 + 인건비 + 원재료비 + 공과금 + 로열티 + 마케팅비 + 기타고정비
   현재 총 지출: ${(totalMonthlyCosts / 10000).toFixed(0)}만원

3. 월 순수익 = 월 매출 - 총 지출금액
   현재 월 순수익: ${finance.monthlyRevenue ? (finance.monthlyRevenue / 10000).toFixed(0) : '0'}만원 - ${(totalMonthlyCosts / 10000).toFixed(0)}만원 = ${(finance.monthlyProfit / 10000).toFixed(0)}만원

4. 회수 개월 = 초기 투자비용 - (월순수익 × N) ≤ 0이 되는 최소 정수 N
   예시: ${(initialInvestment / 100000000).toFixed(1)}억원 - (${(finance.monthlyProfit / 10000).toFixed(0)}만원 × N) ≤ 0
   → N = ${finance.monthlyProfit > 0 ? Math.ceil(initialInvestment / finance.monthlyProfit) : '계산 불가 (월순수익 ≤ 0)'}개월 (${finance.paybackMonths}개월로 계산됨)

5. 목표 판매량 = 월 매출 - 총지출금액이 30% 이상인 수량
   즉, (월 매출 - 총 지출금액) / 월 매출 ≥ 0.3
   현재 수익률: ${finance.monthlyRevenue && finance.monthlyRevenue > 0 ? ((finance.monthlyProfit / finance.monthlyRevenue) * 100).toFixed(1) : '0'}%

상권 정보:
- 경쟁 카페 수: ${market.competitors.total}개 (주소지 기준 반경 ${radiusM}m 내)
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
   
   💡 지출 비용 분석:
   - 총 지출 금액이 월 매출의 80% 이상이면 "high" 리스크 (수익률 매우 낮음)
   - 총 지출 금액이 월 매출의 70-80%면 "medium" 리스크 (수익률 낮음)
   - 총 지출 금액이 월 매출의 70% 미만이면 "low" 리스크 (수익률 양호)
   - 지출 항목 중 월세, 인건비, 원재료비가 과도하게 높으면 해당 항목에 대한 개선 제안 필요

2. 회수 기간 기준 (월 순이익이 양수일 때만 적용):
   - 회수 기간 ≥ 36개월 → "high" 리스크 (구조적 위험)
   - 회수 기간 > 24개월 → "medium" 리스크
   - 회수 기간 ≤ 24개월 → "low" 리스크

3. 상권 경쟁도:
   【경쟁 밀도 판단 기준】
   경쟁 카페 수는 주소지 기준 반경 ${radiusM}m 내에서 계산됩니다 (행정구역 전체가 아닌 주소지 중심 반경 기준):
   - "high": 경쟁 카페 수가 많음 (일반적으로 반경 ${radiusM}m 기준 7개 이상)
   - "medium": 경쟁 카페 수가 보통 (일반적으로 반경 ${radiusM}m 기준 4-6개)
   - "low": 경쟁 카페 수가 적음 (일반적으로 반경 ${radiusM}m 기준 0-3개)
   
   리스크 판단:
   - 경쟁 밀도가 "high"이고 경쟁 카페 수가 많을수록 리스크 증가
   - 경쟁 밀도가 "high" → "high" 또는 "medium" 리스크
   - 경쟁 밀도가 "medium" → "medium" 또는 "low" 리스크
   - 경쟁 밀도가 "low" → "low" 리스크

4. 물리적 리스크:
   - 로드뷰 리스크 점수가 낮을수록(60점 미만) 리스크 증가

위 기준을 종합하여 가장 심각한 리스크부터 우선순위를 매겨주세요.

【개선 제안 작성 가이드】
개선 제안은 구체적인 수치와 함께 작성해주세요:
- 월세 절감: "월세를 10% 낮추면 월 순이익이 X만원 증가하여 회수 기간이 Y개월로 단축됩니다"
- 인건비 절감: "점주 근무 시간을 늘리거나 알바 인원을 조정하면 인건비를 X만원 절감할 수 있습니다"
- 원재료비 절감: "원재료 구매처 협상 또는 대량 구매로 원재료비를 X% 절감 가능합니다"
- 기타 지출 절감: 각 지출 항목별로 구체적인 절감 방안과 예상 효과를 제시해주세요

【우선순위 정렬 기준】
1. impact 레벨 우선: "high" > "medium" > "low"
2. 같은 impact 레벨 내에서는:
   - 월 순이익 리스크 (적자 위험) → 최우선
   - 지출 비용 과다 리스크 → 2순위
   - 회수 기간 리스크 → 3순위
   - 상권 경쟁도 리스크 → 4순위
   - 물리적 리스크 → 5순위

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
  
  // 반경 정보 추출 (radiusM 또는 location.radius)
  const radiusM = market.radiusM || market.location?.radius || 500;

  return `당신은 프랜차이즈 카페 창업 컨설턴트입니다.
다음 상권 정보를 바탕으로 경쟁 환경을 분석해주세요:

경쟁 정보:
- 경쟁 카페 수: ${market.competitors.total}개 (주소지 기준 반경 ${radiusM}m 내)
- 경쟁 밀도: ${market.competitors.density}
- 브랜드: ${brand.name}

【경쟁 밀도 판단 기준】
경쟁 카페 수는 주소지 기준 반경 ${radiusM}m 내에서 계산됩니다 (행정구역 전체가 아닌 주소지 중심 반경 기준):
- "high": 경쟁 카페 수가 많음 (일반적으로 반경 ${radiusM}m 기준 7개 이상)
- "medium": 경쟁 카페 수가 보통 (일반적으로 반경 ${radiusM}m 기준 4-6개)
- "low": 경쟁 카페 수가 적음 (일반적으로 반경 ${radiusM}m 기준 0-3개)

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

