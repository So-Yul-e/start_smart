# 역할 4: 계산 엔진

## 담당 영역
- 손익 계산 엔진
- 점수/신호등/생존 개월 판단 엔진
- 리스크 카드(구조화) + 짧은 템플릿 문장 생성 (엔진)
  - **최종 긴 코멘트(리포트 9p급)**는 AI 판단 레이어(역할 3)로 넘긴다
  - 엔진이 모든 자연어를 생성하면 스코프가 커지고 통합에서 꼬임을 방지

## 폴더
```
engine/
├── finance/          # 손익 계산
│   ├── index.js      #   손익 계산 메인 로직
│   └── calculator.js #   계산식 구현
├── decision/         # 점수/신호등 판단
│   ├── index.js      #   판단 메인 로직
│   └── scorer.js     #   점수 산출 로직
└── ROLE.md
```

## 입력/출력

### 손익 계산 입력
```js
{
  brand: {
    id: "brand_mega",
    name: "메가커피",
    // 브랜드/업종 기본값(정적 데이터에서 주입)
    defaults: {
      avgPrice: 3500,              // 평균 단가 (원/잔)
      cogsRate: 0.35,              // 원가율 (COGS, 매출 대비)
      laborRate: 0.20,             // 인건비율 (매출 대비)
      utilitiesRate: 0.03,         // 공과금 비율 (매출 대비)
      etcFixed: 1100000,           // 기타 고정비 (원)
      royaltyRate: 0.05,           // 로열티율 (매출 대비)
      marketingRate: 0.02          // 마케팅비율 (매출 대비)
    }
  },
  conditions: {
    initialInvestment: 200000000,  // 초기 투자금 (원)
    monthlyRent: 4000000,          // 월세 (원)
    area: 10,                      // 평수 (평)
    ownerWorking: true             // 점주 근무 여부
  },
  market: {
    expectedDailySales: 256,       // 상권 평균(=AI 기대치) 일 판매량 (잔, optional)
    radiusM: 500                   // 반경 (미터)
  },
  targetDailySales: 300,           // 목표 일 판매량 (잔)
  scenarios: [200, 250, 300]       // 확장 옵션(유저 세팅) - 시나리오별 일 판매량
}
```

**⚠️ expectedDailySales Fallback 규칙**:
1. `market.expectedDailySales` 우선 사용
2. 없으면 `brand.defaults.expectedDailySales` 사용
3. 둘 다 없으면 `targetDailySales` 사용 (최후 fallback, 이 경우 GAP=0%)

### 손익 계산 출력
```js
{
  monthlyRevenue: 31500000,        // 월 매출 (원) - targetDailySales 기준
  expected: {
    expectedDailySales: 256,       // 상권 평균 일 판매량 (잔)
    expectedMonthlyRevenue: 26880000,  // 상권 평균 월 매출 (원)
    gapPctVsTarget: 0.17           // GAP 비율: (target - expected) / expected
  },
  monthlyCosts: {
    rent: 4000000,
    labor: 6300000,                // 매출의 20%
    materials: 11025000,           // 매출의 35% (원가)
    utilities: 945000,             // 매출의 3%
    royalty: 1575000,              // 매출의 5%
    marketing: 630000,             // 매출의 2%
    etc: 1100000                   // 기타 고정비
  },
  monthlyProfit: 9100000,          // 월 순이익 (원)
  paybackMonths: 22,               // 회수 개월 수
  breakEvenDailySales: 240,        // 손익분기점 일 판매량 (잔)
  sensitivity: {
    plus10: {
      monthlyProfit: 12000000,
      paybackMonths: 17
    },
    minus10: {
      monthlyProfit: 8000000,
      paybackMonths: 25
    }
  },
  scenarioTable: [                 // 시나리오별 손익 비교표
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

### 판단 입력
```js
{
  finance: financeResultExample,  // 위의 손익 계산 결과
  market: {
    competitors: { total: 5, density: "high" },
    marketScore: 70
  },
  roadview: {
    overallRisk: "medium",
    riskScore: 65
  }
}
```

### 판단 출력
```js
{
  score: 62,                       // 0-100 점수
  successProbability: 0.62,        // 성공 확률 (0-1, score/100)
  signal: "yellow",                // green | yellow | red
  survivalMonths: 31,              // 예상 생존 개월 수 (36 기준선 감점형)
  riskLevel: "medium",             // low | medium | high
  riskFactors: [                   // 레거시: 문자열 배열 (유지)
    "회수 기간이 36개월을 초과함",
    "목표 판매량 달성 난이도 높음"
  ],
  riskCards: [                     // 신규: 구조화된 리스크 카드 배열 (추가)
    {
      id: "rent_sensitivity",
      title: "임대료 대비 매출 민감도 높음",
      severity: "high",            // low | medium | high
      evidence: {
        rentShare: 0.18,           // 임대료/매출 비율
        profitMargin: 0.10,        // 순이익률
        breakEvenDailySales: 260    // 손익분기점 일 판매량
      },
      narrative: "매출이 10% 하락하면 손익분기 도달이 어려워집니다."
    },
    {
      id: "payback_period",
      title: "회수 기간이 기준선(36개월)에 근접",
      severity: "medium",
      evidence: {
        paybackMonths: 22,
        thresholdMonths: 36
      },
      narrative: "현재 회수 기간은 22개월이나, 매출 하락 시 위험 구간에 진입할 수 있습니다."
    }
  ],
  improvementSimulations: [        // 개선 시뮬레이션 (PDF 8p용)
    {
      id: "rent_minus_10",
      delta: "rent -10%",
      survivalMonths: 38,
      signal: "green"
    },
    {
      id: "sales_minus_10",
      delta: "target -10%",
      survivalMonths: 34,
      signal: "yellow"
    }
  ]
}
```

---

## 세팅 가이드

### 1단계: 사전 준비
```bash
# 필요한 것
# - Node.js 24.x Current (node -v 로 확인, v24.x.x 출력되어야 함)
#   ⚠️ 팀원 모두 24.x 버전 사용 필수 (호환성 및 보안 문제 방지)
# - npm (npm -v 로 확인)
# - 코드 에디터 (VS Code 추천)
```

### 2단계: 프로젝트 클론 & 설치
```bash
git clone <repo-url>
cd StartSmart
npm install
```

### 3단계: 환경변수 설정
```bash
cp .env.example .env
```
`.env` 파일은 계산 엔진에서 직접 사용하지 않지만, 백엔드 통합 시 필요할 수 있습니다.

### 4단계: 브랜치 생성
```bash
git checkout -b feature/engine
```

### 5단계: 작업 시작
```bash
# 내 작업 폴더: engine/ 만 수정!
# 핵심 파일: finance/calculator.js, decision/scorer.js
```

---

## 단독 테스트 방법 (서버 없이)

### 테스트 스크립트 만들기
`engine/finance/` 폴더에 `test.js` 파일을 만들어서 단독 테스트:

```js
// engine/finance/test.js
const { calculateFinance } = require('./index');

const result = calculateFinance({
  brand: {
    id: "brand_mega",
    name: "메가커피",
    defaults: {
      avgPrice: 3500,
      cogsRate: 0.35,
      laborRate: 0.20,
      utilitiesRate: 0.03,
      etcFixed: 1100000,
      royaltyRate: 0.05,
      marketingRate: 0.02
    }
  },
  conditions: {
    initialInvestment: 200000000,
    monthlyRent: 4000000,
    area: 10,
    ownerWorking: true
  },
  market: {
    expectedDailySales: 256,
    radiusM: 500
  },
  targetDailySales: 300,
  scenarios: [200, 250, 300]
});

console.log('=== 손익 계산 결과 ===');
console.log(JSON.stringify(result, null, 2));
console.log('\n=== GAP 분석 ===');
const targetDailySales = 300;  // 입력에서 받은 값
console.log(`목표: ${targetDailySales}잔`);
console.log(`기대: ${result.expected.expectedDailySales}잔`);
console.log(`GAP: ${(result.expected.gapPctVsTarget * 100).toFixed(1)}%`);
```

### 실행
```bash
node engine/finance/test.js
```

### 확인할 것
- [ ] JSON 형식이 올바른지 (`shared/interfaces.js` 참고)
- [ ] 월 매출 계산이 정확한지 (일 판매량 × 평균 단가 × 30일)
- [ ] 기대 매출 및 GAP 계산이 정확한지 (`expected.gapPctVsTarget`)
- [ ] 월 비용 계산이 정확한지 (각 항목별 합산, 브랜드 기본값 사용)
- [ ] 회수 개월 수 계산이 정확한지 (초기 투자금 ÷ 월 순이익)
- [ ] 시나리오 테이블이 정확한지 (`scenarioTable` 배열)
- [ ] 민감도 분석이 정확한지 (±10% 시나리오)

---

## 구현 가이드

### 1. 손익 계산식

#### 월 매출 계산
```js
// 평균 단가 (원/잔) - brand.defaults.avgPrice에서 주입받음
const avgPrice = brand.defaults.avgPrice;  // 예: 3500원

// 목표 기준 월 매출 = 일 판매량 × 평균 단가 × 30일
const monthlyRevenue = targetDailySales * avgPrice * 30;

// 기대 월 매출 = 상권 평균 일 판매량 × 평균 단가 × 30일
const expectedMonthlyRevenue = market.expectedDailySales * avgPrice * 30;

// GAP 비율 계산: (target - expected) / expected
const gapPctVsTarget = (targetDailySales - market.expectedDailySales) / market.expectedDailySales;
```

#### 월 비용 계산
```js
const monthlyCosts = {
  rent: conditions.monthlyRent,                              // 월세
  labor: monthlyRevenue * brand.defaults.laborRate,          // 인건비 (매출 대비 비율)
  materials: monthlyRevenue * brand.defaults.cogsRate,      // 원재료비 (매출 대비 비율)
  utilities: monthlyRevenue * brand.defaults.utilitiesRate,  // 공과금 (매출 대비 비율)
  royalty: monthlyRevenue * brand.defaults.royaltyRate,     // 로열티 (매출 대비 비율)
  marketing: monthlyRevenue * brand.defaults.marketingRate, // 마케팅비 (매출 대비 비율)
  etc: brand.defaults.etcFixed                              // 기타 고정비
};

// 점주 근무 시 인건비 감소 (선택적 적용)
if (conditions.ownerWorking) {
  monthlyCosts.labor *= 0.6;  // 점주 근무 시 40% 절감
}
```

#### 시나리오 테이블 생성
```js
// scenarios 배열에 대해 각각 손익 계산
const scenarioTable = scenarios.map(daily => {
  const scenarioRevenue = daily * avgPrice * 30;
  const scenarioCosts = {
    rent: conditions.monthlyRent,
    labor: scenarioRevenue * brand.defaults.laborRate * (conditions.ownerWorking ? 0.6 : 1),
    materials: scenarioRevenue * brand.defaults.cogsRate,
    utilities: scenarioRevenue * brand.defaults.utilitiesRate,
    royalty: scenarioRevenue * brand.defaults.royaltyRate,
    marketing: scenarioRevenue * brand.defaults.marketingRate,
    etc: brand.defaults.etcFixed
  };
  const totalCosts = Object.values(scenarioCosts).reduce((a, b) => a + b, 0);
  const scenarioProfit = scenarioRevenue - totalCosts;
  const scenarioPayback = conditions.initialInvestment / scenarioProfit;
  
  return {
    daily: daily,
    profit: Math.round(scenarioProfit),
    paybackMonths: Math.round(scenarioPayback * 10) / 10  // 소수점 첫째자리까지
  };
});
```

#### 월 순이익 계산
```js
const totalCosts = Object.values(monthlyCosts).reduce((a, b) => a + b, 0);
const monthlyProfit = monthlyRevenue - totalCosts;
```

#### 회수 개월 수 계산
```js
const paybackMonths = conditions.initialInvestment / monthlyProfit;
```

#### 손익분기점 계산
```js
// 손익분기점 일 판매량 = (월 총 비용) ÷ (평균 단가 × 30일)
const breakEvenDailySales = totalCosts / (avgPrice * 30);
```

### 2. 점수 산출 로직

```js
function calculateScore(finance, market, roadview) {
  let score = 100;
  
  // 회수 기간 감점
  if (finance.paybackMonths > 36) {
    score -= 30;  // 36개월 초과 시 30점 감점
  } else if (finance.paybackMonths > 24) {
    score -= 15;  // 24개월 초과 시 15점 감점
  }
  
  // 월 순이익 감점
  if (finance.monthlyProfit <= 0) {
    score -= 50;  // 적자 시 50점 감점
  } else if (finance.monthlyProfit < 5000000) {
    score -= 20;  // 500만원 미만 시 20점 감점
  }
  
  // 상권 점수 반영 (0-30점)
  score = score * 0.7 + market.marketScore * 0.3;
  
  // 로드뷰 리스크 반영
  score -= (100 - roadview.riskScore) * 0.2;
  
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  
  // 성공 확률 = 점수 / 100
  const successProbability = finalScore / 100;
  
  return { score: finalScore, successProbability };
}
```

### 3. 신호등 판단

```js
function determineSignal(score, finance) {
  // 하드컷 규칙
  if (finance.paybackMonths >= 36 || finance.monthlyProfit <= 0) {
    return "red";
  }
  
  // 점수 기반 판단
  if (score >= 70) {
    return "green";
  } else if (score >= 50) {
    return "yellow";
  } else {
    return "red";
  }
}
```

### 4. 리스크 카드 생성 (템플릿 기반)

```js
function generateRiskFactors(finance, market, roadview) {
  const riskFactors = [];
  
  // 리스크 1: 임대료 대비 매출 민감도
  const rentShare = finance.monthlyCosts.rent / finance.monthlyRevenue;
  if (rentShare > 0.15) {
    riskFactors.push({
      id: "rent_sensitivity",
      title: "임대료 대비 매출 민감도 높음",
      severity: rentShare > 0.20 ? "high" : "medium",
      evidence: {
        rentShare: Math.round(rentShare * 100) / 100,
        profitMargin: Math.round((finance.monthlyProfit / finance.monthlyRevenue) * 100) / 100,
        breakEvenDailySales: finance.breakEvenDailySales
      },
      narrative: `임대료가 매출의 ${Math.round(rentShare * 100)}%를 차지합니다. 매출이 10% 하락하면 손익분기 도달이 어려워집니다.`
    });
  }
  
  // 리스크 2: 회수 기간
  if (finance.paybackMonths > 30) {
    riskFactors.push({
      id: "payback_period",
      title: "회수 기간이 기준선(36개월)에 근접",
      severity: finance.paybackMonths >= 36 ? "high" : "medium",
      evidence: {
        paybackMonths: finance.paybackMonths,
        thresholdMonths: 36
      },
      narrative: `현재 회수 기간은 ${Math.round(finance.paybackMonths)}개월이나, 매출 하락 시 위험 구간에 진입할 수 있습니다.`
    });
  }
  
  // 리스크 3: 목표 vs 기대 GAP
  if (finance.expected.gapPctVsTarget > 0.15) {
    // targetDailySales는 입력에서 받아야 함 (finance 객체에 포함되지 않을 수 있음)
    const targetDailySales = finance.targetDailySales || (finance.monthlyRevenue / (finance.expected.expectedMonthlyRevenue / finance.expected.expectedDailySales) / 30);
    riskFactors.push({
      id: "sales_gap",
      title: "목표 판매량과 상권 기대치 간 GAP 큼",
      severity: finance.expected.gapPctVsTarget > 0.25 ? "high" : "medium",
      evidence: {
        targetDailySales: Math.round(targetDailySales),
        expectedDailySales: finance.expected.expectedDailySales,
        gapPct: Math.round(finance.expected.gapPctVsTarget * 100)
      },
      narrative: `목표 판매량(${Math.round(targetDailySales)}잔)이 상권 평균(${finance.expected.expectedDailySales}잔)보다 ${Math.round(finance.expected.gapPctVsTarget * 100)}% 높아 달성 난이도가 있습니다.`
    });
  }
  
  return riskFactors;
}
```

### 5. 개선 시뮬레이션 생성

```js
function generateImprovementSimulations(finance, conditions, brand, market, roadview, targetDailySales) {
  const simulations = [];
  
  // 시뮬레이션 1: 임대료 -10%
  const rentMinus10 = conditions.monthlyRent * 0.9;
  const sim1Conditions = { ...conditions, monthlyRent: rentMinus10 };
  const sim1Finance = recalculateFinance(sim1Conditions, brand, targetDailySales, market);
  const sim1ScoreResult = calculateScore(sim1Finance, market, roadview);
  const sim1Survival = estimateSurvivalMonths(sim1Finance, market, roadview);
  simulations.push({
    id: "rent_minus_10",
    delta: "rent -10%",
    survivalMonths: sim1Survival,
    signal: determineSignal(sim1ScoreResult.score, sim1Finance)
  });
  
  // 시뮬레이션 2: 목표 판매량 -10%
  const salesMinus10 = targetDailySales * 0.9;
  const sim2Finance = recalculateFinance(conditions, brand, salesMinus10, market);
  const sim2ScoreResult = calculateScore(sim2Finance, market, roadview);
  const sim2Survival = estimateSurvivalMonths(sim2Finance, market, roadview);
  simulations.push({
    id: "sales_minus_10",
    delta: "target -10%",
    survivalMonths: sim2Survival,
    signal: determineSignal(sim2ScoreResult.score, sim2Finance)
  });
  
  return simulations;
}

// 참고: recalculateFinance는 finance 계산 함수를 재사용
// (내부적으로 calculateFinance와 동일한 로직 사용)
```

### 6. 생존 개월 수 추정 (36 기준선 감점형)

```js
function estimateSurvivalMonths(finance, market, roadview) {
  // 기준선: 36개월
  const baseMonths = 36;
  let survivalMonths = baseMonths;
  
  // 감점 요인 1: 회수 기간이 길수록 감점
  if (finance.paybackMonths > 36) {
    survivalMonths -= (finance.paybackMonths - 36) * 1.5;  // 36개월 초과 시 강한 감점
  } else if (finance.paybackMonths > 24) {
    survivalMonths -= (finance.paybackMonths - 24) * 0.5;  // 24-36개월 구간 중간 감점
  }
  
  // 감점 요인 2: 매출 -10% 시 적자 전환이면 큰 감점
  const minus10Profit = finance.sensitivity.minus10.monthlyProfit;
  if (minus10Profit <= 0) {
    survivalMonths -= 15;  // 적자 전환 시 강한 감점
  } else if (minus10Profit < finance.monthlyProfit * 0.5) {
    survivalMonths -= 8;   // 수익 급감 시 중간 감점
  }
  
  // 감점 요인 3: 고정비 비중(임대+인건비)/매출이 높으면 감점
  const fixedCostRatio = (finance.monthlyCosts.rent + finance.monthlyCosts.labor) / finance.monthlyRevenue;
  if (fixedCostRatio > 0.35) {
    survivalMonths -= 10;  // 고정비 비중 35% 초과 시 감점
  } else if (fixedCostRatio > 0.30) {
    survivalMonths -= 5;   // 고정비 비중 30-35% 시 경미한 감점
  }
  
  // 감점 요인 4: 경쟁/로드뷰 점수 (MVP에서는 가볍게)
  if (market.marketScore < 50) {
    survivalMonths -= 3;   // 상권 점수 낮을 시 경미한 감점
  }
  if (roadview.riskScore < 50) {
    survivalMonths -= 2;   // 로드뷰 리스크 시 경미한 감점
  }
  
  // 최소값 보장 (12개월 이상)
  return Math.max(12, Math.round(survivalMonths));
}
```

---

## 커밋 규칙
```bash
git add engine/
git commit -m "[Engine] 작업내용"
git push origin feature/engine
```

## 주의사항
- `engine/` 폴더만 수정할 것
- 출력 JSON 형식을 절대 변경하지 말 것 (`shared/interfaces.js` 참고)
- 계산식은 정확해야 하므로 단위 테스트 작성 권장
- **브랜드별 기본값(단가/비율)은 입력으로 주입받아야 함** - 하드코딩 금지
  - `brand.defaults.avgPrice`, `brand.defaults.cogsRate` 등 사용
  - 정적 데이터는 외부(백엔드/프론트엔드)에서 관리
- 리스크 문장은 템플릿 기반으로 생성 (엔진 레벨)
- 최종 긴 코멘트/분석은 AI 레이어(다효)에서 처리
