# 데이터 항목 비교 분석

## 개요
`INPUT_REQUIREMENTS.md`의 입력 요구사항과 실제 구현(`ROLE.md`, `index.js`, `prompts.js`)에서 사용하는 데이터 항목을 비교 분석합니다.

---

## 1. 입력 데이터 구조 비교

### 1.1 INPUT_REQUIREMENTS.md (엔진 입력 요구사항)

```js
{
  brandId: "brand_mega",  // 또는 brand 객체 전체
  brand: {
    id, name,
    defaults: { avgPrice, cogsRate, laborRate, utilitiesRate, royaltyRate, marketingRate, etcFixed, ownerWorkingMultiplier, expectedDailySales },
    exitDefaults: { ... }
  },
  conditions: {
    initialInvestment, monthlyRent, area, ownerWorking,
    loans: [...],
    exitInputs: { keyMoney, pyeong, demolitionBase, demolitionPerPyeong, workingCapital }
  },
  market: {
    expectedDailySales,      // 상권 평균 일 판매량
    radiusM,
    marketScore,
    competitors: { total, density },
    tradeAreaType, dayType, footTrafficIndex, timeProfileKey,  // Multiplier 레이어
    demandMultiplier
  },
  roadview: {
    overallRisk, riskScore
  },
  targetDailySales: 300
}
```

### 1.2 ROLE.md (현재 구현 요구사항)

```js
{
  brand: { id, name },
  location: { lat, lng, address },
  conditions: {
    initialInvestment, monthlyRent, area, ownerWorking
  },
  targetDailySales: 300,
  finance: {                    // ⚠️ 파생 데이터 (엔진 출력값)
    monthlyProfit, paybackMonths
  },
  market: {
    competitors: { total, density },
    footTraffic: { weekday, weekend }  // ⚠️ 구조가 다름
  },
  roadview: {
    overallRisk, riskScore
  }
}
```

### 1.3 index.js / prompts.js (실제 구현)

```js
// generateConsulting 함수 입력
{
  brand: { id, name, defaults?: { avgPrice, ... } },  // defaults는 prompts.js에서 사용
  location: { lat, lng, address },
  conditions: {
    initialInvestment, monthlyRent, area, ownerWorking
  },
  targetDailySales: 300,
  finance: {                    // ⚠️ 필수 입력 (재무 엔진 출력값)
    monthlyRevenue,              // prompts.js에서 사용
    monthlyProfit,
    paybackMonths,
    monthlyCosts: {              // prompts.js에서 사용
      rent, labor, materials, utilities, royalty, marketing, etc
    }
  },
  market: {
    radiusM,                     // prompts.js에서 사용 (자동 계산용)
    competitors: { total, density },
    footTraffic: { weekday, weekend }  // prompts.js에서 사용
  },
  roadview: {
    overallRisk, riskScore
  }
}
```

---

## 2. 주요 차이점 분석

### 2.1 ✅ 일치하는 항목

| 항목 | INPUT_REQUIREMENTS | ROLE.md / 구현 | 상태 |
|------|-------------------|----------------|------|
| `brand.id` | ✅ | ✅ | 일치 |
| `brand.name` | ✅ | ✅ | 일치 |
| `conditions.initialInvestment` | ✅ | ✅ | 일치 |
| `conditions.monthlyRent` | ✅ | ✅ | 일치 |
| `conditions.area` | ✅ | ✅ | 일치 |
| `conditions.ownerWorking` | ✅ | ✅ | 일치 |
| `targetDailySales` | ✅ | ✅ | 일치 |
| `roadview.overallRisk` | ✅ | ✅ | 일치 |
| `roadview.riskScore` | ✅ | ✅ | 일치 |
| `market.competitors.total` | ✅ | ✅ | 일치 |
| `market.competitors.density` | ✅ | ✅ | 일치 |

### 2.2 ⚠️ 누락된 항목 (INPUT_REQUIREMENTS에 있지만 구현에서 사용 안 함)

| 항목 | INPUT_REQUIREMENTS | 구현 상태 | 영향도 |
|------|-------------------|----------|--------|
| `brand.defaults.avgPrice` | ✅ 필수 | ⚠️ prompts.js에서 기본값(3500) 사용 | **중간** - 리스크 분석 정확도에 영향 |
| `brand.defaults.cogsRate` | ✅ 필수 | ❌ 미사용 | **낮음** - 재무 계산은 finance 엔진에서 처리 |
| `brand.defaults.laborRate` | ✅ 필수 | ❌ 미사용 | **낮음** - 재무 계산은 finance 엔진에서 처리 |
| `market.expectedDailySales` | ✅ 필수 | ❌ 미사용 | **높음** - 판매량 시나리오 추론에 유용할 수 있음 |
| `market.marketScore` | ✅ 필수 | ❌ 미사용 | **중간** - 판매량 시나리오 추론에 유용할 수 있음 |
| `market.radiusM` | ✅ 필수 | ⚠️ prompts.js에서 기본값(500) 사용 | **낮음** - 자동 계산되지만 명시적 전달 권장 |
| `market.tradeAreaType` | 선택 | ❌ 미사용 | **낮음** - Multiplier 레이어 (다른 엔진에서 처리) |
| `market.dayType` | 선택 | ❌ 미사용 | **낮음** - Multiplier 레이어 |
| `market.footTrafficIndex` | 선택 | ❌ 미사용 | **낮음** - Multiplier 레이어 |
| `conditions.loans` | 선택 | ❌ 미사용 | **낮음** - 재무 엔진에서 처리 |
| `conditions.exitInputs` | 선택 | ❌ 미사용 | **낮음** - Exit Plan 엔진에서 처리 |

---

## 2.2.1 누락된 항목 상세 설명

### 🔴 높은 우선순위 누락 항목

#### 1. `market.expectedDailySales` (상권 평균 일 판매량)

**정의 및 의미:**
- **타입**: `number` (잔/일)
- **의미**: 해당 상권에서 평균적으로 하루에 판매되는 커피 잔 수
- **출처**: 상권 분석 엔진에서 계산된 값 (AI 분석 또는 통계 데이터 기반)

**현재 상태:**
- ✅ INPUT_REQUIREMENTS.md: **필수 필드**로 명시
- ❌ prompts.js: 사용하지 않음
- ⚠️ test_mega.js: 실제로 전달되고 있음 (256잔/일)
- ⚠️ test_mega_pdf.js: 실제로 전달되고 있음 (423잔/일)

**왜 누락되었는가:**
- 초기 구현 시 판매량 시나리오 추론에 필수적이지 않다고 판단
- 경쟁 카페 수와 유동인구 정보만으로도 판매량 추론이 가능하다고 가정
- 하지만 실제로는 **상권 평균 판매량이 가장 정확한 기준점**이 됨

**활용 방법 및 이점:**
1. **판매량 시나리오 추론의 기준점 제공**
   - 보수적 시나리오: `expectedDailySales`의 80-90%
   - 기대 시나리오: `expectedDailySales`와 유사하거나 약간 높음
   - 낙관적 시나리오: `expectedDailySales`의 110-130%

2. **목표 판매량과의 비교**
   - `targetDailySales`와 `expectedDailySales`의 차이(GAP)를 분석
   - GAP이 크면 현실성 없는 목표일 수 있음을 경고

3. **프롬프트 예시:**
```js
// 현재 (prompts.js - 사용 안 함)
상권 분석:
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}

// 개선 후
상권 분석:
- 상권 평균 일 판매량: ${market.expectedDailySales}잔/일 (기준점)
- 목표 판매량: ${targetDailySales}잔/일
- GAP: ${((targetDailySales - market.expectedDailySales) / market.expectedDailySales * 100).toFixed(1)}%
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}
```

**실제 사용 예시 (test_mega.js):**
```js
market: {
  expectedDailySales: 256,  // 상권 기대 일 판매량
  // ... 다른 필드
}
```

**개선 코드 예시:**
```js
// prompts.js - getSalesScenarioPrompt 함수 수정
function getSalesScenarioPrompt(data) {
  const { brand, location, conditions, market, roadview, targetDailySales } = data;
  
  const radiusM = market.radiusM || market.location?.radius || 500;
  const expectedDailySales = market.expectedDailySales;
  const gapPct = expectedDailySales 
    ? ((targetDailySales - expectedDailySales) / expectedDailySales * 100).toFixed(1)
    : null;

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
- 목표 판매량: ${targetDailySales}잔/일

【시스템 분석 결과 (참고용)】
상권 분석:
${expectedDailySales ? `- 상권 평균 일 판매량: ${expectedDailySales}잔/일 (기준점)
- 목표 판매량과의 GAP: ${gapPct}%${gapPct > 20 ? ' (목표가 상권 평균보다 높음, 현실성 검토 필요)' : ''}
` : ''}- 경쟁 카페 수: ${market.competitors.total}개 (주소지 기준 반경 ${radiusM}m 내)
- 경쟁 밀도: ${market.competitors.density}
${market.marketScore ? `- 상권 점수: ${market.marketScore}/100` : ''}
- 평일 유동인구: ${market.footTraffic?.weekday || '정보 없음'}
- 주말 유동인구: ${market.footTraffic?.weekend || '정보 없음'}

물리적 리스크:
- 전체 리스크: ${roadview.overallRisk}
- 리스크 점수: ${roadview.riskScore}/100

${expectedDailySales ? `⚠️ 중요: 상권 평균 일 판매량(${expectedDailySales}잔/일)을 기준으로 판매량 시나리오를 제안해주세요.
- 보수적 시나리오: 상권 평균의 80-90% 수준
- 기대 시나리오: 상권 평균과 유사하거나 약간 높은 수준
- 낙관적 시나리오: 상권 평균의 110-130% 수준
` : ''}다음 형식으로 JSON을 반환해주세요:
{
  "conservative": 숫자,  // 보수적 판매량 (잔/일)
  "expected": 숫자,      // 기대 판매량 (잔/일)
  "optimistic": 숫자,    // 낙관적 판매량 (잔/일)
  "reason": "이유 설명"
}`;
}
```

---

#### 2. `market.marketScore` (상권 점수)

**정의 및 의미:**
- **타입**: `number` (0-100)
- **의미**: 상권의 전반적인 매력도를 종합적으로 평가한 점수
- **계산 기준**: 유동인구, 경쟁 강도, 접근성, 상권 성장성 등을 종합하여 산출
- **출처**: 상권 분석 엔진에서 계산된 값

**현재 상태:**
- ✅ INPUT_REQUIREMENTS.md: **필수 필드**로 명시
- ❌ prompts.js: 사용하지 않음
- ⚠️ test_mega.js: 실제로 전달되고 있음 (70점)
- ⚠️ test_mega_pdf.js: 실제로 전달되고 있음 (60점)

**왜 누락되었는가:**
- 경쟁 카페 수와 밀도 정보만으로도 충분하다고 판단
- 하지만 상권 점수는 **여러 요소를 종합한 지표**로 더 정확한 판단 가능

**활용 방법 및 이점:**
1. **판매량 시나리오 추론의 신뢰도 조정**
   - 상권 점수가 높을수록(80점 이상): 낙관적 시나리오 신뢰도 증가
   - 상권 점수가 낮을수록(60점 미만): 보수적 시나리오에 더 가중치

2. **리스크 분석에 활용**
   - 상권 점수가 낮으면 경쟁 환경 리스크로 분류
   - 상권 점수와 경쟁 밀도를 함께 고려하여 더 정확한 분석

3. **프롬프트 예시:**
```js
// 현재 (prompts.js - 사용 안 함)
상권 분석:
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}

// 개선 후
상권 분석:
- 상권 점수: ${market.marketScore}/100 ${market.marketScore >= 80 ? '(우수)' : market.marketScore >= 60 ? '(보통)' : '(주의)'}
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}
```

**실제 사용 예시 (test_mega.js):**
```js
market: {
  marketScore: 70,  // 상권 점수 70점
  // ... 다른 필드
}
```

**개선 코드 예시:**
```js
// prompts.js - getSalesScenarioPrompt 함수 수정
function getSalesScenarioPrompt(data) {
  const { brand, location, conditions, market, roadview, targetDailySales } = data;
  
  const radiusM = market.radiusM || market.location?.radius || 500;
  const marketScore = market.marketScore;
  const marketScoreLabel = marketScore >= 80 ? '우수' : marketScore >= 60 ? '보통' : '주의';

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
- 목표 판매량: ${targetDailySales}잔/일

【시스템 분석 결과 (참고용)】
상권 분석:
${marketScore ? `- 상권 점수: ${marketScore}/100 (${marketScoreLabel})` : ''}
- 경쟁 카페 수: ${market.competitors.total}개 (주소지 기준 반경 ${radiusM}m 내)
- 경쟁 밀도: ${market.competitors.density}
${market.expectedDailySales ? `- 상권 평균 일 판매량: ${market.expectedDailySales}잔/일` : ''}
- 평일 유동인구: ${market.footTraffic?.weekday || '정보 없음'}
- 주말 유동인구: ${market.footTraffic?.weekend || '정보 없음'}

물리적 리스크:
- 전체 리스크: ${roadview.overallRisk}
- 리스크 점수: ${roadview.riskScore}/100

${marketScore ? `⚠️ 중요: 상권 점수(${marketScore}/100)를 고려하여 판매량 시나리오를 제안해주세요.
- 상권 점수가 높을수록(80점 이상): 낙관적 시나리오 신뢰도 증가
- 상권 점수가 낮을수록(60점 미만): 보수적 시나리오에 더 가중치
` : ''}다음 형식으로 JSON을 반환해주세요:
{
  "conservative": 숫자,  // 보수적 판매량 (잔/일)
  "expected": 숫자,      // 기대 판매량 (잔/일)
  "optimistic": 숫자,    // 낙관적 판매량 (잔/일)
  "reason": "이유 설명"
}`;
}
```

---

### 🟡 중간 우선순위 누락 항목

#### 3. `brand.defaults.avgPrice` (평균 단가)

**정의 및 의미:**
- **타입**: `number` (원/잔)
- **의미**: 해당 브랜드의 평균 커피 판매 단가 (예: 아메리카노 기준)
- **출처**: 브랜드 기본값 또는 사용자 입력

**현재 상태:**
- ✅ INPUT_REQUIREMENTS.md: **필수 필드**로 명시
- ⚠️ prompts.js: 기본값 3500원 사용 (하드코딩)
- ❌ index.js: 입력 검증 없음

**왜 기본값을 사용하는가:**
- 모든 브랜드가 비슷한 가격대라고 가정
- 하지만 실제로는 브랜드별 차이가 큼 (예: 스타벅스 4500원, 메가커피 3500원, 이디야 4000원)

**활용 방법 및 이점:**
1. **리스크 분석의 정확도 향상**
   - 평균 단가가 높을수록: 매출은 높지만 고객 수는 적을 수 있음
   - 평균 단가가 낮을수록: 고객 수는 많지만 매출은 낮을 수 있음

2. **프롬프트 예시:**
```js
// 현재 (prompts.js - 하드코딩)
- 평균 단가(아메리카노 판매금액): ${avgPrice}원/잔

// 개선 후
- 평균 단가(아메리카노 판매금액): ${brand.defaults?.avgPrice || 3500}원/잔
${!brand.defaults?.avgPrice ? '(기본값 사용, 브랜드별 차이 반영 안 됨)' : ''}
```

**실제 사용 예시 (test_mega.js):**
```js
brand: {
  id: "brand_mega",
  name: "메가커피",
  defaults: {
    avgPrice: 3500,  // 메가커피 평균 단가
    // ... 다른 필드
  }
}
```

**개선 코드 예시:**
```js
// prompts.js - getRiskAnalysisPrompt 함수 수정
function getRiskAnalysisPrompt(data) {
  const { finance, targetDailySales, market, roadview, conditions, brand } = data;
  
  // 평균 단가 추출 (명시적 전달 우선, 없으면 기본값)
  const avgPrice = brand?.defaults?.avgPrice || 3500;
  const avgPriceSource = brand?.defaults?.avgPrice ? '브랜드 기본값' : '시스템 기본값(3500원)';
  
  // ... 나머지 코드
  
  return `당신은 프랜차이즈 카페 창업 컨설턴트입니다.
다음 재무 분석 결과를 바탕으로 핵심 리스크 Top 3를 식별하고 개선 제안을 해주세요:

재무 결과:
- 초기 투자비용: ${(initialInvestment / 100000000).toFixed(1)}억원
- 평균 단가(아메리카노 판매금액): ${avgPrice}원/잔 (${avgPriceSource})
${!brand?.defaults?.avgPrice ? '⚠️ 주의: 브랜드별 평균 단가가 반영되지 않았습니다. 기본값 3500원을 사용합니다.' : ''}
- 월 매출: ${finance.monthlyRevenue ? (finance.monthlyRevenue / 10000).toFixed(0) + '만원' : '정보 없음'}
  (계산식: 판매량(${targetDailySales}잔/일) × 아메리카노 판매금액(${avgPrice}원) × 30일 = ${targetDailySales * avgPrice * 30}원)
// ... 나머지 프롬프트
`;
}
```

**index.js 개선:**
```js
// index.js - generateConsulting 함수 수정
async function generateConsulting(input) {
  try {
    // 입력 검증
    if (!input.brand || !input.location || !input.conditions || !input.finance || !input.market || !input.roadview) {
      throw new Error('필수 입력 데이터가 누락되었습니다.');
    }

    // 평균 단가 검증 및 경고
    if (!input.brand.defaults?.avgPrice) {
      console.warn('⚠️ 경고: brand.defaults.avgPrice가 없어 기본값 3500원을 사용합니다.');
      console.warn('   브랜드별 평균 단가 차이를 반영하지 못할 수 있습니다.');
    }

    // ... 나머지 코드
  }
}
```

---

### 🟢 낮은 우선순위 누락 항목

#### 4. `market.radiusM` (반경)

**정의 및 의미:**
- **타입**: `number` (미터)
- **의미**: 경쟁 카페 수를 계산할 때 사용하는 반경
- **기본값**: 500m

**현재 상태:**
- ✅ INPUT_REQUIREMENTS.md: **필수 필드**로 명시
- ⚠️ prompts.js: 기본값 500m 사용 (하드코딩)
- ⚠️ index.js: 자동 계산 로직 있음

**활용 방법:**
- 프롬프트에서 "주소지 기준 반경 Xm 내"라고 명시하여 정확도 향상
- 반경이 크면 경쟁 카페 수가 많아질 수 있음을 설명

**개선 코드 예시:**
```js
// prompts.js - 이미 부분적으로 사용 중
const radiusM = market.radiusM || market.location?.radius || 500;

// 프롬프트에서 사용
- 경쟁 카페 수: ${market.competitors.total}개 (주소지 기준 반경 ${radiusM}m 내)
```

---

#### 5. `brand.defaults.cogsRate`, `brand.defaults.laborRate` (원가율, 인건비율)

**정의 및 의미:**
- **타입**: `number` (0-1, 비율)
- **의미**: 
  - `cogsRate`: 원가율 (원재료비 / 매출)
  - `laborRate`: 인건비율 (인건비 / 매출)

**현재 상태:**
- ✅ INPUT_REQUIREMENTS.md: **필수 필드**로 명시
- ❌ 구현: 미사용
- **이유**: 재무 계산은 Finance 엔진에서 처리하므로 컨설팅 엔진에서는 불필요

**결론:**
- **의도적인 누락** - 다른 엔진에서 처리하므로 컨설팅 엔진에서 사용할 필요 없음
- **영향도 낮음** - 리스크 분석에는 이미 계산된 `finance.monthlyCosts`를 사용

---

#### 6. `market.tradeAreaType`, `market.dayType`, `market.footTrafficIndex` (Multiplier 레이어)

**정의 및 의미:**
- **타입**: 
  - `tradeAreaType`: `"office" | "residential" | "station" | "tourism" | "university" | "mixed"`
  - `dayType`: `"weekday" | "weekend" | "holiday" | "seollal" | "chuseok"`
  - `footTrafficIndex`: `number` (0.6-1.6)

**현재 상태:**
- ✅ INPUT_REQUIREMENTS.md: **선택 필드**로 명시
- ❌ 구현: 미사용
- **이유**: Multiplier 레이어는 다른 엔진(Decision 엔진)에서 `demandMultiplier` 계산에 사용

**결론:**
- **의도적인 누락** - 다른 엔진에서 처리하므로 컨설팅 엔진에서 사용할 필요 없음
- **영향도 낮음** - 이미 계산된 `demandMultiplier`를 사용하거나, `market.footTraffic` 객체로 대체

---

#### 7. `conditions.loans` (대출 정보)

**정의 및 의미:**
- **타입**: `Array<{ principal, apr, termMonths, repaymentType }>`
- **의미**: 초기 투자금 대출 정보

**현재 상태:**
- ✅ INPUT_REQUIREMENTS.md: **선택 필드**로 명시
- ❌ 구현: 미사용
- **이유**: 재무 계산은 Finance 엔진에서 처리

**결론:**
- **의도적인 누락** - 다른 엔진에서 처리하므로 컨설팅 엔진에서 사용할 필요 없음
- **영향도 낮음** - 리스크 분석에는 이미 계산된 `finance.monthlyProfit`, `finance.paybackMonths`를 사용

---

#### 8. `conditions.exitInputs` (Exit Plan 입력값)

**정의 및 의미:**
- **타입**: `{ keyMoney, pyeong, demolitionBase, demolitionPerPyeong, workingCapital }`
- **의미**: Exit Plan 계산에 필요한 입력값

**현재 상태:**
- ✅ INPUT_REQUIREMENTS.md: **선택 필드**로 명시
- ❌ 구현: 미사용
- **이유**: Exit Plan은 별도 엔진에서 처리

**결론:**
- **의도적인 누락** - 다른 엔진에서 처리하므로 컨설팅 엔진에서 사용할 필요 없음
- **영향도 낮음** - Exit Plan 분석은 컨설팅 엔진 범위 밖

### 2.3 ⚠️ 추가된 항목 (구현에서 사용하지만 INPUT_REQUIREMENTS에 없음)

| 항목 | 구현 상태 | INPUT_REQUIREMENTS | 설명 |
|------|----------|-------------------|------|
| `location` | ✅ 필수 | ❌ 없음 | 위치 정보 (lat, lng, address) - 프롬프트에서 사용 |
| `finance` | ✅ 필수 | ❌ 없음 | **재무 엔진 출력값** - 리스크 분석에 필수 |
| `finance.monthlyRevenue` | ✅ 사용 | ❌ 없음 | prompts.js에서 사용 |
| `finance.monthlyCosts` | ✅ 사용 | ❌ 없음 | prompts.js에서 상세 분석에 사용 |
| `market.footTraffic` | ✅ 사용 | ❌ 없음 | `market.footTrafficIndex`와 다른 구조 |

### 2.4 ⚠️ 구조 차이

| 항목 | INPUT_REQUIREMENTS | 구현 | 문제점 |
|------|-------------------|------|--------|
| `market.footTraffic` | `footTrafficIndex: 1.2` (숫자) | `footTraffic: { weekday: "high", weekend: "medium" }` (객체) | **구조 불일치** - 다른 의미의 데이터 |

---

## 3. 상세 비교표

### 3.1 Brand 객체

| 필드 | INPUT_REQUIREMENTS | ROLE.md | index.js | prompts.js | 상태 |
|------|-------------------|---------|----------|------------|------|
| `id` | ✅ | ✅ | ✅ | ❌ | ✅ 일치 |
| `name` | ✅ | ✅ | ✅ | ✅ | ✅ 일치 |
| `defaults.avgPrice` | ✅ 필수 | ❌ | ⚠️ 선택 | ✅ (기본값 3500) | ⚠️ 부분 사용 |
| `defaults.cogsRate` | ✅ 필수 | ❌ | ❌ | ❌ | ❌ 미사용 |
| `defaults.laborRate` | ✅ 필수 | ❌ | ❌ | ❌ | ❌ 미사용 |
| `defaults.*` (기타) | ✅ 선택 | ❌ | ❌ | ❌ | ❌ 미사용 |

### 3.2 Conditions 객체

| 필드 | INPUT_REQUIREMENTS | ROLE.md | index.js | prompts.js | 상태 |
|------|-------------------|---------|----------|------------|------|
| `initialInvestment` | ✅ 필수 | ✅ | ✅ | ✅ | ✅ 일치 |
| `monthlyRent` | ✅ 필수 | ✅ | ✅ | ✅ | ✅ 일치 |
| `area` | ✅ 필수 | ✅ | ✅ | ✅ | ✅ 일치 |
| `ownerWorking` | ✅ 필수 | ✅ | ✅ | ✅ | ✅ 일치 |
| `loans` | 선택 | ❌ | ❌ | ❌ | ❌ 미사용 |
| `exitInputs` | 선택 | ❌ | ❌ | ❌ | ❌ 미사용 |

### 3.3 Market 객체

| 필드 | INPUT_REQUIREMENTS | ROLE.md | index.js | prompts.js | 상태 |
|------|-------------------|---------|----------|------------|------|
| `expectedDailySales` | ✅ 필수 | ❌ | ❌ | ❌ | ❌ **누락** |
| `radiusM` | ✅ 필수 | ❌ | ⚠️ 선택 | ✅ (기본값 500) | ⚠️ 부분 사용 |
| `marketScore` | ✅ 필수 | ❌ | ❌ | ❌ | ❌ **누락** |
| `competitors.total` | ✅ 필수 | ✅ | ✅ | ✅ | ✅ 일치 |
| `competitors.density` | ✅ 필수 | ✅ | ✅ | ✅ | ✅ 일치 |
| `footTraffic` | ❌ | ✅ | ✅ | ✅ | ⚠️ **구조 차이** |
| `footTrafficIndex` | 선택 | ❌ | ❌ | ❌ | ❌ 미사용 |
| `tradeAreaType` | 선택 | ❌ | ❌ | ❌ | ❌ 미사용 |
| `dayType` | 선택 | ❌ | ❌ | ❌ | ❌ 미사용 |
| `timeProfileKey` | 선택 | ❌ | ❌ | ❌ | ❌ 미사용 |
| `demandMultiplier` | 선택 | ❌ | ❌ | ❌ | ❌ 미사용 |

### 3.4 Roadview 객체

| 필드 | INPUT_REQUIREMENTS | ROLE.md | index.js | prompts.js | 상태 |
|------|-------------------|---------|----------|------------|------|
| `overallRisk` | ✅ 필수 | ✅ | ✅ | ✅ | ✅ 일치 |
| `riskScore` | ✅ 필수 | ✅ | ✅ | ✅ | ✅ 일치 |

### 3.5 추가 항목 (구현에서만 사용)

| 필드 | INPUT_REQUIREMENTS | ROLE.md | index.js | prompts.js | 상태 |
|------|-------------------|---------|----------|------------|------|
| `location` | ❌ | ✅ | ✅ | ✅ | ⚠️ **추가됨** |
| `finance` | ❌ | ✅ | ✅ | ✅ | ⚠️ **추가됨** (파생 데이터) |
| `finance.monthlyRevenue` | ❌ | ❌ | ❌ | ✅ | ⚠️ **추가됨** |
| `finance.monthlyCosts` | ❌ | ❌ | ❌ | ✅ | ⚠️ **추가됨** |

---

## 4. 문제점 및 개선 제안

### 4.1 🔴 높은 우선순위

#### 문제 1: `market.expectedDailySales` 누락
- **현황**: INPUT_REQUIREMENTS에는 필수이지만 구현에서 사용 안 함
- **영향**: 판매량 시나리오 추론 시 상권 평균 판매량을 참고할 수 없음
- **개선**: `prompts.js`의 `getSalesScenarioPrompt`에 추가

```js
// 개선 예시
상권 분석:
- 상권 평균 일 판매량: ${market.expectedDailySales}잔/일
- 경쟁 카페 수: ${market.competitors.total}개
```

#### 문제 2: `market.marketScore` 누락
- **현황**: INPUT_REQUIREMENTS에는 필수이지만 구현에서 사용 안 함
- **영향**: 판매량 시나리오 추론 시 상권 점수를 참고할 수 없음
- **개선**: `prompts.js`의 `getSalesScenarioPrompt`에 추가

```js
// 개선 예시
상권 분석:
- 상권 점수: ${market.marketScore}/100
- 경쟁 카페 수: ${market.competitors.total}개
```

### 4.2 🟡 중간 우선순위

#### 문제 3: `brand.defaults.avgPrice` 기본값 의존
- **현황**: prompts.js에서 기본값 3500원 사용
- **영향**: 브랜드별 평균 단가 차이를 반영하지 못함
- **개선**: `index.js`에서 `brand.defaults.avgPrice`를 명시적으로 전달하거나, 입력 검증 추가

```js
// 개선 예시 (index.js)
const avgPrice = input.brand?.defaults?.avgPrice || 3500;
if (!input.brand?.defaults?.avgPrice) {
  console.warn('⚠️ brand.defaults.avgPrice가 없어 기본값 3500원을 사용합니다.');
}
```

#### 문제 4: `market.footTraffic` 구조 불일치
- **현황**: INPUT_REQUIREMENTS에는 `footTrafficIndex` (숫자), 구현에는 `footTraffic` (객체)
- **영향**: 데이터 구조가 달라 혼란 가능
- **개선**: 
  - 옵션 1: `footTrafficIndex`를 `footTraffic`로 변환하는 어댑터 추가
  - 옵션 2: 두 형식 모두 지원하도록 수정

### 4.3 🟢 낮은 우선순위

#### 문제 5: `location` 객체 추가
- **현황**: INPUT_REQUIREMENTS에 없지만 구현에서 필수로 사용
- **영향**: 프롬프트에서 주소를 표시하는 데 사용되므로 유지 필요
- **개선**: INPUT_REQUIREMENTS.md에 추가 권장

#### 문제 6: `finance` 객체 의존성
- **현황**: INPUT_REQUIREMENTS에는 없지만 구현에서 필수
- **영향**: 재무 엔진 출력값이므로 컨설팅 엔진 입력으로 전달 필요
- **개선**: ROLE.md에 명시되어 있으므로 유지, INPUT_REQUIREMENTS.md에 "파생 데이터"로 명시 권장

---

## 5. 권장 사항

### 5.1 즉시 개선 (High Priority)

1. **`market.expectedDailySales` 추가**
   - `prompts.js`의 `getSalesScenarioPrompt`에 상권 평균 판매량 표시
   - 판매량 시나리오 추론 정확도 향상

2. **`market.marketScore` 추가**
   - `prompts.js`의 `getSalesScenarioPrompt`에 상권 점수 표시
   - 판매량 시나리오 추론 정확도 향상

3. **`brand.defaults.avgPrice` 명시적 전달**
   - `index.js`에서 입력 검증 추가
   - 기본값 사용 시 경고 로그 출력

### 5.2 중기 개선 (Medium Priority)

4. **`market.footTraffic` 구조 통일**
   - INPUT_REQUIREMENTS의 `footTrafficIndex`와 구현의 `footTraffic` 중 하나로 통일
   - 또는 두 형식 모두 지원하는 어댑터 추가

5. **입력 검증 강화**
   - `index.js`의 `generateConsulting` 함수에서 필수 필드 검증 추가
   - 누락된 필드에 대한 명확한 에러 메시지

### 5.3 문서 개선 (Low Priority)

6. **INPUT_REQUIREMENTS.md 업데이트**
   - `location` 객체 추가
   - `finance` 객체를 "파생 데이터 (재무 엔진 출력값)"로 명시

7. **ROLE.md 업데이트**
   - 실제 사용하는 모든 필드 명시
   - `market.expectedDailySales`, `market.marketScore` 추가

---

## 6. 체크리스트

### 필수 필드 누락 확인
- [ ] `market.expectedDailySales` - prompts.js에 추가 필요
- [ ] `market.marketScore` - prompts.js에 추가 필요
- [ ] `brand.defaults.avgPrice` - 입력 검증 추가 필요

### 구조 불일치 확인
- [ ] `market.footTraffic` vs `market.footTrafficIndex` - 통일 필요

### 문서 업데이트 필요
- [ ] INPUT_REQUIREMENTS.md에 `location` 추가
- [ ] INPUT_REQUIREMENTS.md에 `finance` (파생 데이터) 명시
- [ ] ROLE.md에 실제 사용 필드 모두 명시

---

## 7. 참고

- **INPUT_REQUIREMENTS.md**: StartSmart Decision Engine의 전체 입력 요구사항
- **ROLE.md**: AI Consulting 엔진의 역할 및 입력/출력 정의
- **index.js**: 실제 구현 로직
- **prompts.js**: Claude API 프롬프트 템플릿

**결론**: 대부분의 필수 필드는 일치하지만, `market.expectedDailySales`와 `market.marketScore`가 누락되어 있어 판매량 시나리오 추론 정확도에 영향을 줄 수 있습니다. 우선순위에 따라 개선을 진행하는 것을 권장합니다.

