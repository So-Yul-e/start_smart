# 완전한 TODO 체크리스트

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
- [x] 모든 fixture 파일 async/await 적용 ✅

---

## ⏳ 남은 작업 (우선순위별)

### 🔴 High Priority (다음 단계)

#### 1. 단위 테스트 작성 ⚠️ **가장 중요**
- [ ] `engine/finance/calculator.test.js` 생성
  - [ ] 정상 케이스 테스트
  - [ ] 엣지 케이스 테스트 (0원, 음수, null)
  - [ ] 입력 검증 테스트
  - [ ] GAP 계산 정확성 테스트
  - [ ] 시나리오 테이블 정확성 테스트
  - [ ] expectedDailySales fallback 규칙 테스트
- [ ] `engine/decision/scorer.test.js` 생성
  - [ ] 점수 계산 정확성 테스트
  - [ ] 신호등 판단 정확성 테스트
  - [ ] 생존 개월 수 계산 정확성 테스트
  - [ ] 리스크 카드 생성 정확성 테스트
  - [ ] **Breakdown 정확성 테스트** (신규)
  - [ ] **Survival months 보너스 테스트** (신규)

**예상 소요 시간**: 4-6시간  
**중요도**: ⭐⭐⭐⭐⭐ (가장 중요)

---

### 🟡 Medium Priority

#### 2. 통합 테스트 확장
- [ ] 다양한 브랜드/지역/조건 조합 테스트
  - [ ] 저가형 브랜드 + 저렴한 지역 (메가커피 + 노원)
  - [ ] 프리미엄 브랜드 + 강남 (투썸플레이스 + 강남)
  - [ ] 적자 시나리오 (낮은 판매량)
  - [ ] 최적 조건 시나리오 (높은 판매량, 낮은 임대료)
- [ ] `engine/fixtures/other-scenarios.js` 생성

**예상 소요 시간**: 2-3시간

#### 3. API 문서 작성 ⚠️ **협업 필수**
- [ ] `engine/API.md` 생성
  - [ ] 함수 시그니처 및 파라미터 설명
  - [ ] 입력/출력 예제
  - [ ] 에러 처리 방법
  - [ ] 사용 예제
  - [ ] **Breakdown 사용법** (신규)
  - [ ] **비동기 처리 방법** (async/await)

**예상 소요 시간**: 2-3시간  
**중요도**: ⭐⭐⭐⭐ (백엔드 통합 전 필수)

#### 4. 백엔드 통합 가이드 ⚠️ **협업 필수**
- [ ] `engine/INTEGRATION.md` 생성
  - [ ] 모듈 import 방법
  - [ ] 브랜드 데이터 로드 방법 (DB → data_local fallback)
  - [ ] 엔진 호출 방법
  - [ ] 에러 처리 방법
  - [ ] **비동기 처리 방법** (async/await)
  - [ ] **Breakdown 활용 방법**

**예상 소요 시간**: 1-2시간  
**중요도**: ⭐⭐⭐⭐ (백엔드 통합 전 필수)

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

## 🔍 빠진 항목 요약

### 반드시 해야 할 것 (High Priority)
1. **단위 테스트 작성** ⚠️
   - 가장 중요
   - 계산 로직 정확성 보장
   - Breakdown 정확성 검증
   - Survival months 보너스 검증

### 협업 전 필수 (Medium Priority)
2. **API 문서 작성** ⚠️
   - Breakdown 사용법 포함
   - 비동기 처리 방법 포함
3. **백엔드 통합 가이드** ⚠️
   - DB → data_local fallback 설명
   - 비동기 처리 방법 포함
   - Breakdown 활용 방법 포함

### 선택적
4. 통합 테스트 확장
5. 성능 최적화

---

## 📊 우선순위별 작업 순서

### 1단계: 단위 테스트 작성 (가장 중요)
- Finance 계산 테스트
- Decision 판단 테스트
- Breakdown 정확성 테스트
- Survival months 보너스 테스트

**예상 소요 시간**: 4-6시간

### 2단계: 문서화 (협업 필수)
- API 문서 작성
- 백엔드 통합 가이드

**예상 소요 시간**: 3-5시간

### 3단계: 통합 테스트 확장
- 다양한 시나리오 검증

**예상 소요 시간**: 2-3시간

---

## 📝 최종 체크리스트

### High Priority
- [x] 출력 검증 함수 (Finance + Decision) ✅
- [x] 데이터베이스 연동 ✅
- [x] Score breakdown ✅
- [x] Survival months 보너스 ✅
- [ ] **단위 테스트 작성** ⚠️ **가장 중요**

### Medium Priority
- [ ] **API 문서 작성** ⚠️ **협업 필수**
- [ ] **백엔드 통합 가이드** ⚠️ **협업 필수**
- [ ] 통합 테스트 확장

### Low Priority
- [ ] 성능 최적화
- [ ] 추가 기능

---

## 🚨 빠진 항목 요약

1. **단위 테스트 작성** - 가장 중요, 계산 정확성 보장
2. **API 문서 작성** - 협업 필수, Breakdown 포함
3. **백엔드 통합 가이드** - 협업 필수, 비동기 처리 포함

**총 예상 시간**: 7-11시간

---

## 💡 권장 작업 순서

1. **단위 테스트 작성** (4-6h) - 가장 중요
2. **API 문서 작성** (2-3h) - 협업 필수
3. **백엔드 통합 가이드** (1-2h) - 협업 필수
4. 통합 테스트 확장 (2-3h)
