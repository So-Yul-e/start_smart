# 역할 4: 계산 엔진

## 담당 영역
- 손익 계산 엔진
- 점수/신호등/생존 개월 판단 엔진
- 리스크 문장 생성

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
    id: "brand_1",
    name: "스타벅스",
    monthlyRoyalty: 5,      // 로열티 (%)
    monthlyMarketing: 2      // 마케팅비 (%)
  },
  conditions: {
    initialInvestment: 500000000,  // 초기 투자금 (원)
    monthlyRent: 3000000,          // 월세 (원)
    area: 33,                      // 평수 (평)
    ownerWorking: true             // 점주 근무 여부
  },
  targetDailySales: 300            // 목표 일 판매량 (잔)
}
```

### 손익 계산 출력
```js
{
  monthlyRevenue: 27000000,      // 월 매출 (원)
  monthlyCosts: {
    rent: 3000000,
    labor: 5000000,
    materials: 8100000,          // 매출의 30%
    utilities: 500000,
    royalty: 1350000,            // 매출의 5%
    marketing: 540000,           // 매출의 2%
    etc: 500000
  },
  monthlyProfit: 10000000,        // 월 순이익 (원)
  paybackMonths: 50,              // 회수 개월 수
  breakEvenDailySales: 200,       // 손익분기점 일 판매량 (잔)
  sensitivity: {
    plus10: {
      monthlyProfit: 12000000,
      paybackMonths: 42
    },
    minus10: {
      monthlyProfit: 8000000,
      paybackMonths: 63
    }
  }
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
  score: 65,                      // 0-100 점수
  signal: "yellow",                // green | yellow | red
  survivalMonths: 24,              // 예상 생존 개월 수
  riskLevel: "medium",              // low | medium | high
  riskFactors: [
    "회수 기간이 36개월을 초과함",
    "목표 판매량 달성 난이도 높음"
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
    id: "brand_1",
    name: "스타벅스",
    monthlyRoyalty: 5,
    monthlyMarketing: 2
  },
  conditions: {
    initialInvestment: 500000000,
    monthlyRent: 3000000,
    area: 33,
    ownerWorking: true
  },
  targetDailySales: 300
});

console.log('=== 손익 계산 결과 ===');
console.log(JSON.stringify(result, null, 2));
```

### 실행
```bash
node engine/finance/test.js
```

### 확인할 것
- [ ] JSON 형식이 올바른지 (`shared/interfaces.js` 참고)
- [ ] 월 매출 계산이 정확한지 (일 판매량 × 평균 단가 × 30일)
- [ ] 월 비용 계산이 정확한지 (각 항목별 합산)
- [ ] 회수 개월 수 계산이 정확한지 (초기 투자금 ÷ 월 순이익)
- [ ] 민감도 분석이 정확한지 (±10% 시나리오)

---

## 구현 가이드

### 1. 손익 계산식

#### 월 매출 계산
```js
// 평균 단가 (원/잔) - 브랜드별로 다를 수 있음
const avgPrice = 4500;  // 예: 스타벅스 평균 단가

// 월 매출 = 일 판매량 × 평균 단가 × 30일
const monthlyRevenue = targetDailySales * avgPrice * 30;
```

#### 월 비용 계산
```js
const monthlyCosts = {
  rent: conditions.monthlyRent,                    // 월세
  labor: calculateLaborCost(conditions, brand),    // 인건비
  materials: monthlyRevenue * 0.3,                 // 원재료비 (매출의 30%)
  utilities: calculateUtilities(conditions.area), // 공과금
  royalty: monthlyRevenue * (brand.monthlyRoyalty / 100),  // 로열티
  marketing: monthlyRevenue * (brand.monthlyMarketing / 100), // 마케팅비
  etc: 500000                                      // 기타
};

// 인건비 계산 (점주 근무 시 감소)
function calculateLaborCost(conditions, brand) {
  const baseLaborCost = 8000000;  // 기본 인건비
  if (conditions.ownerWorking) {
    return baseLaborCost * 0.6;    // 점주 근무 시 40% 절감
  }
  return baseLaborCost;
}
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
  
  return Math.max(0, Math.min(100, Math.round(score)));
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

### 4. 생존 개월 수 추정

```js
function estimateSurvivalMonths(score, finance, market) {
  // 점수와 재무 지표를 종합하여 생존 개월 수 추정
  const baseMonths = 36;
  
  if (score >= 70) {
    return baseMonths * 2;  // 72개월 이상
  } else if (score >= 50) {
    return baseMonths;      // 36개월
  } else {
    return Math.max(12, baseMonths * 0.5);  // 최소 12개월
  }
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
- 브랜드별 평균 단가, 원재료비 비율 등은 정적 데이터로 관리
