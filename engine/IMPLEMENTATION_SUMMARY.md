# 구현 완료 요약

## ✅ 완료된 작업

### Step A: 입출력 스키마 변경 제안 문서
- **파일**: `engine/SCHEMA_CHANGES.md`
- **내용**: Backward Compatible 방식의 스키마 확장 제안
- **핵심 변경사항**:
  1. Finance 입력에 `market.expectedDailySales` 추가
  2. Finance 출력에 `expected` 객체 및 `scenarioTable` 추가
  3. Decision 출력에 `successProbability`, 구조화된 `riskFactors`, `improvementSimulations` 추가

### Step B: calculator.js 구현 (하드코딩 제거)
- **파일**: `engine/finance/calculator.js`
- **주요 특징**:
  - ✅ 모든 기본값을 `brand.defaults`에서 주입받음
  - ✅ `avgPrice`, `cogsRate`, `laborRate` 등 하드코딩 제거
  - ✅ `ownerWorking` 감산 계수 적용 (기본 0.6)
  - ✅ GAP 계산 (`gapPctVsTarget`) 구현
  - ✅ 시나리오 테이블 생성 로직 포함

### Step C: scorer.js 구현 (survivalMonths 감점형)
- **파일**: `engine/decision/scorer.js`
- **주요 특징**:
  - ✅ 기준선 36개월에서 시작
  - ✅ 5개 감점 요인 구현:
    1. `paybackMonths` (회수 기간)
    2. `profitMargin` (순이익률)
    3. `revenue -10%` 시 적자 전환 여부
    4. `fixedCostShare` (고정비 비중)
    5. 경쟁/로드뷰 점수 (가볍게)
  - ✅ 구조화된 리스크 카드 생성
  - ✅ 성공 확률 계산 (`score/100`)

### Step D: Fixture 테스트 (PDF 느낌 재현)
- **파일**: `engine/fixtures/mega-gangnam.js`
- **테스트 결과**:
  ```
  ✅ 점수 60대: 67점
  ✅ 생존 30대: 35개월
  ✅ GAP 10~20%: 17.2%
  ```
- **검증 통과**: 모든 목표 달성

---

## 📁 생성된 파일 구조

```
engine/
├── ROLE.md                          # 역할 정의 (업데이트됨)
├── SCHEMA_CHANGES.md                # 스키마 변경 제안 문서
├── IMPLEMENTATION_SUMMARY.md         # 구현 완료 요약 (본 문서)
├── finance/
│   ├── index.js                     # Finance 계산 메인 로직
│   └── calculator.js                # 손익 계산식 구현
├── decision/
│   ├── index.js                     # Decision 판단 메인 로직
│   ├── scorer.js                    # 점수/생존 개월/리스크 계산
│   └── simulations.js              # 개선 시뮬레이션 생성
└── fixtures/
    └── mega-gangnam.js              # 메가커피 강남 시나리오 테스트
```

---

## 🎯 핵심 구현 사항

### 1. 하드코딩 제거
```js
// ❌ 이전 (하드코딩)
const avgPrice = 4500;
const cogsRate = 0.3;

// ✅ 현재 (주입 방식)
const avgPrice = brand.defaults.avgPrice;
const cogsRate = brand.defaults.cogsRate;
```

### 2. GAP 계산
```js
expected: {
  expectedDailySales: 256,
  expectedMonthlyRevenue: 26880000,
  gapPctVsTarget: 0.172  // (target - expected) / expected
}
```

### 3. 생존 개월 수 감점형
```js
// 기준선 36개월에서 시작
let survivalMonths = 36;

// 감점 요인 적용
if (paybackMonths > 36) survivalMonths -= (paybackMonths - 36) * 1.5;
if (minus10Profit <= 0) survivalMonths -= 15;
if (fixedCostShare > 0.35) survivalMonths -= 10;
// ...
```

### 4. 구조화된 리스크 카드
```js
riskFactors: [{
  id: "rent_sensitivity",
  title: "임대료 대비 매출 민감도 높음",
  severity: "high",
  evidence: { rentShare: 0.18, ... },
  narrative: "매출이 10% 하락하면..."
}]
```

---

## 🧪 테스트 실행 방법

```bash
cd engine
node fixtures/mega-gangnam.js
```

**예상 출력**:
- 점수: 60대
- 생존 개월: 30대
- GAP: 10~20%

---

## 📊 다음 단계 제안

1. **백엔드 통합**: 엔진 모듈을 백엔드에서 호출하도록 연결
2. **프론트엔드 연동**: 새로운 필드들을 UI에 표시
3. **추가 테스트 케이스**: 다른 브랜드/지역 시나리오 추가
4. **성능 최적화**: 필요시 계산 로직 최적화

---

## ⚠️ 주의사항

1. **브랜드 기본값 필수**: `brand.defaults` 객체가 반드시 필요합니다
2. **Backward Compatibility 정책**: 
   - 기존 필드는 유지하고 신규 필드를 optional로 추가한다
   - 기존 필드는 제거하지 않는다
   - 프론트엔드는 신규 필드 우선 사용, 없으면 레거시 사용
3. **expectedDailySales 원칙**:
   - AI 기대값은 상권 평균(`expectedDailySales`)이다
   - Fallback 규칙: `market.expectedDailySales` → `brand.defaults.expectedDailySales` → `targetDailySales` (최후)
   - Fallback 규칙은 ROLE.md와 동일하다
4. **successProbability 표기 방식**:
   - `score` (0~100)는 내부 점수
   - `successProbability`는 0~1 사이의 값 (score/100)
   - 리포트에는 %로 표시 (`successProbability * 100`)
5. **점주 근무 감산**: `ownerWorkingMultiplier` 기본값은 0.6 (40% 절감)
6. **시나리오 테이블**: `scenarios` 배열이 없으면 `scenarioTable`은 생성되지 않습니다
7. **시나리오 계산 시 주의**: `scenarioTable` 계산 시 변경되는 것은 `targetDailySales`만이며, `market.expectedDailySales`는 원래 값을 유지한다

---

## 📝 참고 문서

- `engine/ROLE.md`: 상세 입출력 스펙
- `engine/SCHEMA_CHANGES.md`: 스키마 변경 제안
- `docs/일 판매량별 손익 비교 (200잔 _ 250잔 _ 300잔).md`: 시나리오 테이블 참고
- `docs/초기 투자비 (10평 기준, 강남구).md`: 초기 투자비 참고
