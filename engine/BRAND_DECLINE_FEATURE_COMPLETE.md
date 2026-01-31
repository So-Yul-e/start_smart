# 브랜드 점포 감소율 기능 구현 완료

## ✅ 완료된 작업

### 1. Finance 엔진 수정 ✅
- **파일**: `engine/finance/calculator.js`
- **변경사항**:
  - 입력 확장: `brand.brandDeclineRate`, `brand.avgMonthlySales`, `brand.avgSalesPerPyeong` 지원
  - `rawExpectedDailySales` 계산: `avgMonthlySales / avgPrice / 30`
  - 브랜드 리스크 점수 계산 (점포 감소율 기반)
  - `revenueAdjustmentFactor` 계산: `1 - (brandRiskScore * 0.4)`
  - `adjustedExpectedDailySales` 계산: `rawExpectedDailySales * revenueAdjustmentFactor`
  - Fallback 규칙: `adjustedExpectedDailySales → market.expectedDailySales → brand.defaults.expectedDailySales → targetDailySales`
  - `finance.expected` 필드 확장:
    - `rawExpectedDailySales`
    - `adjustedExpectedDailySales`
    - `revenueAdjustmentFactor`
    - `brandDeclineRate`

### 2. Decision 엔진 수정 ✅
- **파일**: `engine/decision/scorer.js`
- **변경사항**:
  - GAP 계산 기준 변경: `adjustedExpectedDailySales` 기준으로 계산
  - 브랜드 감소율 기반 점수 감점:
    - `brandDeclineRate >= 0.30`: -30점
    - `brandDeclineRate >= 0.20`: -15점
  - 신호등 강제 조건:
    - `brandDeclineRate >= 0.30`: signal = "red" (하드컷)
    - `brandDeclineRate >= 0.20`: signal = "yellow" (기존 green이어도 강제 변경)
  - `brand_decline` riskCard 자동 생성:
    - `brandDeclineRate >= 0.10`: medium/high severity
    - evidence 및 narrative 포함

### 3. 개선 시뮬레이션 확장 ✅
- **파일**: `engine/decision/simulations.js`
- **변경사항**:
  - "현실 기대 매출 기준 재계산" 시뮬레이션 추가
  - `targetDailySales > adjustedExpectedDailySales`일 때만 생성
  - ⚠️ `expectedDailySales`는 절대 직접 수정하지 않음 (원래 값 유지)
  - `targetDailySales`만 `adjustedExpectedDailySales`로 변경하여 재계산

### 4. 스키마 업데이트 ✅
- **파일**: `shared/interfaces.js`
- **변경사항**:
  - `finance.expected` 객체에 브랜드 데이터 기반 파생 지표 추가

### 5. 테스트 케이스 추가 ✅
- **파일**: `engine/fixtures/brand-decline-test.js`
- **테스트 케이스**:
  - 브랜드 감소율 없음 (기존 결과 유지) ✅
  - 브랜드 감소율 10% (중간 리스크) ✅
  - 브랜드 감소율 20% (높은 리스크, yellow 강제) ✅
  - 브랜드 감소율 30% (최고 리스크, red 강제) ✅

---

## 📊 테스트 결과

### 테스트 1: 브랜드 감소율 없음
- ✅ 기존 결과 유지
- 기대 판매량: 250잔 (market.expectedDailySales 사용)
- GAP: 20.0%
- 신호등: yellow

### 테스트 2: 브랜드 감소율 10% (중간 리스크)
- ✅ 정상 작동
- 원시 기대 판매량: 285.7잔
- 보정 계수: 0.8 (brandRiskScore 0.5 → 1 - 0.5 * 0.4 = 0.8)
- 보정된 기대 판매량: 228.6잔
- 브랜드 감소율: 10.0%
- GAP: 31.3% (300 vs 228.6)
- 신호등: yellow
- 점수: 68점

### 테스트 3: 브랜드 감소율 20% (높은 리스크)
- ✅ yellow 강제 확인
- 보정된 기대 판매량: 194.3잔
- 브랜드 감소율: 20.0%
- 신호등: yellow ✅
- 점수: 57점 (-15점 감점)

### 테스트 4: 브랜드 감소율 30% (최고 리스크)
- ✅ red 강제 확인
- 보정된 기대 판매량: 171.4잔
- 브랜드 감소율: 30.0%
- 신호등: red ✅
- 점수: 47점 (-30점 감점)

---

## 🔍 계산 로직 상세

### 브랜드 리스크 점수
```js
brandRiskScore =
  declineRate >= 0.30 ? 1.0 :  // 최고 리스크
  declineRate >= 0.20 ? 0.8 :  // 높은 리스크
  declineRate >= 0.10 ? 0.5 :  // 중간 리스크
  0.2;                          // 낮은 리스크 (기본값)
```

### 매출 보정 계수
```js
revenueAdjustmentFactor = 1 - (brandRiskScore * 0.4);
```

예시:
- `brandDeclineRate = 0.10` → `brandRiskScore = 0.5` → `revenueAdjustmentFactor = 0.8`
- `brandDeclineRate = 0.20` → `brandRiskScore = 0.8` → `revenueAdjustmentFactor = 0.68`
- `brandDeclineRate = 0.30` → `brandRiskScore = 1.0` → `revenueAdjustmentFactor = 0.6`

### 보정된 기대 판매량
```js
rawExpectedDailySales = avgMonthlySales / avgPrice / 30;
adjustedExpectedDailySales = rawExpectedDailySales * revenueAdjustmentFactor;
```

---

## ⚠️ 중요 사항

### expectedDailySales 변경 금지
- `expectedDailySales`는 절대 user 입력이나 시뮬레이션에서 직접 수정하지 않음
- 원래 값(`market.expectedDailySales`)은 항상 유지
- `targetDailySales`만 변경하여 재계산

### Fallback 우선순위
1. `adjustedExpectedDailySales` (브랜드 데이터 기반, 보정 적용)
2. `market.expectedDailySales` (상권 분석 결과)
3. `brand.defaults.expectedDailySales` (브랜드 기본값)
4. `targetDailySales` (최후 fallback, GAP=0% 경고)

---

## 📝 다음 단계

1. **데이터베이스 연동**: `schema_clean.sql`에서 브랜드 데이터 파싱
   - `franchise_store_stats` → `brandDeclineRate` 계산
   - `franchise_sales_stats` → `avgMonthlySales` 추출
2. **브랜드 로더 확장**: `brandLoader.js`에 브랜드 데이터 통합
3. **추가 테스트**: 다양한 브랜드 감소율 시나리오

---

## ✅ 체크리스트

- [x] finance/calculator.js: rawExpectedDailySales, revenueAdjustmentFactor, adjustedExpectedDailySales 계산
- [x] decision/scorer.js: GAP 계산을 adjustedExpectedDailySales 기준으로 변경
- [x] decision/scorer.js: brandDeclineRate 기반 점수 감점 및 신호등 조건 추가
- [x] decision/scorer.js: brand_decline riskCard 생성
- [x] decision/simulations.js: 현실 기대 매출 기준 재계산 시뮬레이션 추가
- [x] shared/interfaces.js: expected 객체 확장
- [x] 테스트 케이스 추가 및 통과 확인

**모든 작업 완료!** 🎉
