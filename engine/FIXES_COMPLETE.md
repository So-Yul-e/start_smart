# 수정 완료 요약

## ✅ 완료된 수정사항

### 1. Score Breakdown 추가 ✅
- **파일**: `engine/decision/scorer.js`
- **변경사항**:
  - `calculateScore()` 함수가 이제 `breakdown` 객체를 반환
  - 각 항목별 점수 (0-100): `payback`, `profitability`, `gap`, `sensitivity`, `fixedCost`, `market`, `roadview`
  - 최종 점수는 기존 방식 유지 (하위 호환성)

**사용 예시**:
```js
{
  score: 82,
  successProbability: 0.82,
  breakdown: {
    payback: 85,
    profitability: 100,
    gap: 70,
    sensitivity: 100,
    fixedCost: 100,
    market: 65,
    roadview: 60
  }
}
```

### 2. Survival Months 보너스 규칙 추가 ✅
- **파일**: `engine/decision/scorer.js`
- **변경사항**:
  - `estimateSurvivalMonths()` 함수에 보너스 규칙 추가
  - 회수 기간이 18개월 미만일 때 +6개월 보너스

**로직**:
```js
if (finance.paybackMonths !== null && isFinite(finance.paybackMonths) && finance.paybackMonths < 18) {
  survivalMonths += 6;  // 보너스
}
```

### 3. Simulations.js 수정 ✅
- **파일**: `engine/decision/simulations.js`
- **변경사항**:
  - `expectedDailySales` 덮어쓰기 제거
  - 시나리오 계산 시 `market.expectedDailySales` 유지

**수정 전**:
```js
market,  // expectedDailySales가 덮어써질 수 있음
```

**수정 후**:
```js
market: { ...market, expectedDailySales: market.expectedDailySales },  // 명시적으로 유지
```

### 4. determineSignal 개선 ✅
- **파일**: `engine/decision/scorer.js`
- **변경사항**:
  - 중복 함수 정의 제거
  - GAP/민감도/고정비 반영 (이미 구현되어 있었음)
  - GAP 15% 이상 → yellow
  - -10%에 적자 전환 → yellow
  - 고정비 비중 35% 이상 → yellow

### 5. Validator 업데이트 ✅
- **파일**: `engine/decision/validator.js`
- **변경사항**:
  - `breakdown` 필드 검증 추가

### 6. Index.js 업데이트 ✅
- **파일**: `engine/decision/index.js`
- **변경사항**:
  - `breakdown` 필드를 결과에 포함

---

## 📊 개선 효과

### Before (수정 전)
- 점수: 82점 / 71점 두 덩어리로만 구분
- Breakdown 없음 → 약점 파악 어려움
- Survival months: 36개월로 고정적

### After (수정 후)
- 점수: 82점 / 71점 (유지하되 breakdown으로 구분력 향상)
- Breakdown 제공 → "이 브랜드는 수익성은 좋은데 GAP이 크다" 같은 분석 가능
- Survival months: 18개월 미만 시 42개월까지 증가 가능

---

## 🧪 테스트 결과

### Breakdown 테스트
```
이디야커피:
  - 회수 기간: 85점
  - 수익성: 100점
  - GAP: 70점 (약점)
  - 민감도: 100점
  - 고정비: 100점

던킨도너츠:
  - 회수 기간: 70점 (약점)
  - 수익성: 100점
  - GAP: 70점 (약점)
```

### 신호등 개선
- GAP 20% → 모든 브랜드가 **yellow** 신호등 (이전에는 green이었음)
- 더 정확한 리스크 판단 가능

---

## 📝 다음 단계

모든 P0 (반드시 수정) 항목 완료:
- [x] simulations.js에서 expectedDailySales 덮어쓰기 제거
- [x] determineSignal에 GAP/민감도/고정비 반영
- [x] score breakdown 추가
- [x] survivalMonths 보너스 규칙 추가

P1 (강력 추천) 항목도 완료:
- [x] score breakdown 추가
- [x] survivalMonths 보너스 규칙 추가

---

## ✅ 체크리스트

- [x] Score breakdown 추가
- [x] Survival months 보너스 규칙 추가
- [x] Simulations.js 수정
- [x] determineSignal 개선
- [x] Validator 업데이트
- [x] 테스트 통과 확인

**모든 수정 완료!** 🎉
