# 남은 작업 목록

## ✅ 완료된 작업

### High Priority (100% 완료)
- [x] expectedDailySales Fallback 규칙 구현
- [x] paybackMonths null 처리
- [x] breakEvenDailySales null 처리
- [x] 입력 검증 강화
- [x] riskFactors + riskCards 병행 구현
- [x] NaN/Infinity 처리 강화
- [x] 브랜드 데이터 시스템 구축 (12개 브랜드)
- [x] **Finance 출력 검증 함수 작성** ✅
- [x] **Decision 출력 검증 함수 작성** ✅

---

## ⏳ 남은 작업

### 🔴 High Priority (다음 단계)

#### 1. 단위 테스트 작성 ✅ **완료**
- [x] `engine/finance/calculator.test.js` 생성 ✅
  - [x] 정상 케이스 테스트
  - [x] 엣지 케이스 테스트 (0원, 음수, null)
  - [x] 입력 검증 테스트
  - [x] GAP 계산 정확성 테스트
  - [x] 시나리오 테이블 정확성 테스트
- [x] `engine/decision/scorer.test.js` 생성 ✅
  - [x] 점수 계산 정확성 테스트
  - [x] 신호등 판단 정확성 테스트
  - [x] 생존 개월 수 계산 정확성 테스트
  - [x] 리스크 카드 생성 정확성 테스트
  - [x] Breakdown 정확성 테스트
  - [x] Survival months 보너스 테스트

**테스트 결과**: ✅ 61개 테스트 모두 통과

---

### 🟡 Medium Priority

#### 2. 통합 테스트 확장 ✅ **완료**
- [x] 다양한 브랜드/지역/조건 조합 테스트 ✅
  - [x] 저가형 브랜드 + 저렴한 지역
  - [x] 프리미엄 브랜드 + 강남
  - [x] 적자 시나리오
  - [x] 최적 조건 시나리오
  - [x] 대출 포함 시나리오
- [x] `engine/fixtures/integration-scenarios.js` 생성 ✅

**테스트 결과**: ✅ 5개 시나리오 모두 테스트 완료

#### 3. API 문서 작성
- [ ] `engine/API.md` 생성
  - 함수 시그니처 및 파라미터 설명
  - 입력/출력 예제
  - 에러 처리 방법
  - 사용 예제

**예상 소요 시간**: 2-3시간

#### 4. 백엔드 통합 가이드
- [ ] `engine/INTEGRATION.md` 생성
  - 모듈 import 방법
  - 브랜드 데이터 로드 방법
  - 엔진 호출 방법
  - 에러 처리 방법

**예상 소요 시간**: 1-2시간

---

### 🟢 Low Priority (선택적)

#### 5. 성능 최적화
- [ ] 계산 성능 측정
- [ ] 병목 지점 파악 및 최적화

#### 6. 추가 기능
- [ ] PDF 파싱 자동화 (선택적)
- [ ] 브랜드 데이터 업데이트 자동화

---

## 📊 우선순위별 작업 순서

### 즉시 시작 가능 (High Priority)
1. **Finance 계산 단위 테스트** (2-3h)
2. **Decision 판단 단위 테스트** (2-3h)

### 다음 단계 (Medium Priority)
3. **통합 테스트 확장** (2-3h)
4. **API 문서 작성** (2-3h)
5. **백엔드 통합 가이드** (1-2h)

---

## 📝 체크리스트 요약

### High Priority
- [x] 출력 검증 함수 (Finance + Decision) ✅
- [x] 단위 테스트 (Finance + Decision) ✅ **완료**

### Medium Priority
- [x] 통합 테스트 확장 ✅ **완료**
- [ ] API 문서 작성 ⏳ (이미 존재: `API_DOCUMENTATION.md`)
- [ ] 백엔드 통합 가이드 ⏳ (이미 존재: `BACKEND_INTEGRATION_GUIDE.md`)

---

## 🎯 다음 작업 제안

**1단계**: Finance 계산 단위 테스트 작성
- 가장 중요한 계산 로직 검증
- 엣지 케이스 처리 확인

**2단계**: Decision 판단 단위 테스트 작성
- 점수 계산 정확성 확인
- 신호등 판단 로직 검증

**3단계**: 통합 테스트 확장
- 다양한 시나리오로 실제 사용 케이스 검증
