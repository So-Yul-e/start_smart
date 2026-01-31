# ReportModel 구현 상태 보고서

**생성일**: 2025-01-15  
**목적**: 현재 구현 상태 분석 및 개선 작업 리스트 작성

---

## 📋 요약 (Executive Summary)

### ✅ 완료된 작업
1. **핵심 인프라**: `shared/reportModel.js` 생성 완료
2. **백엔드 통합**: `orchestrator.js`에서 reportModel 생성 및 통합 완료
3. **프론트엔드 리팩터링**: `dashboard/script.js`, `report/script.js` reportModel 사용으로 변경 완료
4. **선택 기능**: AI Claims 검증, Q&A API 구현 완료

### ⚠️ 발견된 문제점
1. **입지-상권분석 데이터 누락**: reportModel에 market과 roadview 데이터가 포함되지 않음
2. **프론트엔드 데이터 접근 불일치**: 일부는 reportModel 사용, 일부는 finalResult 직접 사용
3. **입지-상권분석 섹션 미구현**: 대시보드/리포트에 입지-상권분석 전용 섹션 없음

---

## 1. 현재 구현 상태 분석

### 1.1 reportModel 구조

**현재 reportModel에 포함된 데이터**:
```javascript
{
  version: "reportModel.v1",
  executive: { ... },      // ✅ 완료
  finance: { ... },        // ✅ 완료
  gap: { ... },            // ✅ 완료
  scenario: { ... },       // ✅ 완료
  breakdown: { ... },      // ✅ 완료
  risk: { ... },           // ✅ 완료 (병합된 risk cards)
  improvement: { ... },    // ✅ 완료 (병합된 improvement cards)
  exitPlan: { ... },       // ✅ 완료
  failureTriggers: [ ... ], // ✅ 완료
  competitive: { ... },    // ✅ 완료
  sources: {
    hasMarket: !!market,    // ⚠️ boolean만 있음
    hasRoadview: !!roadview, // ⚠️ boolean만 있음
    hasAI: !!aiConsulting
  }
  // ❌ market 데이터 없음
  // ❌ roadview 데이터 없음
}
```

### 1.2 프론트엔드 데이터 사용 현황

#### Dashboard (`frontend/dashboard/script.js`)
- ✅ `reportModel.executive` 사용
- ✅ `reportModel.finance` 사용
- ✅ `reportModel.risk` 사용 (병합된 risk cards)
- ✅ `reportModel.improvement` 사용 (병합된 improvement cards)
- ⚠️ `result.market` 직접 사용 (reportModel에 없어서)
- ❌ `result.roadview` 미사용 (표시되지 않음)

#### Report (`frontend/report/script.js`)
- ✅ `reportModel.executive` 사용
- ✅ `reportModel.finance` 사용
- ✅ `reportModel.risk` 사용
- ✅ `reportModel.improvement` 사용
- ❌ `result.market` 미사용 (표시되지 않음)
- ❌ `result.roadview` 미사용 (표시되지 않음)

### 1.3 입지-상권분석 데이터 구조

#### Market 데이터 (현재 구조)
```javascript
{
  location: { lat, lng, radius },
  competitors: {
    total: number,
    sameBrand: number,
    otherBrands: number,
    density: "low" | "medium" | "high"
  },
  footTraffic: {
    weekday: "low" | "medium" | "high",
    weekend: "low" | "medium" | "high",
    peakHours: string[]
  },
  marketScore: number // 0-100
}
```

#### Roadview 데이터 (현재 구조)
```javascript
{
  location: { lat, lng },
  risks: [
    {
      type: "signage_obstruction" | "steep_slope" | "floor_level" | "visibility",
      level: "low" | "medium" | "high" | "ground" | "half_basement" | "second_floor",
      description: string
    }
  ],
  overallRisk: "low" | "medium" | "high",
  riskScore: number // 0-100 (낮을수록 위험)
}
```

#### Roadview 추가 메타데이터 (Gemini 응답에서 추출 가능)
```javascript
{
  _metadata: {
    confidence: number,        // 평균 신뢰도 (0-1)
    imageQuality: { ... },     // 이미지 품질 정보
    strengths: string[],       // 강점 배열
    weaknesses: string[],      // 약점 배열
    locationScore: number      // 위치 점수 (0-100, 높을수록 좋음)
  }
}
```

---

## 2. 문제점 분석

### 2.1 reportModel에 입지-상권분석 데이터 누락

**문제**:
- `reportModel`에 `market`과 `roadview` 데이터가 포함되지 않음
- `sources.hasMarket`, `sources.hasRoadview`는 boolean만 제공
- 프론트엔드에서 입지-상권분석을 표시하려면 `result.market`, `result.roadview`를 직접 접근해야 함

**영향**:
- 입지-상권분석 섹션을 추가할 수 없음
- reportModel의 일관성 있는 데이터 접근 원칙 위반
- 프론트엔드에서 데이터 접근 방식이 혼재됨

### 2.2 프론트엔드 입지-상권분석 섹션 미구현

**현재 상태**:
- Dashboard: 경쟁 분석 정보만 일부 표시 (AI Detail 탭의 competitiveAnalysis)
- Report: 입지-상권분석 전용 섹션 없음
- Roadview 데이터: 전혀 표시되지 않음

**필요한 섹션**:
1. **입지 분석 (Roadview)**
   - 간판 가시성
   - 경사도
   - 층위
   - 보행 가시성
   - 종합 리스크 평가

2. **상권 분석 (Market)**
   - 경쟁 카페 현황 (총 개수, 동일 브랜드, 타 브랜드)
   - 경쟁 밀도
   - 유동인구 추정
   - 상권 점수

---

## 3. 개선 작업 리스트

### 3.1 reportModel 확장 (필수)

#### 작업 1: reportModel에 market 데이터 추가
**파일**: `shared/reportModel.js`

**추가할 데이터**:
```javascript
market: {
  location: {
    lat: number,
    lng: number,
    radius: number
  },
  competitors: {
    total: number,
    sameBrand: number,
    otherBrands: number,
    density: "low" | "medium" | "high"
  },
  footTraffic: {
    weekday: "low" | "medium" | "high",
    weekend: "low" | "medium" | "high",
    peakHours: string[]
  },
  marketScore: number
}
```

**우선순위**: 🔴 P0 (필수)

#### 작업 2: reportModel에 roadview 데이터 추가
**파일**: `shared/reportModel.js`

**추가할 데이터**:
```javascript
roadview: {
  location: {
    lat: number,
    lng: number
  },
  risks: [
    {
      type: string,
      level: string,
      description: string
    }
  ],
  overallRisk: "low" | "medium" | "high",
  riskScore: number,
  // 추가 메타데이터 (있는 경우)
  metadata: {
    confidence: number,
    strengths: string[],
    weaknesses: string[],
    locationScore: number
  } | null
}
```

**우선순위**: 🔴 P0 (필수)

#### 작업 3: roadview 메타데이터 추출 로직 추가
**파일**: `shared/reportModel.js`

**내용**:
- `finalResult.roadview._metadata`에서 추가 정보 추출
- `convertToLegacyFormat`에서 반환된 `_metadata` 활용
- 없으면 `null`로 설정

**우선순위**: 🟡 P1 (권장)

---

### 3.2 프론트엔드 입지-상권분석 섹션 구현 (필수)

#### 작업 4: Dashboard에 입지-상권분석 탭 추가
**파일**: `frontend/dashboard/index.html`, `frontend/dashboard/script.js`

**구현 내용**:
1. 새 탭 "입지-상권분석" 추가
2. 입지 분석 섹션:
   - Roadview 리스크 카드 4개 표시
   - 종합 리스크 평가 (overallRisk, riskScore)
   - 강점/약점 표시 (metadata가 있는 경우)
3. 상권 분석 섹션:
   - 경쟁 카페 현황 (총 개수, 동일 브랜드, 타 브랜드)
   - 경쟁 밀도 시각화
   - 유동인구 정보
   - 상권 점수 표시

**우선순위**: 🔴 P0 (필수)

#### 작업 5: Report에 입지-상권분석 페이지 추가
**파일**: `frontend/report/index.html`, `frontend/report/script.js`

**구현 내용**:
1. 새 페이지 "입지-상권분석" 추가 (PAGE 2 또는 별도 페이지)
2. 입지 분석 (Roadview):
   - 리스크 항목별 상세 설명
   - 종합 평가
3. 상권 분석 (Market):
   - 경쟁 현황 테이블
   - 상권 점수 및 평가

**우선순위**: 🔴 P0 (필수)

---

### 3.3 데이터 접근 일관성 개선 (권장)

#### 작업 6: 프론트엔드에서 reportModel 우선 사용 강제
**파일**: `frontend/dashboard/script.js`, `frontend/report/script.js`

**내용**:
- `result.market` 직접 접근 제거
- `reportModel.market` 사용으로 변경
- `reportModel.roadview` 사용으로 변경

**우선순위**: 🟡 P1 (권장)

---

### 3.4 UI/UX 개선 (선택)

#### 작업 7: 입지-상권분석 시각화 개선
**파일**: `frontend/dashboard/script.js`, `frontend/report/script.js`

**내용**:
- Roadview 리스크 항목별 아이콘/색상 구분
- 경쟁 밀도 차트/게이지 추가
- 상권 점수 시각화

**우선순위**: 🟢 P2 (선택)

---

## 4. 상세 작업 리스트

### Phase 1: reportModel 확장 (필수)

- [ ] **작업 1-1**: `shared/reportModel.js`의 `buildReportModel` 함수에 market 데이터 추가
  - `market` 객체를 reportModel에 포함
  - null 체크 및 안전한 접근 보장
  - 예상 소요: 30분

- [ ] **작업 1-2**: `shared/reportModel.js`의 `buildReportModel` 함수에 roadview 데이터 추가
  - `roadview` 객체를 reportModel에 포함
  - `_metadata` 추출 로직 추가 (있는 경우)
  - null 체크 및 안전한 접근 보장
  - 예상 소요: 30분

- [ ] **작업 1-3**: 테스트 - reportModel에 market과 roadview 데이터 포함 확인
  - 분석 실행 후 `result.reportModel.market` 확인
  - 분석 실행 후 `result.reportModel.roadview` 확인
  - 예상 소요: 15분

### Phase 2: 프론트엔드 입지-상권분석 섹션 구현 (필수)

- [ ] **작업 2-1**: Dashboard HTML에 입지-상권분석 탭 추가
  - `frontend/dashboard/index.html`에 새 탭 버튼 추가
  - 탭 콘텐츠 영역 추가
  - 입지 분석 섹션 HTML 구조
  - 상권 분석 섹션 HTML 구조
  - 예상 소요: 1시간

- [ ] **작업 2-2**: Dashboard JavaScript에 입지-상권분석 렌더링 로직 추가
  - `frontend/dashboard/script.js`에 입지 분석 렌더 함수 추가
  - `frontend/dashboard/script.js`에 상권 분석 렌더 함수 추가
  - Roadview 리스크 카드 렌더링
  - 경쟁 현황 표시
  - 예상 소요: 2시간

- [ ] **작업 2-3**: Report HTML에 입지-상권분석 페이지 추가
  - `frontend/report/index.html`에 새 페이지 섹션 추가
  - 입지 분석 섹션 HTML 구조
  - 상권 분석 섹션 HTML 구조
  - 예상 소요: 1시간

- [ ] **작업 2-4**: Report JavaScript에 입지-상권분석 렌더링 로직 추가
  - `frontend/report/script.js`에 입지 분석 렌더 함수 추가
  - `frontend/report/script.js`에 상권 분석 렌더 함수 추가
  - PDF 생성 시 입지-상권분석 페이지 포함
  - 예상 소요: 2시간

### Phase 3: 데이터 접근 일관성 개선 (권장)

- [ ] **작업 3-1**: Dashboard에서 reportModel.market 사용으로 변경
  - `result.market` 직접 접근 제거
  - `reportModel.market` 사용으로 변경
  - 예상 소요: 15분

- [ ] **작업 3-2**: Report에서 reportModel.market 사용으로 변경
  - `result.market` 직접 접근 제거 (있는 경우)
  - `reportModel.market` 사용으로 변경
  - 예상 소요: 15분

### Phase 4: UI/UX 개선 (선택)

- [ ] **작업 4-1**: Roadview 리스크 항목별 아이콘/색상 추가
  - 각 리스크 타입별 아이콘 매핑
  - 레벨별 색상 구분
  - 예상 소요: 30분

- [ ] **작업 4-2**: 경쟁 밀도 시각화 추가
  - 게이지 차트 또는 프로그레스 바
  - 밀도 레벨별 색상 구분
  - 예상 소요: 1시간

- [ ] **작업 4-3**: 상권 점수 시각화 추가
  - 원형 게이지 또는 바 차트
  - 점수 범위별 색상 구분
  - 예상 소요: 1시간

---

## 5. 우선순위별 작업 요약

### 🔴 P0 (필수) - 즉시 진행
1. reportModel에 market 데이터 추가
2. reportModel에 roadview 데이터 추가
3. Dashboard에 입지-상권분석 탭 추가
4. Dashboard에 입지-상권분석 렌더링 로직 추가
5. Report에 입지-상권분석 페이지 추가
6. Report에 입지-상권분석 렌더링 로직 추가

**예상 총 소요 시간**: 7시간

### 🟡 P1 (권장) - 단기 진행
1. roadview 메타데이터 추출 로직 추가
2. Dashboard에서 reportModel.market 사용으로 변경
3. Report에서 reportModel.market 사용으로 변경

**예상 총 소요 시간**: 1시간

### 🟢 P2 (선택) - 중장기 진행
1. Roadview 리스크 항목별 아이콘/색상 추가
2. 경쟁 밀도 시각화 추가
3. 상권 점수 시각화 추가

**예상 총 소요 시간**: 2.5시간

---

## 6. 참고 사항

### 6.1 Roadview 메타데이터 활용
- `_metadata`는 `convertToLegacyFormat`에서 반환되지만, 현재 `orchestrator.js`에서 저장되지 않음
- `orchestrator.js`에서 roadview 결과를 저장할 때 `_metadata`도 함께 저장하도록 수정 필요 (선택사항)

### 6.2 하위 호환성
- 기존 데이터는 `reportModel.market`과 `reportModel.roadview`가 없을 수 있음
- 프론트엔드에서 null 체크 필수
- `result.market`, `result.roadview`로 fallback 가능

### 6.3 데이터 구조 일관성
- reportModel의 모든 데이터는 ViewModel 형식으로 정규화되어야 함
- 원본 데이터(`finalResult`)는 참조용으로만 사용
- 프론트엔드는 reportModel만 사용하는 것이 원칙

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-15  
**작성자**: StartSmart Team
