# 구현 계획서 (단계별 가이드)

## 📋 개요

ROLE.md를 기반으로 실제 개발 과정을 단계별로 진행하기 위한 상세 가이드입니다.

---

## 🎯 Phase 1: Finance 계산 엔진 완성

### Step 1.1: 핵심 계산식 검증 및 보완

**목표**: 계산식 정확성 검증 및 엣지 케이스 처리 강화

**작업 파일**: `engine/finance/calculator.js`

**구현 내용**:

#### 1.1.1 입력 검증 함수 추가
```js
// calculator.js 상단에 추가
function validateInput({ brand, conditions, market, targetDailySales }) {
  // brand.defaults 필수 필드 검증
  if (!brand?.defaults) {
    throw new Error('brand.defaults가 필요합니다.');
  }
  
  const requiredDefaults = ['avgPrice', 'cogsRate', 'laborRate'];
  for (const key of requiredDefaults) {
    if (brand.defaults[key] === undefined || brand.defaults[key] === null) {
      throw new Error(`brand.defaults.${key}가 필요합니다.`);
    }
  }
  
  // conditions 필수 필드 검증
  if (!conditions?.initialInvestment || !conditions?.monthlyRent) {
    throw new Error('conditions.initialInvestment와 conditions.monthlyRent가 필요합니다.');
  }
  
  // market.expectedDailySales fallback 규칙 적용
  // 우선순위: market.expectedDailySales → brand.defaults.expectedDailySales → targetDailySales
  if (!market?.expectedDailySales || market.expectedDailySales <= 0) {
    if (brand?.defaults?.expectedDailySales && brand.defaults.expectedDailySales > 0) {
      market = { ...market, expectedDailySales: brand.defaults.expectedDailySales };
    } else {
      market = { ...market, expectedDailySales: targetDailySales };  // 최후 fallback
    }
  }
  
  // targetDailySales 검증
  if (!targetDailySales || targetDailySales <= 0) {
    throw new Error('targetDailySales는 0보다 큰 값이어야 합니다.');
  }
  
  return { brand, conditions, market, targetDailySales };
}
```

#### 1.1.2 엣지 케이스 처리 강화
```js
// calculateFinance 함수 내부 수정
function calculateFinance({ brand, conditions, market, targetDailySales }) {
  // 입력 검증
  ({ brand, conditions, market, targetDailySales } = validateInput({ brand, conditions, market, targetDailySales }));
  
  // ... 기존 코드 ...
  
  // 회수 개월 수 계산 시 엣지 케이스 처리
  // ⚠️ 중요: monthlyProfit <= 0일 때 paybackMonths는 null 권장 (또는 Infinity 사용 시 최종 출력에서는 null로 변환)
  //          Infinity/NaN이 decision 점수와 신호등을 망가뜨리는 1순위 원인
  const paybackMonths = monthlyProfit > 0 
    ? conditions.initialInvestment / monthlyProfit 
    : null;  // 적자/0일 때 null (Infinity 대신)
  
  // 손익분기점 계산 시 엣지 케이스 처리
  // ⚠️ 중요: avgPrice=0 같은 엣지 방어 필요
  const breakEvenDailySales = totalCosts > 0 && avgPrice > 0
    ? totalCosts / (avgPrice * 30)
    : null;  // 계산 불가능 시 null
  
  // ... 나머지 코드 ...
}
```

**체크리스트**:
- [ ] `validateInput()` 함수 작성
- [ ] `calculateFinance()`에 검증 로직 통합
- [ ] 엣지 케이스 테스트 작성
- [ ] 에러 메시지 명확성 확인

**예상 소요 시간**: 2-3시간

---

### Step 1.2: 민감도 분석 검증

**목표**: ±10% 시나리오 계산 정확성 검증

**작업 파일**: `engine/finance/calculator.js`

**구현 내용**:

#### 1.2.1 민감도 분석 함수 검증
```js
// calculateSensitivity 함수 검증 및 보완
function calculateSensitivity(dailySales, avgPrice, baseCosts, initialInvestment, ownerWorking, defaults) {
  // dailySales가 0 이하인 경우 처리
  if (dailySales <= 0) {
    return {
      monthlyProfit: -Infinity,
      paybackMonths: Infinity
    };
  }
  
  // ... 기존 코드 ...
  
  // paybackMonths 계산 시 엣지 케이스
  const paybackMonths = monthlyProfit > 0 
    ? initialInvestment / monthlyProfit 
    : Infinity;
  
  return {
    monthlyProfit: Math.round(monthlyProfit),
    paybackMonths: paybackMonths === Infinity ? Infinity : Math.round(paybackMonths * 10) / 10
  };
}
```

**체크리스트**:
- [ ] `calculateSensitivity()` 엣지 케이스 처리 확인
- [ ] ±10% 시나리오 계산 정확성 테스트
- [ ] Infinity 값 처리 확인

**예상 소요 시간**: 1-2시간

---

### Step 1.3: 시나리오 테이블 생성 검증

**목표**: 시나리오별 손익 비교표 정확성 검증

**작업 파일**: `engine/finance/index.js`

**구현 내용**:

#### 1.3.1 시나리오 테이블 생성 로직 검증
```js
// calculate 함수 내부 시나리오 테이블 생성 부분 검증
// ⚠️ 중요: scenarioTable 계산 시 변경되는 것은 targetDailySales(=daily)만이며,
//          market.expectedDailySales는 원래 값을 유지한다.
//          (expected가 시나리오에 따라 바뀌면 "기대치 vs 목표치" 비교 의미가 붕괴됨)
if (scenarios.length > 0) {
  result.scenarioTable = scenarios
    .filter(daily => daily > 0)  // 0 이하 값 필터링
    .map(daily => {
      const scenarioResult = calculateFinance({
        brand,
        conditions,
        market: market,  // expectedDailySales는 원래 값 유지
        targetDailySales: daily  // 시나리오별로 변경되는 것은 targetDailySales만
      });
      
      return {
        daily: daily,
        profit: Math.round(scenarioResult.monthlyProfit),
        paybackMonths: scenarioResult.paybackMonths === Infinity 
          ? Infinity 
          : Math.round(scenarioResult.paybackMonths * 10) / 10
      };
    });
} else {
  result.scenarioTable = [];  // 명시적으로 빈 배열 설정
}
```

**체크리스트**:
- [ ] 시나리오 배열 필터링 로직 추가
- [ ] Infinity 값 처리 확인
- [ ] 빈 배열 처리 확인
- [ ] 시나리오 테이블 정확성 테스트

**예상 소요 시간**: 1시간

---

### Step 1.4: Finance 출력 형식 검증

**목표**: 출력 형식이 스펙과 일치하는지 검증

**작업 파일**: `engine/finance/validator.js` (신규 생성)

**구현 내용**:

#### 1.4.1 출력 검증 함수 작성
```js
// engine/finance/validator.js (신규 생성)
const { examples } = require('../../shared/interfaces');

/**
 * Finance 출력 형식 검증
 * @param {Object} result - Finance 계산 결과
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateFinanceOutput(result) {
  const errors = [];
  
  // 필수 필드 확인
  const requiredFields = [
    'monthlyRevenue',
    'monthlyCosts',
    'monthlyProfit',
    'paybackMonths',
    'breakEvenDailySales',
    'sensitivity'
  ];
  
  for (const field of requiredFields) {
    if (result[field] === undefined) {
      errors.push(`필수 필드 누락: ${field}`);
    }
  }
  
  // monthlyCosts 객체 구조 확인
  if (result.monthlyCosts) {
    const requiredCostFields = ['rent', 'labor', 'materials', 'utilities', 'royalty', 'marketing', 'etc'];
    for (const field of requiredCostFields) {
      if (result.monthlyCosts[field] === undefined) {
        errors.push(`monthlyCosts 필수 필드 누락: ${field}`);
      }
    }
  }
  
  // expected 객체 확인 (확장 필드)
  if (result.expected) {
    if (result.expected.expectedDailySales === undefined ||
        result.expected.expectedMonthlyRevenue === undefined ||
        result.expected.gapPctVsTarget === undefined) {
      errors.push('expected 객체 필수 필드 누락');
    }
  }
  
  // scenarioTable 확인 (선택적)
  if (result.scenarioTable && !Array.isArray(result.scenarioTable)) {
    errors.push('scenarioTable은 배열이어야 합니다.');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateFinanceOutput
};
```

#### 1.4.2 Finance index.js에 검증 통합
```js
// engine/finance/index.js 수정
const { validateFinanceOutput } = require('./validator');

function calculate(input) {
  // ... 기존 계산 로직 ...
  
  // 출력 검증 (개발 환경에서만)
  if (process.env.NODE_ENV !== 'production') {
    const validation = validateFinanceOutput(result);
    if (!validation.valid) {
      console.warn('Finance 출력 검증 실패:', validation.errors);
    }
  }
  
  return result;
}
```

**체크리스트**:
- [ ] `validator.js` 파일 생성
- [ ] `validateFinanceOutput()` 함수 작성
- [ ] Finance index.js에 검증 통합
- [ ] 검증 테스트 작성

**예상 소요 시간**: 2-3시간

---

## 🎯 Phase 2: Decision 판단 엔진 완성

### Step 2.1: 점수 산출 로직 검증

**목표**: 점수 계산 정확성 검증 및 엣지 케이스 처리

**작업 파일**: `engine/decision/scorer.js`

**구현 내용**:

#### 2.1.1 점수 계산 함수 검증
```js
// scorer.js의 calculateScore 함수 검증
function calculateScore(finance, market, roadview) {
  // finance 객체 검증
  if (!finance || typeof finance.paybackMonths !== 'number' || typeof finance.monthlyProfit !== 'number') {
    throw new Error('finance 객체가 올바르지 않습니다.');
  }
  
  let score = 100;
  
  // 회수 기간 감점 (NaN, Infinity 처리)
  if (isFinite(finance.paybackMonths)) {
    if (finance.paybackMonths > 36) {
      score -= 30;
    } else if (finance.paybackMonths > 24) {
      score -= 15;
    }
  } else {
    score -= 50;  // Infinity인 경우 강한 감점
  }
  
  // 월 순이익 감점
  if (finance.monthlyProfit <= 0) {
    score -= 50;
  } else if (finance.monthlyProfit < 5000000) {
    score -= 20;
  }
  
  // 상권 점수 반영 (기본값 처리)
  const marketScore = market?.marketScore ?? 70;
  score = score * 0.7 + marketScore * 0.3;
  
  // 로드뷰 리스크 반영 (기본값 처리)
  const riskScore = roadview?.riskScore ?? 70;
  score -= (100 - riskScore) * 0.2;
  
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const successProbability = finalScore / 100;
  
  return { score: finalScore, successProbability };
}
```

**체크리스트**:
- [ ] 입력 검증 로직 추가
- [ ] NaN, Infinity 처리 확인
- [ ] 기본값 처리 확인
- [ ] 점수 범위 제한 확인

**예상 소요 시간**: 1-2시간

---

### Step 2.2: 신호등 판단 로직 검증

**목표**: 신호등 판단 정확성 검증

**작업 파일**: `engine/decision/scorer.js`

**구현 내용**:

#### 2.2.1 신호등 판단 함수 검증
```js
// determineSignal 함수 검증
function determineSignal(score, finance) {
  // 입력 검증
  if (typeof score !== 'number' || score < 0 || score > 100) {
    throw new Error('score는 0-100 사이의 숫자여야 합니다.');
  }
  
  if (!finance || typeof finance.paybackMonths !== 'number' || typeof finance.monthlyProfit !== 'number') {
    throw new Error('finance 객체가 올바르지 않습니다.');
  }
  
  // 하드컷 규칙
  if (finance.paybackMonths >= 36 || finance.monthlyProfit <= 0) {
    return "red";
  }
  
  // 점수 기반 판단
  if (score >= 70) {
    return "green";
  } else if (score >= 50) {
    return "yellow";
  } else {
    return "red";
  }
}
```

**체크리스트**:
- [ ] 입력 검증 로직 추가
- [ ] 하드컷 규칙 정확성 확인
- [ ] 점수 기반 판단 정확성 확인

**예상 소요 시간**: 1시간

---

### Step 2.3: 생존 개월 수 추정 검증 (36 기준선 감점형)

**목표**: 36 기준선 감점형 로직 정확성 검증

**핵심 원칙**: base = 36개월에서 시작하여 감점 요인을 적용

**작업 파일**: `engine/decision/scorer.js`

**구현 내용**:

#### 2.3.1 생존 개월 수 추정 함수 검증 (36 기준선 감점형)
```js
// estimateSurvivalMonths 함수 검증
// ⚠️ 핵심: base = 36개월에서 시작하여 감점 요인을 적용
//          최소 4개 감점 요인: paybackMonths, profitMargin, -10% 적자전환, fixedCostShare
function estimateSurvivalMonths(finance, market, roadview) {
  // 입력 검증
  if (!finance || !finance.sensitivity) {
    throw new Error('finance 객체와 sensitivity가 필요합니다.');
  }
  
  // 기준선: 36개월
  const baseMonths = 36;
  let survivalMonths = baseMonths;
  
  // 감점 요인 1: 회수 기간 (paybackMonths 길이)
  if (isFinite(finance.paybackMonths) && finance.paybackMonths !== null) {
    if (finance.paybackMonths > 36) {
      survivalMonths -= (finance.paybackMonths - 36) * 1.5;  // 36개월 초과 시 강한 감점
    } else if (finance.paybackMonths > 24) {
      survivalMonths -= (finance.paybackMonths - 24) * 0.5;  // 24-36개월 구간 중간 감점
    }
  } else {
    survivalMonths -= 20;  // null/Infinity인 경우 강한 감점
  }
  
  // 감점 요인 2: 매출 -10% 시 적자 전환 여부
  const minus10Profit = finance.sensitivity?.minus10?.monthlyProfit ?? finance.monthlyProfit;
  if (minus10Profit <= 0) {
    survivalMonths -= 15;  // 적자 전환 시 강한 감점
  } else if (minus10Profit < finance.monthlyProfit * 0.5) {
    survivalMonths -= 8;   // 수익 급감 시 중간 감점
  }
  
  // 감점 요인 3: 고정비 비중 (fixedCostShare = 임대+인건비/매출)
  const fixedCostShare = (finance.monthlyCosts.rent + finance.monthlyCosts.labor) / finance.monthlyRevenue;
  if (fixedCostShare > 0.35) {
    survivalMonths -= 10;  // 고정비 비중 35% 초과 시 감점
  } else if (fixedCostShare > 0.30) {
    survivalMonths -= 5;   // 고정비 비중 30-35% 시 경미한 감점
  }
  
  // 감점 요인 4: 순이익률 (profitMargin)
  const profitMargin = finance.monthlyProfit / finance.monthlyRevenue;
  if (profitMargin < 0.10) {
    survivalMonths -= 5;   // 순이익률 10% 미만 시 감점
  } else if (profitMargin < 0.15) {
    survivalMonths -= 2;   // 순이익률 15% 미만 시 경미한 감점
  }
  
  // 감점 요인 5: 경쟁/로드뷰 점수 (MVP에서는 가볍게)
  const marketScore = market?.marketScore ?? 70;
  if (marketScore < 50) {
    survivalMonths -= 3;   // 상권 점수 낮을 시 경미한 감점
  }
  
  const riskScore = roadview?.riskScore ?? 70;
  if (riskScore < 50) {
    survivalMonths -= 2;   // 로드뷰 리스크 시 경미한 감점
  }
  
  // 최소값 보장 (12개월 이상)
  return Math.max(12, Math.round(survivalMonths));
}
```

**체크리스트**:
- [ ] 입력 검증 로직 추가
- [ ] 각 감점 요인 정확성 확인
- [ ] Infinity 값 처리 확인
- [ ] 최소값 보장 확인

**예상 소요 시간**: 2시간

---

### Step 2.4: 리스크 카드 생성 검증

**목표**: 리스크 카드 생성 로직 정확성 검증

**작업 파일**: `engine/decision/scorer.js`

**구현 내용**:

#### 2.4.1 리스크 카드 생성 함수 검증
```js
// generateRiskFactors 함수 검증
function generateRiskFactors(finance, market, roadview, targetDailySales) {
  const riskFactors = [];
  
  // finance 객체 검증
  if (!finance || !finance.monthlyCosts || !finance.monthlyRevenue) {
    return [];  // 빈 배열 반환
  }
  
  // 리스크 1: 임대료 민감도
  const rentShare = finance.monthlyCosts.rent / finance.monthlyRevenue;
  if (rentShare > 0.15 && isFinite(rentShare)) {
    riskFactors.push({
      id: "rent_sensitivity",
      title: "임대료 대비 매출 민감도 높음",
      severity: rentShare > 0.20 ? "high" : "medium",
      evidence: {
        rentShare: Math.round(rentShare * 100) / 100,
        profitMargin: Math.round((finance.monthlyProfit / finance.monthlyRevenue) * 100) / 100,
        breakEvenDailySales: finance.breakEvenDailySales
      },
      narrative: `임대료가 매출의 ${Math.round(rentShare * 100)}%를 차지합니다. 매출이 10% 하락하면 손익분기 도달이 어려워집니다.`
    });
  }
  
  // 리스크 2: 회수 기간
  if (isFinite(finance.paybackMonths) && finance.paybackMonths > 30) {
    riskFactors.push({
      id: "payback_period",
      title: "회수 기간이 기준선(36개월)에 근접",
      severity: finance.paybackMonths >= 36 ? "high" : "medium",
      evidence: {
        paybackMonths: finance.paybackMonths,
        thresholdMonths: 36
      },
      narrative: `현재 회수 기간은 ${Math.round(finance.paybackMonths)}개월이나, 매출 하락 시 위험 구간에 진입할 수 있습니다.`
    });
  }
  
  // 리스크 3: 목표 vs 기대 GAP
  if (finance.expected?.gapPctVsTarget > 0.15) {
    const gapPct = Math.round(finance.expected.gapPctVsTarget * 100);
    const target = targetDailySales || Math.round(finance.monthlyRevenue / (finance.expected.expectedMonthlyRevenue / finance.expected.expectedDailySales) / 30);
    
    riskFactors.push({
      id: "sales_gap",
      title: "목표 판매량과 상권 기대치 간 GAP 큼",
      severity: finance.expected.gapPctVsTarget > 0.25 ? "high" : "medium",
      evidence: {
        targetDailySales: Math.round(target),
        expectedDailySales: finance.expected.expectedDailySales,
        gapPct: gapPct
      },
      narrative: `목표 판매량(${Math.round(target)}잔)이 상권 평균(${finance.expected.expectedDailySales}잔)보다 ${gapPct}% 높아 달성 난이도가 있습니다.`
    });
  }
  
  // 리스크 4: 순이익률 낮음
  const profitMargin = finance.monthlyProfit / finance.monthlyRevenue;
  if (profitMargin < 0.10 && isFinite(profitMargin)) {
    riskFactors.push({
      id: "low_profit_margin",
      title: "순이익률이 낮아 수익성 취약",
      severity: profitMargin < 0.05 ? "high" : "medium",
      evidence: {
        profitMargin: Math.round(profitMargin * 100) / 100,
        monthlyProfit: finance.monthlyProfit
      },
      narrative: `순이익률이 ${Math.round(profitMargin * 100)}%로 낮아 매출 변동에 취약합니다.`
    });
  }
  
  return riskFactors;
}
```

**체크리스트**:
- [ ] 입력 검증 로직 추가
- [ ] 각 리스크 카드 생성 조건 확인
- [ ] evidence 객체 구조 확인
- [ ] narrative 템플릿 정확성 확인

**예상 소요 시간**: 2시간

---

### Step 2.5: 개선 시뮬레이션 생성 검증

**목표**: 개선 시뮬레이션 생성 로직 정확성 검증

**작업 파일**: `engine/decision/simulations.js`

**구현 내용**:

#### 2.5.1 개선 시뮬레이션 생성 함수 검증
```js
// generateImprovementSimulations 함수 검증
function generateImprovementSimulations(finance, conditions, brand, market, roadview, targetDailySales) {
  // 입력 검증
  if (!finance || !conditions || !brand || !targetDailySales) {
    return [];  // 빈 배열 반환
  }
  
  const simulations = [];
  
  try {
    // 시뮬레이션 1: 임대료 -10%
    const rentMinus10 = conditions.monthlyRent * 0.9;
    const sim1Conditions = { ...conditions, monthlyRent: rentMinus10 };
    const sim1Finance = calculateFinance({
      brand,
      conditions: sim1Conditions,
      market,
      targetDailySales
    });
    const sim1ScoreResult = calculateScore(sim1Finance, market, roadview);
    const sim1Survival = estimateSurvivalMonths(sim1Finance, market, roadview);
    
    simulations.push({
      id: "rent_minus_10",
      delta: "rent -10%",
      survivalMonths: sim1Survival,
      signal: determineSignal(sim1ScoreResult.score, sim1Finance)
    });
  } catch (error) {
    console.warn('시뮬레이션 1 생성 실패:', error.message);
  }
  
  try {
    // 시뮬레이션 2: 목표 판매량 -10%
    const salesMinus10 = targetDailySales * 0.9;
    const sim2Finance = calculateFinance({
      brand,
      conditions,
      market: { ...market, expectedDailySales: salesMinus10 },
      targetDailySales: salesMinus10
    });
    const sim2ScoreResult = calculateScore(sim2Finance, market, roadview);
    const sim2Survival = estimateSurvivalMonths(sim2Finance, market, roadview);
    
    simulations.push({
      id: "sales_minus_10",
      delta: "target -10%",
      survivalMonths: sim2Survival,
      signal: determineSignal(sim2ScoreResult.score, sim2Finance)
    });
  } catch (error) {
    console.warn('시뮬레이션 2 생성 실패:', error.message);
  }
  
  try {
    // 시뮬레이션 3: 목표 판매량 +10%
    const salesPlus10 = targetDailySales * 1.1;
    const sim3Finance = calculateFinance({
      brand,
      conditions,
      market: { ...market, expectedDailySales: salesPlus10 },
      targetDailySales: salesPlus10
    });
    const sim3ScoreResult = calculateScore(sim3Finance, market, roadview);
    const sim3Survival = estimateSurvivalMonths(sim3Finance, market, roadview);
    
    simulations.push({
      id: "sales_plus_10",
      delta: "target +10%",
      survivalMonths: sim3Survival,
      signal: determineSignal(sim3ScoreResult.score, sim3Finance)
    });
  } catch (error) {
    console.warn('시뮬레이션 3 생성 실패:', error.message);
  }
  
  return simulations;
}
```

**체크리스트**:
- [ ] 입력 검증 로직 추가
- [ ] 각 시뮬레이션 생성 로직 확인
- [ ] 에러 처리 추가
- [ ] 출력 형식 확인

**예상 소요 시간**: 2시간

---

### Step 2.6: Decision 출력 형식 검증

**목표**: 출력 형식이 스펙과 일치하는지 검증

**작업 파일**: `engine/decision/validator.js` (신규 생성)

**구현 내용**:

#### 2.6.1 출력 검증 함수 작성
```js
// engine/decision/validator.js (신규 생성)
/**
 * Decision 출력 형식 검증
 * @param {Object} result - Decision 계산 결과
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateDecisionOutput(result) {
  const errors = [];
  
  // 필수 필드 확인
  const requiredFields = ['score', 'signal', 'survivalMonths', 'riskLevel'];
  for (const field of requiredFields) {
    if (result[field] === undefined) {
      errors.push(`필수 필드 누락: ${field}`);
    }
  }
  
  // score 범위 확인
  if (result.score !== undefined && (result.score < 0 || result.score > 100)) {
    errors.push('score는 0-100 사이의 값이어야 합니다.');
  }
  
  // signal 값 확인
  const validSignals = ['green', 'yellow', 'red'];
  if (result.signal && !validSignals.includes(result.signal)) {
    errors.push(`signal은 ${validSignals.join(', ')} 중 하나여야 합니다.`);
  }
  
  // successProbability 확인 (확장 필드)
  if (result.successProbability !== undefined) {
    if (result.successProbability < 0 || result.successProbability > 1) {
      errors.push('successProbability는 0-1 사이의 값이어야 합니다.');
    }
  }
  
  // riskFactors 확인
  if (result.riskFactors) {
    if (!Array.isArray(result.riskFactors)) {
      errors.push('riskFactors는 배열이어야 합니다.');
    } else {
      result.riskFactors.forEach((risk, idx) => {
        if (!risk.id || !risk.title || !risk.severity) {
          errors.push(`riskFactors[${idx}]에 필수 필드가 누락되었습니다.`);
        }
      });
    }
  }
  
  // improvementSimulations 확인
  if (result.improvementSimulations) {
    if (!Array.isArray(result.improvementSimulations)) {
      errors.push('improvementSimulations는 배열이어야 합니다.');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateDecisionOutput
};
```

**체크리스트**:
- [ ] `validator.js` 파일 생성
- [ ] `validateDecisionOutput()` 함수 작성
- [ ] Decision index.js에 검증 통합
- [ ] 검증 테스트 작성

**예상 소요 시간**: 2-3시간

---

## 🎯 Phase 3: 테스트 및 검증

### Step 3.1: 단위 테스트 작성

**목표**: 각 함수별 단위 테스트 작성

**작업 파일**: 
- `engine/finance/calculator.test.js` (신규 생성)
- `engine/decision/scorer.test.js` (신규 생성)

**구현 내용**:

#### 3.1.1 Finance 계산 테스트
```js
// engine/finance/calculator.test.js
const { calculateFinance } = require('./calculator');
const assert = require('assert');

// 정상 케이스 테스트
function testNormalCase() {
  const result = calculateFinance({
    brand: {
      defaults: {
        avgPrice: 3500,
        cogsRate: 0.35,
        laborRate: 0.20,
        utilitiesRate: 0.03,
        etcFixed: 1100000,
        royaltyRate: 0.05,
        marketingRate: 0.02
      }
    },
    conditions: {
      initialInvestment: 200000000,
      monthlyRent: 4000000,
      area: 10,
      ownerWorking: true
    },
    market: {
      expectedDailySales: 256
    },
    targetDailySales: 300
  });
  
  assert(result.monthlyRevenue > 0, '월 매출은 0보다 커야 합니다.');
  assert(result.monthlyProfit !== undefined, '월 순이익이 계산되어야 합니다.');
  assert(result.paybackMonths > 0, '회수 기간은 0보다 커야 합니다.');
  console.log('✅ 정상 케이스 테스트 통과');
}

// 엣지 케이스 테스트
function testEdgeCases() {
  // ... 엣지 케이스 테스트 작성 ...
}

// 실행
testNormalCase();
testEdgeCases();
```

#### 3.1.2 Decision 판단 테스트
```js
// engine/decision/scorer.test.js
const { calculateScore, determineSignal, estimateSurvivalMonths } = require('./scorer');
const assert = require('assert');

// 점수 계산 테스트
function testScoreCalculation() {
  const finance = {
    paybackMonths: 22,
    monthlyProfit: 9100000,
    monthlyRevenue: 31500000,
    monthlyCosts: { rent: 4000000, labor: 6300000 },
    sensitivity: {
      minus10: { monthlyProfit: 8000000 }
    }
  };
  
  const market = { marketScore: 65 };
  const roadview = { riskScore: 60 };
  
  const result = calculateScore(finance, market, roadview);
  
  assert(result.score >= 0 && result.score <= 100, '점수는 0-100 사이여야 합니다.');
  assert(result.successProbability >= 0 && result.successProbability <= 1, '성공 확률은 0-1 사이여야 합니다.');
  console.log('✅ 점수 계산 테스트 통과');
}

// 실행
testScoreCalculation();
```

**체크리스트**:
- [ ] Finance 계산 테스트 작성
- [ ] Decision 판단 테스트 작성
- [ ] 엣지 케이스 테스트 작성
- [ ] 테스트 실행 및 통과 확인

**예상 소요 시간**: 4-6시간

---

## 📊 전체 일정 요약

| Phase | Step | 작업 내용 | 예상 시간 | 우선순위 |
|-------|------|----------|----------|----------|
| 1 | 1.1 | 핵심 계산식 검증 | 2-3h | 🔴 High |
| 1 | 1.2 | 민감도 분석 검증 | 1-2h | 🔴 High |
| 1 | 1.3 | 시나리오 테이블 검증 | 1h | 🟡 Medium |
| 1 | 1.4 | Finance 출력 검증 | 2-3h | 🔴 High |
| 2 | 2.1 | 점수 산출 검증 | 1-2h | 🔴 High |
| 2 | 2.2 | 신호등 판단 검증 | 1h | 🔴 High |
| 2 | 2.3 | 생존 개월 수 검증 | 2h | 🔴 High |
| 2 | 2.4 | 리스크 카드 검증 | 2h | 🟡 Medium |
| 2 | 2.5 | 개선 시뮬레이션 검증 | 2h | 🟡 Medium |
| 2 | 2.6 | Decision 출력 검증 | 2-3h | 🔴 High |
| 3 | 3.1 | 단위 테스트 작성 | 4-6h | 🔴 High |

**총 예상 시간**: 20-30시간

---

## 🚀 시작하기

1. **Phase 1 Step 1.1부터 시작**: 핵심 계산식 검증 및 보완
2. **각 Step 완료 후 체크리스트 확인**: 모든 항목 체크
3. **테스트 실행**: 각 Step마다 테스트 실행하여 검증
4. **다음 Step 진행**: 이전 Step 완료 확인 후 진행

---

## 📝 참고 문서

- `engine/ROLE.md`: 역할 정의 및 입출력 스펙
- `engine/DEVELOPMENT_CHECKLIST.md`: 개발 체크리스트
- `shared/interfaces.js`: 공유 인터페이스 정의
