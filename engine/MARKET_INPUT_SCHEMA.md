# Market 입력 스키마 확장 (Multiplier 레이어)

## 개요

`expectedDailySales` 확정 후 demandMultiplier를 곱하여 최종 기대 판매량을 보정합니다.

```
expectedDailySales *= market.demandMultiplier
```

`demandMultiplier`는 다음 3개를 곱해 만듭니다:
1. `dayTypeMultiplier` (상권타입 × 요일/휴일)
2. `footTrafficMultiplier` (유동인구 지수)
3. `timeProfileFitMultiplier` (시간대 분포 적합도, MVP에서는 1.0 고정)

---

## 입력 스키마 확장

### market 필드 (최소 필수)

```js
{
  market: {
    // 기존 필드
    expectedDailySales: 256,        // 상권 평균 일 판매량 (잔, optional)
    radiusM: 500,                    // 반경 (미터)
    
    // [NEW] Multiplier 레이어 필드 (최소)
    tradeAreaType: "office",         // 상권 타입
    dayType: "weekday",              // 요일/휴일 타입
    footTrafficIndex: 1.2            // 유동인구 지수 (1.0 기준)
  }
}
```

### market 필드 (추천)

```js
{
  market: {
    // ... 기존 필드 ...
    
    // [NEW] Multiplier 레이어 필드 (추천)
    timeProfileKey: "takeout_franchise",  // 시간대 분포 프로필 키
    demandMultiplier: 1.2                  // market 모듈에서 산출해 calculator로 전달
  }
}
```

---

## 필드 상세 설명

### tradeAreaType (상권 타입)

| 값 | 설명 |
|------|------|
| `"office"` | 오피스 상권 |
| `"residential"` | 주거 상권 |
| `"station"` | 역세권 상권 |
| `"tourism"` | 관광 상권 |
| `"university"` | 대학가 상권 |
| `"mixed"` | 복합 상권 (기본값) |

### dayType (요일/휴일 타입)

| 값 | 설명 |
|------|------|
| `"weekday"` | 평일 (기본값) |
| `"weekend"` | 주말 |
| `"holiday"` | 공휴일 |
| `"seollal"` | 설날 |
| `"chuseok"` | 추석 |

### footTrafficIndex (유동인구 지수)

- **기준값**: `1.0` (100%)
- **범위**: `0.6` ~ `1.6` (자동 clamp)
- **예시**:
  - `1.2` = +20% (유동인구 20% 증가)
  - `0.8` = -20% (유동인구 20% 감소)

### timeProfileKey (시간대 분포 프로필 키)

| 값 | 설명 |
|------|------|
| `"takeout_franchise"` | 테이크아웃 프랜차이즈 (기본값) |
| `"stay_dessert"` | 머물러 먹는 디저트 카페 |

> **참고**: 시간대 분포는 MVP에서 손익 계산에 직접 사용되지 않으며, 다음 단계(인력 산정 모듈)에서 사용됩니다.

### demandMultiplier (수요 배수)

- **자동 계산**: `market` 모듈에서 `buildDemandMultiplier()` 함수로 계산
- **수동 제공**: 이미 계산된 값이 있으면 그대로 사용
- **기본값**: `1.0` (보정 없음)

---

## 출력 스키마 확장

### finance.expected 필드 추가

```js
{
  expected: {
    // 기존 필드
    expectedDailySales: 240,              // 최종 사용된 기대 판매량 (demandMultiplier 적용 후)
    expectedMonthlyRevenue: 25200000,
    gapPctVsTarget: 0.17,
    
    // [NEW] demandMultiplier 관련 추적 필드
    expectedDailySalesRaw: 200,            // 보정 전 원본 값
    demandMultiplier: 1.2,                 // 적용된 수요 배수
    tradeAreaType: "office",               // 상권 타입
    dayType: "weekday",                    // 요일/휴일 타입
    timeProfileKey: "takeout_franchise"    // 시간대 분포 프로필 키
  }
}
```

---

## 사용 예시

### 예시 1: 기본 사용 (자동 계산)

```js
const market = {
  expectedDailySales: 200,
  tradeAreaType: "office",
  dayType: "weekday",
  footTrafficIndex: 1.2
};

// calculator 내부에서 자동으로 demandMultiplier 계산
// office × weekday = 1.0
// footTrafficIndex = 1.2 (clamp 적용)
// demandMultiplier = 1.0 * 1.2 * 1.0 = 1.2
// expectedDailySales = 200 * 1.2 = 240
```

### 예시 2: 수동 제공 (market 모듈에서 계산)

```js
const { buildDemandMultiplier } = require('./engine/market/buildDemandMultiplier');
const { dayTypeMultipliers, footTrafficIndexClamp } = require('./shared/constants');

const market = {
  expectedDailySales: 200,
  tradeAreaType: "office",
  dayType: "weekend",
  footTrafficIndex: 1.1,
  timeProfileKey: "takeout_franchise"
};

// market 모듈에서 미리 계산
market.demandMultiplier = buildDemandMultiplier(market, {
  dayTypeMultipliers,
  footTrafficIndexClamp
});

// calculator는 이미 계산된 demandMultiplier 사용
// office × weekend = 0.65
// footTrafficIndex = 1.1
// demandMultiplier = 0.65 * 1.1 * 1.0 = 0.715
// expectedDailySales = 200 * 0.715 = 143
```

### 예시 3: 주말 오피스 상권 (매출 감소)

```js
const market = {
  expectedDailySales: 250,
  tradeAreaType: "office",
  dayType: "weekend",        // 주말
  footTrafficIndex: 1.0
};

// office × weekend = 0.65
// footTrafficIndex = 1.0
// demandMultiplier = 0.65 * 1.0 * 1.0 = 0.65
// expectedDailySales = 250 * 0.65 = 162.5
// → 주말 오피스 상권은 평일 대비 35% 감소
```

---

## 기본값 (shared/constants.js)

### dayTypeMultipliers (요일/휴일 보정 배수)

```js
{
  office: {
    weekday: 1.00,
    weekend: 0.65,
    holiday: 0.60,
    seollal: 0.45,
    chuseok: 0.45
  },
  residential: {
    weekday: 1.00,
    weekend: 1.20,
    holiday: 1.15,
    seollal: 0.95,
    chuseok: 0.95
  },
  // ... 기타 상권 타입
}
```

### timeProfiles (시간대 분포 프로필)

```js
{
  takeout_franchise: {
    morning: 0.28,    // 오픈~11시
    lunch: 0.32,      // 11~14시
    afternoon: 0.22,  // 14~17시
    evening: 0.12,    // 17~21시
    night: 0.05,      // 21~24시
    dawn: 0.01        // 0시~오픈
  },
  stay_dessert: {
    morning: 0.20,
    lunch: 0.25,
    afternoon: 0.30,
    evening: 0.18,
    night: 0.06,
    dawn: 0.01
  }
}
```

### footTrafficIndexClamp (유동인구 보정 범위)

```js
{
  min: 0.6,  // 최소 60% (40% 감소)
  max: 1.6   // 최대 160% (60% 증가)
}
```

---

## 다음 단계 (인력 산정 모듈)

시간대 분포(`timeProfile`)는 다음 단계에서 사용됩니다:

1. **직원 산정 (피크 동시 근무 인원)**
   - `timeProfiles[timeProfileKey]`에서 가장 높은 구간의 시간당 비중을 피크로 잡음
   - 예: `lunch: 0.32` (3시간 구간) → `peakOrdersPerHour = ordersForStaffing * (0.32 / 3)`

2. **리포트 설명 카드**
   - "점심(11~14) 비중이 32%로 집중 → 피크 대응 인력 필요"
   - "오피스 상권 + 주말 배수 0.65 → 주말 매출 하락 가능"

---

## 참고

- **Fallback 규칙**: demandMultiplier는 fallback 이후에만 적용됩니다.
  1. `adjustedExpectedDailySales` (브랜드 데이터 기반)
  2. `market.expectedDailySales`
  3. `brand.defaults.expectedDailySales`
  4. `targetDailySales` (최후 fallback)
  5. **→ demandMultiplier 적용**

- **Backward Compatibility**: 기존 코드는 `demandMultiplier` 없이도 정상 동작합니다 (기본값 1.0).
