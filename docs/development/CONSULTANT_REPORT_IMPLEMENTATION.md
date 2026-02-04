# 컨설턴트 버전 리포트 구현 가이드

## 구현 전략

이 문서는 "잔 수" 기반 시스템을 "방문객 수 + 구매비용" 기반으로 전환하는 실제 구현 가이드를 제공합니다.

---

## 핵심 변경사항 요약

### 1. 매출 공식 변경
```javascript
// 기존
월 매출 = targetDailySales × avgPrice × 30

// 변경 후
일 매출 = dailyVisitors × avgSpendPerPerson
월 매출 = 일 매출 × 30.4
```

### 2. 손절 기준선 계산 (새로 추가)
```javascript
// 손절 기준 방문객 수
breakdownVisitors = 
  monthlyFixedCost / 
  (avgSpendPerPerson * 30.4 * (1 - variableCostRate))

// 적자 지속 시 생존 개월 수
monthlyLoss = Math.abs(monthlyProfit)
survivalMonthsOnLoss = availableCashAfterExit / monthlyLoss
```

### 3. 리포트 구조 재구성
- Executive Summary (1페이지 요약)
- 창업 조건 요약
- 매출 구조 해석
- 손익 시뮬레이션 결과
- 구조적 리스크 진단
- **손절 & 폐업 판단 리포트** (핵심 차별)
- 조건 변경 시 개선 시뮬레이션
- 최종 컨설턴트 결론

---

## 단계별 구현

### Step 1: Finance Engine 수정

**파일**: `engine/finance/calculator.js`

#### 1.1 함수 시그니처 변경
```javascript
// 기존
function calculateFinance({ brand, conditions, market, targetDailySales })

// 변경 후 (하위 호환성 유지)
function calculateFinance({ 
  brand, 
  conditions, 
  market, 
  targetDailySales,  // 하위 호환성 유지
  dailyVisitors,      // 새로 추가
  avgSpendPerPerson   // 새로 추가
})
```

#### 1.2 입력 변환 로직 추가
```javascript
// 하위 호환성: targetDailySales가 있으면 자동 변환
let dailyVisitors = input.dailyVisitors;
let avgSpendPerPerson = input.avgSpendPerPerson;

if (!dailyVisitors && targetDailySales) {
  dailyVisitors = targetDailySales;
  avgSpendPerPerson = brand.defaults.avgSpendPerPerson || brand.defaults.avgPrice;
}

if (!avgSpendPerPerson) {
  avgSpendPerPerson = brand.defaults.avgSpendPerPerson || brand.defaults.avgPrice;
}
```

#### 1.3 매출 계산 변경
```javascript
// 기존
const monthlyRevenue = targetDailySales * avgPrice * 30;

// 변경 후
const dailyRevenue = dailyVisitors * avgSpendPerPerson;
const monthlyRevenue = dailyRevenue * 30.4;  // 평균 월 일수
```

#### 1.4 손익분기점 계산 변경
```javascript
// 기존
const breakEvenDailySales = totalCosts / (avgPrice * 30);

// 변경 후
const breakEvenDailyVisitors = totalCosts / (avgSpendPerPerson * 30.4);
```

#### 1.5 손절 기준선 계산 추가
```javascript
// 변동비율 계산
const variableCostRate = cogsRate + royaltyRate + marketingRate + utilitiesRate;

// 손절 기준 방문객 수
const monthlyFixedCost = monthlyCosts.rent + monthlyCosts.labor + monthlyCosts.etc;
const breakdownVisitors = monthlyFixedCost / (avgSpendPerPerson * 30.4 * (1 - variableCostRate));

// 적자 지속 시 생존 개월 수 (Exit Plan 활용)
const monthlyLoss = monthlyProfit < 0 ? Math.abs(monthlyProfit) : 0;
let survivalMonthsOnLoss = null;
if (monthlyLoss > 0 && decision?.exitPlan) {
  const availableCash = conditions.initialInvestment - (decision.exitPlan.exitCostBreakdown?.totalLoss || 0);
  survivalMonthsOnLoss = availableCash / monthlyLoss;
}
```

### Step 2: Decision Engine 수정

**파일**: `engine/decision/index.js`

#### 2.1 손절 기준선을 failureTriggers에 추가
```javascript
// generateFailureTriggers 함수에 추가
if (breakdownVisitors && dailyVisitors < breakdownVisitors) {
  triggers.push({
    trigger: "손절 기준선 미달",
    triggerName: "방문객 수가 손절 기준선 미만",
    outcome: `현재 방문객 수(${dailyVisitors}명)가 손절 기준선(${Math.round(breakdownVisitors)}명)보다 낮아 구조적 위험`,
    impact: "critical",
    estimatedFailureWindow: "3개월 이내"
  });
}
```

### Step 3: 리포트 렌더링 업데이트

**파일**: `frontend/report/script.js`, `frontend/report/index.html`

#### 3.1 새로운 리포트 구조 적용
- Executive Summary 섹션 추가
- 손절 & 폐업 판단 리포트 섹션 추가
- 매출 구조 해석 섹션 추가

#### 3.2 "잔 수" 제거
- 모든 "잔/일", "잔 수" 텍스트를 "명/일", "방문객 수"로 변경
- `breakEvenDailySales` → `breakEvenDailyVisitors`로 표시

### Step 4: AI Consulting 프롬프트 업데이트

**파일**: `ai/consulting/prompts.js`

#### 4.1 프롬프트에서 "잔 수" 제거
- 모든 프롬프트에서 "잔 수", "잔/일" 개념 제거
- "방문객 수", "1인당 평균 구매비용"으로 변경
- 소비 구조 해석 추가 (객단가형/회전형/혼합형)

---

## 하위 호환성 유지

### 자동 변환 로직
```javascript
// orchestrator.js에서
if (analysisRequest.targetDailySales && !analysisRequest.dailyVisitors) {
  analysisRequest.dailyVisitors = analysisRequest.targetDailySales;
  analysisRequest.avgSpendPerPerson = brand.defaults.avgSpendPerPerson || brand.defaults.avgPrice;
}
```

### 이중 표시 (전환 기간)
- 리포트에서 "방문객 수"와 "잔 수"를 함께 표시 (선택적)
- 이후 "잔 수" 완전 제거

---

## 주의사항

1. **30 vs 30.4**: 월 일수를 30.4일로 변경 (더 정확한 계산)
2. **변동비율**: `variableCostRate = cogsRate + royaltyRate + marketingRate + utilitiesRate`
3. **손절 기준선**: 고정비만으로 계산 (변동비 최소값 포함)
4. **폐업 비용**: 기존 Exit Plan 로직 활용

---

## 테스트 체크리스트

- [ ] 기존 `targetDailySales` 입력이 정상 작동하는가?
- [ ] 새로운 `dailyVisitors` 입력이 정상 작동하는가?
- [ ] 매출 계산이 정확한가? (방문객 수 × 구매비용 × 30.4)
- [ ] 손절 기준선이 정확히 계산되는가?
- [ ] 리포트에 "잔 수"가 표시되지 않는가?
- [ ] AI 컨설팅이 "방문객 수" 기반으로 설명하는가?
