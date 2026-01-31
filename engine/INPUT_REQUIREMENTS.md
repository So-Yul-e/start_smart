# StartSmart 엔진 입력값 요구사항

## 개요

StartSmart Decision Engine에 필요한 모든 입력값을 정리한 문서입니다.  
프론트엔드에서 이 형식에 맞춰 데이터를 전달해야 합니다.

---

## 1. 필수 입력값

### 1.1 Brand (브랜드 정보)

**선택 방법**: 브랜드 ID로 선택하거나, 브랜드 객체 전체를 전달

```js
// 방법 1: 브랜드 ID만 전달 (백엔드에서 브랜드 데이터 로드)
brandId: "brand_mega"

// 방법 2: 브랜드 객체 전체 전달
brand: {
  id: "brand_mega",
  name: "메가커피",
  defaults: {
    avgPrice: 3500,              // 평균 단가 (원/잔) - 필수
    cogsRate: 0.35,              // 원가율 (0-1) - 필수
    laborRate: 0.20,             // 인건비율 (0-1) - 필수
    utilitiesRate: 0.03,         // 공과금 비율 (0-1)
    royaltyRate: 0.05,           // 로열티율 (0-1)
    marketingRate: 0.02,         // 마케팅비율 (0-1)
    etcFixed: 1100000,           // 기타 고정비 (원)
    ownerWorkingMultiplier: 0.6, // 점주 근무 시 인건비 감산 계수
    expectedDailySales: null    // 기본 기대 판매량 (선택)
  },
  // Exit Plan 기본값 (선택, 없으면 DEFAULT 사용)
  exitDefaults: {
    contractYears: 3,            // 계약 기간 (년)
    penaltyRule: "remaining_months", // "remaining_months" | "fixed"
    monthlyRoyalty: 300000,      // 월 로열티 (remaining_months일 때 사용)
    fixedPenalty: 0,             // 고정 위약금 (fixed일 때 사용)
    interiorCostRatio: 0.35,     // 초기투자금 중 인테리어/설비 비중
    interiorSalvageCurve: [      // 인테리어 회수율 곡선
      { from: 0, to: 6, salvageRate: 0.05 },
      { from: 6, to: 12, salvageRate: 0.10 },
      { from: 12, to: 18, salvageRate: 0.20 },
      { from: 18, to: 60, salvageRate: 0.30 }
    ],
    goodwillRecoveryCurve: [     // 권리금 회수율 곡선
      { from: 0, to: 6, recoveryRate: 0.00 },
      { from: 6, to: 12, recoveryRate: 0.10 },
      { from: 12, to: 18, recoveryRate: 0.30 },
      { from: 18, to: 60, recoveryRate: 0.60 }
    ]
  }
}
```

### 1.2 Conditions (조건)

```js
conditions: {
  // 필수 필드
  initialInvestment: 200000000,  // 초기 투자금 (원)
  monthlyRent: 4000000,          // 월세 (원)
  area: 10,                       // 평수 (평)
  ownerWorking: true,             // 점주 근무 여부 (boolean)
  
  // 선택 필드: 대출 정보
  loans: [                        // 대출 배열 (선택)
    {
      principal: 200000000,       // 대출 원금 (원)
      apr: 0.05,                  // 연 이자율 (0-1, 예: 0.05 = 5%)
      termMonths: 60,             // 대출 기간 (개월)
      repaymentType: "equal_payment" // "equal_payment" | "equal_principal" | "interest_only"
    }
  ],
  
  // 선택 필드: Exit Plan 입력값
  exitInputs: {
    keyMoney: 50000000,           // 권리금 (원, 기본값: 0)
    pyeong: 10,                   // 평수 (기본값: 10)
    demolitionBase: 15000000,     // 철거 기본비 (원, 기본값: 15,000,000)
    demolitionPerPyeong: 1000000, // 평당 철거비 (원, 기본값: 1,000,000)
    workingCapital: 10000000      // 운영자금 (원, 기본값: 0, 향후 사용)
  }
}
```

### 1.3 Market (상권 정보)

```js
market: {
  // 필수 필드
  expectedDailySales: 256,        // 상권 평균 일 판매량 (잔)
  radiusM: 500,                   // 반경 (미터)
  marketScore: 70,                // 상권 점수 (0-100)
  
  // 선택 필드: 경쟁 정보
  competitors: {
    total: 5,                      // 총 경쟁업체 수
    density: "high"                // "low" | "medium" | "high"
  },
  
  // 선택 필드: Multiplier 레이어 (demandMultiplier 계산용)
  tradeAreaType: "office",        // "office" | "residential" | "station" | "tourism" | "university" | "mixed"
  dayType: "weekday",             // "weekday" | "weekend" | "holiday" | "seollal" | "chuseok"
  footTrafficIndex: 1.2,          // 유동인구 지수 (1.0 기준, 1.2=+20%, 0.8=-20%)
  timeProfileKey: "takeout_franchise", // "takeout_franchise" | "stay_dessert"
  
  // 선택 필드: 이미 계산된 demandMultiplier (있으면 사용, 없으면 자동 계산)
  demandMultiplier: 1.2
}
```

### 1.4 Roadview (로드뷰 분석 결과)

```js
roadview: {
  overallRisk: "medium",          // "low" | "medium" | "high"
  riskScore: 65                   // 로드뷰 리스크 점수 (0-100, 낮을수록 위험)
}
```

### 1.5 Target Daily Sales (목표 일 판매량)

```js
targetDailySales: 300             // 목표 일 판매량 (잔) - 필수
```

---

## 2. 전체 입력 예시

```js
{
  // 브랜드 선택
  brandId: "brand_mega",  // 또는 brand 객체 전체
  
  // 조건
  conditions: {
    initialInvestment: 200000000,
    monthlyRent: 4000000,
    area: 10,
    ownerWorking: true,
    exitInputs: {
      keyMoney: 50000000,
      pyeong: 10,
      demolitionBase: 15000000,
      demolitionPerPyeong: 1000000
    }
  },
  
  // 상권 정보
  market: {
    expectedDailySales: 256,
    radiusM: 500,
    marketScore: 70,
    competitors: { total: 5, density: "high" },
    tradeAreaType: "office",
    dayType: "weekday",
    footTrafficIndex: 1.2,
    timeProfileKey: "takeout_franchise"
  },
  
  // 로드뷰 분석
  roadview: {
    overallRisk: "medium",
    riskScore: 65
  },
  
  // 목표 판매량
  targetDailySales: 300
}
```

---

## 3. 필수 vs 선택 필드 요약

### 필수 필드 (반드시 입력 필요)

| 카테고리 | 필드 | 설명 |
|---------|------|------|
| Brand | `defaults.avgPrice` | 평균 단가 |
| Brand | `defaults.cogsRate` | 원가율 |
| Brand | `defaults.laborRate` | 인건비율 |
| Conditions | `initialInvestment` | 초기 투자금 |
| Conditions | `monthlyRent` | 월세 |
| Market | `expectedDailySales` | 상권 평균 일 판매량 |
| Market | `marketScore` | 상권 점수 |
| Roadview | `riskScore` | 로드뷰 리스크 점수 |
| - | `targetDailySales` | 목표 일 판매량 |

### 선택 필드 (기본값 사용 가능)

- `brand.exitDefaults`: Exit Plan 기본값 (없으면 DEFAULT 사용)
- `conditions.exitInputs`: Exit Plan 입력값 (없으면 DEFAULT 사용)
- `conditions.loans`: 대출 정보 (없으면 대출 없음으로 처리)
- `market.tradeAreaType`, `dayType`, `footTrafficIndex`: Multiplier 레이어 (없으면 기본값 1.0)
- `market.demandMultiplier`: 이미 계산된 수요 배수 (없으면 자동 계산)

---

## 4. 프론트엔드 입력 UI 제안

### 4.1 기본 정보 입력

- [ ] 브랜드 선택 (드롭다운)
- [ ] 초기 투자금 (숫자 입력)
- [ ] 월세 (숫자 입력)
- [ ] 평수 (숫자 입력)
- [ ] 점주 근무 여부 (체크박스)
- [ ] 목표 일 판매량 (숫자 입력)

### 4.2 상권 정보 입력

- [ ] 상권 평균 일 판매량 (숫자 입력, AI 추정값 표시)
- [ ] 상권 점수 (숫자 입력, AI 분석값 표시)
- [ ] 상권 타입 (드롭다운: 오피스/주거/역세권/관광/대학가/복합)
- [ ] 요일/휴일 타입 (드롭다운: 평일/주말/공휴일/설날/추석)
- [ ] 유동인구 지수 (슬라이더: 0.6 ~ 1.6)

### 4.3 로드뷰 분석 (자동)

- [ ] 로드뷰 분석 결과 (AI 자동 분석, 사용자 입력 불필요)

### 4.4 고급 옵션 (선택)

- [ ] 대출 정보 (토글 → 상세 입력)
- [ ] Exit Plan 입력값 (토글 → 상세 입력)
  - 권리금
  - 철거 기본비
  - 평당 철거비

---

## 5. 입력값 검증 규칙

### 숫자 필드

- `initialInvestment`: 1,000만원 이상
- `monthlyRent`: 0 이상
- `targetDailySales`: 1 이상
- `marketScore`, `riskScore`: 0-100 범위
- `footTrafficIndex`: 0.6-1.6 범위 (자동 clamp)

### 필수 필드 누락 시

- 에러 메시지 표시
- 계산 중단

---

## 6. API 요청 형식 예시

```js
// POST /api/analyze
{
  brandId: "brand_mega",
  location: {
    lat: 37.5665,
    lng: 126.9780,
    address: "서울특별시 강남구 테헤란로 123"
  },
  conditions: {
    initialInvestment: 200000000,
    monthlyRent: 4000000,
    area: 10,
    ownerWorking: true,
    exitInputs: {
      keyMoney: 50000000,
      pyeong: 10,
      demolitionBase: 15000000,
      demolitionPerPyeong: 1000000
    }
  },
  targetDailySales: 300
}

// 백엔드에서 market, roadview 자동 생성 후 엔진 호출
```

---

## 7. 참고

- 모든 선택 필드는 기본값이 제공되므로, MVP에서는 필수 필드만 입력해도 정상 동작합니다.
- Exit Plan 기능을 사용하려면 `conditions.exitInputs`와 `brand.exitDefaults`가 필요합니다.
- Multiplier 레이어를 사용하려면 `market.tradeAreaType`, `dayType`, `footTrafficIndex`가 필요합니다.
