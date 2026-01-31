# 백엔드 통합 가이드

## 목차
1. [개요](#개요)
2. [DB → data_local Fallback](#db--data_local-fallback)
3. [비동기 처리 방법](#비동기-처리-방법)
4. [Breakdown 활용 방법](#breakdown-활용-방법)
5. [Express 라우트 통합 예시](#express-라우트-통합-예시)
6. [에러 처리 전략](#에러-처리-전략)

---

## 개요

백엔드에서 Engine 모듈을 통합할 때 다음 사항을 고려해야 합니다:

1. **데이터 로딩**: DB에서 브랜드 데이터를 조회하되, 실패 시 `data_local`로 자동 fallback
2. **비동기 처리**: Engine 함수는 동기이지만, 데이터 로딩은 비동기
3. **Breakdown 활용**: 사용자에게 상세한 점수 분석 제공

---

## DB → data_local Fallback

### 동작 원리

브랜드 데이터는 다음 순서로 로드됩니다:

1. **1차 시도**: 데이터베이스에서 조회 (`.env` 설정 기반)
2. **2차 Fallback**: DB 실패 시 `data_local/brands.json`에서 로드

### 설정 방법

#### 1. .env 파일 설정

```bash
# 데이터베이스 사용 여부
USE_DATABASE=true

# MySQL 설정
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=startsmart

# 또는 PostgreSQL
# DB_TYPE=postgresql
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_NAME=startsmart
```

#### 2. 데이터베이스 비활성화 (개발/테스트용)

```bash
USE_DATABASE=false
```

이 경우 항상 `data_local/brands.json`을 사용합니다.

### 사용 예시

```javascript
const { getBrandForEngine } = require('./engine/data_local/dbLoader');
const { calculate } = require('./engine/finance');

async function analyzeFinance(brandId, conditions, market, targetDailySales) {
  try {
    // 1. 브랜드 데이터 로드 (DB → data_local fallback 자동 처리)
    const brand = await getBrandForEngine(brandId);
    
    if (!brand) {
      throw new Error(`브랜드를 찾을 수 없습니다: ${brandId}`);
    }
    
    // 2. Finance 계산 (동기 함수)
    const financeResult = calculate({
      brand,
      conditions,
      market,
      targetDailySales
    });
    
    return financeResult;
  } catch (error) {
    console.error('Finance 분석 실패:', error);
    throw error;
  }
}
```

### Fallback 로그

**정상 케이스 (DB 연결 성공):**
```
📊 데이터베이스에서 브랜드 데이터 로드 시도...
✅ 데이터베이스에서 12개 브랜드 로드 성공
```

**Fallback 케이스 (DB 연결 실패):**
```
📊 데이터베이스에서 브랜드 데이터 로드 시도...
⚠️ 데이터베이스 로드 실패, data_local로 fallback: Connection refused
📁 data_local에서 브랜드 데이터 로드 시도...
✅ data_local에서 12개 브랜드 로드 성공
```

---

## 비동기 처리 방법

### 핵심 원칙

1. **Engine 함수는 동기 함수**입니다. `await`를 사용할 필요가 없습니다.
2. **데이터 로딩만 비동기**입니다 (DB 조회, 파일 읽기 등).
3. **비동기 → 동기 → 비동기** 흐름을 명확히 구분합니다.

### 패턴 1: 기본 비동기 처리

```javascript
const { getBrandForEngine } = require('./engine/data_local/dbLoader');
const { calculate: calculateFinance } = require('./engine/finance');
const { calculate: calculateDecision } = require('./engine/decision');

async function analyze(brandId, conditions, market, targetDailySales) {
  // 1. 비동기: 브랜드 데이터 로드
  const brand = await getBrandForEngine(brandId);
  
  // 2. 동기: Finance 계산
  const financeResult = calculateFinance({
    brand,
    conditions,
    market,
    targetDailySales
  });
  
  // 3. 동기: Decision 계산
  const decisionResult = calculateDecision({
    finance: financeResult,
    market: { marketScore: 70 },
    roadview: { riskScore: 70 }
  });
  
  return {
    finance: financeResult,
    decision: decisionResult
  };
}
```

### 패턴 2: Express 라우트에서 사용

```javascript
const express = require('express');
const router = express.Router();
const { getBrandForEngine } = require('../engine/data_local/dbLoader');
const { calculate: calculateFinance } = require('../engine/finance');
const { calculate: calculateDecision } = require('../engine/decision');

router.post('/api/analyze', async (req, res) => {
  try {
    const { brandId, conditions, market, targetDailySales } = req.body;
    
    // 비동기: 브랜드 데이터 로드 (DB → data_local fallback 자동)
    const brand = await getBrandForEngine(brandId);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        error: `브랜드를 찾을 수 없습니다: ${brandId}`
      });
    }
    
    // 동기: Finance 계산
    const financeResult = calculateFinance({
      brand,
      conditions,
      market,
      targetDailySales
    });
    
    // 동기: Decision 계산
    const decisionResult = calculateDecision({
      finance: financeResult,
      market: market || { marketScore: 70 },
      roadview: req.body.roadview || { riskScore: 70 },
      conditions,  // 개선 시뮬레이션용
      brand,        // 개선 시뮬레이션용
      targetDailySales  // 개선 시뮬레이션용
    });
    
    res.json({
      success: true,
      finance: financeResult,
      decision: decisionResult
    });
  } catch (error) {
    console.error('분석 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### 패턴 3: 여러 시나리오 병렬 계산

```javascript
const { getBrandForEngine } = require('./engine/data_local/dbLoader');
const { calculate } = require('./engine/finance');

async function calculateMultipleScenarios(brandId, conditions, market, scenarios) {
  // 비동기: 브랜드 데이터 로드 (한 번만)
  const brand = await getBrandForEngine(brandId);
  
  // 각 시나리오를 병렬로 계산
  const promises = scenarios.map(targetDailySales =>
    Promise.resolve(calculate({
      brand,
      conditions,
      market,
      targetDailySales
    }))
  );
  
  const results = await Promise.all(promises);
  
  return results.map((result, index) => ({
    scenario: scenarios[index],
    finance: result
  }));
}

// 사용
const scenarios = [200, 250, 300];
const results = await calculateMultipleScenarios(
  'brand_mega',
  conditions,
  market,
  scenarios
);
```

### 주의사항

1. **Promise.resolve() 사용**: 동기 함수를 Promise로 감싸 병렬 처리 가능
2. **에러 처리**: try-catch 또는 Promise.catch() 필수
3. **Fallback 자동 처리**: `getBrandForEngine()`이 내부적으로 fallback 처리

---

## Breakdown 활용 방법

### Breakdown이란?

Breakdown은 종합 점수(`score`)를 구성하는 각 항목별 점수입니다. 이를 통해 사용자에게 점수가 낮은 이유를 명확히 전달할 수 있습니다.

### Breakdown 구조

```javascript
{
  breakdown: {
    payback: 50,        // 회수 기간 점수 (0-100)
    profitability: 100, // 수익성 점수 (0-100)
    gap: 70,            // GAP 점수 (0-100)
    sensitivity: 100,   // 민감도 점수 (0-100)
    fixedCost: 100,     // 고정비 점수 (0-100)
    dscr: 100,          // DSCR 점수 (0-100)
    market: 70,         // 상권 점수 (0-100)
    roadview: 70        // 로드뷰 점수 (0-100)
  }
}
```

### 활용 예시

#### 1. 약점 항목 하이라이트

```javascript
const decisionResult = calculateDecision({
  finance: financeResult,
  market: { marketScore: 70 },
  roadview: { riskScore: 70 }
});

// 점수가 70점 미만인 항목 찾기
const weakPoints = Object.entries(decisionResult.breakdown)
  .filter(([key, score]) => score < 70)
  .map(([key, score]) => ({
    category: key,
    score: score,
    label: getCategoryLabel(key)  // 한글 이름 변환
  }));

// API 응답에 포함
res.json({
  success: true,
  decision: decisionResult,
  weakPoints: weakPoints  // 추가 정보
});
```

#### 2. Breakdown 차트 데이터 생성

```javascript
function getCategoryLabel(key) {
  const labels = {
    payback: '회수 기간',
    profitability: '수익성',
    gap: 'GAP',
    sensitivity: '민감도',
    fixedCost: '고정비',
    dscr: '대출 상환 능력',
    market: '상권',
    roadview: '로드뷰'
  };
  return labels[key] || key;
}

function getScoreColor(score) {
  if (score >= 80) return '#4CAF50';  // 녹색
  if (score >= 60) return '#FFC107'; // 노랑
  return '#F44336';                   // 빨강
}

// 프론트엔드 차트 라이브러리용 데이터 변환
const chartData = Object.entries(decisionResult.breakdown).map(([key, score]) => ({
  name: getCategoryLabel(key),
  score: score,
  color: getScoreColor(score),
  maxScore: 100
}));

// 예: Chart.js, Recharts 등에 사용 가능
```

#### 3. 개선 제안 우선순위 결정

```javascript
// 점수가 낮은 순서대로 정렬하여 개선 제안 우선순위 결정
const improvementPriority = Object.entries(decisionResult.breakdown)
  .map(([key, score]) => ({
    category: key,
    score: score,
    label: getCategoryLabel(key),
    improvement: getImprovementSuggestion(key, score)  // 개선 제안 함수
  }))
  .sort((a, b) => a.score - b.score);

function getImprovementSuggestion(category, score) {
  if (score >= 70) return null;
  
  const suggestions = {
    payback: '회수 기간을 단축하려면 매출 증대 또는 비용 절감이 필요합니다.',
    profitability: '수익성을 개선하려면 매출 증대 또는 원가 절감이 필요합니다.',
    gap: '목표 판매량을 현실적으로 조정하거나 마케팅 전략을 수립하세요.',
    sensitivity: '매출 변동에 취약하므로 비용 구조를 개선하세요.',
    fixedCost: '고정비 비중이 높습니다. 임대료 협상 또는 인건비 절감을 고려하세요.',
    dscr: '대출 상환 능력이 부족합니다. 대출 조건 재협상 또는 매출 증대가 필요합니다.'
  };
  
  return suggestions[category] || '해당 항목을 개선하세요.';
}
```

#### 4. API 응답에 Breakdown 포함

```javascript
router.post('/api/analyze', async (req, res) => {
  // ... 분석 로직 ...
  
  const decisionResult = calculateDecision({
    finance: financeResult,
    market: market,
    roadview: roadview
  });
  
  res.json({
    success: true,
    result: {
      score: decisionResult.score,
      signal: decisionResult.signal,
      breakdown: decisionResult.breakdown,  // Breakdown 포함
      breakdownSummary: {
        weakPoints: Object.entries(decisionResult.breakdown)
          .filter(([key, score]) => score < 70)
          .map(([key, score]) => ({ category: key, score })),
        strongPoints: Object.entries(decisionResult.breakdown)
          .filter(([key, score]) => score >= 80)
          .map(([key, score]) => ({ category: key, score }))
      },
      survivalMonths: decisionResult.survivalMonths,
      riskLevel: decisionResult.riskLevel
    }
  });
});
```

---

## Express 라우트 통합 예시

### 완전한 통합 예시

```javascript
const express = require('express');
const router = express.Router();
const { getBrandForEngine } = require('../engine/data_local/dbLoader');
const { calculate: calculateFinance } = require('../engine/finance');
const { calculate: calculateDecision } = require('../engine/decision');

/**
 * POST /api/analyze
 * 분석 실행
 */
router.post('/api/analyze', async (req, res) => {
  try {
    const { brandId, conditions, market, roadview, targetDailySales } = req.body;
    
    // 입력 검증
    if (!brandId || !conditions || !targetDailySales) {
      return res.status(400).json({
        success: false,
        error: '필수 입력값이 누락되었습니다.'
      });
    }
    
    // 1. 비동기: 브랜드 데이터 로드 (DB → data_local fallback)
    const brand = await getBrandForEngine(brandId);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        error: `브랜드를 찾을 수 없습니다: ${brandId}`
      });
    }
    
    // 2. 동기: Finance 계산
    const financeResult = calculateFinance({
      brand,
      conditions,
      market: market || {},
      targetDailySales
    });
    
    // 3. 동기: Decision 계산 (개선 시뮬레이션 포함)
    const decisionResult = calculateDecision({
      finance: financeResult,
      market: market || { marketScore: 70 },
      roadview: roadview || { riskScore: 70 },
      conditions,      // 개선 시뮬레이션용
      brand,           // 개선 시뮬레이션용
      targetDailySales // 개선 시뮬레이션용
    });
    
    // 4. Breakdown 분석
    const breakdownAnalysis = {
      weakPoints: Object.entries(decisionResult.breakdown)
        .filter(([key, score]) => score < 70)
        .map(([key, score]) => ({
          category: key,
          score: score,
          label: getCategoryLabel(key)
        })),
      strongPoints: Object.entries(decisionResult.breakdown)
        .filter(([key, score]) => score >= 80)
        .map(([key, score]) => ({
          category: key,
          score: score,
          label: getCategoryLabel(key)
        }))
    };
    
    // 5. 응답
    res.json({
      success: true,
      finance: financeResult,
      decision: {
        ...decisionResult,
        breakdownAnalysis  // 추가 분석 정보
      }
    });
  } catch (error) {
    console.error('분석 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/brands
 * 브랜드 목록 조회
 */
router.get('/api/brands', async (req, res) => {
  try {
    const { getAllBrands } = require('../engine/data_local/dbLoader');
    const brands = await getAllBrands();
    
    res.json({
      success: true,
      brands: brands
    });
  } catch (error) {
    console.error('브랜드 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

function getCategoryLabel(key) {
  const labels = {
    payback: '회수 기간',
    profitability: '수익성',
    gap: 'GAP',
    sensitivity: '민감도',
    fixedCost: '고정비',
    dscr: '대출 상환 능력',
    market: '상권',
    roadview: '로드뷰'
  };
  return labels[key] || key;
}

module.exports = router;
```

---

## 에러 처리 전략

### 1. 브랜드 데이터 로드 실패

```javascript
try {
  const brand = await getBrandForEngine(brandId);
  if (!brand) {
    // 브랜드를 찾을 수 없음
    return res.status(404).json({
      success: false,
      error: `브랜드를 찾을 수 없습니다: ${brandId}`
    });
  }
} catch (error) {
  // DB 연결 실패도 내부적으로 fallback 처리되므로,
  // 여기서 에러가 발생하면 data_local도 실패한 경우
  console.error('브랜드 데이터 로드 실패:', error);
  return res.status(500).json({
    success: false,
    error: '브랜드 데이터를 로드할 수 없습니다.'
  });
}
```

### 2. Finance 계산 에러

```javascript
try {
  const financeResult = calculateFinance({
    brand,
    conditions,
    market,
    targetDailySales
  });
} catch (error) {
  if (error.message.includes('brand.defaults가 필요합니다')) {
    return res.status(400).json({
      success: false,
      error: '브랜드 정보가 올바르지 않습니다.'
    });
  } else if (error.message.includes('targetDailySales는 0보다 큰 값이어야 합니다')) {
    return res.status(400).json({
      success: false,
      error: '목표 판매량이 올바르지 않습니다.'
    });
  } else {
    console.error('Finance 계산 실패:', error);
    return res.status(500).json({
      success: false,
      error: '손익 계산 중 오류가 발생했습니다.'
    });
  }
}
```

### 3. null 값 처리

```javascript
const financeResult = calculateFinance({ /* ... */ });

// null 체크 필수
if (financeResult.paybackMonths === null) {
  // 적자 상태 - 사용자에게 경고
  console.warn('월 순이익이 0 이하여서 회수 기간을 계산할 수 없습니다.');
}

if (financeResult.debt.dscr === null) {
  // 대출이 없음 - 정상
  console.log('대출 정보가 없습니다.');
}
```

---

## 추가 리소스

- [API 문서](./API_DOCUMENTATION.md)
- [DB 연동 가이드](./data_local/README_DB.md)
- [공유 인터페이스](../shared/interfaces.js)
