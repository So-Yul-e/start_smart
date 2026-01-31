# 리포트 출력 데이터 분석 및 활용 가이드

## 개요

`SAMPLE_REPORT.md`에 출력되는 리포트 데이터를 분석하고, `INPUT_REQUIREMENTS.md`의 입력값과 매핑하여 `prompts.js`에서 활용 가능한 데이터를 정리합니다.

---

## 1. 리포트 출력 데이터 구조

### 1.1 SAMPLE_REPORT.md에서 확인된 출력 데이터

#### 📋 EXECUTIVE SUMMARY (최종 판정)
```js
{
  signal: "green",              // "green" | "yellow" | "red"
  summary: "기본적인 창업 조건을 충족하여 진행 가능합니다.",
  isSystemDecision: true,      // 시스템 판정 (컨설팅으로 변경 불가)
  hardCutReasons: ["SURVIVAL_LT_36"]  // 하드컷 판정 근거
}
```

#### 📊 핵심 지표
```js
{
  score: 77,                   // 종합 점수 (0-100)
  successProbability: 0.77,    // 성공 확률 (score/100)
  survivalMonths: 33,           // 예상 생존 기간 (개월)
  riskLevel: "low",            // "low" | "medium" | "high"
  optimalExitMonth: 36,        // 최적 손절 시점 (개월)
  optimalExitLoss: 43250000,    // 최적 손절 총손실 (원)
  trapZoneStart: 36            // 트랩존 시작 (개월)
}
```

#### 💰 손익 분석
```js
{
  // 기본 손익 구조
  monthlyRevenue: 33600000,    // 월 매출 (원)
  monthlyProfit: 8350000,      // 월 순이익 (원)
  paybackMonths: 29.9,         // 회수 기간 (개월)
  breakEvenDailySales: 240.5,  // 손익분기점 (잔/일)
  
  // 목표 vs 기대치 분석
  targetDailySales: 320,       // 목표 일 판매량 (잔)
  expectedDailySales: 322,     // 상권 기대 일 판매량 (잔)
  gapPct: -0.6,                // GAP (%)
  demandMultiplier: 1.15       // 수요 배수
}
```

#### 🚨 실패 트리거 (Failure Triggers)
```js
{
  triggers: [
    {
      id: "survival_threshold",
      trigger: "survival threshold",
      result: "survivalMonths < 36",
      impact: "high",
      expectedFailureMonth: 33,
      totalLossAtFailure: 44150000,
      exitCostAtFailure: 44150000
    }
  ]
}
```

#### 📈 개선 시뮬레이션
```js
{
  improvementSimulations: [
    {
      id: "rent_minus_10",
      delta: "rent -10%",
      survivalMonths: 34,
      signal: "green"
    },
    {
      id: "target_minus_10",
      delta: "target -10%",
      survivalMonths: 36,
      signal: "red"
    },
    {
      id: "target_plus_10",
      delta: "target +10%",
      survivalMonths: 35,
      signal: "green"
    }
  ]
}
```

#### ⏰ 손절 타이밍 설계
```js
{
  exitTiming: {
    warning: {
      month: 21,
      meaning: "적자 구조 고착 신호",
      totalLoss: 47750000
    },
    optimal: {
      month: 36,
      meaning: "손실 최소",
      totalLoss: 43250000
    },
    lossAcceleration: {
      month: 36,
      meaning: "지연 손절 리스크",
      totalLoss: 43250000
    }
  }
}
```

#### 💸 폐업(Exit) 비용 상세
```js
{
  exitCost: {
    contractPenalty: 0,              // 가맹 위약금 (원)
    demolitionRestoration: 30000000, // 철거/원상복구 (원)
    interiorLoss: 61250000,          // 인테리어/설비 손실(비회수) (원)
    goodwillRecovery: -48000000,     // 권리금 회수(감액) (원)
    totalExitCost: 43250000,         // Exit Cost 합계 (원)
    operatingLossAccumulated: 0,     // 운영손실 누적 (원)
    finalTotalLoss: 43250000         // 최종 총손실 (원)
  }
}
```

#### 🔍 판정 신뢰도
```js
{
  confidence: {
    dataCoverage: "high",      // "low" | "medium" | "high"
    assumptionRisk: "low",      // "low" | "medium" | "high"
    decisionStability: "high"  // "low" | "medium" | "high"
  }
}
```

#### 📊 점수 Breakdown
```js
{
  breakdown: {
    payback: 70,        // 회수 기간 점수 (0-100)
    profitability: 100, // 수익성 점수 (0-100)
    gap: 100,           // GAP 점수 (0-100)
    sensitivity: 100,    // 민감도 점수 (0-100)
    fixedCost: 100,     // 고정비 점수 (0-100)
    dscr: 100,          // DSCR 점수 (0-100)
    market: 75,         // 상권 점수 (0-100)
    roadview: 75        // 로드뷰 점수 (0-100)
  }
}
```

---

## 2. 입력값과 출력값 매핑

### 2.1 INPUT_REQUIREMENTS.md → Decision Engine → SAMPLE_REPORT.md

| 입력 (INPUT_REQUIREMENTS) | 중간 처리 (Decision Engine) | 출력 (SAMPLE_REPORT) |
|--------------------------|---------------------------|---------------------|
| `brand.defaults.avgPrice` | → Finance 엔진 계산 | → `monthlyRevenue` |
| `conditions.initialInvestment` | → Finance 엔진 계산 | → `paybackMonths` |
| `conditions.monthlyRent` | → Finance 엔진 계산 | → `monthlyCosts.rent` |
| `targetDailySales` | → Finance 엔진 계산 | → `monthlyRevenue`, `monthlyProfit` |
| `market.expectedDailySales` | → Decision 엔진 계산 | → `gapPct`, `breakdown.gap` |
| `market.marketScore` | → Decision 엔진 계산 | → `breakdown.market` |
| `roadview.riskScore` | → Decision 엔진 계산 | → `breakdown.roadview` |
| `finance.monthlyProfit` | → Decision 엔진 계산 | → `survivalMonths`, `score` |
| `finance.paybackMonths` | → Decision 엔진 계산 | → `breakdown.payback` |

---

## 3. prompts.js에서 활용 가능한 데이터

### 3.1 현재 사용 중인 데이터

#### getSalesScenarioPrompt
```js
// 현재 사용 중
- brand.name
- location.address
- conditions.initialInvestment
- conditions.monthlyRent
- conditions.area
- conditions.ownerWorking
- market.competitors.total
- market.competitors.density
- market.footTraffic.weekday
- market.footTraffic.weekend
- roadview.overallRisk
- roadview.riskScore
- market.radiusM (기본값 500)

// ⚠️ 누락됨 (INPUT_REQUIREMENTS에 있음)
- market.expectedDailySales  // 상권 평균 일 판매량
- market.marketScore         // 상권 점수
- targetDailySales           // 목표 일 판매량
```

#### getRiskAnalysisPrompt
```js
// 현재 사용 중
- finance.monthlyRevenue
- finance.monthlyProfit
- finance.paybackMonths
- finance.monthlyCosts.*
- targetDailySales
- conditions.initialInvestment
- brand.defaults.avgPrice (기본값 3500)
- market.competitors.total
- market.competitors.density
- roadview.overallRisk
- roadview.riskScore

// ⚠️ 누락됨 (Decision Engine 출력값)
- decision.score              // 종합 점수
- decision.survivalMonths     // 예상 생존 기간
- decision.riskLevel          // 리스크 레벨
- decision.breakdown.*        // 점수 Breakdown
- decision.riskCards          // 구조화된 리스크 카드
- decision.improvementSimulations // 개선 시뮬레이션
- finance.expected.expectedDailySales // 상권 기대 일 판매량
- finance.expected.gapPctVsTarget    // GAP 비율
```

#### getCompetitiveAnalysisPrompt
```js
// 현재 사용 중
- brand.name
- market.competitors.total
- market.competitors.density
- market.radiusM (기본값 500)

// ⚠️ 누락됨
- market.marketScore          // 상권 점수
```

---

## 4. Decision Engine 출력값 활용 방안

### 4.1 getSalesScenarioPrompt 개선

**추가할 데이터:**
```js
// Decision Engine 출력값
decision: {
  score: 77,                    // 종합 점수
  survivalMonths: 33,           // 예상 생존 기간
  breakdown: {
    market: 75,                  // 상권 점수
    gap: 100                     // GAP 점수
  }
}

// Finance 엔진 출력값 (이미 있지만 활용 안 함)
finance: {
  expected: {
    expectedDailySales: 322,     // 상권 기대 일 판매량
    gapPctVsTarget: -0.6         // GAP 비율
  }
}
```

**개선된 프롬프트 예시:**
```js
function getSalesScenarioPrompt(data) {
  const { brand, location, conditions, market, roadview, targetDailySales, decision, finance } = data;
  
  const radiusM = market.radiusM || market.location?.radius || 500;
  const expectedDailySales = market.expectedDailySales || finance?.expected?.expectedDailySales;
  const marketScore = market.marketScore;
  const gapPct = finance?.expected?.gapPctVsTarget;
  const survivalMonths = decision?.survivalMonths;
  const score = decision?.score;

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
${expectedDailySales ? `- 상권 평균 일 판매량: ${expectedDailySales}잔/일 (기준점)` : ''}
${gapPct !== undefined ? `- 목표 판매량과의 GAP: ${gapPct > 0 ? '+' : ''}${gapPct.toFixed(1)}%${gapPct > 20 ? ' (목표가 상권 평균보다 높음, 현실성 검토 필요)' : ''}` : ''}
- 경쟁 카페 수: ${market.competitors.total}개 (주소지 기준 반경 ${radiusM}m 내)
- 경쟁 밀도: ${market.competitors.density}
${marketScore ? `- 상권 점수: ${marketScore}/100${marketScore >= 80 ? ' (우수)' : marketScore >= 60 ? ' (보통)' : ' (주의)'}` : ''}
- 평일 유동인구: ${market.footTraffic?.weekday || '정보 없음'}
- 주말 유동인구: ${market.footTraffic?.weekend || '정보 없음'}

물리적 리스크:
- 전체 리스크: ${roadview.overallRisk}
- 리스크 점수: ${roadview.riskScore}/100

${decision ? `시스템 판정 결과:
- 종합 점수: ${score}/100 (성공 확률: ${(score / 100 * 100).toFixed(1)}%)
- 예상 생존 기간: ${survivalMonths}개월
${decision.breakdown ? `- 상권 점수 Breakdown: ${decision.breakdown.market}/100` : ''}
${decision.breakdown ? `- GAP 점수 Breakdown: ${decision.breakdown.gap}/100` : ''}
` : ''}${expectedDailySales ? `⚠️ 중요: 상권 평균 일 판매량(${expectedDailySales}잔/일)을 기준으로 판매량 시나리오를 제안해주세요.
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

### 4.2 getRiskAnalysisPrompt 개선

**추가할 데이터:**
```js
// Decision Engine 출력값
decision: {
  score: 77,                    // 종합 점수
  survivalMonths: 33,           // 예상 생존 기간
  riskLevel: "low",             // 리스크 레벨
  breakdown: {
    payback: 70,                // 회수 기간 점수
    profitability: 100,         // 수익성 점수
    gap: 100,                   // GAP 점수
    sensitivity: 100,           // 민감도 점수
    fixedCost: 100,            // 고정비 점수
    dscr: 100,                 // DSCR 점수
    market: 75,                // 상권 점수
    roadview: 75               // 로드뷰 점수
  },
  riskCards: [                  // 구조화된 리스크 카드
    {
      id: "survival_36",
      title: "36개월 이전 리스크 구간",
      severity: "low",
      narrative: "36개월은 생존 분기점으로..."
    }
  ],
  improvementSimulations: [     // 개선 시뮬레이션
    {
      id: "rent_minus_10",
      delta: "rent -10%",
      survivalMonths: 34,
      signal: "green"
    }
  ]
}
```

**개선된 프롬프트 예시:**
```js
function getRiskAnalysisPrompt(data) {
  const { finance, targetDailySales, market, roadview, conditions, brand, decision } = data;
  
  // ... 기존 코드 ...
  
  return `당신은 프랜차이즈 카페 창업 컨설턴트입니다.
다음 재무 분석 결과를 바탕으로 핵심 리스크 Top 3를 식별하고 개선 제안을 해주세요:

재무 결과:
- 초기 투자비용: ${(initialInvestment / 100000000).toFixed(1)}억원
- 평균 단가(아메리카노 판매금액): ${avgPrice}원/잔
- 월 매출: ${finance.monthlyRevenue ? (finance.monthlyRevenue / 10000).toFixed(0) + '만원' : '정보 없음'}
- 총 지출 금액: ${(totalMonthlyCosts / 10000).toFixed(0)}만원${costDetails}
- 월 순수익: ${(finance.monthlyProfit / 10000).toFixed(0)}만원
- 회수 개월: ${finance.paybackMonths}개월
- 목표 판매량: ${targetDailySales}잔/일

${decision ? `시스템 판정 결과:
- 종합 점수: ${decision.score}/100
- 예상 생존 기간: ${decision.survivalMonths}개월
- 리스크 레벨: ${decision.riskLevel}
- 점수 Breakdown:
  * 회수 기간: ${decision.breakdown?.payback || 'N/A'}/100
  * 수익성: ${decision.breakdown?.profitability || 'N/A'}/100
  * GAP: ${decision.breakdown?.gap || 'N/A'}/100
  * 민감도: ${decision.breakdown?.sensitivity || 'N/A'}/100
  * 고정비: ${decision.breakdown?.fixedCost || 'N/A'}/100
  * DSCR: ${decision.breakdown?.dscr || 'N/A'}/100
  * 상권: ${decision.breakdown?.market || 'N/A'}/100
  * 로드뷰: ${decision.breakdown?.roadview || 'N/A'}/100
` : ''}${decision?.riskCards && decision.riskCards.length > 0 ? `
시스템 식별 리스크:
${decision.riskCards.map(risk => `- ${risk.title} [${risk.severity}]: ${risk.narrative}`).join('\n')}
` : ''}${decision?.improvementSimulations && decision.improvementSimulations.length > 0 ? `
시스템 개선 시뮬레이션 결과:
${decision.improvementSimulations.map(sim => `- ${sim.delta}: 생존 기간 ${sim.survivalMonths}개월, 신호등 ${sim.signal}`).join('\n')}
` : ''}상권 정보:
- 경쟁 카페 수: ${market.competitors.total}개 (주소지 기준 반경 ${radiusM}m 내)
- 경쟁 밀도: ${market.competitors.density}

물리적 리스크:
- 전체 리스크: ${roadview.overallRisk}
- 리스크 점수: ${roadview.riskScore}/100

【리스크 판단 기준】
// ... 기존 리스크 판단 기준 ...

⚠️ 중요: 시스템 판정 결과를 참고하되, AI 컨설팅은 더 구체적이고 실행 가능한 제안을 제공해야 합니다.
시스템이 식별한 리스크를 바탕으로 더 상세한 분석과 개선 방안을 제시해주세요.

// ... 나머지 프롬프트 ...
`;
}
```

---

### 4.3 getCompetitiveAnalysisPrompt 개선

**추가할 데이터:**
```js
// Market 분석 결과
market: {
  marketScore: 70,              // 상권 점수
  // ... 기존 필드
}

// Decision Engine 출력값
decision: {
  breakdown: {
    market: 75                  // 상권 점수 Breakdown
  }
}
```

**개선된 프롬프트 예시:**
```js
function getCompetitiveAnalysisPrompt(data) {
  const { brand, market, decision } = data;
  
  const radiusM = market.radiusM || market.location?.radius || 500;
  const marketScore = market.marketScore;
  const marketBreakdown = decision?.breakdown?.market;

  return `당신은 프랜차이즈 카페 창업 컨설턴트입니다.
다음 상권 정보를 바탕으로 경쟁 환경을 분석해주세요:

경쟁 정보:
- 경쟁 카페 수: ${market.competitors.total}개 (주소지 기준 반경 ${radiusM}m 내)
- 경쟁 밀도: ${market.competitors.density}
- 브랜드: ${brand.name}
${marketScore ? `- 상권 점수: ${marketScore}/100${marketScore >= 80 ? ' (우수)' : marketScore >= 60 ? ' (보통)' : ' (주의)'}` : ''}
${marketBreakdown ? `- 상권 점수 Breakdown: ${marketBreakdown}/100` : ''}

【경쟁 밀도 판단 기준】
// ... 기존 기준 ...

${marketScore ? `⚠️ 중요: 상권 점수(${marketScore}/100)를 고려하여 경쟁 환경을 분석해주세요.
- 상권 점수가 높을수록(80점 이상): 경쟁이 치열해도 차별화 가능성 높음
- 상권 점수가 낮을수록(60점 미만): 경쟁 환경이 불리할 수 있음
` : ''}다음 형식으로 JSON을 반환해주세요:
{
  "intensity": "high",           // low | medium | high
  "differentiation": "possible", // possible | difficult | impossible
  "priceStrategy": "premium"     // premium | standard | budget
}`;
}
```

---

## 5. 데이터 흐름도

```
INPUT_REQUIREMENTS.md (입력)
    ↓
[Finance Engine] → finance: { monthlyRevenue, monthlyProfit, paybackMonths, ... }
    ↓
[Decision Engine] → decision: { score, survivalMonths, riskLevel, breakdown, ... }
    ↓
SAMPLE_REPORT.md (출력)
    ↓
[AI Consulting] → prompts.js에서 활용
```

---

## 6. 권장 사항

### 6.1 즉시 개선 (High Priority)

1. **Decision Engine 출력값 추가**
   - `index.js`의 `generateConsulting` 함수에 `decision` 파라미터 추가
   - `prompts.js`의 모든 프롬프트 함수에 `decision` 데이터 활용

2. **누락된 입력값 추가**
   - `market.expectedDailySales` → `getSalesScenarioPrompt`에 추가
   - `market.marketScore` → `getSalesScenarioPrompt`, `getCompetitiveAnalysisPrompt`에 추가
   - `targetDailySales` → `getSalesScenarioPrompt`에 추가

3. **Finance 엔진 출력값 활용**
   - `finance.expected.expectedDailySales` → `getSalesScenarioPrompt`에 추가
   - `finance.expected.gapPctVsTarget` → `getSalesScenarioPrompt`에 추가

### 6.2 중기 개선 (Medium Priority)

4. **Decision Engine의 구조화된 데이터 활용**
   - `decision.riskCards` → `getRiskAnalysisPrompt`에서 시스템 식별 리스크 참고
   - `decision.improvementSimulations` → `getRiskAnalysisPrompt`에서 개선 제안 참고
   - `decision.breakdown` → 모든 프롬프트에서 점수 Breakdown 참고

5. **입력 검증 강화**
   - `index.js`에서 Decision Engine 출력값 검증 추가
   - 누락된 필드에 대한 경고 로그 출력

---

## 7. 체크리스트

### 입력값 누락 확인
- [ ] `market.expectedDailySales` - prompts.js에 추가 필요
- [ ] `market.marketScore` - prompts.js에 추가 필요
- [ ] `targetDailySales` - getSalesScenarioPrompt에 추가 필요

### Decision Engine 출력값 활용
- [ ] `decision.score` - 모든 프롬프트에 추가
- [ ] `decision.survivalMonths` - getRiskAnalysisPrompt에 추가
- [ ] `decision.riskLevel` - getRiskAnalysisPrompt에 추가
- [ ] `decision.breakdown.*` - 모든 프롬프트에 추가
- [ ] `decision.riskCards` - getRiskAnalysisPrompt에 추가
- [ ] `decision.improvementSimulations` - getRiskAnalysisPrompt에 추가

### Finance 엔진 출력값 활용
- [ ] `finance.expected.expectedDailySales` - getSalesScenarioPrompt에 추가
- [ ] `finance.expected.gapPctVsTarget` - getSalesScenarioPrompt에 추가

---

## 8. 참고

- **INPUT_REQUIREMENTS.md**: StartSmart Decision Engine의 전체 입력 요구사항
- **SAMPLE_REPORT.md**: Decision Engine의 출력 리포트 샘플
- **shared/interfaces.js**: 데이터 구조 인터페이스 정의
- **EXAMPLE_INPUT_OUTPUT.md**: 입력/출력 예시

**결론**: Decision Engine의 출력값(`decision` 객체)과 Finance 엔진의 추가 출력값(`finance.expected`)을 활용하면 AI 컨설팅의 정확도와 유용성이 크게 향상됩니다. 특히 `survivalMonths`, `score`, `breakdown`, `riskCards`, `improvementSimulations` 등을 활용하면 더 구체적이고 실행 가능한 컨설팅을 제공할 수 있습니다.

