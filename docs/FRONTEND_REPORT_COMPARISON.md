# 프론트엔드 리포트 비교 분석

**생성일**: 2025-01-15  
**목적**: 리포트 내용과 프론트엔드 구현 비교

---

## 📋 비교 결과 요약

### ✅ 프론트엔드에 잘 표시되는 항목

1. **Executive Summary** ✅
   - Score, Signal, Label, Summary
   - Survival Months, Payback Months
   - Monthly Profit, Break Even Daily Sales

2. **Finance** ✅
   - Monthly Revenue, Monthly Costs
   - Monthly Profit, Payback Months
   - Sensitivity Analysis

3. **Risk Cards** ✅
   - Engine + AI 병합된 리스크 카드
   - Dashboard와 Report 모두 표시

4. **Improvement Cards** ✅
   - Engine + AI 병합된 개선 카드
   - Dashboard와 Report 모두 표시

5. **Market Analysis** ✅
   - 경쟁 카페 현황
   - 유동인구 정보
   - 상권 점수

6. **Roadview Analysis** ✅
   - 리스크 항목 4개
   - 종합 리스크 평가
   - 메타데이터 (강점/약점)

7. **Gap Analysis** ✅
   - Target vs Expected Daily Sales
   - Gap Percentage

---

## ⚠️ 리포트에 있지만 프론트엔드에 표시되지 않는 항목

### 1. 실패 트리거 (Failure Triggers) 상세 정보

**리포트에 포함**:
- 트리거 1: 매출 -10% 시 적자 전환
- 트리거 2: 월세 상승 시 수익성 악화
- 각 트리거의 영향도, 예상 실패 시점, 총손실, Exit 비용

**프론트엔드 상태**:
- ❌ Dashboard: 표시 안 됨
- ❌ Report: 표시 안 됨
- ⚠️ `failureTriggers` 데이터는 reportModel에 있지만 렌더링 로직 없음

**권장 사항**: Dashboard와 Report에 실패 트리거 섹션 추가

---

### 2. Exit Plan 상세 정보

**리포트에 포함**:
- 손절 타이밍 설계 (경고 구간, 최적 손절, 손실 폭증)
- 폐업 비용 상세 (위약금, 철거/원복, 인테리어 손실, 권리금 회수)

**프론트엔드 상태**:
- ❌ Dashboard: 표시 안 됨
- ❌ Report: 표시 안 됨
- ⚠️ `exitPlan` 데이터는 reportModel에 있지만 렌더링 로직 없음

**권장 사항**: Dashboard와 Report에 Exit Plan 섹션 추가

---

### 3. 판정 신뢰도 (Decision Confidence)

**리포트에 포함**:
- 데이터 커버리지 (HIGH/MEDIUM/LOW)
- 가정 리스크 (HIGH/MEDIUM/LOW)
- 판정 안정성 (HIGH/MEDIUM/LOW)

**프론트엔드 상태**:
- ❌ Dashboard: 표시 안 됨
- ❌ Report: 표시 안 됨
- ⚠️ `executive.confidence` 데이터는 있지만 상세 정보 없음

**권장 사항**: 신뢰도 정보를 Dashboard와 Report에 추가

---

### 4. 점수 Breakdown 상세

**리포트에 포함**:
- 회수 기간: 80점
- 수익성: 85점
- GAP: 65점
- 민감도: 75점
- 고정비: 90점
- DSCR: 85점
- 상권: 68점
- 로드뷰: 65점

**프론트엔드 상태**:
- ⚠️ Dashboard: breakdown 데이터는 있지만 표시 안 됨
- ⚠️ Report: breakdown 데이터는 있지만 표시 안 됨
- ✅ `breakdown` 데이터는 reportModel에 있음

**권장 사항**: Dashboard와 Report에 Breakdown 차트/테이블 추가

---

### 5. 개선 시뮬레이션 상세

**리포트에 포함**:
- 시뮬레이션 1: 임대료 -10%
- 시뮬레이션 2: 목표 판매량 -10%
- 시뮬레이션 3: 목표 판매량 +10%
- 각 시뮬레이션의 결과 (생존 기간, 신호등 변화, 임계값 교차)

**프론트엔드 상태**:
- ✅ Dashboard: "시뮬레이션 비교" 탭에 Before/After 비교 있음
- ⚠️ Report: 시뮬레이션 상세 정보 없음
- ⚠️ `improvement.cards`는 있지만 시뮬레이션 결과는 별도로 표시 안 됨

**권장 사항**: Report에 개선 시뮬레이션 섹션 추가

---

## ✅ 프론트엔드에 있지만 리포트에 없는 항목

### 1. Competitive Analysis 상세

**프론트엔드에 표시**:
- 경쟁 강도 (high/medium/low)
- 차별화 가능성
- 권장 가격 전략

**리포트 상태**:
- ⚠️ 리포트에 "경쟁 환경 요약" 섹션은 있지만 상세 정보 없음

**권장 사항**: 리포트에 Competitive Analysis 상세 정보 추가

---

## 📊 데이터 구조 비교

### reportModel 구조

```javascript
{
  executive: {
    signal, label, summary, score,
    survivalMonths, paybackMonths,
    monthlyProfit, breakEvenDailySales,
    confidence
  },
  finance: { ... },
  gap: { ... },
  scenario: { ... },
  breakdown: { ... },  // ⚠️ 프론트엔드에서 사용 안 됨
  risk: { cards: [...] },
  improvement: { cards: [...] },
  exitPlan: { ... },  // ⚠️ 프론트엔드에서 사용 안 됨
  failureTriggers: [...],  // ⚠️ 프론트엔드에서 사용 안 됨
  competitive: { ... },
  market: { ... },
  roadview: { ... }
}
```

---

## 🔧 개선 작업 리스트

### 우선순위 1: 필수 표시 항목 추가

1. **실패 트리거 섹션 추가**
   - Dashboard: "AI 상세분석" 탭에 추가
   - Report: PAGE 4에 추가
   - 파일: `frontend/dashboard/script.js`, `frontend/report/script.js`

2. **Exit Plan 섹션 추가**
   - Dashboard: "시뮬레이션 비교" 탭에 추가
   - Report: PAGE 4에 추가
   - 파일: `frontend/dashboard/script.js`, `frontend/report/script.js`

3. **Breakdown 차트 추가**
   - Dashboard: "요약" 탭에 추가
   - Report: PAGE 2에 추가
   - 파일: `frontend/dashboard/script.js`, `frontend/report/script.js`

### 우선순위 2: 개선 사항

4. **판정 신뢰도 표시**
   - Dashboard: "요약" 탭에 추가
   - Report: PAGE 1에 추가

5. **개선 시뮬레이션 상세**
   - Report: PAGE 4에 추가

---

## 📝 리포트 데이터 매핑

### 리포트 섹션 → reportModel 필드

| 리포트 섹션 | reportModel 필드 | 프론트엔드 표시 |
|------------|-----------------|----------------|
| 1. Executive Summary | `executive` | ✅ 표시됨 |
| 2. 핵심 지표 | `executive` | ✅ 표시됨 |
| 3. 손익 분석 | `finance` | ✅ 표시됨 |
| 4. 하드컷 판정 | `executive.nonNegotiable` | ⚠️ 부분 표시 |
| 5. 실패 트리거 | `failureTriggers` | ❌ 표시 안 됨 |
| 6. 주요 리스크 | `risk.cards` | ✅ 표시됨 |
| 7. 개선 시뮬레이션 | `improvement.cards` | ⚠️ 부분 표시 |
| 8. 손절 타이밍 | `exitPlan` | ❌ 표시 안 됨 |
| 9. 폐업 비용 | `exitPlan` | ❌ 표시 안 됨 |
| 10. 입지-상권분석 | `roadview`, `market` | ✅ 표시됨 |
| 11. 판정 신뢰도 | `executive.confidence` | ❌ 표시 안 됨 |
| 12. 점수 Breakdown | `breakdown` | ❌ 표시 안 됨 |

---

## ✅ 체크리스트

### 프론트엔드 표시 확인

- [x] Executive Summary
- [x] Finance Analysis
- [x] Risk Cards
- [x] Improvement Cards
- [x] Market Analysis
- [x] Roadview Analysis
- [x] Gap Analysis
- [ ] Failure Triggers
- [ ] Exit Plan
- [ ] Breakdown
- [ ] Decision Confidence
- [ ] Improvement Simulations (상세)

---

## 🎯 결론

### 잘 표시되는 항목
- 핵심 지표 (Score, Signal, Summary)
- 손익 분석 (Finance)
- 리스크 및 개선 카드
- 입지-상권분석

### 누락된 항목
- 실패 트리거 상세
- Exit Plan (손절 타이밍, 폐업 비용)
- 점수 Breakdown
- 판정 신뢰도

### 권장 사항
1. 실패 트리거 섹션 추가 (우선순위 높음)
2. Exit Plan 섹션 추가 (우선순위 높음)
3. Breakdown 차트 추가 (우선순위 중간)
4. 판정 신뢰도 표시 (우선순위 낮음)

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-15
