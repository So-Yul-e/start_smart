# TODO 리뷰 및 빠진 항목 체크

## ✅ 완료된 작업 (실제 구현 완료)

### High Priority (100% 완료)
- [x] expectedDailySales Fallback 규칙 구현 ✅
- [x] paybackMonths null 처리 ✅
- [x] breakEvenDailySales null 처리 ✅
- [x] 입력 검증 강화 ✅
- [x] riskFactors + riskCards 병행 구현 ✅
- [x] NaN/Infinity 처리 강화 ✅
- [x] 브랜드 데이터 시스템 구축 (12개 브랜드) ✅
- [x] Finance 출력 검증 함수 작성 ✅
- [x] Decision 출력 검증 함수 작성 ✅
- [x] Score breakdown 추가 ✅
- [x] Survival months 보너스 규칙 추가 ✅
- [x] Simulations.js 수정 (expectedDailySales 덮어쓰기 제거) ✅
- [x] determineSignal 개선 (GAP/민감도/고정비 반영) ✅
- [x] 데이터베이스 연동 (DB → data_local fallback) ✅

---

## ⚠️ 체크리스트에 표시되지 않았지만 완료된 항목

### 1. Finance 출력 검증 ✅
- **파일**: `engine/finance/validator.js` ✅ 생성됨
- **통합**: `engine/finance/index.js`에 통합됨 ✅
- **테스트**: `engine/fixtures/validator-test.js` ✅ 생성됨

### 2. Decision 출력 검증 ✅
- **파일**: `engine/decision/validator.js` ✅ 생성됨
- **통합**: `engine/decision/index.js`에 통합됨 ✅
- **테스트**: `engine/fixtures/validator-test.js` ✅ 생성됨

### 3. Score Breakdown ✅
- **구현**: `engine/decision/scorer.js`에 breakdown 추가 ✅
- **출력**: `engine/decision/index.js`에 breakdown 포함 ✅
- **검증**: `engine/decision/validator.js`에 breakdown 검증 추가 ✅

### 4. Survival Months 보너스 ✅
- **구현**: `engine/decision/scorer.js`에 보너스 규칙 추가 ✅
- **테스트**: `engine/fixtures/survival-bonus-test.js` ✅ 생성됨

### 5. 데이터베이스 연동 ✅
- **구현**: `engine/data_local/dbLoader.js` ✅ 생성됨
- **Fallback**: DB → data_local 자동 fallback ✅
- **스키마**: MySQL/PostgreSQL 스키마 파일 생성 ✅

---

## ⏳ 남은 작업 (체크리스트 기준)

### 🔴 High Priority

#### 1. 단위 테스트 작성
- [ ] `engine/finance/calculator.test.js` 생성
  - 정상 케이스 테스트
  - 엣지 케이스 테스트 (0원, 음수, null)
  - 입력 검증 테스트
  - GAP 계산 정확성 테스트
  - 시나리오 테이블 정확성 테스트
- [ ] `engine/decision/scorer.test.js` 생성
  - 점수 계산 정확성 테스트
  - 신호등 판단 정확성 테스트
  - 생존 개월 수 계산 정확성 테스트
  - 리스크 카드 생성 정확성 테스트
  - Breakdown 정확성 테스트 (신규)

**예상 소요 시간**: 4-6시간

---

### 🟡 Medium Priority

#### 2. 통합 테스트 확장
- [ ] 다양한 브랜드/지역/조건 조합 테스트
  - 저가형 브랜드 + 저렴한 지역
  - 프리미엄 브랜드 + 강남
  - 적자 시나리오
  - 최적 조건 시나리오
- [ ] `engine/fixtures/other-scenarios.js` 생성

**예상 소요 시간**: 2-3시간

#### 3. API 문서 작성
- [ ] `engine/API.md` 생성
  - 함수 시그니처 및 파라미터 설명
  - 입력/출력 예제
  - 에러 처리 방법
  - 사용 예제
  - **Breakdown 사용법 추가** (신규)

**예상 소요 시간**: 2-3시간

#### 4. 백엔드 통합 가이드
- [ ] `engine/INTEGRATION.md` 생성
  - 모듈 import 방법
  - 브랜드 데이터 로드 방법 (DB → data_local fallback 포함)
  - 엔진 호출 방법
  - 에러 처리 방법
  - **비동기 처리 방법** (async/await)

**예상 소요 시간**: 1-2시간

---

### 🟢 Low Priority (선택적)

#### 5. 성능 최적화
- [ ] 계산 성능 측정
- [ ] 병목 지점 파악 및 최적화
- [ ] DB 연결 풀링 (선택적)

#### 6. 추가 기능
- [ ] PDF 파싱 자동화 (선택적)
- [ ] 브랜드 데이터 업데이트 자동화

---

## 🔍 빠진 항목 체크

### 1. Breakdown 관련 문서화 ⚠️
- [ ] API 문서에 breakdown 사용법 추가
- [ ] 백엔드 통합 가이드에 breakdown 활용 방법 추가

### 2. 비동기 처리 관련 ⚠️
- [ ] 모든 fixture 파일 async/await 적용 확인
  - [x] `multi-brand-comparison.js` ✅
  - [x] `mega-gangnam.js` ✅
  - [x] `brand-test.js` ✅
  - [x] `validator-test.js` ✅
  - [ ] `breakdown-test.js` ⚠️ (확인 필요)
  - [ ] `survival-bonus-test.js` ⚠️ (확인 필요)
  - [ ] `dunkin-calculator.js` ⚠️ (확인 필요)

### 3. 데이터베이스 관련 ⚠️
- [ ] DB 연결 실패 시 재시도 로직 (선택적)
- [ ] DB 연결 풀링 (성능 최적화)
- [ ] DB 마이그레이션 스크립트 (brands.json → DB)

### 4. 에러 핸들링 강화 ⚠️
- [ ] 브랜드 데이터 로드 실패 시 명확한 에러 메시지
- [ ] DB 연결 실패 시 상세한 로그

---

## 📋 최종 체크리스트

### 즉시 시작 가능 (High Priority)
1. [ ] **단위 테스트 작성** (4-6h)
   - Finance 계산 테스트
   - Decision 판단 테스트
   - Breakdown 테스트 (신규)

### 다음 단계 (Medium Priority)
2. [ ] **통합 테스트 확장** (2-3h)
3. [ ] **API 문서 작성** (2-3h)
   - Breakdown 사용법 포함
4. [ ] **백엔드 통합 가이드** (1-2h)
   - 비동기 처리 방법 포함
   - DB → data_local fallback 설명

### 선택적 (Low Priority)
5. [ ] **성능 최적화** (선택적)
6. [ ] **추가 기능** (선택적)

---

## 🎯 우선순위별 작업 순서

### 1단계: 단위 테스트 작성 (가장 중요)
- 계산 로직의 정확성 보장
- 엣지 케이스 처리 확인
- Breakdown 정확성 검증

### 2단계: 문서화 (협업 효율)
- API 문서 작성
- 백엔드 통합 가이드
- Breakdown 활용 방법 포함

### 3단계: 통합 테스트 확장
- 다양한 시나리오 검증

---

## 💡 빠진 항목 요약

### 반드시 해야 할 것
1. **단위 테스트 작성** - 가장 중요
2. **API 문서 작성** - Breakdown 사용법 포함
3. **백엔드 통합 가이드** - 비동기 처리 방법 포함

### 확인이 필요한 것
1. **나머지 fixture 파일들** async/await 적용 확인
2. **DB 연결 풀링** (성능 최적화, 선택적)

### 선택적
1. **성능 최적화**
2. **PDF 파싱 자동화**

---

## ✅ 체크리스트 업데이트 필요

`DEVELOPMENT_CHECKLIST.md`에 다음 항목들이 완료되었지만 체크되지 않았습니다:
- [x] Finance 출력 검증 함수 작성 ✅
- [x] Decision 출력 검증 함수 작성 ✅
- [x] Score breakdown 추가 ✅
- [x] Survival months 보너스 규칙 ✅
- [x] 데이터베이스 연동 ✅
