# Engine API 문서

## 목차
1. [Finance API](#finance-api)
2. [Decision API](#decision-api)
3. [Breakdown 사용법](#breakdown-사용법)
4. [비동기 처리 방법](#비동기-처리-방법)
5. [에러 처리](#에러-처리)

---

## Finance API

### `calculate(input)`

손익 계산 메인 함수입니다.

#### 입력 (Input)

```javascript
{
  brand: {
    defaults: {
      avgPrice: 5000,              // 평균 단가 (원)
      cogsRate: 0.30,              // 원재료비율 (0-1)
      laborRate: 0.20,             // 인건비율 (0-1)
      utilitiesRate: 0.03,         // 공과금 비율 (0-1, 선택)
      royaltyRate: 0.05,           // 로열티 비율 (0-1, 선택)
      marketingRate: 0.02,         // 마케팅비 비율 (0-1, 선택)
      etcFixed: 500000,             // 기타 고정비 (원, 선택)
      ownerWorkingMultiplier: 0.6,  // 점주 근무 시 인건비 감소 계수 (선택)
      expectedDailySales: 250       // 기본 기대 판매량 (선택)
    },
    avgMonthlySales: 37500000,      // 브랜드 평균 월 매출 (선택)
    brandDeclineRate: 0.15          // 브랜드 점포 감소율 (0-1, 선택)
  },
  conditions: {
    initialInvestment: 500000000,   // 초기 투자금 (원)
    monthlyRent: 3000000,           // 월세 (원)
    ownerWorking: false,            // 점주 근무 여부 (선택)
    loans: [                        // 대출 정보 배열 (선택)
      {
        principal: 200000000,       // 대출 원금 (원)
        apr: 0.05,                  // 연 이자율 (0-1)
        termMonths: 60,             // 대출 기간 (개월)
        repaymentType: "equal_payment"  // 상환 방식: "equal_payment" | "equal_principal" | "interest_only"
      }
    ]
  },
  market: {
    expectedDailySales: 250         // 상권 기대 일 판매량 (선택)
  },
  targetDailySales: 300,            // 목표 일 판매량 (잔)
  scenarios: [200, 250, 300]        // 시나리오별 일 판매량 배열 (선택)
}
```

#### 출력 (Output)

```javascript
{
  monthlyRevenue: 45000000,         // 월 매출 (원)
  expected: {
    expectedDailySales: 250,        // 최종 사용된 기대 일 판매량 (잔)
    expectedMonthlyRevenue: 37500000, // 기대 월 매출 (원)
    gapPctVsTarget: 0.20,           // 목표 대비 GAP 비율 (0-1)
    gapWarning: false,              // 최후 fallback 시 true
    rawExpectedDailySales: 250,     // 원시 기대 판매량 (브랜드 평균 매출 기반, 선택)
    adjustedExpectedDailySales: 200, // 보정된 기대 판매량 (점포 감소율 반영, 선택)
    revenueAdjustmentFactor: 0.8,   // 매출 보정 계수 (0-1)
    brandDeclineRate: 0.15          // 브랜드 점포 감소율 (0-1)
  },
  monthlyCosts: {
    rent: 3000000,                  // 월세
    labor: 9000000,                 // 인건비
    materials: 13500000,            // 원재료비
    utilities: 1350000,             // 공과금
    royalty: 2250000,               // 로열티
    marketing: 900000,              // 마케팅비
    etc: 500000                     // 기타
  },
  operatingProfit: 12000000,        // 영업 이익 (대출 상환 전)
  monthlyProfit: 10000000,         // 월 순이익 (대출 상환 후)
  paybackMonths: 50,                // 회수 개월 수 (null 가능)
  breakEvenDailySales: 200,        // 손익분기점 일 판매량 (null 가능)
  debt: {
    monthlyPayment: 3775000,        // 월 대출 상환액 (원)
    monthlyInterest: 833333,        // 월 이자 (원)
    monthlyPrincipal: 2941667,     // 월 원금 상환액 (원)
    balanceAfterMonth: 197058333,   // 1개월 후 잔액 (원)
    dscr: 3.18,                     // DSCR (Debt Service Coverage Ratio, null 가능)
    debtSchedulePreview: [         // 12개월 상환 스케줄 미리보기
      {
        month: 1,
        payment: 3775000,
        interest: 833333,
        principal: 2941667,
        balance: 197058333
      }
      // ... 12개월치
    ]
  },
  sensitivity: {
    plus10: {
      monthlyProfit: 12000000,      // 판매량 +10% 시 월 순이익
      paybackMonths: 42             // 판매량 +10% 시 회수 개월 수 (null 가능)
    },
    minus10: {
      monthlyProfit: 8000000,       // 판매량 -10% 시 월 순이익
      paybackMonths: 63             // 판매량 -10% 시 회수 개월 수 (null 가능)
    }
  },
  scenarioTable: [                  // 시나리오별 손익 비교표 (scenarios 입력 시)
    {
      daily: 200,
      profit: 4350000,
      paybackMonths: 46
    },
    {
      daily: 250,
      profit: 6710000,
      paybackMonths: 30
    },
    {
      daily: 300,
      profit: 9070000,
      paybackMonths: 22
    }
  ]
}
```

#### 사용 예시

```javascript
const { calculate } = require('./engine/finance');

const result = calculate({
  brand: {
    defaults: {
      avgPrice: 5000,
      cogsRate: 0.30,
      laborRate: 0.20
    }
  },
  conditions: {
    initialInvestment: 500000000,
    monthlyRent: 3000000
  },
  market: {
    expectedDailySales: 250
  },
  targetDailySales: 300
});

console.log(`월 순이익: ${result.monthlyProfit.toLocaleString()}원`);
console.log(`회수 기간: ${result.paybackMonths}개월`);
```

---

## Decision API

### `calculate(input)`

판단 메인 함수입니다.

#### 입력 (Input)

```javascript
{
  finance: {
    // Finance API 출력 결과 전체
    monthlyRevenue: 45000000,
    monthlyProfit: 10000000,
    paybackMonths: 50,
    // ... (Finance API 출력 참고)
  },
  market: {
    marketScore: 70                // 상권 점수 (0-100)
  },
  roadview: {
    riskScore: 70                  // 로드뷰 리스크 점수 (0-100, 낮을수록 위험)
  },
  conditions: {                    // 개선 시뮬레이션용 (선택)
    initialInvestment: 500000000,
    monthlyRent: 3000000,
    // ... (Finance API 입력 참고)
  },
  brand: {                          // 개선 시뮬레이션용 (선택)
    defaults: { /* ... */ }
  },
  targetDailySales: 300            // 개선 시뮬레이션용 (선택)
}
```

#### 출력 (Output)

```javascript
{
  score: 65,                        // 종합 점수 (0-100)
  successProbability: 0.65,        // 성공 확률 (0-1)
  breakdown: {                      // 점수 Breakdown (각 항목별 0-100점)
    payback: 50,                    // 회수 기간 점수
    profitability: 100,             // 수익성 점수
    gap: 70,                        // GAP 점수
    sensitivity: 100,                // 민감도 점수
    fixedCost: 100,                 // 고정비 점수
    dscr: 100,                      // DSCR 점수
    market: 70,                      // 상권 점수
    roadview: 70                     // 로드뷰 점수
  },
  signal: "yellow",                 // 신호등: "green" | "yellow" | "red"
  survivalMonths: 24,               // 예상 생존 개월 수
  riskLevel: "medium",              // 리스크 레벨: "low" | "medium" | "high"
  riskFactors: [                    // 레거시: 리스크 요인 문자열 배열
    "회수 기간이 36개월을 초과함",
    "목표 판매량 달성 난이도 높음"
  ],
  riskCards: [                      // 신규: 구조화된 리스크 카드 배열
    {
      id: "payback_period",
      title: "회수 기간이 기준선(36개월)에 근접",
      severity: "high",             // "low" | "medium" | "high"
      evidence: {
        paybackMonths: 50,
        thresholdMonths: 36
      },
      narrative: "현재 회수 기간은 50개월이나, 매출 하락 시 위험 구간에 진입할 수 있습니다."
    }
  ],
  improvementSimulations: [         // 개선 시뮬레이션 (조건 입력 시)
    {
      id: "rent_minus_10",
      delta: "rent -10%",
      survivalMonths: 28,
      signal: "yellow"
    }
  ]
}
```

#### 사용 예시

```javascript
const { calculate } = require('./engine/decision');

const result = calculate({
  finance: financeResult,          // Finance API 출력 결과
  market: {
    marketScore: 70
  },
  roadview: {
    riskScore: 70
  }
});

console.log(`종합 점수: ${result.score}점`);
console.log(`신호등: ${result.signal}`);
console.log(`생존 개월 수: ${result.survivalMonths}개월`);
```

---

## Breakdown 사용법

### Breakdown이란?

Breakdown은 종합 점수(`score`)를 구성하는 각 항목별 점수입니다. 이를 통해 사용자에게 점수가 낮은 이유를 명확히 전달할 수 있습니다.

### Breakdown 항목 설명

| 항목 | 설명 | 점수 기준 |
|------|------|-----------|
| `payback` | 회수 기간 점수 | 18개월 미만: 100점, 18-24개월: 85점, 24-36개월: 70점, 36개월 초과: 50점, null: 0점 |
| `profitability` | 수익성 점수 | 500만원 이상: 100점, 500만원 미만: 60점, 0 이하: 0점 |
| `gap` | GAP 점수 | 10% 이하: 100점, 10-15%: 85점, 15-25%: 70점, 25% 초과: 50점 |
| `sensitivity` | 민감도 점수 | 안정적: 100점, 수익 급감: 60점, 적자 전환: 30점 |
| `fixedCost` | 고정비 점수 | 30% 이하: 100점, 30-35%: 70점, 35% 초과: 50점 |
| `dscr` | DSCR 점수 | ≥1.5: 100점, 1.2-1.5: 80점, 1.0-1.2: 50점, <1.0: 0점 |
| `market` | 상권 점수 | 입력값 그대로 사용 (0-100) |
| `roadview` | 로드뷰 점수 | 입력값 그대로 사용 (0-100) |

### Breakdown 활용 예시

#### 1. 점수 낮은 항목 하이라이트

```javascript
const result = calculate({
  finance: financeResult,
  market: { marketScore: 70 },
  roadview: { riskScore: 70 }
});

// 점수가 70점 미만인 항목 찾기
const weakPoints = Object.entries(result.breakdown)
  .filter(([key, score]) => score < 70)
  .map(([key, score]) => ({ category: key, score }));

console.log('약점 항목:', weakPoints);
// 예: [{ category: 'payback', score: 50 }, { category: 'gap', score: 70 }]
```

#### 2. Breakdown 차트 데이터 생성

```javascript
// 프론트엔드 차트 라이브러리용 데이터 변환
const chartData = Object.entries(result.breakdown).map(([key, score]) => ({
  name: getCategoryName(key),  // 한글 이름 변환 함수
  score: score,
  color: getScoreColor(score)   // 점수에 따른 색상 (녹색/노랑/빨강)
}));
```

#### 3. 개선 제안 우선순위 결정

```javascript
// 점수가 낮은 순서대로 정렬하여 개선 제안 우선순위 결정
const improvementPriority = Object.entries(result.breakdown)
  .map(([key, score]) => ({ category: key, score }))
  .sort((a, b) => a.score - b.score);

console.log('개선 우선순위:', improvementPriority);
// 예: [{ category: 'payback', score: 50 }, { category: 'gap', score: 70 }, ...]
```

---

## 비동기 처리 방법

### 동기 처리 (기본)

Engine 모듈은 **동기 함수**입니다. 즉시 결과를 반환합니다.

```javascript
const { calculate } = require('./engine/finance');

// 동기 처리
const result = calculate({
  brand: brandData,
  conditions: conditionsData,
  market: marketData,
  targetDailySales: 300
});

console.log(result.monthlyProfit);
```

### 비동기 처리 (Promise/async-await)

비동기 처리가 필요한 경우 (예: DB 조회, API 호출), Promise로 감싸거나 async 함수 내에서 처리합니다.

#### 예시 1: 브랜드 데이터를 DB에서 조회하는 경우

```javascript
const { calculate } = require('./engine/finance');
const { loadBrandFromDB } = require('./data_local/dbLoader');

async function analyzeFinance(conditions, market, targetDailySales) {
  try {
    // 1. DB에서 브랜드 데이터 조회 (비동기)
    const brand = await loadBrandFromDB('brand_1');
    
    // 2. Finance 계산 (동기)
    const result = calculate({
      brand,
      conditions,
      market,
      targetDailySales
    });
    
    return result;
  } catch (error) {
    // DB 조회 실패 시 data_local fallback
    const brand = require('./data_local/brandLoader').loadBrand('brand_1');
    return calculate({
      brand,
      conditions,
      market,
      targetDailySales
    });
  }
}

// 사용
analyzeFinance(conditions, market, 300)
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

#### 예시 2: 여러 시나리오를 병렬로 계산

```javascript
const { calculate } = require('./engine/finance');

async function calculateScenarios(brand, conditions, market, scenarios) {
  // 각 시나리오를 병렬로 계산
  const promises = scenarios.map(targetDailySales =>
    Promise.resolve(calculate({
      brand,
      conditions,
      market,
      targetDailySales
    }))
  );
  
  const results = await Promise.all(promises);
  return results;
}

// 사용
calculateScenarios(brand, conditions, market, [200, 250, 300])
  .then(results => {
    results.forEach((result, index) => {
      console.log(`${scenarios[index]}잔: ${result.monthlyProfit}원`);
    });
  });
```

#### 예시 3: Express 라우트에서 사용

```javascript
const express = require('express');
const router = express.Router();
const { calculate } = require('../engine/finance');
const { loadBrandFromDB } = require('../engine/data_local/dbLoader');

router.post('/api/analyze', async (req, res) => {
  try {
    const { brandId, conditions, market, targetDailySales } = req.body;
    
    // 비동기: 브랜드 데이터 조회
    let brand;
    try {
      brand = await loadBrandFromDB(brandId);
    } catch (error) {
      // Fallback: data_local에서 로드
      brand = require('../engine/data_local/brandLoader').loadBrand(brandId);
    }
    
    // 동기: Finance 계산
    const financeResult = calculate({
      brand,
      conditions,
      market,
      targetDailySales
    });
    
    res.json({ success: true, finance: financeResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 주의사항

1. **Engine 함수는 동기 함수**이므로 `await`를 사용할 필요가 없습니다.
2. **비동기 처리가 필요한 부분**은 데이터 로딩(DB 조회, 파일 읽기 등)입니다.
3. **에러 처리**는 try-catch 또는 Promise.catch()를 사용합니다.
4. **Fallback 전략**: DB 조회 실패 시 `data_local`에서 로드하는 것이 권장됩니다.

---

## 에러 처리

### 입력 검증 에러

```javascript
const { calculate } = require('./engine/finance');

try {
  const result = calculate({
    brand: {},  // defaults 누락
    conditions: { /* ... */ },
    market: { /* ... */ },
    targetDailySales: 300
  });
} catch (error) {
  if (error.message.includes('brand.defaults가 필요합니다')) {
    console.error('브랜드 정보가 올바르지 않습니다.');
  } else if (error.message.includes('targetDailySales는 0보다 큰 값이어야 합니다')) {
    console.error('목표 판매량이 올바르지 않습니다.');
  } else {
    console.error('알 수 없는 오류:', error.message);
  }
}
```

### 대출 입력 검증 에러

```javascript
try {
  const result = calculate({
    brand: brandData,
    conditions: {
      ...conditionsData,
      loans: [{
        principal: -1000000,  // 음수 원금 (에러)
        apr: 0.05,
        termMonths: 60,
        repaymentType: 'equal_payment'
      }]
    },
    market: marketData,
    targetDailySales: 300
  });
} catch (error) {
  if (error.message.includes('대출 입력 검증 실패')) {
    console.error('대출 정보가 올바르지 않습니다:', error.message);
  }
}
```

### null 값 처리

일부 계산 결과는 `null`을 반환할 수 있습니다:

- `paybackMonths`: 월 순이익이 0 이하일 때 `null`
- `breakEvenDailySales`: `avgPrice`가 0일 때 `null`
- `debt.dscr`: 대출이 없을 때 `null`

```javascript
const result = calculate({ /* ... */ });

// null 체크 필수
if (result.paybackMonths !== null) {
  console.log(`회수 기간: ${result.paybackMonths}개월`);
} else {
  console.log('회수 기간을 계산할 수 없습니다 (적자 상태)');
}

if (result.debt.dscr !== null) {
  console.log(`DSCR: ${result.debt.dscr}`);
} else {
  console.log('대출이 없습니다.');
}
```

---

## 추가 리소스

- [Finance Calculator 구현 상세](./finance/calculator.js)
- [Decision Scorer 구현 상세](./decision/scorer.js)
- [공유 인터페이스](../shared/interfaces.js)
- [단위 테스트 예시](./finance/calculator.test.js)
