# 컨설턴트 버전 리포트 마이그레이션 계획

## 개요

현재 시스템의 "잔 수" 기반 리포트를 "1일 방문객 수 + 1인당 평균 구매비용" 기반의 컨설턴트 버전으로 전환합니다.

---

## 현재 구조 vs 목표 구조

### 현재 구조
- **입력**: `targetDailySales` (목표 일 판매량, 잔/일)
- **매출 공식**: `월 매출 = targetDailySales × avgPrice × 30`
- **표시**: "300잔/일", "손익분기점 200잔/일"

### 목표 구조
- **입력**: `dailyVisitors` (1일 방문객 수, 명/일) + `avgSpendPerPerson` (1인당 평균 구매비용, 원)
- **매출 공식**: `일 매출 = dailyVisitors × avgSpendPerPerson`<br>`월 매출 = 일 매출 × 30.4`
- **표시**: "300명/일", "손절 기준 180명/일"

---

## 변경 범위

### 1. 데이터 모델 변경

#### 1.1 브랜드 스키마 확장
```javascript
// 기존
{
  defaults: {
    avgPrice: 3500,  // 원/잔
    ...
  }
}

// 변경 후
{
  defaults: {
    avgPrice: 3500,  // 하위 호환성 유지
    avgSpendPerPerson: 3500,  // 1인당 평균 구매비용 (원) - 새로 추가
    purchasePattern: "high_turnover",  // "high_turnover" | "high_spend" | "mixed" - 새로 추가
    defaultDailyVisitors: {  // 새로 추가
      conservative: 180,
      expected: 230,
      optimistic: 280
    }
  }
}
```

#### 1.2 분석 요청 구조 변경
```javascript
// 기존
{
  targetDailySales: 300  // 잔/일
}

// 변경 후
{
  dailyVisitors: 300,  // 명/일 (새로 추가)
  avgSpendPerPerson: 3500,  // 원 (새로 추가, 브랜드 기본값 사용 가능)
  // 하위 호환성: targetDailySales도 유지 (자동 변환)
}
```

### 2. Finance Engine 변경

#### 2.1 매출 계산 로직 변경
**파일**: `engine/finance/calculator.js`

```javascript
// 기존
const monthlyRevenue = targetDailySales * avgPrice * 30;

// 변경 후
const dailyRevenue = dailyVisitors * avgSpendPerPerson;
const monthlyRevenue = dailyRevenue * 30.4;  // 30.4일 = 평균 월 일수
```

#### 2.2 손익분기점 계산 변경
```javascript
// 기존
const breakEvenDailySales = totalCosts / (avgPrice * 30);

// 변경 후
const breakEvenDailyVisitors = totalCosts / (avgSpendPerPerson * 30.4);
```

#### 2.3 손절 기준선 계산 추가 (새로 추가)
```javascript
// 손절 기준 방문객 수
const breakdownVisitors = 
  monthlyFixedCost / 
  (avgSpendPerPerson * 30.4 * (1 - variableCostRate));

// 적자 지속 시 생존 개월 수
const monthlyLoss = Math.abs(monthlyProfit);
const survivalMonthsOnLoss = 
  availableCashAfterExit / monthlyLoss;
```

### 3. Decision Engine 변경

#### 3.1 리스크 카드 업데이트
- "방문객 의존 구조" 리스크 추가
- "고정비 과다" 리스크 강화

### 4. AI Consulting 변경

#### 4.1 프롬프트 업데이트
**파일**: `ai/consulting/prompts.js`

- "잔 수" 개념 완전 제거
- "방문객 수" 기반 설명으로 변경
- 소비 구조 해석 추가 (객단가형/회전형/혼합형)

### 5. 리포트 구조 재구성

#### 5.1 새로운 리포트 목차
1. **Executive Summary** (1페이지 요약)
   - 결론 카드 (진행/조건부/비추천)
   - 핵심 코멘트

2. **창업 조건 요약** (입력값 스냅샷)
   - 1일 방문객 수 (기준값 & 사용자 입력값)
   - 1인당 평균 구매비용

3. **매출 구조 해석**
   - 매출 공식
   - 브랜드별 소비 구조 해석

4. **손익 시뮬레이션 결과**
   - 민감도: 방문객 수 ±10%, 구매비용 ±5%

5. **구조적 리스크 진단**
   - Top 3 리스크
   - AI 해석

6. **손절 & 폐업 판단 리포트** (핵심 차별 구간)
   - 손절 기준선
   - 적자 지속 시 생존 개월 수
   - 폐업 시 회수 구조

7. **조건 변경 시 개선 시뮬레이션**

8. **최종 컨설턴트 결론**

---

## 구현 단계

### Phase 1: 데이터 모델 확장 (하위 호환성 유지)
1. 브랜드 스키마에 `avgSpendPerPerson`, `purchasePattern`, `defaultDailyVisitors` 추가
2. 분석 요청에 `dailyVisitors`, `avgSpendPerPerson` 필드 추가 (선택적)
3. 기존 `targetDailySales`는 유지하되, 자동 변환 로직 추가

### Phase 2: Finance Engine 업데이트
1. 매출 계산 로직 변경
2. 손익분기점 계산 변경
3. 손절 기준선 계산 추가
4. 민감도 분석 업데이트 (방문객 수 ±10%, 구매비용 ±5%)

### Phase 3: 리포트 렌더링 업데이트
1. 리포트 HTML 구조 재구성
2. 리포트 스크립트 업데이트
3. 대시보드 업데이트 (선택적)

### Phase 4: AI Consulting 업데이트
1. 프롬프트에서 "잔 수" 제거
2. 방문객 수 기반 설명으로 변경
3. 소비 구조 해석 추가

---

## 하위 호환성 전략

### 1. 자동 변환 로직
```javascript
// 기존 targetDailySales가 있으면 자동 변환
if (input.targetDailySales && !input.dailyVisitors) {
  input.dailyVisitors = input.targetDailySales;
  input.avgSpendPerPerson = brand.defaults.avgSpendPerPerson || brand.defaults.avgPrice;
}
```

### 2. 이중 표시 (전환 기간)
- 리포트에서 "방문객 수"와 "잔 수"를 함께 표시 (전환 기간 동안)
- 이후 "잔 수" 완전 제거

---

## 주의사항

1. **30 vs 30.4**: 월 일수를 30.4일로 변경 (더 정확한 계산)
2. **변동비율 계산**: `variableCostRate = cogsRate + royaltyRate + marketingRate + utilitiesRate`
3. **손절 기준선**: 고정비만으로 계산 (변동비 최소값 포함)
4. **폐업 비용**: Exit Plan 로직 활용

---

## 다음 단계

이 계획을 바탕으로 단계별 구현을 진행하겠습니다. 먼저 Phase 1부터 시작할까요?
