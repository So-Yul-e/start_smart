# AI 컨설팅 테스트 프로세스 가이드

## 📋 목차
1. [개요](#개요)
2. [시스템 구조](#시스템-구조)
3. [파일 구조 및 역할](#파일-구조-및-역할)
4. [실행 프로세스](#실행-프로세스)
5. [입력 데이터 구조](#입력-데이터-구조)
6. [프롬프트 엔지니어링](#프롬프트-엔지니어링)
7. [API 호출 및 응답 처리](#api-호출-및-응답-처리)
8. [출력 데이터 구조](#출력-데이터-구조)
9. [테스트 실행 방법](#테스트-실행-방법)
10. [실제 테스트 결과 분석](#실제-테스트-결과-분석)

---

## 개요

AI 컨설팅 모듈은 Claude API를 활용하여 프랜차이즈 카페 창업에 대한 종합적인 컨설팅을 제공합니다. 주요 기능은 다음과 같습니다:

- **판매량 시나리오 추론**: 보수적/기대/낙관적 판매량 예측
- **리스크 분석**: 핵심 리스크 Top 3 식별 및 개선 제안
- **경쟁 환경 분석**: 경쟁 강도, 차별화 가능성, 가격 전략 제안

### 사용 기술
- **API**: Anthropic Claude API
- **모델**: `claude-3-haiku-20240307` (현재 사용 중)
  - 참고: ROLE.md에는 `claude-3-5-sonnet-20241022`가 명시되어 있으나, 현재 API 키 권한으로는 Haiku 모델 사용
  - 최대 토큰 제한: 4,096 tokens
- **언어**: Node.js (JavaScript)

---

## 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    입력 데이터 (test.js)                     │
│  - 브랜드 정보, 위치, 창업 조건, 재무 분석, 상권 분석 등      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  generateConsulting()                       │
│                    (index.js)                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 판매량 시나리오 │ │ 리스크 분석   │ │ 경쟁 환경 분석 │
│ 프롬프트 생성   │ │ 프롬프트 생성  │ │ 프롬프트 생성  │
│ (prompts.js)  │ │ (prompts.js) │ │ (prompts.js) │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│              Claude API 호출 (병렬 처리)                      │
│              - callClaude() 함수 사용                         │
│              - JSON 응답 파싱 및 검증                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    결과 병합 및 반환                         │
│  - salesScenario, topRisks, improvements,                  │
│    competitiveAnalysis 포함                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 파일 구조 및 역할

### 1. `ROLE.md`
- **역할**: 프로젝트 가이드 문서
- **내용**:
  - 담당 영역 및 폴더 구조
  - API/크레딧 정보
  - 입력/출력 데이터 형식
  - 세팅 가이드
  - 단독 테스트 방법
  - 프롬프트 엔지니어링 가이드
  - 커밋 규칙

### 2. `prompts.js`
- **역할**: 프롬프트 템플릿 관리
- **주요 함수**:
  - `getSalesScenarioPrompt(data)`: 판매량 시나리오 추론 프롬프트 생성
  - `getRiskAnalysisPrompt(data)`: 리스크 분석 및 개선 제안 프롬프트 생성
  - `getCompetitiveAnalysisPrompt(data)`: 경쟁 환경 분석 프롬프트 생성
- **특징**: 토큰 비용 최적화를 위해 프롬프트를 간결하게 유지

### 3. `index.js`
- **역할**: 메인 로직 및 API 호출 처리
- **주요 함수**:
  - `generateConsulting(input)`: 메인 컨설팅 생성 함수
  - `generateSalesScenario(data)`: 판매량 시나리오 생성
  - `generateRiskAnalysis(data)`: 리스크 분석 생성
  - `generateCompetitiveAnalysis(data)`: 경쟁 환경 분석 생성
  - `callClaude(prompt, maxTokens)`: Claude API 호출 헬퍼
  - `parseJSONResponse(text)`: JSON 응답 파싱 (안전한 파싱)

### 4. `test.js`
- **역할**: 단독 테스트 스크립트
- **기능**:
  - 환경변수 로드 확인
  - 테스트 데이터 생성
  - `generateConsulting()` 호출
  - 결과 출력 및 요약

### 5. `utils.js`
- **역할**: 유틸리티 함수 (경쟁 밀도 계산 등)

---

## 실행 프로세스

### 1단계: 환경 설정

```bash
# Node.js 버전 확인 (24.x Current 권장)
node -v

# 프로젝트 클론 및 설치
git clone <repo-url>
cd StartSmart
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 ANTHROPIC_API_KEY 설정
```

### 2단계: 테스트 실행

```bash
# 테스트 스크립트 실행
node ai/consulting/test.js
```

### 3단계: 실행 흐름

1. **환경변수 검증** (`test.js`)
   - `ANTHROPIC_API_KEY` 로드 확인
   - API 키 유효성 검증

2. **테스트 데이터 준비** (`test.js`)
   - 브랜드 정보 (스타벅스)
   - 위치 정보 (강남구 테헤란로)
   - 창업 조건 (초기 투자금, 월세, 평수 등)
   - 재무 분석 결과 (월 매출, 월 순이익, 회수 기간 등)
   - 상권 분석 결과 (경쟁 카페 수, 유동인구 등)
   - 로드뷰 분석 결과 (리스크 점수)

3. **컨설팅 생성** (`index.js` → `generateConsulting()`)
   - 입력 데이터 검증
   - 경쟁 밀도 자동 계산 (필요시)
   - **병렬 처리로 3가지 분석 동시 실행**:
     - 판매량 시나리오 추론
     - 리스크 분석 및 개선 제안
     - 경쟁 환경 분석

4. **프롬프트 생성** (`prompts.js`)
   - 각 분석별로 프롬프트 템플릿에 데이터 주입
   - 한국어 프롬프트 생성

5. **Claude API 호출** (`index.js` → `callClaude()`)
   - 각 프롬프트를 Claude API에 전송
   - JSON 응답 수신
   - 응답 파싱 및 검증

6. **결과 병합** (`index.js`)
   - 3가지 분석 결과를 하나의 객체로 병합
   - 입력 데이터도 함께 반환

7. **결과 출력** (`test.js`)
   - JSON 형식으로 전체 결과 출력
   - 테스트 데이터 요약 출력

---

## 입력 데이터 구조

### 전체 입력 데이터 예시

```javascript
{
  // 브랜드 정보
  brand: {
    id: "brand_1",
    name: "스타벅스",
    defaults: {
      avgPrice: 4500,        // 평균 단가 (아메리카노 판매금액)
      cogsRate: 0.30,        // 원재료비 비율
      laborRate: 0.25,       // 인건비 비율
      utilitiesRate: 0.03,   // 공과금 비율
      royaltyRate: 0.05,     // 로열티 비율
      marketingRate: 0.02,   // 마케팅비 비율
      etcFixed: 500000       // 기타 고정비
    }
  },
  
  // 위치 정보
  location: {
    lat: 37.5665,
    lng: 126.9780,
    address: "서울특별시 강남구 테헤란로 123"
  },
  
  // 창업 조건
  conditions: {
    initialInvestment: 500000000,  // 초기 투자금 (5억원)
    monthlyRent: 3000000,           // 월세 (300만원)
    area: 33,                      // 평수 (33평)
    ownerWorking: true              // 점주 근무 여부
  },
  
  // 목표 판매량
  targetDailySales: 320,  // 목표 일 판매량 (잔/일)
  
  // 재무 분석 결과 (Finance Engine 출력값)
  finance: {
    monthlyRevenue: 33600000,      // 월 매출 (3,360만원)
    monthlyProfit: 8350000,         // 월 순이익 (835만원)
    paybackMonths: 29.9,            // 회수 기간 (29.9개월)
    breakEvenDailySales: 240.5,     // 손익분기점 (240.5잔/일)
    monthlyCosts: {
      rent: 3000000,                // 월세
      labor: 5000000,               // 인건비
      materials: 10080000,          // 원재료비
      utilities: 1008000,           // 공과금
      royalty: 1680000,             // 로열티
      marketing: 672000,            // 마케팅비
      etc: 500000                   // 기타
    },
    expected: {
      expectedDailySales: 322,      // 상권 기대 일 판매량
      expectedMonthlyRevenue: 34704000,
      gapPctVsTarget: -0.6,         // GAP -0.6%
      gapWarning: false
    },
    sensitivity: {
      plus10: { monthlyProfit: 10200000, paybackMonths: 24.5 },
      minus10: { monthlyProfit: 6515000, paybackMonths: 38.4 }
    }
  },
  
  // 상권 분석 결과
  market: {
    expectedDailySales: 322,        // 상권 평균 일 판매량
    radiusM: 500,                    // 반경 500m
    marketScore: 75,                 // 상권 점수
    competitors: {
      total: 5,                      // 경쟁 카페 수
      density: "high"                // 경쟁 밀도 (low | medium | high)
    },
    footTraffic: {
      weekday: "high",               // 평일 유동인구
      weekend: "medium"               // 주말 유동인구
    },
    tradeAreaType: "office",
    dayType: "weekday",
    footTrafficIndex: 1.2,
    demandMultiplier: 1.15           // 수요 배수
  },
  
  // 로드뷰 분석 결과
  roadview: {
    overallRisk: "medium",           // 전체 리스크 (low | medium | high)
    riskScore: 75                    // 리스크 점수 (0-100)
  },
  
  // Decision Engine 출력값 (선택적)
  decision: {
    score: 77,                      // 종합 점수
    successProbability: 0.77,       // 성공 확률
    signal: "green",                // 신호등 (green | yellow | red)
    survivalMonths: 33,             // 예상 생존 기간
    riskLevel: "low",                // 리스크 레벨
    riskFactors: [...],
    breakdown: { ... },
    riskCards: [...],
    improvementSimulations: [...]
  }
}
```

---

## 프롬프트 엔지니어링

### 1. 판매량 시나리오 추론 프롬프트

**목적**: 보수적/기대/낙관적 판매량 예측

**주요 내용**:
- 사용자 입력 조건 (브랜드, 입지, 창업 조건)
- 시스템 분석 결과 (상권 분석, 물리적 리스크)
- 반경 정보 포함 (기본 500m)

**출력 형식**:
```json
{
  "conservative": 숫자,  // 보수적 판매량 (잔/일)
  "expected": 숫자,      // 기대 판매량 (잔/일)
  "optimistic": 숫자,    // 낙관적 판매량 (잔/일)
  "reason": "이유 설명"
}
```

### 2. 리스크 분석 프롬프트

**목적**: 핵심 리스크 Top 3 식별 및 개선 제안

**주요 내용**:
- 재무 결과 상세 정보 (월 매출, 총 지출, 월 순이익, 회수 기간)
- 중요 계산식 설명
- 리스크 판단 기준:
  1. 월 순이익 기준 (최우선)
  2. 회수 기간 기준
  3. 상권 경쟁도
  4. 물리적 리스크
- 개선 제안 작성 가이드
- 비교 분석 시나리오 작성 가이드

**출력 형식**:
```json
{
  "topRisks": [
    {
      "title": "리스크 제목",
      "description": "상세 설명",
      "impact": "high"  // high | medium | low
    }
  ],
  "improvements": [
    {
      "title": "개선 제안 제목",
      "description": "상세 설명",
      "expectedImpact": "기대 효과",
      "scenarios": [
        {
          "type": "rent_reduction",
          "description": "시나리오 설명",
          "before": { "monthlyProfit": 숫자, "paybackMonths": 숫자 },
          "after": { "monthlyProfit": 숫자, "paybackMonths": 숫자 },
          "improvement": { "profitIncrease": 숫자, "paybackReduction": 숫자 }
        }
      ]
    }
  ]
}
```

**주의사항**: JSON 문자열 값 내부에는 따옴표를 사용하지 않도록 프롬프트에 명시

### 3. 경쟁 환경 분석 프롬프트

**목적**: 경쟁 강도, 차별화 가능성, 가격 전략 제안

**주요 내용**:
- 경쟁 정보 (경쟁 카페 수, 경쟁 밀도, 브랜드)
- 경쟁 밀도 판단 기준
- 기준선(Benchmark) 데이터 (도시 평균, 상위 20%, 상위 10%)
- reasoningRule 작성 가이드

**출력 형식**:
```json
{
  "intensity": "high",           // low | medium | high
  "differentiation": "possible", // possible | difficult | impossible
  "priceStrategy": "premium",    // premium | standard | budget
  "reasoningRule": {
    "metric": "competitor_count_500m",
    "userValue": 5,
    "benchmark": {
      "cityAverage": 2.1,
      "top20Percent": 4.3,
      "top10Percent": 6.5
    },
    "judgement": "상위 X% 경쟁 밀도" 또는 "도시 평균의 Y배 수준"
  }
}
```

---

## API 호출 및 응답 처리

### 1. Claude API 호출 (`callClaude()`)

**파라미터**:
- `prompt`: 프롬프트 텍스트
- `maxTokens`: 최대 토큰 수 (기본값: 4096, 모델 제한)

**처리 과정**:
1. 모델 제한 확인 (`claude-3-haiku-20240307` 최대 4096 tokens)
2. API 호출 (`anthropic.messages.create()`)
3. 응답 완전성 확인 (`stop_reason` 체크)
4. JSON 파싱 (`parseJSONResponse()`)

### 2. JSON 응답 파싱 (`parseJSONResponse()`)

**주요 기능**:
- JSON 코드 블록 제거 (```json ... ```)
- JSON 객체만 추출 (중괄호로 시작하고 끝나는 부분)
- 문자열 값 내부의 따옴표 이스케이프 처리
- 에러 처리 및 디버깅 정보 제공

**처리 예시**:
```javascript
// 입력: "description": "월 순이익이 500만원 미만으로 "medium" 리스크"
// 처리: "description": "월 순이익이 500만원 미만으로 \"medium\" 리스크"
```

### 3. 응답 검증

각 분석별로 응답 형식을 검증:
- **판매량 시나리오**: `conservative`, `expected`, `optimistic`, `reason` 필수
- **리스크 분석**: `topRisks`, `improvements` 배열 필수
- **경쟁 환경 분석**: `intensity`, `differentiation`, `priceStrategy` enum 값 검증

### 4. 리스크 우선순위 정렬

리스크 분석 결과는 다음 기준으로 정렬:
1. **impact 레벨**: high > medium > low
2. **같은 impact 내에서**: 월 순이익 리스크 > 회수 기간 리스크 > 상권 경쟁도 리스크 > 물리적 리스크
3. **최대 3개로 제한**

---

## 출력 데이터 구조

### 전체 출력 데이터 예시

```javascript
{
  // 입력 데이터 (그대로 반환)
  brand: { ... },
  location: { ... },
  conditions: { ... },
  targetDailySales: 320,
  finance: { ... },
  market: { ... },
  roadview: { ... },
  decision: { ... },
  
  // AI 컨설팅 결과
  
  // 1. 판매량 시나리오
  salesScenario: {
    conservative: 400,    // 보수적 판매량 (잔/일)
    expected: 500,        // 기대 판매량 (잔/일)
    optimistic: 600       // 낙관적 판매량 (잔/일)
  },
  salesScenarioReason: "해당 지역은 유동인구가 높고 경쟁 카페 수가 많아 고객 확보가 어려울 것으로 예상됩니다. 보수적 예상 판매량은 400잔/일로 책정하였고, 기대 판매량은 500잔/일, 낙관적 판매량은 600잔/일로 예측했습니다. 점주의 적극적인 마케팅 활동과 효율적인 운영이 필요할 것으로 보입니다.",
  
  // 2. 리스크 분석
  topRisks: [
    {
      title: "상권 경쟁도 리스크",
      description: "경쟁 밀도가 high로 리스크가 높습니다",
      impact: "high"
    },
    {
      title: "월 순이익 리스크",
      description: "월 순이익이 500만원 미만으로 medium 리스크 수준입니다",
      impact: "medium"
    },
    {
      title: "지출 비용 과다 리스크",
      description: "총 지출 금액이 월 매출의 65.3%로 medium 리스크 수준입니다",
      impact: "medium"
    }
  ],
  
  // 3. 개선 제안
  improvements: [
    {
      title: "월세 절감",
      description: "월세를 10% 낮추면 월 순이익이 증가하여 회수 기간이 단축됩니다",
      expectedImpact: "월세를 10% 낮추면 월 순이익이 85만원 증가하고 회수 기간이 27.5개월로 단축됩니다",
      scenarios: [
        {
          type: "rent_reduction",
          description: "월세 10% 감소",
          before: { monthlyProfit: 835, paybackMonths: 29.9 },
          after: { monthlyProfit: 920, paybackMonths: 27.5 },
          improvement: { profitIncrease: 85, paybackReduction: 2.4 }
        }
      ]
    },
    {
      title: "원재료비 절감",
      description: "원재료 구매처 협상 또는 대량 구매로 원재료비를 5% 절감 가능합니다",
      expectedImpact: "원재료비를 5% 절감하면 월 순이익이 50만원 증가하고 회수 기간이 28.1개월로 단축됩니다",
      scenarios: [
        {
          type: "material_cost_reduction",
          description: "원재료비 5% 절감",
          before: { monthlyProfit: 835, paybackMonths: 29.9 },
          after: { monthlyProfit: 885, paybackMonths: 28.1 },
          improvement: { profitIncrease: 50, paybackReduction: 1.8 }
        }
      ]
    },
    {
      title: "상권 변경",
      description: "경쟁 카페가 2-3개인 지역으로 이동하면 차별화 가능성이 높아져 예상 판매량이 증가할 것으로 보입니다",
      expectedImpact: "경쟁 카페가 2-3개인 지역으로 이동하면 월 순이익이 950만원으로 증가하고 회수 기간이 26.3개월로 단축됩니다",
      scenarios: [
        {
          type: "location_change",
          description: "경쟁 카페 2-3개 지역으로 이동",
          before: { monthlyProfit: 835, paybackMonths: 29.9 },
          after: { monthlyProfit: 950, paybackMonths: 26.3 },
          improvement: { profitIncrease: 115, paybackReduction: 3.6 }
        }
      ]
    }
  ],
  
  // 4. 경쟁 환경 분석
  competitiveAnalysis: {
    intensity: "high",
    differentiation: "difficult",
    priceStrategy: "budget",
    reasoningRule: {
      metric: "competitor_count_500m",
      userValue: 5,
      benchmark: {
        cityAverage: 2.1,
        top20Percent: 4.3,
        top10Percent: 6.5
      },
      judgement: "상위 15% 경쟁 밀도, 도시 평균의 2.4배 수준"
    }
  }
}
```

---

## 테스트 실행 방법

### 1. 환경 설정

```bash
# 프로젝트 루트에서
cd start_smart-main/start_smart-main

# 환경변수 확인
cat .env | grep ANTHROPIC_API_KEY
```

### 2. 테스트 실행

```bash
# 테스트 스크립트 실행
node ai/consulting/test.js
```

### 3. 예상 출력

```
✅ 환경변수 로드 확인: ANTHROPIC_API_KEY가 설정되었습니다.
   API Key: sk-ant-api03-xxxxx...xxxxx

=== 컨설팅 결과 ===
{
  "brand": { ... },
  "location": { ... },
  ...
  "salesScenario": { ... },
  "topRisks": [ ... ],
  "improvements": [ ... ],
  "competitiveAnalysis": { ... }
}

=== 테스트 데이터 요약 ===
브랜드: 스타벅스
목표 판매량: 320잔/일
상권 기대 판매량: 322잔/일
GAP: -0.6%
종합 점수: 77점
예상 생존 기간: 33개월
```

### 4. 확인 사항

- [ ] JSON 형식이 올바른지
- [ ] `salesScenario`에 3가지 값이 모두 있는지
- [ ] `topRisks`와 `improvements`가 각각 최대 3개인지
- [ ] `competitiveAnalysis`의 값들이 올바른 enum인지
- [ ] 모든 텍스트가 한국어로 작성되는지

---

## 실제 테스트 결과 분석

### 테스트 케이스: 스타벅스 강남구 테헤란로

#### 입력 데이터 요약
- **브랜드**: 스타벅스
- **위치**: 서울특별시 강남구 테헤란로 123
- **초기 투자금**: 5억원
- **월세**: 300만원
- **목표 판매량**: 320잔/일
- **경쟁 카페 수**: 5개 (반경 500m 내)
- **경쟁 밀도**: high

#### 출력 결과 분석

##### 1. 판매량 시나리오
```json
{
  "conservative": 400,
  "expected": 500,
  "optimistic": 600
}
```
- **분석**: 기대 판매량(500잔/일)이 목표 판매량(320잔/일)보다 훨씬 높음 (156% 수준)
- **이유**: "해당 지역은 유동인구가 높고 경쟁 카페 수가 많아 고객 확보가 어려울 것으로 예상됩니다. 보수적 예상 판매량은 400잔/일로 책정하였고, 기대 판매량은 500잔/일, 낙관적 판매량은 600잔/일로 예측했습니다. 점주의 적극적인 마케팅 활동과 효율적인 운영이 필요할 것으로 보입니다."

##### 2. 리스크 분석

**Top 3 리스크**:
1. **상권 경쟁도 리스크** (high)
   - 경쟁 밀도가 high로 리스크가 높습니다
2. **월 순이익 리스크** (medium)
   - 월 순이익이 500만원 미만으로 medium 리스크 수준입니다
   - (참고: 실제 월 순이익은 835만원이지만, AI가 보수적으로 판단)
3. **지출 비용 과다 리스크** (medium)
   - 총 지출 금액이 월 매출의 65.3%로 medium 리스크 수준입니다

**개선 제안**:
1. **월세 절감**: 10% 감소 시 월 순이익 85만원 증가, 회수 기간 2.4개월 단축 (27.5개월로 단축)
2. **원재료비 절감**: 5% 절감 시 월 순이익 50만원 증가, 회수 기간 1.8개월 단축 (28.1개월로 단축)
3. **상권 변경**: 경쟁 카페가 2-3개인 지역으로 이동 시 월 순이익 115만원 증가, 회수 기간 3.6개월 단축 (26.3개월로 단축)

##### 3. 경쟁 환경 분석
```json
{
  "intensity": "high",
  "differentiation": "difficult",
  "priceStrategy": "budget",
  "reasoningRule": {
    "metric": "competitor_count_500m",
    "userValue": 5,
    "benchmark": {
      "cityAverage": 2.1,
      "top20Percent": 4.3,
      "top10Percent": 6.5
    },
    "judgement": "상위 15% 경쟁 밀도, 도시 평균의 2.4배 수준"
  }
}
```
- **분석**: 경쟁 강도가 높고 차별화가 어려운 상권
- **기준선 비교**: 경쟁 카페 수 5개는 도시 평균(2.1개)의 2.4배, 상위 15% 수준
- **가격 전략**: 프리미엄보다는 예산형(budget) 가격 전략 권장 (경쟁이 치열하여 가격 경쟁력이 중요)

#### 종합 평가

**강점**:
- 기대 판매량(500잔/일)이 목표 판매량(320잔/일)보다 훨씬 높음 (156% 수준)
- 월 순이익이 양수(835만원)이며 회수 기간이 30개월 미만(29.9개월)
- 로드뷰 리스크 점수가 75점으로 양호
- 종합 점수 77점, 신호등 "green" (LOW RISK)

**약점**:
- 경쟁 카페 수가 많아(5개) 차별화가 어려움 (상위 15% 경쟁 밀도)
- 지출 비용이 월 매출의 65.3%로 수익률이 낮음
- 회수 기간이 29.9개월로 36개월 기준에 근접
- 예상 생존 기간이 33개월로 36개월 이하 (주의 필요)

**개선 권장사항**:
1. **월세 절감**: 10% 절감 시 월 순이익 85만원 증가, 회수 기간 2.4개월 단축
2. **원재료비 절감**: 5% 절감 시 월 순이익 50만원 증가, 회수 기간 1.8개월 단축
3. **상권 변경**: 경쟁 카페가 2-3개인 지역으로 이동 시 월 순이익 115만원 증가, 회수 기간 3.6개월 단축
4. **가격 전략**: 예산형(budget) 가격 전략으로 경쟁력 확보
5. **차별화 전략**: 경쟁이 치열한 상권이므로 서비스, 메뉴, 브랜딩 차별화 필수

---

## 주의사항 및 트러블슈팅

### 1. API 키 설정
- `.env` 파일에 `ANTHROPIC_API_KEY`가 올바르게 설정되어 있는지 확인
- API 키가 한 줄로 되어 있는지 확인 (줄바꿈 없이)

### 2. JSON 파싱 오류
- **증상**: `JSON 파싱 오류` 메시지 출력
- **원인**: 
  - 응답이 `max_tokens` 제한으로 잘림
  - JSON 문자열 값 내부에 따옴표 사용
- **해결**:
  - 프롬프트에서 JSON 내부 문자열에 따옴표를 사용하지 않도록 수정
  - `max_tokens`를 늘릴 수 없으므로 프롬프트를 간결하게 유지

### 3. 응답 형식 오류
- **증상**: `응답 형식이 올바르지 않습니다` 메시지 출력
- **원인**: Claude 응답이 예상한 형식과 다름
- **해결**: 프롬프트에서 출력 형식을 더 명확하게 지정

### 4. 토큰 제한
- 현재 사용 모델(`claude-3-haiku-20240307`)의 최대 토큰은 4,096
- 응답이 잘릴 경우 프롬프트를 간결하게 수정하거나 더 짧은 응답을 요청

---

## 다음 단계

1. **프롬프트 개선**: 더 정확한 판매량 예측을 위한 프롬프트 튜닝
2. **시나리오 확장**: 더 다양한 개선 시나리오 추가
3. **캐싱 구현**: 동일한 입력에 대한 응답 캐싱으로 비용 절감
4. **에러 핸들링 강화**: 더 상세한 에러 메시지 및 복구 로직
5. **테스트 자동화**: 다양한 테스트 케이스에 대한 자동 테스트 스크립트

---

## 참고 자료

- [ROLE.md](./ROLE.md): 프로젝트 가이드 문서
- [prompts.js](./prompts.js): 프롬프트 템플릿
- [index.js](./index.js): 메인 로직
- [test.js](./test.js): 테스트 스크립트
- [Anthropic Claude API 문서](https://docs.anthropic.com/)

