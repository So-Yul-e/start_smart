# 엔진 리포트 vs AI 컨설팅 일관성 검증 문서

## 📋 목적

이 문서는 **엔진이 분석해서 내주는 결과 리포트**(`ANALYSIS_OUTPUT_FORMAT.md`)와 **AI 컨설팅 프롬프트**(`ai/consulting/prompts.js`) 간의 일관성을 검증합니다.

**핵심 원칙**: 엔진 리포트와 AI 컨설팅의 결론이 **전혀 다른 결론이 나와선 안 됩니다.**

---

## 1. 데이터 흐름 비교

### 1.1 엔진 리포트 구조

```
입력 데이터
    ↓
[1단계] Finance 엔진 → finance 결과
    ↓
[2단계] Decision 엔진 → decision 결과 (finance 결과 포함)
    ↓
최종 분석 결과 (리포트 생성)
```

**출력 구조**:
```javascript
{
  finance: { /* Finance 엔진 출력 */ },
  decision: { /* Decision 엔진 출력 */ }
}
```

### 1.2 AI 컨설팅 입력 구조

**현재 구현** (`ai/consulting/index.js`):
```javascript
async function generateConsulting(input) {
  // ...
  const aiConsulting = await generateConsulting({
    brand, location, conditions, targetDailySales,
    finance,  // ✅ Finance 결과만 사용
    market, roadview
    // ❌ decision 결과는 전달되지 않음
  });
}
```

**프롬프트 입력** (`ai/consulting/prompts.js`):
```javascript
function getRiskAnalysisPrompt(data) {
  const { finance, targetDailySales, market, roadview, conditions, brand } = data;
  // ❌ decision 객체를 받지 않음
}
```

---

## 2. 핵심 지표 비교

### 2.1 Finance 엔진 출력 vs 컨설팅 프롬프트 사용

| 엔진 리포트 필드 | 컨설팅 프롬프트 사용 여부 | 일관성 상태 |
|----------------|----------------------|-----------|
| `monthlyRevenue` | ✅ 사용 (`finance.monthlyRevenue`) | ✅ 일치 |
| `monthlyProfit` | ✅ 사용 (`finance.monthlyProfit`) | ✅ 일치 |
| `paybackMonths` | ✅ 사용 (`finance.paybackMonths`) | ✅ 일치 |
| `breakEvenDailySales` | ❌ 미사용 | ⚠️ 미사용 |
| `expected.expectedDailySales` | ❌ 미사용 | ⚠️ 미사용 |
| `expected.gapPctVsTarget` | ❌ 미사용 | ⚠️ 미사용 |
| `monthlyCosts` (상세) | ✅ 사용 (`finance.monthlyCosts`) | ✅ 일치 |
| `sensitivity.plus10` | ❌ 미사용 | ⚠️ 미사용 |
| `sensitivity.minus10` | ❌ 미사용 | ⚠️ 미사용 |
| `debt.dscr` | ❌ 미사용 | ⚠️ 미사용 |
| `scenarioTable` | ❌ 미사용 | ⚠️ 미사용 |

### 2.2 Decision 엔진 출력 vs 컨설팅 프롬프트 사용

| 엔진 리포트 필드 | 컨설팅 프롬프트 사용 여부 | 일관성 상태 |
|----------------|----------------------|-----------|
| `score` | ❌ 미사용 | ❌ **불일치** |
| `signal` | ❌ 미사용 | ❌ **불일치** |
| `survivalMonths` | ❌ 미사용 | ❌ **불일치** |
| `riskLevel` | ❌ 미사용 | ❌ **불일치** |
| `finalJudgement.signal` | ❌ 미사용 | ❌ **불일치** |
| `finalJudgement.label` | ❌ 미사용 | ❌ **불일치** |
| `finalJudgement.summary` | ❌ 미사용 | ❌ **불일치** |
| `hardCutReasons` | ❌ 미사용 | ❌ **불일치** |
| `failureTriggers` | ❌ 미사용 | ❌ **불일치** |
| `riskCards` | ❌ 미사용 | ❌ **불일치** |
| `improvementSimulations` | ❌ 미사용 | ❌ **불일치** |
| `exitPlan` | ❌ 미사용 | ❌ **불일치** |

---

## 3. 판정 기준 비교

### 3.1 엔진의 판정 기준 (Decision 엔진)

**신호등 판정 기준** (`ANALYSIS_OUTPUT_FORMAT.md`):
- `green`: `score >= 70` && `paybackMonths < 36` && `monthlyProfit > 0`
- `yellow`: `score >= 50` && `paybackMonths < 36` && `monthlyProfit > 0`
- `red`: 그 외 (하드컷 조건 포함)

**하드컷 판정 근거**:
- `NEGATIVE_PROFIT`: 월 순이익 <= 0
- `DSCR_FAIL`: DSCR < 1.0
- `PAYBACK_TOO_LONG`: 회수 기간 >= 36개월
- `SURVIVAL_LT_36`: 생존 기간 < 36개월

### 3.2 컨설팅 프롬프트의 판단 기준

**리스크 판단 기준** (`prompts.js`):
```javascript
1. 월 순이익 기준 (최우선 확인):
   - 월 순이익 ≤ 0원 → "high" 리스크 (적자 위험, 회수 불가능)
   - 월 순이익 < 500만원 → "medium" 리스크
   - 월 순이익 ≥ 500만원 → "low" 리스크

2. 회수 기간 기준 (월 순이익이 양수일 때만 적용):
   - 회수 기간 ≥ 36개월 → "high" 리스크 (구조적 위험)
   - 회수 기간 > 24개월 → "medium" 리스크
   - 회수 기간 ≤ 24개월 → "low" 리스크
```

**비교 결과**:
- ✅ 월 순이익 <= 0 → 하드컷: **일치**
- ✅ 회수 기간 >= 36개월 → 하드컷: **일치**
- ⚠️ 컨설팅 프롬프트는 엔진의 `signal`, `finalJudgement`를 참조하지 않음: **불일치**

---

## 4. 발견된 문제점

### 4.1 🔴 심각한 문제: Decision 엔진 결과 미사용

**문제**: AI 컨설팅 프롬프트가 Decision 엔진의 판정 결과를 전혀 사용하지 않습니다.

**영향**:
- 엔진이 `signal: "red"`, `finalJudgement.label: "HIGH RISK"`로 판정했는데
- AI 컨설팅이 "medium 리스크"로 결론낼 수 있음
- **결론 불일치 발생 가능**

**예시 시나리오**:
```javascript
// 엔진 판정
decision = {
  signal: "red",
  finalJudgement: {
    signal: "red",
    label: "HIGH RISK",
    summary: "월 순이익이 0원 이하로 적자 위험이 매우 높습니다.",
    nonNegotiable: true
  },
  hardCutReasons: ["NEGATIVE_PROFIT"]
}

// AI 컨설팅 (현재)
// decision 객체를 받지 않으므로 엔진 판정을 모름
// finance.monthlyProfit만 보고 자체 판단
// → "high 리스크"로 판단하지만, 엔진의 "HIGH RISK" 판정과 일치하는지 보장 불가
```

### 4.2 ⚠️ 중간 문제: GAP 분석 미사용

**문제**: 컨설팅 프롬프트가 `finance.expected.gapPctVsTarget`를 사용하지 않습니다.

**영향**:
- 엔진이 계산한 GAP 분석 결과를 AI 컨설팅이 반영하지 않음
- 상권 기대치와 목표 판매량 간의 괴리를 컨설팅에서 언급하지 않을 수 있음

### 4.3 ⚠️ 중간 문제: 민감도 분석 미사용

**문제**: 컨설팅 프롬프트가 `finance.sensitivity`를 사용하지 않습니다.

**영향**:
- 엔진이 계산한 민감도 분석(±10% 시나리오)을 AI 컨설팅이 반영하지 않음
- 개선 제안 시나리오와 엔진의 민감도 분석이 일치하지 않을 수 있음

### 4.4 ⚠️ 중간 문제: 하드컷 판정 근거 미사용

**문제**: 컨설팅 프롬프트가 `decision.hardCutReasons`를 사용하지 않습니다.

**영향**:
- 엔진이 하드컷으로 판정한 근거를 AI 컨설팅이 반영하지 않음
- 하드컷 판정과 컨설팅 결론이 불일치할 수 있음

---

## 5. 개선 방안

### 5.1 즉시 수정 필요 (High Priority)

#### 5.1.1 Decision 엔진 결과를 컨설팅 프롬프트에 전달

**수정 위치**: `ai/consulting/index.js`

```javascript
// 현재
async function generateConsulting(input) {
  const aiConsulting = await generateConsulting({
    brand, location, conditions, targetDailySales,
    finance, market, roadview
    // ❌ decision 누락
  });
}

// 수정 후
async function generateConsulting(input) {
  const aiConsulting = await generateConsulting({
    brand, location, conditions, targetDailySales,
    finance, 
    decision,  // ✅ Decision 엔진 결과 추가
    market, roadview
  });
}
```

#### 5.1.2 컨설팅 프롬프트에서 Decision 결과 참조

**수정 위치**: `ai/consulting/prompts.js`

```javascript
function getRiskAnalysisPrompt(data) {
  const { finance, decision, targetDailySales, market, roadview, conditions, brand } = data;
  
  // ✅ Decision 엔진 판정 결과를 프롬프트에 포함
  return `당신은 프랜차이즈 카페 창업 컨설턴트입니다.
다음 재무 분석 결과를 바탕으로 핵심 리스크 Top 3를 식별하고 개선 제안을 해주세요:

【시스템 판정 결과 (반드시 참고)】
- 신호등: ${decision.finalJudgement.signal} (${decision.finalJudgement.label})
- 판정 요약: ${decision.finalJudgement.summary}
- 시스템 판정 (컨설팅으로 변경 불가): ${decision.finalJudgement.nonNegotiable ? '예' : '아니오'}
- 하드컷 판정 근거: ${decision.hardCutReasons.length > 0 ? decision.hardCutReasons.join(', ') : '없음'}

⚠️ 중요: 시스템 판정이 "HIGH RISK"이고 nonNegotiable이 true인 경우, 
반드시 해당 판정을 존중하여 리스크 분석을 작성하세요.

재무 결과:
// ... 기존 코드 ...
`;
}
```

### 5.2 개선 권장 (Medium Priority)

#### 5.2.1 GAP 분석 반영

```javascript
// 프롬프트에 추가
상권 기대치 분석:
- 목표 일 판매량: ${targetDailySales}잔/일
- 상권 기대 일 판매량: ${finance.expected.expectedDailySales}잔/일
- GAP 비율: ${(finance.expected.gapPctVsTarget * 100).toFixed(1)}%
- GAP 경고: ${finance.expected.gapWarning ? '예' : '아니오'}

⚠️ GAP 비율이 15% 이상이면 목표 판매량 달성 난이도가 높습니다.
```

#### 5.2.2 민감도 분석 반영

```javascript
// 프롬프트에 추가
민감도 분석:
- 매출 +10% 시: 월 순이익 ${(finance.sensitivity.plus10.monthlyProfit / 10000).toFixed(0)}만원, 회수 기간 ${finance.sensitivity.plus10.paybackMonths}개월
- 매출 -10% 시: 월 순이익 ${(finance.sensitivity.minus10.monthlyProfit / 10000).toFixed(0)}만원, 회수 기간 ${finance.sensitivity.minus10.paybackMonths}개월

⚠️ 매출 -10% 시나리오에서 월 순이익이 0원 이하가 되면 매우 위험합니다.
```

#### 5.2.3 하드컷 판정 근거 반영

```javascript
// 프롬프트에 추가
하드컷 판정 근거:
${decision.hardCutReasons.length > 0 ? decision.hardCutReasons.map(reason => {
  const reasonMap = {
    'NEGATIVE_PROFIT': '월 순이익이 0원 이하 (적자 위험)',
    'DSCR_FAIL': 'DSCR이 1.0 미만 (대출 상환 불가)',
    'PAYBACK_TOO_LONG': '회수 기간이 36개월 이상',
    'SURVIVAL_LT_36': '예상 생존 기간이 36개월 미만'
  };
  return `- ${reasonMap[reason] || reason}`;
}).join('\n') : '- 없음'}

⚠️ 하드컷 판정이 있는 경우, 해당 리스크를 최우선으로 다뤄야 합니다.
```

---

## 6. 검증 체크리스트

### 6.1 데이터 전달 검증

- [ ] `generateConsulting` 함수가 `decision` 객체를 받는가?
- [ ] `getRiskAnalysisPrompt` 함수가 `decision` 객체를 받는가?
- [ ] 프롬프트에 `decision.finalJudgement` 정보가 포함되는가?

### 6.2 판정 기준 일치 검증

- [ ] 컨설팅 프롬프트가 엔진의 `signal` 판정을 참조하는가?
- [ ] 컨설팅 프롬프트가 엔진의 `hardCutReasons`를 참조하는가?
- [ ] 컨설팅 프롬프트가 엔진의 `finalJudgement.nonNegotiable`을 존중하는가?

### 6.3 결론 일치 검증

- [ ] 엔진이 `signal: "red"`로 판정한 경우, 컨설팅도 "high" 리스크로 판단하는가?
- [ ] 엔진이 `hardCutReasons: ["NEGATIVE_PROFIT"]`인 경우, 컨설팅도 적자 위험을 최우선으로 다루는가?
- [ ] 엔진이 `finalJudgement.nonNegotiable: true`인 경우, 컨설팅이 시스템 판정을 존중하는가?

---

## 7. 테스트 시나리오

### 7.1 시나리오 1: 적자 위험 (NEGATIVE_PROFIT)

**엔진 판정**:
```javascript
finance = { monthlyProfit: -500000, paybackMonths: null }
decision = {
  signal: "red",
  finalJudgement: {
    signal: "red",
    label: "HIGH RISK",
    summary: "월 순이익이 0원 이하로 적자 위험이 매우 높습니다.",
    nonNegotiable: true
  },
  hardCutReasons: ["NEGATIVE_PROFIT"]
}
```

**기대 결과**: AI 컨설팅도 "high" 리스크로 판단하고, 적자 위험을 최우선으로 다뤄야 함.

### 7.2 시나리오 2: 회수 기간 초과 (PAYBACK_TOO_LONG)

**엔진 판정**:
```javascript
finance = { monthlyProfit: 3000000, paybackMonths: 42 }
decision = {
  signal: "red",
  finalJudgement: {
    signal: "red",
    label: "HIGH RISK",
    summary: "회수 기간이 36개월을 초과하여 구조적 위험이 존재합니다.",
    nonNegotiable: true
  },
  hardCutReasons: ["PAYBACK_TOO_LONG"]
}
```

**기대 결과**: AI 컨설팅도 "high" 리스크로 판단하고, 회수 기간 초과를 주요 리스크로 다뤄야 함.

### 7.3 시나리오 3: 조건부 리스크 (CONDITIONAL RISK)

**엔진 판정**:
```javascript
finance = { monthlyProfit: 8000000, paybackMonths: 28 }
decision = {
  signal: "yellow",
  finalJudgement: {
    signal: "yellow",
    label: "CONDITIONAL RISK",
    summary: "예상 생존 기간이 기준선(36개월) 미만으로 구조적 리스크가 존재합니다.",
    nonNegotiable: false
  },
  hardCutReasons: []
}
```

**기대 결과**: AI 컨설팅도 "medium" 리스크로 판단하고, 개선 가능성을 제시해야 함.

---

## 8. 결론

### 8.1 현재 상태

**일관성 수준**: ⚠️ **부분 일치** (60%)

- ✅ Finance 엔진의 기본 지표(monthlyProfit, paybackMonths)는 일치
- ❌ Decision 엔진의 판정 결과는 전혀 사용하지 않음
- ⚠️ GAP 분석, 민감도 분석 등 추가 지표는 미사용

### 8.2 개선 필요성

**즉시 수정 필요**: 🔴 **High Priority**

1. Decision 엔진 결과를 컨설팅 프롬프트에 전달
2. 컨설팅 프롬프트에서 Decision 판정 결과를 참조
3. 하드컷 판정 근거를 컨설팅에 반영

**개선 권장**: ⚠️ **Medium Priority**

1. GAP 분석 반영
2. 민감도 분석 반영
3. Exit Plan 정보 반영 (선택)

### 8.3 최종 권고사항

**엔진 리포트와 AI 컨설팅의 결론이 일치하도록 하려면**:

1. ✅ **필수**: Decision 엔진 결과를 컨설팅 프롬프트에 전달하고 참조
2. ✅ **필수**: 하드컷 판정 근거를 컨설팅에 반영
3. ✅ **권장**: GAP 분석, 민감도 분석 등 추가 지표 반영
4. ✅ **권장**: 시스템 판정(`nonNegotiable: true`)을 존중하는 프롬프트 가이드 추가

---

**문서 버전**: 1.0  
**최종 업데이트**: 2024-01-15  
**작성자**: StartSmart Decision Engine Team

