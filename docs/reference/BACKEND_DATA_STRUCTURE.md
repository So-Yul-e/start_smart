# 백엔드/엔진 데이터 구조 가이드

## 개요

이 문서는 백엔드(`backend/services/orchestrator.js`)와 엔진(`engine/`)에서 실제로 계산되고 반환되는 데이터 구조를 정리합니다.

## 데이터 흐름

```
1. Orchestrator (backend/services/orchestrator.js)
   ↓
2. Finance Engine (engine/finance/calculator.js)
   ↓
3. Decision Engine (engine/decision/index.js)
   ↓
4. AI Consulting (ai/consulting/index.js)
   ↓
5. Market Analysis (backend/market/)
   ↓
6. Roadview Analysis (ai/roadview/)
   ↓
7. finalResult 생성
   ↓
8. reportModel 생성 (shared/reportModel.js)
   ↓
9. 프론트엔드로 전달
```

---

## finalResult 구조

### 위치: `backend/services/orchestrator.js`

```javascript
const finalResult = {
  id: analysisId,                    // 분석 ID
  status: 'completed',               // 상태
  brand: {                          // 브랜드 정보
    id: brand.id,
    name: brand.name,
    position: brand.position,
    initialInvestment: brand.initialInvestment,
    monthlyRoyalty: brand.monthlyRoyalty,
    monthlyMarketing: brand.monthlyMarketing,
    avgDailySales: brand.avgDailySales
  },
  location: {                       // 위치 정보
    lat: location.lat,
    lng: location.lng,
    address: location.address || ''
  },
  conditions,                        // 입력 조건
  targetDailySales,                  // 목표 일 판매량
  finance,                          // 손익 계산 결과 (Finance Engine)
  decision,                         // 판단 결과 (Decision Engine)
  aiConsulting,                    // AI 컨설팅 결과
  roadview,                        // 로드뷰 분석 결과
  market,                          // 상권 분석 결과
  createdAt: new Date().toISOString(),
  reportModel                       // 리포트 전용 ViewModel (추가 생성)
};
```

---

## Finance Engine 출력 구조

### 위치: `engine/finance/calculator.js`

```javascript
{
  // 월 매출
  monthlyRevenue: Number,           // 월 매출 (원)

  // 기대 매출 및 GAP 분석
  expected: {
    expectedDailySales: Number,      // 기대 일 판매량 (demandMultiplier 적용 후)
    expectedDailySalesRaw: Number,   // 보정 전 원본 값
    expectedMonthlyRevenue: Number,  // 기대 월 매출
    gapPctVsTarget: Number,          // 목표 대비 GAP 비율 (소수점 셋째자리)
    gapWarning: Boolean,             // GAP=0% 경고 플래그
    rawExpectedDailySales: Number,    // 원본 기대 판매량
    adjustedExpectedDailySales: Number, // 보정된 기대 판매량
    revenueAdjustmentFactor: Number, // 매출 조정 계수
    brandDeclineRate: Number,        // 브랜드 감소율
    demandMultiplier: Number,        // 수요 배수
    tradeAreaType: String,           // 상권 유형
    dayType: String,                 // 요일 유형
    timeProfileKey: String           // 시간 프로필 키
  },

  // 월 비용
  monthlyCosts: {
    rent: Number,                    // 월세
    labor: Number,                   // 인건비
    materials: Number,               // 원재료비
    utilities: Number,               // 공과금
    royalty: Number,                 // 로열티
    marketing: Number,               // 마케팅비
    etc: Number                      // 기타 고정비
  },

  // 이익
  operatingProfit: Number,           // 영업 이익 (대출 상환 전)
  monthlyProfit: Number,             // 월 순이익 (대출 상환 후)

  // 회수 기간
  paybackMonths: Number | null,     // 투자 회수 기간 (개월), null = 회수 불가

  // 손익분기점
  breakEvenDailySales: Number | null, // 손익분기 일 판매량, null = 계산 불가

  // 대출 정보
  debt: {
    monthlyPayment: Number,          // 월 대출 상환액
    monthlyInterest: Number,         // 월 이자
    monthlyPrincipal: Number,       // 월 원금
    balanceAfterMonth: Number,       // 1개월 후 잔액
    dscr: Number | null,             // DSCR (Debt Service Coverage Ratio), null = 대출 없음
    debtSchedulePreview: Array       // 대출 상환 일정 미리보기
  },

  // 민감도 분석 (±10%)
  sensitivity: {
    plus10: {
      monthlyProfit: Number,         // 매출 +10% 시 월 순이익
      paybackMonths: Number | null   // 매출 +10% 시 회수 기간
    },
    minus10: {
      monthlyProfit: Number,         // 매출 -10% 시 월 순이익
      paybackMonths: Number | null   // 매출 -10% 시 회수 기간
    }
  }
}
```

### 주의사항
- `paybackMonths === null`: 월 순이익이 0 이하일 때 (회수 불가)
- `breakEvenDailySales === null`: 계산 불가능한 경우
- `dscr === null`: 대출이 없는 경우
- 모든 금액은 `Math.round()`로 반올림
- 모든 기간은 소수점 첫째자리까지 반올림

---

## Decision Engine 출력 구조

### 위치: `engine/decision/index.js`

```javascript
{
  // 점수 및 신호등
  score: Number,                     // 종합 점수 (0-100)
  signal: String,                    // 신호등 ("green" | "yellow" | "red")
  
  // 생존 개월 수
  survivalMonths: Number,            // 예상 생존 개월 수 (최소 12개월)

  // 최종 판정 (Final Judgement)
  finalJudgement: {
    signal: String,                   // 신호등
    label: String,                    // 라벨 ("긍정 신호" | "주의 신호" | "부정 신호")
    summary: String,                  // 판정 요약 문장
    nonNegotiable: Boolean,           // 하드컷 여부
    primaryReason: String             // 주요 판정 근거
  },

  // 리스크 카드 (구조화)
  riskCards: [
    {
      id: String,                     // 리스크 ID
      title: String,                   // 리스크 제목
      narrative: String,               // 리스크 설명
      trigger: String,                 // 트리거
      severity: String,                // 심각도 ("high" | "medium" | "low")
      impact: String                   // 영향도 (severity와 동일)
    }
  ],

  // 레거시 riskFactors (문자열 배열)
  riskFactors: [String],              // 리스크 요인 설명 배열

  // 하드컷 판정 근거
  hardCutReasons: [String],           // 하드컷 판정 근거 코드 배열

  // 개선 시뮬레이션
  improvementSimulations: [
    {
      id: String,                     // 시뮬레이션 ID
      delta: String,                  // 변경 내용 (예: "rent -10%")
      title: String,                  // 제목
      description: String,            // 설명
      survivalMonths: Number,        // 예상 생존 개월
      signal: String,                 // 신호등
      signalChange: String            // 신호등 변화 ("improved" | "worsened" | "unchanged")
    }
  ],

  // 실패 트리거
  failureTriggers: [
    {
      trigger: String,                // 트리거 타입
      triggerName: String,            // 트리거명 (한글)
      outcome: String,                // 결과 설명 (한글)
      impact: String,                 // 영향도 ("critical" | "high" | "medium" | "low")
      estimatedFailureWindow: String  // 예상 실패 시점 (예: "12~18개월")
    }
  ],

  // 판정 신뢰도
  decisionConfidence: {
    dataCoverage: String,             // 데이터 커버리지 ("high" | "medium" | "low")
    assumptionRisk: String,           // 가정 리스크 ("high" | "medium" | "low")
    stability: String                 // 판정 안정성 ("high" | "medium" | "low")
  } | String,                         // 또는 단순 값 ("high" | "medium" | "low")

  // 점수 Breakdown
  breakdown: {
    payback: Number,                  // 회수 기간 점수
    profitMargin: Number,             // 순이익률 점수
    fixedCost: Number,                // 고정비 점수
    dscr: Number,                     // DSCR 점수
    market: Number,                   // 상권 점수
    roadview: Number                  // 로드뷰 점수
  },

  // Exit Plan
  exitPlan: {
    warningMonth: Number,             // 경고 구간 (개월)
    optimalExitMonth: Number,         // 최적 손절 시점 (개월)
    lossExplosionMonth: Number,       // 손실 폭증 시점 (개월)
    totalLossAtWarning: Number,       // 경고 구간 총손실
    totalLossAtOptimal: Number,       // 최적 손절 총손실
    totalLossAtExplosion: Number,     // 손실 폭증 총손실
    exitCostBreakdown: {              // 폐업 비용 상세
      initialInvestment: Number,      // 초기 투자금
      accumulatedLoss: Number,        // 누적 손실
      exitCost: Number,               // Exit 비용
      totalLoss: Number               // 총 손실
    }
  } | null                            // 조건/브랜드가 없으면 null
}
```

---

## AI Consulting 출력 구조

### 위치: `ai/consulting/index.js`

```javascript
{
  // 판매량 시나리오
  salesScenario: {
    conservative: Number,            // 보수적 시나리오 (일 판매량)
    expected: Number,                // 기대치 시나리오 (일 판매량)
    optimistic: Number               // 낙관적 시나리오 (일 판매량)
  },
  salesScenarioReason: String,       // 시나리오 근거 설명

  // 리스크 Top 3
  topRisks: [
    {
      id: String,                    // 리스크 ID
      title: String,                  // 리스크 제목
      description: String,           // 리스크 설명
      impact: String                 // 영향도 ("high" | "medium" | "low")
    }
  ],

  // 개선 제안
  improvements: [
    {
      id: String,                    // 개선 제안 ID
      title: String,                 // 제목
      description: String,           // 설명
      expectedImpact: String,       // 기대 효과
      scenarios: [                   // 시나리오 (선택적)
        {
          type: String,              // 시나리오 타입
          description: String,       // 설명
          before: {
            monthlyProfit: Number,
            paybackMonths: Number
          },
          after: {
            monthlyProfit: Number,
            paybackMonths: Number
          },
          improvement: {
            profitIncrease: Number,
            paybackReduction: Number
          }
        }
      ]
    }
  ],

  // 경쟁 환경 분석
  competitiveAnalysis: {
    intensity: String,               // 경쟁 강도 ("high" | "medium" | "low")
    differentiation: String,         // 차별화 가능성 ("possible" | "difficult" | "impossible")
    priceStrategy: String            // 가격 전략 ("premium" | "standard" | "budget")
  },

  // GAP Narrative (선택적)
  gapNarrative: String | null        // GAP 분석 서술
}
```

---

## Market Analysis 출력 구조

### 위치: `backend/market/`

```javascript
{
  location: {
    lat: Number,                     // 위도
    lng: Number,                     // 경도
    radius: Number                   // 반경 (m)
  },
  competitors: {
    total: Number,                   // 총 경쟁 카페 수
    sameBrand: Number,               // 동일 브랜드 수
    otherBrands: Number,            // 타 브랜드 수
    density: String                  // 경쟁 밀도 ("low" | "medium" | "high")
  },
  footTraffic: {
    weekday: String,                 // 평일 유동인구 ("low" | "medium" | "high")
    weekend: String,                 // 주말 유동인구 ("low" | "medium" | "high")
    peakHours: [String]              // 피크 시간대 배열 (예: ["08:00-10:00", "12:00-14:00"])
  },
  marketScore: Number,              // 상권 점수 (0-100)
  tradeAreaType: String,            // 상권 유형
  dayType: String,                  // 요일 유형
  timeProfileKey: String            // 시간 프로필 키
}
```

---

## Roadview Analysis 출력 구조

### 위치: `ai/roadview/index.js`

```javascript
{
  location: {
    lat: Number,                     // 위도
    lng: Number                      // 경도
  },
  risks: [
    {
      type: String,                  // 리스크 타입
                                     // "signage_obstruction" | "steep_slope" | "floor_level" | "visibility"
      level: String,                 // 리스크 레벨
                                     // "low" | "medium" | "high" | "ground" | "half_basement" | "second_floor"
      description: String            // 리스크 설명
    }
  ],
  overallRisk: String,              // 전체 리스크 ("low" | "medium" | "high")
  riskScore: Number,                 // 리스크 점수 (0-100, 낮을수록 위험)
  _metadata: {                       // 메타데이터 (선택적)
    confidence: Number,              // 분석 신뢰도
    strengths: [String],             // 강점 배열
    weaknesses: [String],            // 약점 배열
    locationScore: Number            // 입지 점수
  },
  roadviewUrl: String,               // 로드뷰 이미지 URL (orchestrator에서 추가)
  source: String                     // 로드뷰 소스 ("google" | "naver" | "kakao")
}
```

---

## reportModel 구조

### 위치: `shared/reportModel.js`

`buildReportModel(finalResult)` 함수가 `finalResult`를 받아 리포트 전용 ViewModel을 생성합니다.

```javascript
{
  version: "reportModel.v1",
  generatedAt: String,               // 생성 시각 (ISO 8601)

  // Executive Summary
  executive: {
    signal: String,                   // 신호등
    label: String,                    // 라벨
    summary: String,                  // 요약
    nonNegotiable: Boolean,           // 하드컷 여부
    score: Number,                    // 점수
    survivalMonths: Number,           // 생존 개월
    paybackMonths: Number,            // 회수 기간
    monthlyProfit: Number,            // 월 순이익
    breakEvenDailySales: Number,      // 손익분기 판매량
    confidence: Object | String       // 판정 신뢰도
  },

  // Finance (정제된 데이터)
  finance: {
    monthlyRevenue: Number,
    monthlyCosts: Object,
    monthlyProfit: Number,
    paybackMonths: Number,
    sensitivity: Object,
    breakEvenDailySales: Number
  },

  // GAP Analysis
  gap: {
    targetDailySales: Number,
    expectedDailySales: Number,
    gapPctVsTarget: Number,
    narrative: String | null
  },

  // Scenario Comparison
  scenario: {
    engineScenarioTable: Array,
    aiSalesScenario: Object | null
  },

  // Risk Cards (병합된)
  risk: {
    cards: [
      {
        id: String,
        severity: String,
        engine: Object | null,
        ai: Object | null
      }
    ]
  },

  // Improvement Cards (병합된)
  improvement: {
    cards: [
      {
        id: String,
        delta: String | null,
        engine: Object | null,
        ai: Object | null
      }
    ]
  },

  // Exit Plan
  exitPlan: Object | null,

  // Breakdown
  breakdown: Object | null,

  // Failure Triggers
  failureTriggers: Array,

  // Competitive Analysis
  competitive: Object | null,

  // Market Analysis
  market: {
    location: Object,
    competitors: Object,
    footTraffic: Object | null,
    marketScore: Number
  } | null,

  // Roadview Analysis
  roadview: {
    location: Object,
    risks: Array,
    overallRisk: String,
    riskScore: Number,
    metadata: Object | null
  } | null,

  // Sources
  sources: {
    hasMarket: Boolean,
    hasRoadview: Boolean,
    hasAI: Boolean
  }
}
```

---

## 데이터 변환 규칙

### 1. 숫자 변환
- `toMoney(n)`: 숫자가 아니면 `null` 반환
- `toNum(n)`: 숫자가 아니면 `null` 반환

### 2. 배열 안전 처리
- `Array.isArray(value) ? value : []` 패턴 사용

### 3. null 처리
- `paybackMonths === null`: 회수 불가
- `breakEvenDailySales === null`: 계산 불가
- `dscr === null`: 대출 없음

### 4. 병합 로직
- **리스크 카드**: Engine과 AI를 병합, AI 우선
- **개선 제안**: Engine과 AI를 병합, AI 우선

---

## 주의사항

1. **null vs 999**: `paybackMonths`는 `null`이 정상, `999`는 프론트엔드에서 사용하는 fallback 값
2. **금액 단위**: 모든 금액은 원(KRW) 단위
3. **기간 단위**: 모든 기간은 개월(month) 단위
4. **점수 범위**: 점수는 0-100 범위
5. **신호등 값**: "green" | "yellow" | "red"만 유효
6. **영향도 값**: "high" | "medium" | "low"만 유효
