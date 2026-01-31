# 결과 리포트 추가 작업 확인

**생성일**: 2025-01-15  
**목적**: 결과 리포트에서 추가로 남은 작업 확인

---

## 📋 리포트 섹션 체크리스트

### ✅ 완료된 섹션 (웹 + PDF)

1. **EXECUTIVE SUMMARY** ✅
   - 웹: Dashboard, Report PAGE 1
   - PDF: Page 1

2. **핵심 지표** ✅
   - 웹: Dashboard, Report PAGE 1
   - PDF: Page 1, Page 2

3. **손익 분석** ✅
   - 웹: Dashboard, Report PAGE 2
   - PDF: Page 2

4. **주요 리스크** ✅
   - 웹: Dashboard, Report PAGE 4
   - PDF: Page 4

5. **개선 제안** ✅
   - 웹: Dashboard, Report PAGE 4
   - PDF: Page 4

6. **입지-상권 분석** ✅
   - 웹: Dashboard, Report PAGE 3
   - PDF: Page 3

7. **경쟁 환경** ✅
   - 웹: Dashboard, Report PAGE 4
   - PDF: Page 4

---

## ⚠️ 웹에는 있지만 PDF에 누락된 항목

### 1. 실패 트리거 (Failure Triggers) ❌

**웹 상태**: ✅ Dashboard, Report PAGE 4에 표시됨  
**PDF 상태**: ❌ PDF 생성 코드에 없음

**리포트 섹션**: 5. 실패 트리거

**포함 정보**:
- 트리거 1: 매출 -10% 시 적자 전환
- 트리거 2: 월세 상승 시 수익성 악화
- 각 트리거의 영향도, 예상 실패 시점, 총손실, Exit 비용

**작업 필요**: PDF 생성 함수에 실패 트리거 섹션 추가

---

### 2. Exit Plan (손절 타이밍 및 폐업 비용) ❌

**웹 상태**: ✅ Dashboard, Report PAGE 4에 표시됨  
**PDF 상태**: ❌ PDF 생성 코드에 없음

**리포트 섹션**: 8. 손절 타이밍 설계, 9. 폐업 비용 상세

**포함 정보**:
- 손절 타이밍 (경고 구간, 최적 손절, 손실 폭증)
- 폐업 비용 상세 (위약금, 철거/원복, 인테리어 손실, 권리금 회수)

**작업 필요**: PDF 생성 함수에 Exit Plan 섹션 추가

---

### 3. 점수 Breakdown ❌

**웹 상태**: ✅ Dashboard, Report PAGE 2에 표시됨  
**PDF 상태**: ❌ PDF 생성 코드에 없음

**리포트 섹션**: 12. 점수 Breakdown

**포함 정보**:
- 회수 기간, 수익성, GAP, 민감도, 고정비, DSCR, 상권, 로드뷰 점수

**작업 필요**: PDF 생성 함수에 Breakdown 테이블 추가

---

### 4. 판정 신뢰도 (Decision Confidence) ❌

**웹 상태**: ✅ Dashboard, Report PAGE 1에 표시됨  
**PDF 상태**: ❌ PDF 생성 코드에 없음

**리포트 섹션**: 11. 판정 신뢰도

**포함 정보**:
- 데이터 커버리지, 가정 리스크, 판정 안정성

**작업 필요**: PDF 생성 함수에 신뢰도 정보 추가

---

### 5. 하드컷 판정 근거 ⚠️

**웹 상태**: ⚠️ Dashboard에만 표시 (하드컷 경고)  
**PDF 상태**: ❌ PDF 생성 코드에 없음

**리포트 섹션**: 4. 하드컷 판정 근거

**포함 정보**:
- 하드컷 판정 근거 (있는 경우)

**작업 필요**: PDF 생성 함수에 하드컷 판정 근거 섹션 추가

---

### 6. 개선 시뮬레이션 상세 ⚠️

**웹 상태**: ⚠️ Dashboard에 Before/After만 있음  
**PDF 상태**: ❌ PDF 생성 코드에 없음

**리포트 섹션**: 7. 개선 시뮬레이션

**포함 정보**:
- 시뮬레이션 1: 임대료 -10%
- 시뮬레이션 2: 목표 판매량 -10%
- 시뮬레이션 3: 목표 판매량 +10%
- 각 시뮬레이션의 상세 결과 (생존 기간, 신호등 변화, 임계값 교차)

**작업 필요**: 
- 웹: 개선 시뮬레이션 상세 정보 추가
- PDF: 개선 시뮬레이션 섹션 추가

---

## 📊 작업 우선순위

### 🔴 P0 (필수) - PDF 누락 항목

1. **PDF에 실패 트리거 추가**
   - 파일: `frontend/report/script.js`
   - 함수: `generatePDF()`
   - 위치: Page 4 또는 새 페이지

2. **PDF에 Exit Plan 추가**
   - 파일: `frontend/report/script.js`
   - 함수: `generatePDF()`
   - 위치: Page 4 또는 새 페이지

3. **PDF에 Breakdown 추가**
   - 파일: `frontend/report/script.js`
   - 함수: `generatePDF()`
   - 위치: Page 2 (Financial 섹션)

4. **PDF에 판정 신뢰도 추가**
   - 파일: `frontend/report/script.js`
   - 함수: `generatePDF()`
   - 위치: Page 1 (Overall Evaluation 섹션)

### 🟡 P1 (권장) - 리포트 보완

5. **PDF에 하드컷 판정 근거 추가**
   - 파일: `frontend/report/script.js`
   - 함수: `generatePDF()`
   - 위치: Page 1 또는 Page 2

6. **개선 시뮬레이션 상세 정보 추가**
   - 웹: Dashboard "시뮬레이션 비교" 탭
   - PDF: Page 4 또는 새 페이지

---

## 📝 리포트 섹션 매핑

| 리포트 섹션 | 웹 표시 | PDF 표시 | 상태 |
|------------|--------|---------|------|
| 1. EXECUTIVE SUMMARY | ✅ | ✅ | 완료 |
| 2. 핵심 지표 | ✅ | ✅ | 완료 |
| 3. 손익 분석 | ✅ | ✅ | 완료 |
| 4. 하드컷 판정 | ⚠️ | ❌ | PDF 추가 필요 |
| 5. 실패 트리거 | ✅ | ❌ | PDF 추가 필요 |
| 6. 주요 리스크 | ✅ | ✅ | 완료 |
| 7. 개선 시뮬레이션 | ⚠️ | ❌ | 상세 정보 추가 필요 |
| 8. 손절 타이밍 | ✅ | ❌ | PDF 추가 필요 |
| 9. 폐업 비용 | ✅ | ❌ | PDF 추가 필요 |
| 10. 입지-상권분석 | ✅ | ✅ | 완료 |
| 11. 판정 신뢰도 | ✅ | ❌ | PDF 추가 필요 |
| 12. 점수 Breakdown | ✅ | ❌ | PDF 추가 필요 |

---

## 🔧 구현 가이드

### PDF 생성 함수 수정 위치

**파일**: `frontend/report/script.js`  
**함수**: `generatePDF()` (라인 629부터)

**현재 PDF 구조**:
- Page 1: Analysis Overview, Overall Evaluation
- Page 2: Financial Analysis, Key Metrics, Sensitivity Analysis
- Page 3: Location Analysis, Market Analysis
- Page 4: AI Risks, AI Improvements, Competitive Analysis

**추가 필요**:
- Page 1: Decision Confidence (Overall Evaluation 섹션에 추가)
- Page 2: Breakdown (Financial 섹션에 추가)
- Page 4 또는 Page 5: Failure Triggers, Exit Plan

---

## ✅ 체크리스트

### 웹 구현
- [x] Executive Summary
- [x] Finance Analysis
- [x] Risk Cards
- [x] Improvement Cards
- [x] Market Analysis
- [x] Roadview Analysis
- [x] Gap Analysis
- [x] Competitive Analysis
- [x] Failure Triggers
- [x] Exit Plan
- [x] Breakdown
- [x] Decision Confidence
- [ ] 개선 시뮬레이션 상세 (부분적)

### PDF 구현
- [x] Executive Summary
- [x] Finance Analysis
- [x] Risk Cards
- [x] Improvement Cards
- [x] Market Analysis
- [x] Roadview Analysis
- [x] Competitive Analysis
- [ ] Failure Triggers ❌
- [ ] Exit Plan ❌
- [ ] Breakdown ❌
- [ ] Decision Confidence ❌
- [ ] 하드컷 판정 근거 ❌
- [ ] 개선 시뮬레이션 상세 ❌

---

## 📝 결론

### 완료된 작업
- 웹 프론트엔드: 모든 주요 섹션 구현 완료 ✅
- PDF 생성: 기본 섹션 구현 완료 ✅

### 남은 작업
1. **PDF에 누락된 섹션 추가** (P0)
   - 실패 트리거
   - Exit Plan
   - Breakdown
   - 판정 신뢰도

2. **리포트 보완** (P1)
   - 하드컷 판정 근거 (PDF)
   - 개선 시뮬레이션 상세 (웹 + PDF)

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-15
