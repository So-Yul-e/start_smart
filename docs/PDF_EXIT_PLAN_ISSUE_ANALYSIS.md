# PDF 리포트 "5. 손절 폐업 판단 리포트" 섹션 미표시 원인 분석

## 문제 요약

PDF 리포트에서 "5. 손절 폐업 판단 리포트" 섹션의 다음 항목들이 표시되지 않음:
- 5.1 손절 기준선 (Break-Down Line)
- 5.2 적자 지속 시 생존 개월 수
- 5.3 폐업 시 회수 구조

---

## 1) 안 나오는 이유

### 1.1 손절 기준선 (5.1) - `breakdownVisitors` 누락

**문제:**
- `reportModel.finance`에 `breakdownVisitors` 필드가 포함되지 않음
- PDF 생성 코드에서 `finance?.breakdownVisitors`를 찾지 못함

**원인:**
- `shared/reportModel.js`의 `finance` 객체에 `breakdownVisitors` 필드가 누락됨
- 엔진에서는 `engine/finance/calculator.js`에서 계산하지만, reportModel로 전달되지 않음

**해결:**
- ✅ `shared/reportModel.js`에 `breakdownVisitors` 필드 추가
- ✅ 리포트 화면 및 PDF 생성 코드에서 `result.finance.breakdownVisitors`로 fallback 처리

---

### 1.2 적자 지속 시 생존 개월 수 (5.2) - 데이터 접근 문제

**문제:**
- `finance.monthlyProfit`가 `reportModel.finance`에서 null일 수 있음
- `exitPlan.exitCostBreakdown` 접근 시 구조 불일치

**원인:**
- `reportModel.finance.monthlyProfit`가 `toMoney()` 함수로 변환되면서 null이 될 수 있음
- `exitPlan` 구조가 `exitTiming`/`exitScenario`로 중첩되어 있는데, PDF 코드에서 평탄화된 구조로 접근

**해결:**
- ✅ `result.finance.monthlyProfit`로 fallback 처리
- ✅ `exitPlan.exitScenario.breakdown` 또는 `exitPlan.exitCostBreakdown` 모두 지원하도록 수정

---

### 1.3 폐업 시 회수 구조 (5.3) - Exit Plan 구조 불일치

**문제:**
- PDF 생성 코드에서 `exitPlan.optimalExitMonth`, `exitPlan.warningMonth`를 직접 접근
- 실제 구조는 `exitPlan.exitTiming.optimalExitMonth`, `exitPlan.exitTiming.warningMonth`

**원인:**
- 엔진에서 반환하는 exitPlan 구조:
  ```js
  {
    exitTiming: {
      optimalExitMonth,
      warningMonth,
      optimalExitTotalLoss,
      totalLossSeries
    },
    exitScenario: {
      breakdown: {
        penaltyCost,
        demolitionCost,
        ...
      }
    }
  }
  ```
- PDF 코드는 평탄화된 구조를 기대:
  ```js
  {
    optimalExitMonth,
    warningMonth,
    exitCostBreakdown: { ... }
  }
  ```

**해결:**
- ✅ PDF 생성 코드에서 exitPlan 구조를 리포트 화면과 동일하게 처리
- ✅ `exitTiming`/`exitScenario` 구조와 평탄화된 구조 모두 지원

---

## 2) 필요한 추가 데이터

### 2.1 reportModel.finance에 추가된 필드

```js
finance: {
  // 기존 필드들...
  breakdownVisitors: toNum(finance?.breakdownVisitors), // 손절 기준선
  breakEvenDailyVisitors: toNum(finance?.breakEvenDailyVisitors), // 손익분기 방문객 수
  operatingProfit: toMoney(finance?.operatingProfit), // 영업 이익 (대출 상환 전)
}
```

### 2.2 Exit Plan 데이터 구조

**엔진에서 계산되는 구조:**
```js
{
  exitTiming: {
    warningMonth: Number,
    optimalExitMonth: Number,
    trapZoneStartMonth: Number,
    optimalExitTotalLoss: Number,
    keepGoingDeltaLoss_6m: Number,
    totalLossSeries: Array // 36개월 손실 시리즈
  },
  exitScenario: {
    assumedExitMonth: Number,
    breakdown: {
      penaltyCost: Number,
      demolitionCost: Number,
      interiorLoss: Number,
      goodwillRecovered: Number,
      exitCostTotal: Number
    },
    operatingLossUntilExit: Number,
    finalTotalLoss: Number
  }
}
```

**PDF에서 필요한 데이터:**
- `optimalExitMonth`: 최적 손절 시점
- `warningMonth`: 경고 시점
- `lossExplosionMonth` (또는 `trapZoneStartMonth`): 손실 폭증 시점
- `totalLossAtOptimal`: 최적 손절 시 총손실
- `totalLossAtWarning`: 경고 시점 총손실
- `totalLossAtExplosion`: 손실 폭증 시점 총손실
- `exitCostBreakdown`: 폐업 비용 상세

---

## 수정 완료 사항

### ✅ 1. reportModel에 breakdownVisitors 추가
- `shared/reportModel.js`에 `breakdownVisitors`, `breakEvenDailyVisitors`, `operatingProfit` 필드 추가

### ✅ 2. 리포트 화면 fallback 처리
- `finance.debt`, `finance.breakdownVisitors` 등이 없을 때 `result.finance`로 fallback

### ✅ 3. PDF 생성 코드 Exit Plan 구조 처리
- `exitTiming`/`exitScenario` 구조와 평탄화된 구조 모두 지원
- `totalLossSeries`에서 경고/폭증 시점 손실 자동 계산

### ✅ 4. PDF 생성 코드 데이터 fallback
- `breakdownVisitors`, `monthlyProfit` 등이 없을 때 `result.finance`로 fallback

---

## 데이터 흐름 확인

```
엔진 계산
  ↓
finance.breakdownVisitors (calculator.js)
exitPlan.exitTiming / exitScenario (decision/index.js)
  ↓
reportModel 생성
  ↓
reportModel.finance.breakdownVisitors ✅ (추가됨)
reportModel.exitPlan ✅ (이미 포함됨)
  ↓
리포트 화면 / PDF 생성
  ↓
result.finance.breakdownVisitors (fallback) ✅
exitPlan 구조 처리 ✅
```

---

## 테스트 체크리스트

- [ ] 대출이 있는 경우 PDF에 대출 상환액 표시 확인
- [ ] breakdownVisitors가 PDF에 표시되는지 확인
- [ ] 적자 상태일 때 생존 개월 수가 PDF에 표시되는지 확인
- [ ] Exit Plan이 있는 경우 폐업 시 회수 구조가 PDF에 표시되는지 확인
- [ ] Exit Plan이 없는 경우에도 PDF가 정상 생성되는지 확인
