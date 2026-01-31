# ReportModel 테스트 가이드

**생성일**: 2025-01-15  
**목적**: ReportModel 구현 검증 및 테스트 방법

---

## 📋 테스트 체크리스트

### 1. 백엔드 테스트

#### 1.1 분석 실행 및 reportModel 생성 확인

**테스트 방법**:
```bash
# 1. 서버 시작
cd backend
npm start

# 2. 분석 API 호출 (Postman 또는 curl)
POST http://localhost:3000/api/analyze
{
  "brandId": "brand_1",
  "location": {
    "lat": 37.5665,
    "lng": 126.9780,
    "address": "서울특별시 강남구 테헤란로 123"
  },
  "radius": 500,
  "conditions": {
    "initialInvestment": 500000000,
    "monthlyRent": 3000000,
    "area": 33,
    "ownerWorking": true
  },
  "targetDailySales": 300
}
```

**확인 사항**:
- [ ] 서버 로그에 `✅ reportModel 생성 완료` 메시지 확인
- [ ] `analysisId` 받기

#### 1.2 결과 조회 및 reportModel 데이터 확인

**테스트 방법**:
```bash
# 분석 결과 조회
GET http://localhost:3000/api/result/:analysisId
```

**확인 사항**:
- [ ] `result.reportModel` 존재 확인
- [ ] `result.reportModel.version === "reportModel.v1"` 확인
- [ ] `result.reportModel.executive` 존재 및 데이터 확인
- [ ] `result.reportModel.finance` 존재 및 데이터 확인
- [ ] `result.reportModel.market` 존재 및 데이터 확인
- [ ] `result.reportModel.roadview` 존재 및 데이터 확인
- [ ] `result.reportModel.gap` 존재 및 데이터 확인
- [ ] `result.reportModel.risk.cards` 배열 확인
- [ ] `result.reportModel.improvement.cards` 배열 확인

**콘솔에서 확인**:
```javascript
// 브라우저 개발자 도구 콘솔에서
const result = await fetch('/api/result/:analysisId').then(r => r.json());
console.log('reportModel:', result.result.reportModel);
console.log('market:', result.result.reportModel.market);
console.log('roadview:', result.result.reportModel.roadview);
```

---

### 2. 프론트엔드 테스트

#### 2.1 Dashboard 테스트

**테스트 방법**:
1. 브라우저에서 `http://localhost:3000` 접속
2. 브랜드 선택 → 조건 입력 → 분석 실행
3. Dashboard 페이지로 이동

**확인 사항**:

**TAB 1: 요약**
- [ ] Score Circle 표시 (점수, 색상)
- [ ] Signal Badge 표시 (신호등, 라벨)
- [ ] 4개 메트릭 카드 표시 (생존 개월, 회수 기간, 월 순이익, 손익분기)
- [ ] Hardcut Warnings 표시 (있는 경우)
- [ ] Cost Stack Chart 표시
- [ ] Sensitivity Chart 표시

**TAB 2: AI 상세분석**
- [ ] AI 리스크 Top 3 표시 (병합된 risk cards)
- [ ] AI 개선 제안 표시 (병합된 improvement cards)
- [ ] 경쟁 환경 해석 표시

**TAB 3: 입지-상권분석** ⭐ 신규
- [ ] 입지 분석 섹션 표시
  - [ ] Roadview 리스크 카드 4개 표시 (간판 가시성, 경사도, 층위, 보행 가시성)
  - [ ] 각 리스크 카드에 아이콘, 레벨, 설명 표시
  - [ ] 종합 리스크 평가 표시 (overallRisk, riskScore)
  - [ ] 강점/약점 표시 (metadata가 있는 경우)
- [ ] 상권 분석 섹션 표시
  - [ ] 경쟁 카페 현황 카드 4개 표시 (총 개수, 동일 브랜드, 타 브랜드, 경쟁 밀도)
  - [ ] 유동인구 정보 표시 (평일/주말, 피크 시간대)
  - [ ] 상권 종합 점수 표시 (점수, 게이지)

**TAB 4: 시뮬레이션 비교**
- [ ] Before/After 비교 표시
- [ ] 판매량 시나리오 비교 차트 표시
- [ ] 저장된 시뮬레이션 목록 표시

**브라우저 콘솔 확인**:
```javascript
// 개발자 도구 콘솔에서
console.log('[대시보드] reportModel:', result.reportModel);
console.log('[대시보드] market:', result.reportModel?.market);
console.log('[대시보드] roadview:', result.reportModel?.roadview);
```

**에러 확인**:
- [ ] 콘솔에 에러 없음
- [ ] `reportModel이 없습니다` 경고 없음 (새 분석의 경우)

#### 2.2 Report 테스트

**테스트 방법**:
1. Dashboard에서 "PDF 리포트" 버튼 클릭
2. Report 페이지로 이동

**확인 사항**:

**PAGE 1: Overview**
- [ ] 분석 개요 테이블 표시
- [ ] 종합 평가 (Score Circle, Signal, Summary) 표시

**PAGE 2: Financial**
- [ ] 예상 수익성 분석 테이블 표시
- [ ] 핵심 지표 (KPI) 표시
- [ ] 민감도 분석 테이블 표시

**PAGE 3: 입지-상권분석** ⭐ 신규
- [ ] 입지 분석 섹션 표시
  - [ ] Roadview 리스크 항목 4개 표시
  - [ ] 종합 리스크 평가 표시
  - [ ] 강점/약점 표시 (있는 경우)
- [ ] 상권 분석 섹션 표시
  - [ ] 경쟁 현황 테이블 표시
  - [ ] 유동인구 정보 테이블 표시
  - [ ] 상권 종합 점수 표시

**PAGE 4: AI Consulting**
- [ ] AI 리스크 분석 표시
- [ ] AI 개선 제안 표시
- [ ] 경쟁 환경 요약 표시

**PDF 생성 테스트**:
1. "PDF 다운로드" 버튼 클릭
2. PDF 파일 다운로드 확인
3. PDF 내용 확인:
   - [ ] PAGE 1: Overview 포함
   - [ ] PAGE 2: Financial 포함
   - [ ] PAGE 3: 입지-상권분석 포함 ⭐ 신규
   - [ ] PAGE 4: AI Consulting 포함

---

### 3. 데이터 검증 테스트

#### 3.1 reportModel 데이터 일관성 검증

**테스트 스크립트**:
```javascript
// 브라우저 콘솔에서 실행
const result = JSON.parse(sessionStorage.getItem('analysisResult'));

// 1. reportModel 존재 확인
if (!result.reportModel) {
  console.error('❌ reportModel이 없습니다!');
} else {
  console.log('✅ reportModel 존재');
}

// 2. 데이터 일관성 검증
const rm = result.reportModel;
const finance = result.finance;
const decision = result.decision;

// Executive 데이터 검증
if (rm.executive.paybackMonths !== finance.paybackMonths) {
  console.error('❌ paybackMonths 불일치:', {
    reportModel: rm.executive.paybackMonths,
    finance: finance.paybackMonths
  });
} else {
  console.log('✅ paybackMonths 일치');
}

if (rm.executive.monthlyProfit !== finance.monthlyProfit) {
  console.error('❌ monthlyProfit 불일치:', {
    reportModel: rm.executive.monthlyProfit,
    finance: finance.monthlyProfit
  });
} else {
  console.log('✅ monthlyProfit 일치');
}

if (rm.executive.score !== decision.score) {
  console.error('❌ score 불일치:', {
    reportModel: rm.executive.score,
    decision: decision.score
  });
} else {
  console.log('✅ score 일치');
}

// 3. Market 데이터 검증
if (rm.market) {
  console.log('✅ market 데이터 존재');
  console.log('  - competitors.total:', rm.market.competitors?.total);
  console.log('  - marketScore:', rm.market.marketScore);
} else {
  console.warn('⚠️ market 데이터 없음');
}

// 4. Roadview 데이터 검증
if (rm.roadview) {
  console.log('✅ roadview 데이터 존재');
  console.log('  - risks 개수:', rm.roadview.risks?.length);
  console.log('  - overallRisk:', rm.roadview.overallRisk);
  console.log('  - riskScore:', rm.roadview.riskScore);
  console.log('  - metadata:', rm.roadview.metadata);
} else {
  console.warn('⚠️ roadview 데이터 없음');
}

// 5. Risk Cards 병합 검증
if (rm.risk && rm.risk.cards) {
  console.log('✅ risk cards 병합 완료:', rm.risk.cards.length, '개');
  rm.risk.cards.forEach((card, idx) => {
    console.log(`  [${idx}] engine:`, !!card.engine, 'ai:', !!card.ai);
  });
} else {
  console.warn('⚠️ risk cards 없음');
}

// 6. Improvement Cards 병합 검증
if (rm.improvement && rm.improvement.cards) {
  console.log('✅ improvement cards 병합 완료:', rm.improvement.cards.length, '개');
  rm.improvement.cards.forEach((card, idx) => {
    console.log(`  [${idx}] engine:`, !!card.engine, 'ai:', !!card.ai);
  });
} else {
  console.warn('⚠️ improvement cards 없음');
}
```

#### 3.2 하위 호환성 테스트

**테스트 방법**:
1. 기존 분석 결과 (reportModel 없는 데이터) 로드
2. Dashboard/Report가 정상 동작하는지 확인

**확인 사항**:
- [ ] `reportModel이 없습니다` 경고 메시지 표시
- [ ] 기존 방식으로 데이터 표시 (fallback 동작)
- [ ] 에러 없이 페이지 렌더링

---

### 4. 통합 테스트 시나리오

#### 시나리오 1: 전체 플로우 테스트

1. **브랜드 선택**
   - 브랜드 목록에서 브랜드 선택
   - 확인: 브랜드 정보 표시

2. **조건 입력**
   - 초기 투자금, 월세, 평수, 점주 근무 여부 입력
   - 목표 판매량 입력
   - 확인: 입력값 검증

3. **분석 실행**
   - "분석 시작" 버튼 클릭
   - 분석 진행 상태 확인
   - 확인: 분석 완료 메시지

4. **Dashboard 확인**
   - 모든 탭 확인
   - 입지-상권분석 탭 확인 ⭐ 신규
   - 데이터 표시 확인

5. **Report 확인**
   - 모든 페이지 확인
   - 입지-상권분석 페이지 확인 ⭐ 신규
   - PDF 생성 확인

#### 시나리오 2: 엣지 케이스 테스트

1. **roadview 데이터 없는 경우**
   - roadview 분석 실패 시나리오
   - 확인: Dashboard/Report에서 "입지 분석 데이터가 없습니다" 메시지 표시

2. **market 데이터 없는 경우**
   - market 분석 실패 시나리오
   - 확인: Dashboard/Report에서 "상권 분석 데이터가 없습니다" 메시지 표시

3. **reportModel 생성 실패**
   - reportModel 생성 중 에러 발생
   - 확인: `reportModelError` 필드에 에러 메시지 포함
   - 확인: 전체 분석은 실패하지 않음 (하위 호환성)

---

### 5. 성능 테스트

#### 5.1 reportModel 생성 시간

**확인 방법**:
- 서버 로그에서 `✅ reportModel 생성 완료` 메시지 확인
- 분석 전체 시간과 비교

**예상 시간**: < 100ms (reportModel 생성은 단순 변환 작업)

#### 5.2 프론트엔드 렌더링 시간

**확인 방법**:
- 브라우저 개발자 도구 Performance 탭 사용
- Dashboard/Report 페이지 로드 시간 측정

---

### 6. 디버깅 체크리스트

#### 문제 발생 시 확인 사항

1. **reportModel이 생성되지 않는 경우**
   - [ ] 서버 로그 확인: `❌ reportModel 생성 실패` 메시지
   - [ ] `finalResult` 구조 확인 (finance, decision, market, roadview 포함 여부)
   - [ ] `shared/reportModel.js` 파일 존재 확인
   - [ ] Node.js require 경로 확인

2. **market/roadview 데이터가 없는 경우**
   - [ ] `finalResult.market` 존재 확인
   - [ ] `finalResult.roadview` 존재 확인
   - [ ] `reportModel.market` null 체크 확인
   - [ ] `reportModel.roadview` null 체크 확인

3. **프론트엔드 렌더링 오류**
   - [ ] 브라우저 콘솔 에러 확인
   - [ ] `reportModel` 존재 여부 확인
   - [ ] null 체크 로직 확인
   - [ ] HTML 요소 ID 확인

4. **데이터 불일치**
   - [ ] `reportModel.executive.paybackMonths === finance.paybackMonths` 확인
   - [ ] `reportModel.executive.monthlyProfit === finance.monthlyProfit` 확인
   - [ ] `reportModel.executive.score === decision.score` 확인

---

### 7. 빠른 테스트 스크립트

**브라우저 콘솔에서 실행**:
```javascript
// 전체 검증 스크립트
(function() {
  const result = JSON.parse(sessionStorage.getItem('analysisResult'));
  if (!result) {
    console.error('❌ 분석 결과가 없습니다. 먼저 분석을 실행하세요.');
    return;
  }

  console.log('=== ReportModel 검증 시작 ===');
  
  // 1. reportModel 존재 확인
  if (!result.reportModel) {
    console.error('❌ reportModel이 없습니다!');
    return;
  }
  console.log('✅ reportModel 존재');

  const rm = result.reportModel;
  
  // 2. 필수 필드 확인
  const requiredFields = ['executive', 'finance', 'gap', 'scenario', 'risk', 'improvement', 'market', 'roadview'];
  requiredFields.forEach(field => {
    if (rm[field] === undefined || rm[field] === null) {
      console.warn(`⚠️ ${field} 필드가 없거나 null입니다.`);
    } else {
      console.log(`✅ ${field} 필드 존재`);
    }
  });

  // 3. 데이터 일관성 확인
  if (rm.executive.paybackMonths === result.finance.paybackMonths) {
    console.log('✅ paybackMonths 일치');
  } else {
    console.error('❌ paybackMonths 불일치');
  }

  if (rm.executive.monthlyProfit === result.finance.monthlyProfit) {
    console.log('✅ monthlyProfit 일치');
  } else {
    console.error('❌ monthlyProfit 불일치');
  }

  // 4. Market 데이터 확인
  if (rm.market) {
    console.log('✅ market 데이터:', {
      competitors: rm.market.competitors,
      marketScore: rm.market.marketScore
    });
  }

  // 5. Roadview 데이터 확인
  if (rm.roadview) {
    console.log('✅ roadview 데이터:', {
      risksCount: rm.roadview.risks?.length,
      overallRisk: rm.roadview.overallRisk,
      riskScore: rm.roadview.riskScore,
      hasMetadata: !!rm.roadview.metadata
    });
  }

  console.log('=== ReportModel 검증 완료 ===');
})();
```

---

### 8. 테스트 결과 기록

테스트 완료 후 다음 정보를 기록하세요:

- [ ] 분석 실행 성공 여부
- [ ] reportModel 생성 성공 여부
- [ ] Dashboard 모든 탭 정상 동작
- [ ] Report 모든 페이지 정상 동작
- [ ] PDF 생성 성공
- [ ] 입지-상권분석 데이터 표시 확인
- [ ] 데이터 일관성 검증 통과
- [ ] 하위 호환성 확인 (기존 데이터)

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-15  
**작성자**: StartSmart Team
