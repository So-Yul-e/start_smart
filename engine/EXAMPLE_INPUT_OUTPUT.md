# 엔진 입출력 예시 (메가커피)

이 문서는 계산 엔진의 입력값과 출력값을 실제 예시로 보여줍니다.
컨설팅 작업자가 엔진 사용 시 참고할 수 있는 표준 예시입니다.

---

## 📥 입력값 (Input)

### Finance 엔진 입력값

```json
{
  "brand": {
    "id": "brand_mega",
    "name": "메가커피",
    "defaults": {
      "avgPrice": 3500,
      "cogsRate": 0.35,
      "laborRate": 0.20,
      "utilitiesRate": 0.03,
      "etcFixed": 1100000,
      "royaltyRate": 0.05,
      "marketingRate": 0.02
    }
  },
  "conditions": {
    "initialInvestment": 200000000,
    "monthlyRent": 4000000,
    "area": 10,
    "ownerWorking": true
  },
  "market": {
    "expectedDailySales": 256,
    "radiusM": 500
  },
  "targetDailySales": 300,
  "scenarios": [200, 250, 300]
}
```

### 입력값 설명

#### `brand` (브랜드 정보)
- `id`: 브랜드 식별자
- `name`: 브랜드명
- `defaults`: 브랜드별 기본값
  - `avgPrice`: 평균 단가 (원/잔)
  - `cogsRate`: 원재료비율 (매출 대비, 0-1)
  - `laborRate`: 인건비율 (매출 대비, 0-1)
  - `utilitiesRate`: 공과금 비율 (매출 대비, 0-1)
  - `etcFixed`: 기타 고정비 (원)
  - `royaltyRate`: 로열티 비율 (매출 대비, 0-1)
  - `marketingRate`: 마케팅비 비율 (매출 대비, 0-1)

#### `conditions` (조건)
- `initialInvestment`: 초기 투자금 (원)
- `monthlyRent`: 월세 (원)
- `area`: 평수 (평)
- `ownerWorking`: 점주 근무 여부 (true/false)

#### `market` (상권 정보)
- `expectedDailySales`: 상권 기대 일 판매량 (잔)
- `radiusM`: 반경 (미터)

#### `targetDailySales` (목표)
- 목표 일 판매량 (잔)

#### `scenarios` (시나리오)
- 시나리오별 일 판매량 배열 (선택적)

---

## 📤 출력값 (Output)

### Finance 엔진 출력값

```json
{
  "monthlyRevenue": 31500000,
  "expected": {
    "expectedDailySales": 256,
    "expectedMonthlyRevenue": 26880000,
    "gapPctVsTarget": 0.172,
    "gapWarning": false,
    "rawExpectedDailySales": null,
    "adjustedExpectedDailySales": null,
    "revenueAdjustmentFactor": 0.92,
    "brandDeclineRate": 0
  },
  "monthlyCosts": {
    "rent": 4000000,
    "labor": 3780000,
    "materials": 11025000,
    "utilities": 945000,
    "royalty": 1575000,
    "marketing": 630000,
    "etc": 1100000
  },
  "operatingProfit": 8445000,
  "monthlyProfit": 8445000,
  "paybackMonths": 23.7,
  "breakEvenDailySales": 219.6,
  "debt": {
    "monthlyPayment": 0,
    "monthlyInterest": 0,
    "monthlyPrincipal": 0,
    "balanceAfterMonth": 0,
    "dscr": null,
    "debtSchedulePreview": []
  },
  "sensitivity": {
    "plus10": {
      "monthlyProfit": 9799500,
      "paybackMonths": 20.4
    },
    "minus10": {
      "monthlyProfit": 7090500,
      "paybackMonths": 28.2
    }
  },
  "scenarioTable": [
    {
      "daily": 200,
      "profit": 3930000,
      "paybackMonths": 50.9
    },
    {
      "daily": 250,
      "profit": 6187500,
      "paybackMonths": 32.3
    },
    {
      "daily": 300,
      "profit": 8445000,
      "paybackMonths": 23.7
    }
  ]
}
```

### Finance 출력값 설명

#### 주요 지표
- `monthlyRevenue`: 월 매출 (원) - 목표 판매량 기준
- `monthlyProfit`: 월 순이익 (원)
- `paybackMonths`: 회수 개월 수
- `breakEvenDailySales`: 손익분기점 일 판매량 (잔)

#### `expected` (기대치 분석)
- `expectedDailySales`: 상권 평균 일 판매량 (잔)
- `expectedMonthlyRevenue`: 상권 평균 월 매출 (원)
- `gapPctVsTarget`: 목표 대비 GAP 비율 ((target - expected) / expected)
- `gapWarning`: GAP 경고 여부

#### `monthlyCosts` (월 비용 상세)
- `rent`: 월세
- `labor`: 인건비 (점주 근무 시 40% 절감 적용)
- `materials`: 원재료비
- `utilities`: 공과금
- `royalty`: 로열티
- `marketing`: 마케팅비
- `etc`: 기타 고정비

#### `sensitivity` (민감도 분석)
- `plus10`: 매출 +10% 시나리오
- `minus10`: 매출 -10% 시나리오

#### `scenarioTable` (시나리오별 손익 비교)
- 각 시나리오별 일 판매량, 순이익, 회수 개월 수

---

### Decision 엔진 입력값

```json
{
  "finance": {
    "monthlyRevenue": 31500000,
    "expected": {
      "expectedDailySales": 256,
      "expectedMonthlyRevenue": 26880000,
      "gapPctVsTarget": 0.172
    },
    "monthlyCosts": {
      "rent": 4000000,
      "labor": 3780000,
      "materials": 11025000,
      "utilities": 945000,
      "royalty": 1575000,
      "marketing": 630000,
      "etc": 1100000
    },
    "monthlyProfit": 8445000,
    "paybackMonths": 23.7,
    "breakEvenDailySales": 219.6,
    "sensitivity": {
      "plus10": {
        "monthlyProfit": 9799500,
        "paybackMonths": 20.4
      },
      "minus10": {
        "monthlyProfit": 7090500,
        "paybackMonths": 28.2
      }
    },
    "scenarioTable": [
      {
        "daily": 200,
        "profit": 3930000,
        "paybackMonths": 50.9
      },
      {
        "daily": 250,
        "profit": 6187500,
        "paybackMonths": 32.3
      },
      {
        "daily": 300,
        "profit": 8445000,
        "paybackMonths": 23.7
      }
    ]
  },
  "market": {
    "marketScore": 70
  },
  "roadview": {
    "riskScore": 65
  },
  "conditions": {
    "initialInvestment": 200000000,
    "monthlyRent": 4000000,
    "area": 10,
    "ownerWorking": true
  },
  "brand": {
    "id": "brand_mega",
    "name": "메가커피",
    "defaults": {
      "avgPrice": 3500,
      "cogsRate": 0.35,
      "laborRate": 0.20,
      "utilitiesRate": 0.03,
      "etcFixed": 1100000,
      "royaltyRate": 0.05,
      "marketingRate": 0.02
    }
  },
  "targetDailySales": 300
}
```

### Decision 입력값 설명

#### `finance` (필수)
- Finance 엔진의 출력 결과 전체

#### `market` (필수)
- `marketScore`: 상권 점수 (0-100)

#### `roadview` (필수)
- `riskScore`: 로드뷰 리스크 점수 (0-100, 낮을수록 위험)

#### `conditions`, `brand`, `targetDailySales` (선택)
- 개선 시뮬레이션 생성 시 필요

---

### Decision 엔진 출력값

```json
{
  "score": 77,
  "successProbability": 0.77,
  "breakdown": {
    "payback": 85,
    "profitability": 100,
    "gap": 70,
    "sensitivity": 100,
    "fixedCost": 100,
    "dscr": 100,
    "market": 70,
    "roadview": 65
  },
  "signal": "yellow",
  "survivalMonths": 36,
  "riskLevel": "low",
  "riskFactors": [
    "목표 판매량(300잔)이 상권 평균(256잔)보다 17% 높아 달성 난이도가 있습니다.",
    "36개월은 생존 분기점으로, 이 구간을 넘길 수 있는 운영 계획이 필요합니다.",
    "생존 가능 기간이 36개월 이하로 주의가 필요합니다."
  ],
  "riskCards": [
    {
      "id": "sales_gap",
      "title": "목표 판매량과 상권 기대치 간 GAP 큼",
      "severity": "medium",
      "evidence": {
        "targetDailySales": 300,
        "expectedDailySales": 256,
        "gapPct": 17
      },
      "narrative": "목표 판매량(300잔)이 상권 평균(256잔)보다 17% 높아 달성 난이도가 있습니다."
    },
    {
      "id": "survival_36",
      "title": "36개월 이전 리스크 구간",
      "severity": "low",
      "evidence": {
        "survivalMonths": 36
      },
      "narrative": "36개월은 생존 분기점으로, 이 구간을 넘길 수 있는 운영 계획이 필요합니다.",
      "relatedMetricKeys": [
        "survivalMonths"
      ]
    }
  ],
  "improvementSimulations": [
    {
      "id": "rent_minus_10",
      "delta": "rent -10%",
      "survivalMonths": 36,
      "signal": "green"
    },
    {
      "id": "sales_minus_10",
      "delta": "target -10%",
      "survivalMonths": 34,
      "signal": "green"
    },
    {
      "id": "sales_plus_10",
      "delta": "target +10%",
      "survivalMonths": 36,
      "signal": "green"
    }
  ]
}
```

### Decision 출력값 설명

#### 주요 지표
- `score`: 종합 점수 (0-100)
- `successProbability`: 성공 확률 (0-1, score/100)
- `signal`: 신호등 ("green" | "yellow" | "red")
- `survivalMonths`: 예상 생존 개월 수
- `riskLevel`: 리스크 레벨 ("low" | "medium" | "high")

#### `breakdown` (점수 Breakdown)
각 항목별 점수 (0-100):
- `payback`: 회수 기간 점수
- `profitability`: 수익성 점수
- `gap`: GAP 점수
- `sensitivity`: 민감도 점수
- `fixedCost`: 고정비 점수
- `dscr`: DSCR 점수
- `market`: 상권 점수
- `roadview`: 로드뷰 점수

#### `riskFactors` (레거시)
리스크 요인 문자열 배열 (Backward Compatibility)

#### `riskCards` (구조화된 리스크 카드)
각 리스크 카드 구조:
- `id`: 리스크 식별자
- `title`: 리스크 제목
- `severity`: 심각도 ("low" | "medium" | "high")
- `evidence`: 근거 데이터
- `narrative`: 설명 문장

#### `improvementSimulations` (개선 시뮬레이션)
조건 입력 시 생성되는 개선 시나리오:
- `id`: 시뮬레이션 식별자
- `delta`: 변경 내용
- `survivalMonths`: 변경 후 생존 개월 수
- `signal`: 변경 후 신호등

---

## 📊 결과 요약 (메가커피 예시)

### 입력값 요약
- **브랜드**: 메가커피
- **초기 투자금**: 2억원
- **월세**: 400만원
- **목표 일 판매량**: 300잔
- **상권 기대 일 판매량**: 256잔
- **점주 근무**: 예

### 출력값 요약

#### Finance 결과
- **월 매출**: 3,150만원
- **월 순이익**: 844.5만원
- **회수 개월 수**: 23.7개월
- **GAP**: +17.2% (목표가 상권 기대치보다 높음)

#### Decision 결과
- **종합 점수**: 77점
- **성공 확률**: 77%
- **신호등**: 🟡 Yellow (주의)
- **예상 생존 개월 수**: 36개월
- **리스크 레벨**: Low (낮음)

### 주요 리스크
1. **목표 판매량 GAP**: 목표(300잔)가 상권 평균(256잔)보다 17% 높아 달성 난이도 있음
2. **생존 분기점**: 36개월은 생존 분기점으로, 이 구간을 넘길 수 있는 운영 계획 필요

### 개선 시뮬레이션
- **임대료 -10%**: 신호등 🟢 Green, 생존 개월 수 36개월
- **목표 판매량 -10%**: 신호등 🟢 Green, 생존 개월 수 34개월
- **목표 판매량 +10%**: 신호등 🟢 Green, 생존 개월 수 36개월

---

## 🔧 사용 방법

### 1. Finance 엔진 실행

```javascript
const { calculate } = require('./engine/finance');

const input = {
  brand: { /* ... */ },
  conditions: { /* ... */ },
  market: { /* ... */ },
  targetDailySales: 300,
  scenarios: [200, 250, 300]
};

const financeResult = calculate(input);
```

### 2. Decision 엔진 실행

```javascript
const { calculate } = require('./engine/decision');

const input = {
  finance: financeResult,  // Finance 엔진 출력 결과
  market: { marketScore: 70 },
  roadview: { riskScore: 65 },
  conditions: { /* ... */ },  // 개선 시뮬레이션용 (선택)
  brand: { /* ... */ },       // 개선 시뮬레이션용 (선택)
  targetDailySales: 300        // 개선 시뮬레이션용 (선택)
};

const decisionResult = calculate(input);
```

---

## 📝 참고사항

1. **입력값 검증**: 엔진은 필수 입력값이 없거나 잘못된 경우 에러를 발생시킵니다.
2. **출력 형식**: 출력 JSON 형식은 `shared/interfaces.js`를 참고하세요.
3. **개선 시뮬레이션**: `conditions`, `brand`, `targetDailySales`를 입력하면 자동으로 생성됩니다.
4. **점주 근무**: `ownerWorking: true`일 경우 인건비가 40% 절감됩니다.
5. **GAP 계산**: `market.expectedDailySales`가 없으면 `targetDailySales`를 사용합니다 (GAP = 0%).

---

**작성일**: 2024년
**버전**: 1.0
**대상**: 컨설팅 작업자
