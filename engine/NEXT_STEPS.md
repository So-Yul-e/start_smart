# 다음 단계 작업 가이드

## 📊 현재 진행 상황

### ✅ 완료된 작업
- [x] **High Priority 작업 (100% 완료)**
  - [x] expectedDailySales Fallback 규칙 구현
  - [x] paybackMonths null 처리
  - [x] breakEvenDailySales null 처리
  - [x] 입력 검증 강화
  - [x] riskFactors + riskCards 병행 구현
  - [x] NaN/Infinity 처리 강화
  - [x] 브랜드 데이터 시스템 구축 (12개 브랜드)

### ⏳ 다음 단계 (Medium Priority)

---

## 🎯 Phase 1: 출력 형식 검증 (우선순위 1)

### Step 1.1: Finance 출력 검증 함수 작성

**목표**: Finance 계산 결과가 스펙과 일치하는지 검증

**작업 파일**: `engine/finance/validator.js` (신규 생성)

**구현 내용**:
- 필수 필드 확인 (`monthlyRevenue`, `monthlyCosts`, `paybackMonths` 등)
- 확장 필드 확인 (`expected`, `scenarioTable`)
- `shared/interfaces.js` 호환성 확인
- 엣지 케이스 검증 (null 값 처리)

**예상 소요 시간**: 2-3시간

**체크리스트**:
- [ ] `validateFinanceOutput()` 함수 작성
- [ ] Finance index.js에 검증 통합 (개발 환경에서만)
- [ ] 검증 테스트 작성

---

### Step 1.2: Decision 출력 검증 함수 작성

**목표**: Decision 판단 결과가 스펙과 일치하는지 검증

**작업 파일**: `engine/decision/validator.js` (신규 생성)

**구현 내용**:
- 필수 필드 확인 (`score`, `signal`, `survivalMonths`, `riskLevel`)
- 확장 필드 확인 (`successProbability`, `riskCards`, `improvementSimulations`)
- `riskFactors` (레거시) + `riskCards` (신규) 병행 확인
- Backward compatibility 확인

**예상 소요 시간**: 2-3시간

**체크리스트**:
- [ ] `validateDecisionOutput()` 함수 작성
- [ ] Decision index.js에 검증 통합 (개발 환경에서만)
- [ ] 검증 테스트 작성

---

## 🎯 Phase 2: 단위 테스트 작성 (우선순위 2)

### Step 2.1: Finance 계산 단위 테스트

**목표**: Finance 계산 로직의 정확성 검증

**작업 파일**: `engine/finance/calculator.test.js` (신규 생성)

**테스트 케이스**:
1. **정상 케이스**
   - 기본 계산 정확성
   - GAP 계산 정확성
   - 시나리오 테이블 정확성

2. **엣지 케이스**
   - `monthlyProfit <= 0` → `paybackMonths = null`
   - `expectedDailySales` fallback 규칙
   - `avgPrice = 0` → `breakEvenDailySales = null`

3. **입력 검증**
   - `brand.defaults` 누락 시 에러
   - 필수 필드 누락 시 에러

**예상 소요 시간**: 2-3시간

**체크리스트**:
- [ ] 정상 케이스 테스트 작성
- [ ] 엣지 케이스 테스트 작성
- [ ] 입력 검증 테스트 작성
- [ ] 테스트 실행 및 통과 확인

---

### Step 2.2: Decision 판단 단위 테스트

**목표**: Decision 판단 로직의 정확성 검증

**작업 파일**: `engine/decision/scorer.test.js` (신규 생성)

**테스트 케이스**:
1. **점수 계산**
   - 기본 점수 계산
   - `paybackMonths` null 처리
   - `successProbability` 계산 (0~1)

2. **신호등 판단**
   - 하드컷 규칙 (`paybackMonths >= 36`, `monthlyProfit <= 0`)
   - 점수 기반 판단 (70/50 기준)

3. **생존 개월 수**
   - 36 기준선 감점형 로직
   - 각 감점 요인별 테스트

4. **리스크 카드 생성**
   - 각 리스크 카드 생성 조건
   - `riskFactors` + `riskCards` 병행 확인

**예상 소요 시간**: 2-3시간

**체크리스트**:
- [ ] 점수 계산 테스트 작성
- [ ] 신호등 판단 테스트 작성
- [ ] 생존 개월 수 테스트 작성
- [ ] 리스크 카드 생성 테스트 작성
- [ ] 테스트 실행 및 통과 확인

---

## 🎯 Phase 3: 통합 테스트 확장 (우선순위 3)

### Step 3.1: 다양한 시나리오 테스트

**목표**: 다양한 브랜드/지역/조건 조합 테스트

**작업 파일**: `engine/fixtures/` (추가 생성)

**시나리오**:
1. **저가형 브랜드 + 저렴한 지역** (예: 메가커피 + 노원)
2. **프리미엄 브랜드 + 강남** (예: 투썸플레이스 + 강남)
3. **적자 시나리오** (낮은 판매량)
4. **최적 조건 시나리오** (높은 판매량, 낮은 임대료)

**예상 소요 시간**: 2-3시간

**체크리스트**:
- [ ] 다양한 브랜드 조합 테스트 작성
- [ ] 다양한 지역 조건 테스트 작성
- [ ] 엣지 케이스 시나리오 테스트 작성

---

## 🎯 Phase 4: 문서화 및 통합 준비 (우선순위 4)

### Step 4.1: API 문서 작성

**목표**: 엔진 사용법 문서화

**작업 파일**: `engine/API.md` (신규 생성)

**내용**:
- 함수 시그니처 및 파라미터 설명
- 입력/출력 예제
- 에러 처리 방법
- 사용 예제

**예상 소요 시간**: 2-3시간

---

### Step 4.2: 백엔드 통합 가이드

**목표**: 백엔드에서 엔진 사용 방법 가이드

**작업 파일**: `engine/INTEGRATION.md` (신규 생성)

**내용**:
- 모듈 import 방법
- 브랜드 데이터 로드 방법
- 엔진 호출 방법
- 에러 처리 방법

**예상 소요 시간**: 1-2시간

---

## 📋 우선순위별 작업 순서

### 🔴 즉시 시작 (High Priority)
1. **Finance 출력 검증 함수 작성** (2-3h)
2. **Decision 출력 검증 함수 작성** (2-3h)

### 🟡 다음 단계 (Medium Priority)
3. **Finance 계산 단위 테스트** (2-3h)
4. **Decision 판단 단위 테스트** (2-3h)
5. **다양한 시나리오 테스트** (2-3h)

### 🟢 선택적 (Low Priority)
6. **API 문서 작성** (2-3h)
7. **백엔드 통합 가이드** (1-2h)

---

## 🚀 추천 시작 순서

### Option A: 검증 우선 (안정성 중심)
1. Finance 출력 검증 함수 작성
2. Decision 출력 검증 함수 작성
3. 단위 테스트 작성

### Option B: 테스트 우선 (빠른 검증)
1. Finance 계산 단위 테스트
2. Decision 판단 단위 테스트
3. 출력 검증 함수 작성

### Option C: 통합 준비 우선 (협업 중심)
1. API 문서 작성
2. 백엔드 통합 가이드
3. 검증 및 테스트

---

## 💡 권장 사항

**현재 상황**: High Priority 작업 완료, 기본 기능 동작 확인됨

**추천**: **Option A (검증 우선)**
- 이유: 출력 형식 검증이 완료되면 다른 팀과의 통합이 안전함
- 다음: 단위 테스트로 계산 정확성 보장
- 마지막: 문서화로 협업 효율성 향상

---

## 📝 다음 작업 체크리스트

### 즉시 시작 가능한 작업
- [ ] `engine/finance/validator.js` 생성
- [ ] `engine/decision/validator.js` 생성
- [ ] `engine/finance/calculator.test.js` 생성
- [ ] `engine/decision/scorer.test.js` 생성

### 준비 작업
- [ ] 테스트 프레임워크 선택 (Jest 또는 Node.js assert)
- [ ] 테스트 실행 스크립트 설정

---

## 📊 예상 일정

| 작업 | 예상 시간 | 우선순위 |
|------|----------|----------|
| 출력 검증 함수 (Finance + Decision) | 4-6h | 🔴 High |
| 단위 테스트 (Finance + Decision) | 4-6h | 🔴 High |
| 통합 테스트 확장 | 2-3h | 🟡 Medium |
| 문서화 | 3-5h | 🟡 Medium |

**총 예상 시간**: 13-20시간

---

## 🎯 다음 단계 제안

**1단계 (즉시 시작)**: Finance 출력 검증 함수 작성
- 가장 빠르게 완료 가능
- 다른 작업의 기반이 됨

**2단계**: Decision 출력 검증 함수 작성
- Finance와 유사한 구조로 빠르게 완료 가능

**3단계**: 단위 테스트 작성
- 검증 함수가 완료된 후 테스트 작성이 수월함
