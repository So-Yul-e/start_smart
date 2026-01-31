# StartSmart Cafe Franchise - 전체 PRD (Product Requirements Document)

**AI 기반 프랜차이즈 카페 창업 현실 검증 시뮬레이터**

> "될 것 같은지"가 아니라 "수치·현장·구조상 가능한지"로 판단하게 만드는 AI 의사결정 시뮬레이터

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [핵심 기능 상세](#3-핵심-기능-상세)
4. [데이터 모델](#4-데이터-모델)
5. [API 명세](#5-api-명세)
6. [AI 모듈 상세](#6-ai-모듈-상세)
7. [계산 엔진 상세](#7-계산-엔진-상세)
8. [프론트엔드 구조](#8-프론트엔드-구조)
9. [데이터베이스 구조](#9-데이터베이스-구조)
10. [배포 및 운영](#10-배포-및-운영)
11. [향후 계획](#11-향후-계획)

---

## 1. 프로젝트 개요

### 1.1 제품 정의

**StartSmart**는 프랜차이즈 카페 창업 의사결정을 지원하는 AI 기반 시뮬레이션 서비스입니다. 사용자가 선택한 브랜드, 입지, 투자 조건을 바탕으로 재무 분석, 상권 분석, 물리적 입지 리스크 분석을 수행하고, AI가 종합 판단과 개선 제안을 제공합니다.

### 1.2 핵심 가치

- **구체화**: 창업 조건을 실행 가능한 숫자(회수 개월, 순이익, 필요 판매량)로 전환
- **현실 검증**: 상권·비용·물리적 입지 조건이 목표 판매량을 허용하는지 검증
- **판단 보조**: 계산 결과를 AI가 컨설턴트 관점에서 해석·설명
- **재사용**: 조건을 변경하며 반복 시뮬레이션 → 최종 창업 결정까지 지원

### 1.3 MVP 범위

- **업종**: 프랜차이즈 카페 단일
- **브랜드**: 12개 (PostgreSQL 데이터베이스 저장)
- **지역**: 서울 (초기 데모는 강남구로 제한 가능)
- **상권 분석**: 지도 핀 기반 반경 분석 (300m / 500m / 1km)
- **분석 레이어**:
  - 재무 시뮬레이션 (손익 계산, 회수 기간, 민감도 분석)
  - 상권 경쟁도 분석
  - AI 로드뷰 기반 물리 리스크 분석
  - AI 리스크 해석 & 개선 제안
- **산출물**:
  - 결과 대시보드 (웹 UI)
  - PDF 리포트 (다운로드 가능)

### 1.4 판정 기준

- **점수**: 0~100점
- **신호등**: 🟢 Green (70점 이상) / 🟡 Yellow (50~69점) / 🔴 Red (50점 미만)
- **예상 생존 개월 수**: 36개월 기준선 감점형 계산
- **하드컷 규칙**:
  - 회수 기간 ≥ 36개월 → 🔴 위험
  - 월 순이익 ≤ 0 → 🔴 위험

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
StartSmart/
├── frontend/              # 역할 1: UI 전체
│   ├── brand/             #   브랜드 선택 페이지
│   ├── input/             #   조건 입력 폼
│   ├── dashboard/         #   결과 대시보드
│   └── report/            #   PDF 리포트 생성
│
├── ai/
│   ├── roadview/          # 역할 2: AI-로드뷰 (비전 분석)
│   │   ├── index.js
│   │   └── visionAnalyzer.js
│   └── consulting/       # 역할 3: AI-판단 (컨설팅)
│       ├── index.js
│       └── prompts.js
│
├── engine/                # 역할 4: 계산 엔진
│   ├── finance/           #   손익 계산
│   │   ├── index.js
│   │   ├── calculator.js
│   │   └── loan/          #   대출 상환 계산
│   └── decision/          #   점수/신호등 판단
│       ├── index.js
│       └── scorer.js
│
├── backend/               # 역할 5: 백엔드+통합
│   ├── server.js          #   Express 서버
│   ├── routes/            #   API 라우트
│   │   ├── brands.js
│   │   ├── analyze.js
│   │   ├── result.js
│   │   ├── report.js
│   │   ├── roadview.js
│   │   └── consulting.js
│   ├── services/
│   │   └── orchestrator.js  #   AI 파이프라인 총괄
│   ├── market/            #   상권 분석
│   │   ├── index.js
│   │   └── mapApi.js
│   └── db/                #   데이터베이스
│       ├── connection.js
│       └── analysisRepository.js
│
├── shared/                # 공용 인터페이스
│   ├── interfaces.js      #   데이터 계약 정의
│   ├── reportModel.js     #   리포트 ViewModel 생성
│   └── constants.js       #   상수 정의
│
└── docs/                  # 문서
    ├── PRD.md
    ├── IA.md
    └── ...
```

### 2.2 기술 스택

#### 백엔드
- **런타임**: Node.js 24.x Current
- **프레임워크**: Express.js 4.18.2
- **데이터베이스**: PostgreSQL (Supabase)
- **ORM/쿼리**: pg (PostgreSQL 클라이언트)

#### AI/ML
- **비전 분석**: Google Gemini Vision API (`gemini-1.5-pro-vision`)
- **컨설팅 AI**: Anthropic Claude API (`claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`)

#### 프론트엔드
- **기술**: 순수 HTML/CSS/JavaScript (Vanilla JS)
- **PDF 생성**: jsPDF 2.5.1, jspdf-autotable 3.8.3
- **지도 API**: Kakao Maps API / Google Maps API

#### 인프라
- **배포**: Vercel (서버리스 함수)
- **환경변수 관리**: dotenv

### 2.3 데이터 흐름

```
사용자 입력
  ↓
프론트엔드 (브랜드 선택, 입지 선택, 조건 입력)
  ↓
POST /api/analyze
  ↓
백엔드 Orchestrator
  ├─→ 상권 분석 (backend/market)
  ├─→ 손익 계산 (engine/finance)
  ├─→ 로드뷰 분석 (ai/roadview) → Gemini Vision
  ├─→ AI 컨설팅 (ai/consulting) → Claude
  └─→ 판단 계산 (engine/decision)
  ↓
결과 저장 (PostgreSQL)
  ↓
GET /api/result/:analysisId (폴링)
  ↓
프론트엔드 대시보드 표시
  ↓
POST /api/report/:analysisId → PDF 생성
```

---

## 3. 핵심 기능 상세

### 3.1 사용자 플로우

1. **브랜드 선택** (`/brand`)
   - 12개 프랜차이즈 브랜드 카드 리스트
   - 브랜드명, 포지션 태그 표시
   - "이 브랜드로 분석하기" CTA

2. **입지 선택** (`/input`)
   - 지도 인터랙션 (Kakao Maps / Google Maps)
   - 핀 클릭 → 좌표 확정
   - 반경 선택: 300m / 500m / 1km
   - 상권 요약 카드 (경쟁 카페 수, 경쟁 밀도)

3. **조건 입력** (`/input`)
   - 기본 입력:
     - 초기 투자금 (원)
     - 월세 (원)
     - 평수 (평)
     - 점주 근무 여부 (Y/N)
   - 대출 정보 (선택):
     - 대출 원금, 연 이자율, 대출 기간, 상환 방식
   - 판매량 설정:
     - AI 제안 판매량 (보수 / 기대 / 낙관)
     - 사용자 목표 판매량 입력

4. **분석 실행**
   - "이 조건으로 분석하기" CTA
   - 로딩 단계 표시:
     1. 손익 계산
     2. 상권 경쟁 분석
     3. 로드뷰 물리 리스크 분석
     4. AI 리스크 해석
     5. 판단 계산

5. **결과 대시보드** (`/dashboard`)
   - 핵심 카드:
     - 최종 점수 + 신호등 (🟢🟡🔴)
     - 예상 생존 개월 수
     - 회수 개월
     - 월 순이익
   - 차트:
     - 손익 구조 스택 차트
     - 민감도 ±10% 그래프
     - 시나리오 비교 테이블

6. **AI 판단 상세**
   - 핵심 리스크 Top 3
   - 개선 제안 (최대 3가지)
   - 경쟁 환경 해석
   - GAP 분석 (목표 vs 기대 판매량)

7. **시뮬레이션 비교**
   - Before / After 카드
   - 조건 변경 시 재계산
   - 점수 / 회수 개월 변화 강조

8. **PDF 리포트 출력** (`/report`)
   - PDF 다운로드
   - 요약 페이지, 차트 페이지, AI 판단 코멘트 페이지

### 3.2 AI 핵심 역할

#### AI의 역할
- 계산 결과 해석 및 구조적 리스크 식별
- 목표 판매량의 현실성 판단
- 경쟁 환경에서의 생존 전략 추론
- 물리적 입지 리스크(로드뷰) 인식
- 개선 레버(무엇을 바꾸면 효과적인지) 제안

#### AI 없이는 불가능한 영역
- 이미지 기반 물리 리스크 인식 (Gemini Vision)
- 다변수 결과의 종합 판단 언어화 (Claude)
- 경쟁 구도의 정성적 해석 (Claude)

---

## 4. 데이터 모델

### 4.1 브랜드 데이터

```javascript
{
  id: "brand_1",
  name: "스타벅스",
  position: "프리미엄",
  initialInvestment: 500000000,  // 초기 투자금 (원)
  monthlyRoyalty: 5,             // 로열티 (%)
  monthlyMarketing: 2,           // 마케팅비 (%)
  avgDailySales: 250,            // 평균 일 판매량 (잔)
  // 브랜드 기본값 (계산 엔진용)
  defaults: {
    avgPrice: 5000,               // 평균 단가 (원/잔)
    cogsRate: 0.30,              // 원가율 (매출 대비)
    laborRate: 0.25,              // 인건비율 (매출 대비)
    utilitiesRate: 0.03,         // 공과금 비율 (매출 대비)
    etcFixed: 1500000,           // 기타 고정비 (원)
    royaltyRate: 0.05,            // 로열티율 (매출 대비)
    marketingRate: 0.02,          // 마케팅비율 (매출 대비)
    ownerWorkingMultiplier: 0.6   // 점주 근무 시 인건비 감소 계수
  }
}
```

### 4.2 분석 요청

```javascript
{
  brandId: "brand_1",
  location: {
    lat: 37.5665,
    lng: 126.9780,
    address: "서울특별시 강남구 테헤란로 123"
  },
  radius: 500,  // 300 | 500 | 1000 (m)
  conditions: {
    initialInvestment: 500000000,  // 초기 투자금 (원)
    monthlyRent: 3000000,           // 월세 (원)
    area: 33,                      // 평수 (평)
    ownerWorking: true,             // 점주 근무 여부
    loans: [                       // 대출 정보 배열 (선택적)
      {
        principal: 200000000,      // 대출 원금 (원)
        apr: 0.05,                 // 연 이자율 (0-1, 예: 0.05 = 5%)
        termMonths: 60,            // 대출 기간 (개월)
        repaymentType: "equal_payment"  // 상환 방식: "equal_payment" | "equal_principal" | "interest_only"
      }
    ]
  },
  targetDailySales: 300  // 목표 일 판매량 (잔)
}
```

### 4.3 최종 분석 결과

```javascript
{
  id: "analysis_abc123",
  status: "completed",  // pending | processing | completed | failed
  brand: { id: "brand_1", name: "스타벅스" },
  location: { lat: 37.5665, lng: 126.9780, address: "..." },
  finance: {
    monthlyRevenue: 27000000,      // 월 매출 (원)
    monthlyCosts: { ... },
    monthlyProfit: 10000000,      // 월 순이익 (원, 대출 상환 후)
    operatingProfit: 12000000,      // 영업 이익 (원, 대출 상환 전)
    paybackMonths: 50,             // 회수 개월 수
    breakEvenDailySales: 200,      // 손익분기점 일 판매량 (잔)
    expected: {
      expectedDailySales: 250,
      expectedMonthlyRevenue: 22500000,
      gapPctVsTarget: 0.20
    },
    debt: {
      monthlyPayment: 3775000,
      dscr: 3.18,
      debtSchedulePreview: [ ... ]
    },
    sensitivity: { plus10: {...}, minus10: {...} }
  },
  decision: {
    score: 65,
    signal: "yellow",
    survivalMonths: 24,
    riskLevel: "medium",
    riskCards: [ ... ],
    improvementSimulations: [ ... ]
  },
  aiConsulting: {
    salesScenario: { conservative: 200, expected: 250, optimistic: 300 },
    topRisks: [ ... ],
    improvements: [ ... ],
    competitiveAnalysis: { ... }
  },
  roadview: {
    risks: [ ... ],
    overallRisk: "medium",
    riskScore: 65
  },
  market: {
    competitors: { total: 5, density: "high" },
    footTraffic: { ... },
    marketScore: 70
  },
  reportModel: { ... },  // 리포트 전용 ViewModel
  createdAt: "2026-02-01T14:30:00Z"
}
```

---

## 5. API 명세

### 5.1 브랜드 목록 조회

**GET** `/api/brands`

**응답**:
```json
{
  "success": true,
  "brands": [
    {
      "id": "brand_1",
      "name": "스타벅스",
      "position": "프리미엄",
      "initialInvestment": 500000000,
      "monthlyRoyalty": 5,
      "monthlyMarketing": 2,
      "avgDailySales": 250
    }
  ]
}
```

### 5.2 분석 실행

**POST** `/api/analyze`

**요청 본문**:
```json
{
  "brandId": "brand_1",
  "location": { "lat": 37.5665, "lng": 126.9780, "address": "..." },
  "radius": 500,
  "conditions": { ... },
  "targetDailySales": 300
}
```

**응답**:
```json
{
  "success": true,
  "analysisId": "analysis_abc123",
  "message": "분석을 시작합니다."
}
```

### 5.3 분석 결과 조회

**GET** `/api/result/:analysisId`

**응답**:
```json
{
  "success": true,
  "result": {
    "id": "analysis_abc123",
    "status": "completed",
    ...
  }
}
```

### 5.4 PDF 리포트 생성

**POST** `/api/report/:analysisId`

**응답**:
```json
{
  "success": true,
  "reportUrl": "https://storage.googleapis.com/bucket/report_abc123.pdf",
  "reportId": "report_abc123"
}
```

### 5.5 로드뷰 이미지 분석

**POST** `/api/roadview/analyze`

**요청**: `multipart/form-data`
- `roadview`: 이미지 파일 (선택)
- `roadmap`: 이미지 파일 (선택)
- `address`: 주소 문자열
- `lat`: 위도
- `lng`: 경도
- `metadata`: JSON 문자열 (경쟁 분석 메타데이터)

**응답**:
```json
{
  "success": true,
  "analysis": {
    "risks": [ ... ],
    "overallRisk": "medium",
    "riskScore": 65
  }
}
```

### 5.6 리포트 Q&A

**POST** `/api/consulting/chat`

**요청 본문**:
```json
{
  "analysisId": "analysis_abc123",
  "message": "회수 기간이 왜 50개월인가요?"
}
```

**응답**:
```json
{
  "success": true,
  "response": "회수 기간 50개월은 초기 투자금 5억원을 월 순이익 1천만원으로 나눈 결과입니다..."
}
```

---

## 6. AI 모듈 상세

### 6.1 AI 로드뷰 분석 (ai/roadview)

#### 기능
- Google Gemini Vision API를 사용한 로드뷰 이미지 분석
- 물리적 입지 리스크 인식:
  - 간판 가림 (signage_obstruction)
  - 급경사 (steep_slope)
  - 층위 추정 (floor_level)
  - 보행 가시성 (visibility)

#### 입력
```javascript
{
  location: { lat: 37.5665, lng: 126.9780 },
  imageUrl: "https://maps.googleapis.com/maps/api/streetview?...",
  source: "google"  // 'google' | 'naver' | 'kakao'
}
```

#### 출력
```javascript
{
  location: { lat: 37.5665, lng: 126.9780 },
  risks: [
    {
      type: "signage_obstruction",
      level: "medium",  // low | medium | high
      description: "주변 건물에 의해 간판이 부분적으로 가려짐"
    },
    ...
  ],
  overallRisk: "medium",  // low | medium | high
  riskScore: 65  // 0-100 (낮을수록 위험)
}
```

#### 구현 파일
- `ai/roadview/index.js`: 메인 로직
- `ai/roadview/visionAnalyzer.js`: Gemini Vision API 연동

### 6.2 AI 컨설팅 (ai/consulting)

#### 기능
- Anthropic Claude API를 사용한 판매량 시나리오 추론
- 리스크 분석 및 개선 제안
- 경쟁 환경 해석

#### 입력
```javascript
{
  brand: { id: "brand_1", name: "스타벅스" },
  location: { lat: 37.5665, lng: 126.9780, address: "..." },
  conditions: { ... },
  targetDailySales: 300,
  finance: { ... },
  decision: { ... },
  market: { ... },
  roadview: { ... }
}
```

#### 출력
```javascript
{
  salesScenario: {
    conservative: 200,    // 보수적 판매량 (잔/일)
    expected: 250,        // 기대 판매량 (잔/일)
    optimistic: 300       // 낙관적 판매량 (잔/일)
  },
  salesScenarioReason: "주변 경쟁 카페 밀도가 높고...",
  topRisks: [
    {
      title: "회수 기간 초과",
      description: "36개월 회수 기준을 초과하여...",
      impact: "high"  // high | medium | low
    },
    ...
  ],
  improvements: [
    {
      title: "월세 협상",
      description: "월세를 10% 낮추면...",
      expectedImpact: "paybackMonths: 50 → 45"
    },
    ...
  ],
  competitiveAnalysis: {
    intensity: "high",           // low | medium | high
    differentiation: "possible", // possible | difficult | impossible
    priceStrategy: "premium"     // premium | standard | budget
  }
}
```

#### 구현 파일
- `ai/consulting/index.js`: 메인 로직
- `ai/consulting/prompts.js`: 프롬프트 템플릿

#### 사용 모델
- `claude-3-5-sonnet-20241022`: 리스크 분석 및 개선 제안
- `claude-3-haiku-20240307`: 리포트 Q&A

---

## 7. 계산 엔진 상세

### 7.1 손익 계산 엔진 (engine/finance)

#### 핵심 계산식

**월 매출 계산**:
```
월 매출 = 목표 일 판매량 × 평균 단가 × 30일
```

**월 비용 계산**:
```
월 비용 = 월세 + 인건비 + 원재료비 + 공과금 + 로열티 + 마케팅비 + 기타고정비
- 인건비 = 월 매출 × 인건비율 (점주 근무 시 40% 절감)
- 원재료비 = 월 매출 × 원가율
- 공과금 = 월 매출 × 공과금 비율
- 로열티 = 월 매출 × 로열티율
- 마케팅비 = 월 매출 × 마케팅비율
```

**월 순이익 계산**:
```
영업 이익 = 월 매출 - 월 비용
월 순이익 = 영업 이익 - 월 대출 상환액
```

**회수 개월 수 계산**:
```
회수 개월 = 초기 투자금 ÷ 월 순이익
(단, 월 순이익 ≤ 0일 때는 null 반환)
```

**손익분기점 계산**:
```
손익분기점 일 판매량 = 월 총 비용 ÷ (평균 단가 × 30일)
```

**민감도 분석**:
- 판매량 ±10% 시나리오별 월 순이익 및 회수 개월 수 계산

**시나리오 테이블**:
- 여러 판매량 시나리오별 손익 비교표 생성

#### 대출 상환 계산

지원 상환 방식:
- **균등분할상환 (equal_payment)**: 매월 동일한 원리금 상환
- **원금균등상환 (equal_principal)**: 매월 동일한 원금 + 이자 상환
- **이자만 상환 (interest_only)**: 매월 이자만 상환, 만기 일시 상환

**DSCR 계산**:
```
DSCR = 영업 이익 ÷ 월 대출 상환액
```

#### 구현 파일
- `engine/finance/index.js`: 메인 로직
- `engine/finance/calculator.js`: 계산식 구현
- `engine/finance/loan/amortize.js`: 대출 상환 계산
- `engine/finance/loan/validator.js`: 대출 입력 검증

### 7.2 판단 엔진 (engine/decision)

#### 점수 산출 로직

**기본 점수**: 100점에서 시작

**감점 요인**:
1. 회수 기간 감점:
   - 36개월 초과: -30점
   - 24~36개월: -15점
2. 월 순이익 감점:
   - 적자 (≤ 0): -50점
   - 500만원 미만: -20점
3. 상권 점수 반영:
   - 점수 = 점수 × 0.7 + 상권점수 × 0.3
4. 로드뷰 리스크 반영:
   - 점수 -= (100 - 로드뷰리스크점수) × 0.2

**최종 점수**: 0~100점 범위로 클램핑

#### 신호등 판단

**하드컷 규칙**:
- 회수 기간 ≥ 36개월 → 🔴 Red
- 월 순이익 ≤ 0 → 🔴 Red

**점수 기반 판단**:
- 70점 이상 → 🟢 Green
- 50~69점 → 🟡 Yellow
- 50점 미만 → 🔴 Red

#### 생존 개월 수 추정

**기준선**: 36개월

**감점 요인**:
1. 회수 기간이 길수록 감점
2. 매출 -10% 시 적자 전환이면 큰 감점
3. 고정비 비중이 높으면 감점
4. 상권/로드뷰 점수 낮으면 경미한 감점

**최소값 보장**: 12개월 이상

#### 리스크 카드 생성

템플릿 기반 리스크 카드 생성:
- 임대료 대비 매출 민감도
- 회수 기간 위험
- 목표 vs 기대 GAP

#### 구현 파일
- `engine/decision/index.js`: 메인 로직
- `engine/decision/scorer.js`: 점수 산출 로직

---

## 8. 프론트엔드 구조

### 8.1 페이지 구조

#### 브랜드 선택 페이지 (`frontend/brand/`)
- 브랜드 카드 리스트 (12개)
- 브랜드명, 포지션 태그 표시
- "이 브랜드로 분석하기" CTA

#### 조건 입력 페이지 (`frontend/input/`)
- 지도 인터랙션 (Kakao Maps / Google Maps)
- 입력 폼:
  - 초기 투자금, 월세, 평수, 점주 근무 여부
  - 대출 정보 (선택)
  - 목표 판매량
- "이 조건으로 분석하기" CTA

#### 결과 대시보드 (`frontend/dashboard/`)
- 핵심 카드: 점수, 신호등, 생존 개월, 회수 개월, 월 순이익
- 차트: 손익 구조, 민감도, 시나리오 비교
- AI 판단 상세: 리스크, 개선 제안, 경쟁 환경

#### PDF 리포트 (`frontend/report/`)
- jsPDF를 사용한 클라이언트 사이드 PDF 생성
- 요약 페이지, 차트 페이지, AI 판단 코멘트 페이지

### 8.2 기술 스택

- **HTML/CSS/JavaScript**: 순수 Vanilla JS
- **PDF 생성**: jsPDF, jspdf-autotable
- **지도 API**: Kakao Maps API / Google Maps API

---

## 9. 데이터베이스 구조

### 9.1 스키마

#### brands 테이블

```sql
CREATE TABLE brands (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(20) NOT NULL,
  initial_investment BIGINT NOT NULL,
  monthly_royalty DECIMAL(5, 2) NOT NULL,
  monthly_marketing DECIMAL(5, 2) NOT NULL,
  avg_daily_sales INTEGER NOT NULL,
  pdf_source TEXT,
  avg_monthly_revenue BIGINT,
  avg_revenue_per_area DECIMAL(10, 2),
  avg_store_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### analyses 테이블

```sql
CREATE TABLE analyses (
  id VARCHAR(100) PRIMARY KEY,
  brand_id VARCHAR(50) NOT NULL REFERENCES brands(id),
  location_lat DECIMAL(10, 7) NOT NULL,
  location_lng DECIMAL(10, 7) NOT NULL,
  location_address TEXT,
  radius INTEGER NOT NULL,
  initial_investment BIGINT NOT NULL,
  monthly_rent BIGINT NOT NULL,
  area INTEGER NOT NULL,
  owner_working BOOLEAN NOT NULL,
  target_daily_sales INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9.2 인덱스

```sql
CREATE INDEX idx_analyses_brand_id ON analyses(brand_id);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
```

### 9.3 데이터베이스 연결

- **호스트**: Supabase PostgreSQL
- **연결 풀**: pg 모듈 사용
- **SSL**: 필수 (프로덕션 환경)

---

## 10. 배포 및 운영

### 10.1 배포 환경

#### Vercel (서버리스 함수)
- Express 앱을 Vercel 서버리스 함수로 변환
- `vercel.json` 설정 파일 사용
- 환경변수: Vercel 대시보드에서 관리

#### 로컬 개발 환경
```bash
# 서버 실행
node backend/server.js

# 또는 nodemon 사용
npm run dev
```

### 10.2 환경변수

```bash
# 서버 설정
PORT=3000
HOST=localhost  # 또는 0.0.0.0 (다른 기기 접근 시)

# AI API 키
GEMINI_API_KEY=xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# 지도 API 키
KAKAO_REST_API_KEY=xxxxx
GOOGLE_MAPS_API_KEY=xxxxx

# 데이터베이스 연결
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=xxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=xxxxx
DB_SSL=true
```

### 10.3 보안

#### API 키 관리
- `.env` 파일은 절대 Git에 커밋하지 않음
- Vercel 환경변수로 관리
- 팀 채널에서만 공유

#### 의존성 보안
```bash
npm audit              # 보안 취약점 확인
npm audit fix          # 자동 수정 가능한 취약점 해결
```

### 10.4 모니터링

#### 로깅
- 콘솔 로그로 분석 진행 상황 추적
- 에러 로그는 `error_message` 필드에 저장

#### 헬스 체크
- `GET /health`: 서버 상태 확인

---

## 11. 향후 계획

### 11.1 Phase 2 기능

#### AI 심층 상담관 (Post-Analysis Advisor)
- 결과 기반 질의응답 전용 인터페이스
- 해당 분석 컨텍스트로만 응답
- 자유 채팅이 아닌 판단 보조 중심

#### 시뮬레이션 저장/불러오기
- 분석 결과를 저장하여 나중에 다시 확인
- 여러 시뮬레이션 비교 기능

#### 브랜드 확장
- 현재 12개 브랜드 → 더 많은 브랜드 추가
- 브랜드별 상세 데이터 확장

### 11.2 기술 개선

#### 성능 최적화
- 분석 결과 캐싱
- 비동기 처리 최적화

#### 테스트 자동화
- 단위 테스트 확장
- 통합 테스트 자동화
- E2E 테스트 추가

#### 문서화
- API 문서 자동 생성 (Swagger/OpenAPI)
- 사용자 가이드 작성

### 11.3 비즈니스 확장

#### 지역 확장
- 서울 → 전국 확장
- 지역별 특성 반영

#### 업종 확장
- 카페 → 다른 프랜차이즈 업종 확장

---

## 부록

### A. 성공 기준 (Definition of Done)

- [x] 입력 → 결과 → 수정 → 재결과 루프 정상 동작
- [x] 재무 / 상권 / 물리 리스크가 결과에 반영
- [x] 회수 개월 / 순이익 / 민감도 계산 정확
- [x] AI 리스크 분석 및 개선 제안 자동 생성
- [x] PDF 리포트 생성 성공
- [x] 데모 시나리오 완주 가능

### B. 크레딧 현황

| 플랫폼 | 총 크레딧 | 용도 |
|--------|-----------|------|
| Anthropic | $75 (5인 풀링) | Claude 리스크 분석 |
| Google Gemini | 무료 | 로드뷰 이미지 분석 |
| Kakao Maps | 무료 (일일 한도) | 지도 API |
| Google Maps | 무료 (월 $200 크레딧) | 지도 API (대안) |

**1회 분석 예상 비용**: ~$0.01 (Claude API 호출 기준)

### C. 참고 문서

- `docs/PRD.md`: 초기 PRD (MVP 버전)
- `docs/IA.md`: 정보 아키텍처
- `docs/ONBOARDING.md`: 해커톤 당일 온보딩 가이드
- `shared/interfaces.js`: 모듈 간 데이터 계약
- 각 폴더의 `ROLE.md`: 역할별 상세 가이드

---

**문서 버전**: 1.0  
**최종 업데이트**: 2026-02-01  
**작성자**: StartSmart Team
