# 개발 체크리스트 및 구현 계획

## 📋 현재 상태 분석

### ✅ 완료된 작업
- [x] 기본 파일 구조 생성 (`finance/`, `decision/` 폴더)
- [x] `finance/calculator.js` - 하드코딩 제거, defaults 주입 구조
- [x] `finance/index.js` - Finance 계산 메인 로직
- [x] `decision/scorer.js` - 점수/생존 개월/리스크 계산
- [x] `decision/simulations.js` - 개선 시뮬레이션 생성
- [x] `decision/index.js` - Decision 판단 메인 로직
- [x] `fixtures/mega-gangnam.js` - 테스트 fixture
- [x] 스키마 변경 제안 문서 (`SCHEMA_CHANGES.md`)

### ⚠️ 검증 필요 항목
- [ ] Finance 계산 로직 정확성 검증
- [ ] Decision 판단 로직 정확성 검증
- [ ] 입력 검증 및 에러 핸들링
- [ ] 출력 형식이 `shared/interfaces.js`와 호환되는지 확인
- [ ] 엣지 케이스 처리 (0원, 음수, Infinity 등)

---

## 🔴 High Priority (필수 작업)

### Backward Compatibility 유지
- [ ] **riskFactors(string[]) 유지 + riskCards(optional) 추가**
  - [ ] `riskFactors`는 문자열 배열로 유지 (레거시)
  - [ ] `riskCards`는 객체 배열로 추가 (신규)
  - [ ] 프론트엔드는 `riskCards` 우선 사용, 없으면 `riskFactors` 사용

### expectedDailySales Fallback 규칙 구현/검증
- [ ] **Fallback 규칙 구현**
  - [ ] `market.expectedDailySales` 우선 사용
  - [ ] 없으면 `brand.defaults.expectedDailySales` 사용
  - [ ] 둘 다 없으면 `targetDailySales` 사용 (최후 fallback)
  - [ ] 최후 fallback 시 GAP=0%임을 명시적으로 출력 (경고 플래그 추천)

---

## 🎯 Phase 1: Finance 계산 엔진 완성

### Step 1.1: 핵심 계산식 검증 및 보완

#### 체크리스트
- [ ] **월 매출 계산**
  - [ ] 목표 판매량 기준 매출 계산 정확성
  - [ ] 기대 판매량 기준 매출 계산 정확성
  - [ ] GAP 비율 계산 정확성 (`(target - expected) / expected`)
  - [ ] 엣지 케이스: `expectedDailySales`가 0이거나 음수인 경우
  - [ ] **expectedDailySales 없음 → `brand.defaults.expectedDailySales`로 gap 계산**
  - [ ] **둘 다 없음 → 최후 fallback `targetDailySales`, gap=0%임을 명시적으로 출력 (경고 플래그 추천)**

- [ ] **월 비용 계산**
  - [ ] 각 비용 항목별 계산 정확성
  - [ ] 브랜드 defaults 주입 검증
  - [ ] 점주 근무 시 인건비 감산 로직 (`ownerWorkingMultiplier`)
  - [ ] 엣지 케이스: defaults 누락 시 에러 처리

- [ ] **월 순이익 계산**
  - [ ] 매출 - 비용 계산 정확성
  - [ ] 적자 상황 처리 (음수 허용)

- [ ] **회수 개월 수 계산**
  - [ ] `초기 투자금 / 월 순이익` 계산
  - [ ] 엣지 케이스: 순이익이 0이거나 음수인 경우 → `paybackMonths = null` (또는 Infinity 사용 시 최종 출력에서는 null 권장)
  - [ ] `monthlyProfit <= 0` → `paybackMonths = null`, `signal = "red"`

- [ ] **손익분기점 계산**
  - [ ] `총 비용 / (평균 단가 × 30일)` 계산 정확성
  - [ ] 엣지 케이스: `avgPrice = 0` 같은 경우 → `breakEvenDailySales = null`

#### 구현 작업
```js
// 파일: engine/finance/calculator.js
// 작업: 입력 검증 추가, 엣지 케이스 처리 강화
```

---

### Step 1.2: 민감도 분석 구현

#### 체크리스트
- [ ] **+10% 시나리오**
  - [ ] 판매량 +10% 시 매출 재계산
  - [ ] 비용 재계산 (매출 비례 항목만 변경)
  - [ ] 순이익 및 회수 기간 재계산

- [ ] **-10% 시나리오**
  - [ ] 판매량 -10% 시 매출 재계산
  - [ ] 비용 재계산
  - [ ] 적자 전환 여부 확인

#### 구현 작업
```js
// 파일: engine/finance/calculator.js
// 함수: calculateSensitivity()
// 상태: ✅ 구현됨 (검증 필요)
```

---

### Step 1.3: 시나리오 테이블 생성

#### 체크리스트
- [ ] **시나리오별 손익 계산**
  - [ ] `scenarios` 배열 순회하며 각각 계산
  - [ ] 각 시나리오별 `profit`, `paybackMonths` 계산
  - [ ] `scenarios`가 없을 때 빈 배열 반환
  - [ ] **scenarioTable에서 `expectedMonthlyRevenue`가 변하지 않는지 확인** (변경되는 것은 `targetDailySales`만)

- [ ] **출력 형식 검증**
  - [ ] `scenarioTable` 배열 구조 확인
  - [ ] 각 항목: `{ daily, profit, paybackMonths }`

#### 구현 작업
```js
// 파일: engine/finance/index.js
// 함수: calculate() 내부 시나리오 테이블 생성 로직
// 상태: ✅ 구현됨 (검증 필요)
```

---

### Step 1.4: Finance 출력 형식 검증

#### 체크리스트
- [ ] **기본 필드 확인**
  - [ ] `monthlyRevenue` (Number)
  - [ ] `monthlyCosts` (Object)
  - [ ] `monthlyProfit` (Number)
  - [ ] `paybackMonths` (Number)
  - [ ] `breakEvenDailySales` (Number)
  - [ ] `sensitivity` (Object)

- [ ] **확장 필드 확인**
  - [ ] `expected` 객체 (expectedDailySales, expectedMonthlyRevenue, gapPctVsTarget)
  - [ ] `scenarioTable` 배열 (선택적)

- [ ] **shared/interfaces.js 호환성**
  - [ ] 기존 필드 형식 일치 확인
  - [ ] 새 필드 추가로 인한 호환성 문제 없음 확인

#### 구현 작업
```js
// 파일: engine/finance/index.js 또는 별도 검증 파일
// 작업: 출력 형식 검증 함수 작성
```

---

## 🎯 Phase 2: Decision 판단 엔진 완성

### Step 2.1: 점수 산출 로직 검증

#### 체크리스트
- [ ] **기본 점수 계산**
  - [ ] 초기 점수 100점에서 시작
  - [ ] 회수 기간 감점 로직 (36개월, 24개월 기준)
  - [ ] 월 순이익 감점 로직 (0원, 500만원 기준)
  - [ ] 점수 범위 제한 (0-100)

- [ ] **상권 점수 반영**
  - [ ] `market.marketScore` 반영 (30% 가중치)
  - [ ] `marketScore` 누락 시 기본값 처리

- [ ] **로드뷰 리스크 반영**
  - [ ] `roadview.riskScore` 반영 (20% 감점)
  - [ ] `riskScore` 누락 시 기본값 처리

- [ ] **성공 확률 계산**
  - [ ] `successProbability = score / 100`
  - [ ] 범위: 0-1

#### 구현 작업
```js
// 파일: engine/decision/scorer.js
// 함수: calculateScore()
// 상태: ✅ 구현됨 (검증 필요)
```

---

### Step 2.2: 신호등 판단 로직 검증

#### 체크리스트
- [ ] **하드컷 규칙**
  - [ ] `paybackMonths >= 36` → "red"
  - [ ] `monthlyProfit <= 0` → "red"

- [ ] **점수 기반 판단**
  - [ ] `score >= 70` → "green"
  - [ ] `score >= 50` → "yellow"
  - [ ] `score < 50` → "red"

#### 구현 작업
```js
// 파일: engine/decision/scorer.js
// 함수: determineSignal()
// 상태: ✅ 구현됨 (검증 필요)
```

---

### Step 2.3: 생존 개월 수 추정 (36 기준선 감점형)

#### 체크리스트
- [ ] **기준선 설정**
  - [ ] 초기값: 36개월

- [ ] **감점 요인 1: 회수 기간**
  - [ ] `paybackMonths > 36`: 강한 감점 (1.5배)
  - [ ] `paybackMonths > 24`: 중간 감점 (0.5배)

- [ ] **감점 요인 2: 매출 -10% 시 적자 전환**
  - [ ] `minus10Profit <= 0`: -15개월
  - [ ] `minus10Profit < monthlyProfit * 0.5`: -8개월

- [ ] **감점 요인 3: 고정비 비중**
  - [ ] `fixedCostShare > 0.35`: -10개월
  - [ ] `fixedCostShare > 0.30`: -5개월

- [ ] **감점 요인 4: 순이익률**
  - [ ] `profitMargin < 0.10`: -5개월
  - [ ] `profitMargin < 0.15`: -2개월

- [ ] **감점 요인 5: 경쟁/로드뷰 점수**
  - [ ] `marketScore < 50`: -3개월
  - [ ] `riskScore < 50`: -2개월

- [ ] **최소값 보장**
  - [ ] 최소 12개월 보장

#### 구현 작업
```js
// 파일: engine/decision/scorer.js
// 함수: estimateSurvivalMonths()
// 상태: ✅ 구현됨 (검증 필요)
```

---

### Step 2.4: 리스크 카드 생성 (템플릿 기반)

#### 체크리스트
- [ ] **리스크 1: 임대료 민감도**
  - [ ] `rentShare > 0.15` 시 리스크 카드 생성
  - [ ] `rentShare > 0.20` → severity "high"
  - [ ] evidence 객체 포함 (rentShare, profitMargin, breakEvenDailySales)
  - [ ] narrative 템플릿 문장 생성

- [ ] **리스크 2: 회수 기간**
  - [ ] `paybackMonths > 30` 시 리스크 카드 생성
  - [ ] `paybackMonths >= 36` → severity "high"
  - [ ] evidence 객체 포함

- [ ] **리스크 3: 목표 vs 기대 GAP**
  - [ ] `gapPctVsTarget > 0.15` 시 리스크 카드 생성
  - [ ] `gapPctVsTarget > 0.25` → severity "high"
  - [ ] evidence 객체 포함

- [ ] **리스크 4: 순이익률 낮음**
  - [ ] `profitMargin < 0.10` 시 리스크 카드 생성
  - [ ] `profitMargin < 0.05` → severity "high"

- [ ] **출력 형식 검증**
  - [ ] 각 카드: `{ id, title, severity, evidence, narrative }`
  - [ ] 배열 형태로 반환

#### 구현 작업
```js
// 파일: engine/decision/scorer.js
// 함수: generateRiskFactors()
// 상태: ✅ 구현됨 (검증 필요)
```

---

### Step 2.5: 개선 시뮬레이션 생성

#### 체크리스트
- [ ] **시뮬레이션 1: 임대료 -10%**
  - [ ] `monthlyRent * 0.9` 적용
  - [ ] Finance 재계산
  - [ ] 생존 개월 수 재계산
  - [ ] 신호등 재판단

- [ ] **시뮬레이션 2: 목표 판매량 -10%**
  - [ ] `targetDailySales * 0.9` 적용
  - [ ] Finance 재계산
  - [ ] 생존 개월 수 재계산
  - [ ] 신호등 재판단

- [ ] **시뮬레이션 3: 목표 판매량 +10%** (선택적)
  - [ ] `targetDailySales * 1.1` 적용
  - [ ] Finance 재계산
  - [ ] 생존 개월 수 재계산
  - [ ] 신호등 재판단

- [ ] **출력 형식 검증**
  - [ ] 각 시뮬레이션: `{ id, delta, survivalMonths, signal }`
  - [ ] 배열 형태로 반환

#### 구현 작업
```js
// 파일: engine/decision/simulations.js
// 함수: generateImprovementSimulations()
// 상태: ✅ 구현됨 (검증 필요)
```

---

### Step 2.6: Decision 출력 형식 검증

#### 체크리스트
- [ ] **기본 필드 확인**
  - [ ] `score` (Number, 0-100)
  - [ ] `signal` (String, "green"|"yellow"|"red")
  - [ ] `survivalMonths` (Number)
  - [ ] `riskLevel` (String, "low"|"medium"|"high")

- [ ] **확장 필드 확인**
  - [ ] `successProbability` (Number, 0-1)
  - [ ] `riskFactors` (Array<Object>)
  - [ ] `improvementSimulations` (Array<Object>)

- [ ] **shared/interfaces.js 호환성**
  - [ ] 기존 필드 형식 일치 확인
  - [ ] `riskFactors` 구조화 (기존 문자열 배열 → 객체 배열)
  - [ ] Backward compatibility 고려

#### 구현 작업
```js
// 파일: engine/decision/index.js 또는 별도 검증 파일
// 작업: 출력 형식 검증 함수 작성
```

---

## 🎯 Phase 3: 테스트 및 검증

### Step 3.1: 단위 테스트 작성

#### 체크리스트
- [ ] **Finance 계산 테스트**
  - [ ] 정상 케이스 테스트
  - [ ] 엣지 케이스 테스트 (0원, 음수, Infinity)
  - [ ] 입력 검증 테스트 (defaults 누락 등)
  - [ ] GAP 계산 정확성 테스트
  - [ ] 시나리오 테이블 정확성 테스트

- [ ] **Decision 판단 테스트**
  - [ ] 점수 계산 정확성 테스트
  - [ ] 신호등 판단 정확성 테스트
  - [ ] 생존 개월 수 계산 정확성 테스트
  - [ ] 리스크 카드 생성 정확성 테스트
  - [ ] 개선 시뮬레이션 정확성 테스트

#### 구현 작업
```js
// 파일: engine/finance/calculator.test.js (생성 필요)
// 파일: engine/decision/scorer.test.js (생성 필요)
// 도구: Jest 또는 Node.js 내장 assert
```

---

### Step 3.2: 통합 테스트 작성

#### 체크리스트
- [ ] **전체 플로우 테스트**
  - [ ] Finance → Decision 연동 테스트
  - [ ] Fixture 기반 통합 테스트
  - [ ] 실제 시나리오 기반 테스트

- [ ] **PDF 느낌 재현 테스트**
  - [ ] 메가커피 강남 시나리오
  - [ ] 점수 60대, 생존 30대, GAP 10~20% 검증
  - [ ] 다른 브랜드/지역 시나리오 추가

#### 구현 작업
```js
// 파일: engine/fixtures/mega-gangnam.js (✅ 이미 있음)
// 파일: engine/fixtures/other-scenarios.js (생성 필요)
```

---

### Step 3.3: 입력 검증 및 에러 핸들링

#### 체크리스트
- [ ] **Finance 입력 검증**
  - [ ] `brand.defaults` 필수 필드 확인
  - [ ] `conditions` 필수 필드 확인
  - [ ] `market.expectedDailySales` 검증
  - [ ] 음수/0 값 검증

- [ ] **Decision 입력 검증**
  - [ ] `finance` 객체 필수 확인
  - [ ] `market`, `roadview` 기본값 처리
  - [ ] 필수 필드 누락 시 에러 처리

- [ ] **에러 메시지**
  - [ ] 명확한 에러 메시지 제공
  - [ ] 어떤 필드가 문제인지 명시

#### 구현 작업
```js
// 파일: engine/finance/validator.js (생성 필요)
// 파일: engine/decision/validator.js (생성 필요)
// 또는 각 index.js에 검증 로직 추가
```

---

## 🎯 Phase 4: 문서화 및 통합 준비

### Step 4.1: API 문서 작성

#### 체크리스트
- [ ] **함수 시그니처 문서화**
  - [ ] 각 함수의 입력/출력 형식 명시
  - [ ] 파라미터 설명
  - [ ] 반환값 설명
  - [ ] 예외 상황 설명

- [ ] **사용 예제 작성**
  - [ ] 기본 사용법
  - [ ] 고급 사용법
  - [ ] 에러 처리 예제

#### 구현 작업
```js
// 파일: engine/API.md (생성 필요)
// 또는 각 파일에 JSDoc 주석 추가
```

---

### Step 4.2: 백엔드 통합 가이드

#### 체크리스트
- [ ] **모듈 export 확인**
  - [ ] `finance/index.js`에서 `calculate` export
  - [ ] `decision/index.js`에서 `calculate` export
  - [ ] 필요한 하위 함수들 export

- [ ] **통합 예제 작성**
  - [ ] 백엔드에서 엔진 호출하는 방법
  - [ ] 입력 데이터 변환 방법
  - [ ] 출력 데이터 활용 방법

#### 구현 작업
```js
// 파일: engine/INTEGRATION.md (생성 필요)
```

---

### Step 4.3: 성능 최적화 (선택적)

#### 체크리스트
- [ ] **계산 최적화**
  - [ ] 불필요한 재계산 제거
  - [ ] 메모이제이션 적용 가능 여부 검토

- [ ] **코드 리뷰**
  - [ ] 코드 가독성 확인
  - [ ] 중복 코드 제거
  - [ ] 네이밍 일관성 확인

---

## 📊 구현 우선순위

### 🔴 High Priority (필수)
1. **Phase 1 Step 1.1**: 핵심 계산식 검증 및 보완
2. **Phase 1 Step 1.4**: Finance 출력 형식 검증
3. **Phase 2 Step 2.6**: Decision 출력 형식 검증
4. **Phase 3 Step 3.1**: 단위 테스트 작성
5. **Phase 3 Step 3.3**: 입력 검증 및 에러 핸들링

### 🟡 Medium Priority (권장)
6. **Phase 3 Step 3.2**: 통합 테스트 작성
7. **Phase 4 Step 4.1**: API 문서 작성
8. **Phase 4 Step 4.2**: 백엔드 통합 가이드

### 🟢 Low Priority (선택적)
9. **Phase 4 Step 4.3**: 성능 최적화

---

## 🚀 다음 단계

1. **즉시 시작**: Phase 1 Step 1.1 - 핵심 계산식 검증
2. **병렬 진행 가능**: Phase 3 Step 3.1 - 단위 테스트 작성
3. **통합 준비**: Phase 4 Step 4.2 - 백엔드 통합 가이드

---

## 📝 참고 문서

- `engine/ROLE.md`: 역할 정의 및 입출력 스펙
- `engine/SCHEMA_CHANGES.md`: 스키마 변경 제안
- `engine/IMPLEMENTATION_SUMMARY.md`: 구현 완료 요약
- `shared/interfaces.js`: 공유 인터페이스 정의
