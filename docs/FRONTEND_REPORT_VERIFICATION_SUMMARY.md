# 프론트엔드 리포트 검증 요약

**생성일**: 2025-01-15  
**목적**: 리포트 내용이 프론트엔드에서 잘 표시되는지 검증

---

## ✅ 잘 표시되는 항목

### 1. Executive Summary ✅
- **리포트 섹션**: 1. EXECUTIVE SUMMARY, 2. 핵심 지표
- **프론트엔드 표시**: ✅ Dashboard 요약 탭, Report PAGE 1
- **데이터 매핑**: `reportModel.executive`
- **표시 항목**:
  - Score (종합 점수)
  - Signal (신호등)
  - Label (판정 라벨)
  - Summary (판정 요약)
  - Survival Months (예상 생존 기간)
  - Payback Months (투자 회수 기간)
  - Monthly Profit (월 순이익)
  - Break Even Daily Sales (손익분기 판매량)

### 2. Finance Analysis ✅
- **리포트 섹션**: 3. 손익 분석
- **프론트엔드 표시**: ✅ Dashboard 요약 탭, Report PAGE 2
- **데이터 매핑**: `reportModel.finance`
- **표시 항목**:
  - Monthly Revenue (월 매출)
  - Monthly Costs (월 비용)
  - Monthly Profit (월 순이익)
  - Payback Months (회수 기간)
  - Sensitivity Analysis (민감도 분석)
  - Cost Stack Chart (비용 구조 차트)

### 3. Risk Cards ✅
- **리포트 섹션**: 6. 주요 리스크
- **프론트엔드 표시**: ✅ Dashboard AI 상세분석 탭, Report PAGE 4
- **데이터 매핑**: `reportModel.risk.cards` (Engine + AI 병합)
- **표시 항목**:
  - Risk Title
  - Risk Description
  - Impact Level

### 4. Improvement Cards ✅
- **리포트 섹션**: 7. 개선 시뮬레이션
- **프론트엔드 표시**: ✅ Dashboard AI 상세분석 탭, Report PAGE 4
- **데이터 매핑**: `reportModel.improvement.cards` (Engine + AI 병합)
- **표시 항목**:
  - Improvement Title
  - Improvement Description
  - Expected Impact

### 5. Market Analysis ✅
- **리포트 섹션**: 10. 입지-상권 분석 (상권 분석)
- **프론트엔드 표시**: ✅ Dashboard 입지-상권분석 탭, Report PAGE 3
- **데이터 매핑**: `reportModel.market`
- **표시 항목**:
  - 경쟁 카페 현황 (총 개수, 동일 브랜드, 타 브랜드)
  - 경쟁 밀도
  - 유동인구 정보 (평일/주말, 피크 시간대)
  - 상권 종합 점수

### 6. Roadview Analysis ✅
- **리포트 섹션**: 10. 입지-상권 분석 (입지 분석)
- **프론트엔드 표시**: ✅ Dashboard 입지-상권분석 탭, Report PAGE 3
- **데이터 매핑**: `reportModel.roadview`
- **표시 항목**:
  - 리스크 항목 4개 (간판 가시성, 경사도, 층위, 보행 가시성)
  - 종합 리스크 평가 (overallRisk, riskScore)
  - 메타데이터 (강점/약점)

### 7. Gap Analysis ✅
- **리포트 섹션**: 3. 손익 분석 (목표 vs 기대치 분석)
- **프론트엔드 표시**: ✅ Dashboard (일부), Report (일부)
- **데이터 매핑**: `reportModel.gap`
- **표시 항목**:
  - Target Daily Sales
  - Expected Daily Sales
  - Gap Percentage

### 8. Competitive Analysis ✅
- **리포트 섹션**: (간접적으로 언급)
- **프론트엔드 표시**: ✅ Dashboard AI 상세분석 탭, Report PAGE 4
- **데이터 매핑**: `reportModel.competitive`
- **표시 항목**:
  - 경쟁 강도
  - 차별화 가능성
  - 권장 가격 전략

---

## ❌ 리포트에 있지만 프론트엔드에 표시되지 않는 항목

### 1. 실패 트리거 (Failure Triggers) ❌

**리포트 섹션**: 5. 실패 트리거

**포함된 정보**:
- 트리거 1: 매출 -10% 시 적자 전환
  - 영향도: CRITICAL
  - 예상 실패 시점: 18~24개월
  - 그때 총손실: 6,500만원
  - 그때 Exit 비용: 5,200만원
- 트리거 2: 월세 상승 시 수익성 악화
  - 영향도: HIGH
  - 예상 실패 시점: 24~30개월
  - 그때 총손실: 5,800만원

**데이터 상태**:
- ✅ `reportModel.failureTriggers` 배열 존재
- ❌ Dashboard: 렌더링 로직 없음
- ❌ Report: 렌더링 로직 없음

**권장 구현**:
- Dashboard: "AI 상세분석" 탭에 "실패 트리거" 섹션 추가
- Report: PAGE 4에 "실패 트리거" 섹션 추가

---

### 2. Exit Plan (손절 타이밍 및 폐업 비용) ❌

**리포트 섹션**: 8. 손절 타이밍 설계, 9. 폐업 비용 상세

**포함된 정보**:
- 손절 타이밍:
  - 경고 구간: 24개월 (총손실 5,800만원)
  - 최적 손절: 32개월 (총손실 5,200만원)
  - 손실 폭증: 36개월 (총손실 6,200만원)
- 폐업 비용:
  - 가맹 위약금: 0만원
  - 철거/원상복구: 2,500만원
  - 인테리어/설비 손실: 5,300만원
  - 권리금 회수: -2,600만원
  - Exit Cost 합계: 5,200만원

**데이터 상태**:
- ✅ `reportModel.exitPlan` 객체 존재
- ❌ Dashboard: 렌더링 로직 없음
- ❌ Report: 렌더링 로직 없음

**권장 구현**:
- Dashboard: "시뮬레이션 비교" 탭에 "손절 타이밍" 섹션 추가
- Report: PAGE 4에 "Exit Plan" 섹션 추가

---

### 3. 점수 Breakdown ❌

**리포트 섹션**: 12. 점수 Breakdown

**포함된 정보**:
- 회수 기간: 80점
- 수익성: 85점
- GAP: 65점
- 민감도: 75점
- 고정비: 90점
- DSCR: 85점
- 상권: 68점
- 로드뷰: 65점

**데이터 상태**:
- ✅ `reportModel.breakdown` 객체 존재
- ❌ Dashboard: 렌더링 로직 없음
- ❌ Report: 렌더링 로직 없음

**권장 구현**:
- Dashboard: "요약" 탭에 "점수 Breakdown" 차트 추가
- Report: PAGE 2에 "점수 Breakdown" 테이블 추가

---

### 4. 판정 신뢰도 (Decision Confidence) ❌

**리포트 섹션**: 11. 판정 신뢰도

**포함된 정보**:
- 데이터 커버리지: HIGH
- 가정 리스크: MEDIUM
- 판정 안정성: MEDIUM

**데이터 상태**:
- ⚠️ `reportModel.executive.confidence` 존재 (단순 값일 수 있음)
- ❌ Dashboard: 렌더링 로직 없음
- ❌ Report: 렌더링 로직 없음

**권장 구현**:
- Dashboard: "요약" 탭에 신뢰도 배지 추가
- Report: PAGE 1에 신뢰도 정보 추가

---

### 5. 개선 시뮬레이션 상세 ❌

**리포트 섹션**: 7. 개선 시뮬레이션

**포함된 정보**:
- 시뮬레이션 1: 임대료 -10%
  - 월 순이익 변화
  - 생존 기간 변화
  - 신호등 변화
  - 임계값 교차 여부
- 시뮬레이션 2: 목표 판매량 -10%
  - 월 매출 변화
  - 월 순이익 변화
  - 생존 기간 변화
  - 신호등 변화 (YELLOW → GREEN)
  - 최적 손절 총손실 절감
- 시뮬레이션 3: 목표 판매량 +10%
  - 월 매출 변화
  - 월 순이익 변화
  - 생존 기간 변화

**데이터 상태**:
- ✅ `reportModel.improvement.cards` 존재 (Engine 시뮬레이션)
- ⚠️ Dashboard: "시뮬레이션 비교" 탭에 Before/After만 있음
- ❌ Report: 시뮬레이션 상세 정보 없음

**권장 구현**:
- Dashboard: "시뮬레이션 비교" 탭에 개선 시뮬레이션 상세 추가
- Report: PAGE 4에 개선 시뮬레이션 섹션 추가

---

## ⚠️ 부분적으로 표시되는 항목

### 1. 하드컷 판정 근거 ⚠️

**리포트 섹션**: 4. 하드컷 판정 근거

**프론트엔드 상태**:
- ✅ Dashboard: "하드컷 경고" 표시 (Hardcut Warnings)
- ❌ Report: 하드컷 판정 근거 섹션 없음

**개선 사항**:
- Report에 하드컷 판정 근거 섹션 추가

---

## 📊 리포트 데이터 매핑 테이블

| 리포트 섹션 | reportModel 필드 | Dashboard | Report | PDF |
|------------|-----------------|-----------|--------|-----|
| 1. Executive Summary | `executive` | ✅ | ✅ | ✅ |
| 2. 핵심 지표 | `executive` | ✅ | ✅ | ✅ |
| 3. 손익 분석 | `finance` | ✅ | ✅ | ✅ |
| 4. 하드컷 판정 | `executive.nonNegotiable` | ⚠️ | ❌ | ❌ |
| 5. 실패 트리거 | `failureTriggers` | ❌ | ❌ | ❌ |
| 6. 주요 리스크 | `risk.cards` | ✅ | ✅ | ✅ |
| 7. 개선 시뮬레이션 | `improvement.cards` | ⚠️ | ⚠️ | ⚠️ |
| 8. 손절 타이밍 | `exitPlan` | ❌ | ❌ | ❌ |
| 9. 폐업 비용 | `exitPlan` | ❌ | ❌ | ❌ |
| 10. 입지-상권분석 | `roadview`, `market` | ✅ | ✅ | ✅ |
| 11. 판정 신뢰도 | `executive.confidence` | ❌ | ❌ | ❌ |
| 12. 점수 Breakdown | `breakdown` | ❌ | ❌ | ❌ |

---

## 🔧 개선 작업 우선순위

### 🔴 P0 (필수) - 리포트 핵심 정보

1. **실패 트리거 섹션 추가**
   - Dashboard: "AI 상세분석" 탭
   - Report: PAGE 4
   - 예상 소요: 2시간

2. **Exit Plan 섹션 추가**
   - Dashboard: "시뮬레이션 비교" 탭
   - Report: PAGE 4
   - 예상 소요: 2시간

### 🟡 P1 (권장) - 리포트 보완 정보

3. **Breakdown 차트 추가**
   - Dashboard: "요약" 탭
   - Report: PAGE 2
   - 예상 소요: 1.5시간

4. **판정 신뢰도 표시**
   - Dashboard: "요약" 탭
   - Report: PAGE 1
   - 예상 소요: 30분

### 🟢 P2 (선택) - 리포트 개선

5. **개선 시뮬레이션 상세**
   - Dashboard: "시뮬레이션 비교" 탭
   - Report: PAGE 4
   - 예상 소요: 1시간

---

## ✅ 최종 체크리스트

### 데이터 확인
- [x] `reportModel.failureTriggers` 존재
- [x] `reportModel.exitPlan` 존재
- [x] `reportModel.breakdown` 존재
- [x] `reportModel.executive.confidence` 존재

### 프론트엔드 구현
- [x] Executive Summary 표시
- [x] Finance Analysis 표시
- [x] Risk Cards 표시
- [x] Improvement Cards 표시
- [x] Market Analysis 표시
- [x] Roadview Analysis 표시
- [x] Gap Analysis 표시
- [x] Competitive Analysis 표시
- [ ] Failure Triggers 표시 ❌
- [ ] Exit Plan 표시 ❌
- [ ] Breakdown 표시 ❌
- [ ] Decision Confidence 표시 ❌

---

## 📝 결론

### 잘 표시되는 항목 (8개)
1. Executive Summary ✅
2. Finance Analysis ✅
3. Risk Cards ✅
4. Improvement Cards ✅
5. Market Analysis ✅
6. Roadview Analysis ✅
7. Gap Analysis ✅
8. Competitive Analysis ✅

### 누락된 항목 (4개)
1. Failure Triggers ❌
2. Exit Plan ❌
3. Breakdown ❌
4. Decision Confidence ❌

### 권장 사항
1. **우선순위 높음**: Failure Triggers, Exit Plan 추가 (리포트 핵심 정보)
2. **우선순위 중간**: Breakdown 차트 추가
3. **우선순위 낮음**: Decision Confidence 표시

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-15
