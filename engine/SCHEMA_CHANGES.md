# 입출력 스키마 변경 제안

## 📋 변경 배경

PDF 리포트 수준의 상세 분석을 제공하기 위해 필드 확장이 필요합니다.
**기존 필드는 모두 유지하며, 새로운 필드만 추가하는 Backward Compatible 방식**으로 진행합니다.

## 🔄 변경 사항 요약

### 1. Finance 입력 스키마 변경

#### 추가 필드
```js
{
  // ... 기존 필드 유지 ...
  market: {
    expectedDailySales: 256,    // 상권 평균 일 판매량 (AI 기대치, optional)
    radiusM: 500                // 반경 (미터)
  },
  scenarios: [200, 250, 300]    // 시나리오별 손익 비교 (선택적)
}
```

**이유**: PDF 4p "AI 기대 vs 사용자 목표" + GAP 계산을 위해 필요

**Fallback 규칙** (expectedDailySales가 없을 경우):
1. `market.expectedDailySales` 우선 사용
2. 없으면 `brand.defaults.expectedDailySales` 사용
3. 둘 다 없으면 `targetDailySales` 사용 (최후 fallback, 이 경우 GAP=0%)

**주의**: MVP 단계에서는 `market.expectedDailySales`를 optional로 두되, fallback 규칙을 반드시 구현해야 합니다.

---

### 2. Finance 출력 스키마 변경

#### 추가 필드
```js
{
  // ... 기존 필드 모두 유지 ...
  expected: {
    expectedDailySales: 256,
    expectedMonthlyRevenue: 26880000,
    gapPctVsTarget: 0.17  // (target - expected) / expected
  },
  scenarioTable: [  // 시나리오별 손익 비교표
    { daily: 200, profit: 4350000, paybackMonths: 46 },
    { daily: 250, profit: 6710000, paybackMonths: 30 },
    { daily: 300, profit: 9070000, paybackMonths: 22 }
  ]
}
```

**이유**: 
- PDF 2p "GAP +17%" 표시
- PDF 4p 그래프 데이터
- PDF 내부 "일 판매량별 손익 비교" 테이블 재현

---

### 3. Decision 출력 스키마 변경

#### 추가 필드
```js
{
  // ... 기존 필드 모두 유지 ...
  successProbability: 0.62,  // 성공 확률 (0~1, score/100)
  
  // riskFactors: 문자열 배열 (레거시, 유지)
  riskFactors: [
    "회수 기간이 36개월을 초과함",
    "목표 판매량 달성 난이도 높음"
  ],
  
  // riskCards: 객체 배열 (신규, 추가)
  riskCards: [
    {
      id: "rent_sensitivity",
      title: "임대료 대비 매출 민감도 높음",
      severity: "high",
      evidence: { rentShare: 0.18, profitMargin: 0.10, breakEvenDailySales: 260 },
      narrative: "매출이 10% 하락하면 손익분기 도달이 어려워집니다."
    }
  ],
  
  // 새로운 필드
  improvementSimulations: [
    {
      id: "rent_minus_10",
      delta: "rent -10%",
      survivalMonths: 38,
      signal: "green"
    }
  ]
}
```

**주의**: `riskFactors`는 유지되고, `riskCards`가 추가됩니다. 프론트엔드는 가능하면 `riskCards`를 사용하고, 없으면 `riskFactors`를 사용합니다.

**이유**:
- PDF 6p "성공확률 단정" 표시
- PDF 7p Risk 1/2/3 카드형 구조
- PDF 8p 개선 시뮬레이션 그래프

---

## ✅ Backward Compatibility 보장

### 호환성 정책 (핵심 원칙)
**"기존 필드는 유지하고, 신규 필드는 optional로 추가한다. 기존 필드는 제거하지 않는다."**

### 기존 코드 호환성
- **기존 필드는 모두 유지**: `monthlyRevenue`, `monthlyCosts`, `paybackMonths` 등
- **기존 riskFactors 문자열 배열은 유지 (legacy)**: 기존 코드가 깨지지 않도록 보장
- **신규 riskCards 객체 배열 추가**: 프론트엔드는 가능하면 `riskCards` 사용, 없으면 `riskFactors` 사용 (폴백)
- **새 필드는 optional로 처리**: 기존 클라이언트는 새 필드를 무시하면 됨

### 마이그레이션 가이드
```js
// 기존 코드 (여전히 동작)
const score = decision.score;
const signal = decision.signal;

// 새로운 코드 (확장 사용)
const successProb = decision.successProbability || (decision.score / 100);
const riskCards = decision.riskFactors || [];
```

---

## 📊 영향 범위

### 영향받는 모듈
1. **계산 엔진 (engine/)**: Finance/Decision 출력 형식 변경
2. **백엔드 (backend/)**: 엔진 호출 시 입력 형식 변경, 응답 파싱
3. **프론트엔드 (frontend/)**: UI에서 새 필드 표시 (선택적)

### 영향받지 않는 모듈
- **AI-로드뷰**: 변경 없음
- **AI-판단**: 변경 없음 (엔진 결과를 받아서 처리)

---

## 🎯 구현 우선순위

### Phase 1 (필수)
- [x] Finance 입력에 `market.expectedDailySales` 추가
- [x] Finance 출력에 `expected` 객체 추가
- [x] Decision 출력에 `successProbability` 추가

### Phase 2 (권장)
- [ ] Decision 출력에 구조화된 `riskFactors` 추가
- [ ] Decision 출력에 `improvementSimulations` 추가
- [ ] Finance 출력에 `scenarioTable` 추가

### Phase 3 (선택)
- [ ] 기존 `riskFactors` 문자열 배열 제거 (deprecated)

---

## 📝 참고 문서

- `engine/ROLE.md`: 상세 입출력 스펙
- `docs/일 판매량별 손익 비교 (200잔 _ 250잔 _ 300잔).md`: 시나리오 테이블 참고
- `초안_컨셉_StartSmart Final Report`: PDF 리포트 구조

---

## ❓ Q&A

**Q: 기존 코드가 깨지지 않나요?**  
A: 아니요. 기존 필드는 모두 유지하며, 새 필드만 추가합니다. 기존 클라이언트는 새 필드를 무시하면 됩니다.

**Q: riskFactors를 문자열에서 객체로 바꾸면 기존 코드가 깨지지 않나요?**  
A: 아니요. `riskFactors`는 문자열 배열로 유지되고, `riskCards`가 객체 배열로 추가됩니다. 기존 코드는 그대로 동작하며, 점진적 마이그레이션을 권장합니다.

**Q: successProbability 단위는 무엇인가요?**  
A: `successProbability`는 0~1 사이의 값입니다 (score/100). 리포트나 프론트엔드에서 표시할 때는 `(successProbability * 100)`으로 %로 변환하면 됩니다.

**Q: 필드가 너무 많아지는 것 아닌가요?**  
A: PDF 리포트 수준의 상세 분석을 위해서는 필수입니다. 필요시 프론트엔드에서 선택적으로 표시하면 됩니다.
