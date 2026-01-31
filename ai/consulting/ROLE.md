# 역할 3: AI-판단 (컨설팅)

## 담당 영역
- Claude API로 판매량 시나리오 추론
- 리스크 분석 및 개선 제안
- 경쟁 환경 해석

## 폴더
```
ai/consulting/
├── index.js           # 컨설팅 메인 로직
├── prompts.js         # 프롬프트 템플릿
└── ROLE.md
```

## 사용 API/크레딧
- Anthropic Claude API ($15 x 5인 풀링 = $75)
- 모델: `claude-3-5-sonnet-20241022`

## 입력/출력

**입력** (백엔드에서 호출):
```js
{
  brand: {
    id: "brand_1",
    name: "스타벅스"
  },
  location: {
    lat: 37.5665,
    lng: 126.9780,
    address: "서울특별시 강남구 테헤란로 123"
  },
  conditions: {
    initialInvestment: 500000000,
    monthlyRent: 3000000,
    area: 33,
    ownerWorking: true
  },
  targetDailySales: 300,
  finance: {
    monthlyProfit: 10000000,
    paybackMonths: 50
  },
  market: {
    competitors: { total: 5, density: "high" },
    footTraffic: { weekday: "high", weekend: "medium" }
  },
  roadview: {
    overallRisk: "medium",
    riskScore: 65
  }
}
```

**출력**:
```js
{
  salesScenario: {
    conservative: 200,    // 보수적 판매량 (잔/일)
    expected: 250,       // 기대 판매량 (잔/일)
    optimistic: 300      // 낙관적 판매량 (잔/일)
  },
  salesScenarioReason: "주변 경쟁 카페 밀도가 높고, 유동인구가 많아 기대 판매량은 250잔/일로 추정됩니다.",
  topRisks: [
    {
      title: "회수 기간 초과",
      description: "36개월 회수 기준을 초과하여 구조적 위험이 있습니다.",
      impact: "high"
    }
    // ... 최대 3개
  ],
  improvements: [
    {
      title: "월세 협상",
      description: "월세를 10% 낮추면 회수 기간이 45개월로 단축됩니다.",
      expectedImpact: "paybackMonths: 50 → 45"
    }
    // ... 최대 3개
  ],
  competitiveAnalysis: {
    intensity: "high",           // low | medium | high
    differentiation: "possible", // possible | difficult | impossible
    priceStrategy: "premium"     // premium | standard | budget
  }
}
```

---

## 세팅 가이드

### 1단계: 사전 준비
```bash
# 필요한 것
# - Node.js 24.x Current (node -v 로 확인, v24.x.x 출력되어야 함)
#   ⚠️ 팀원 모두 24.x 버전 사용 필수 (호환성 및 보안 문제 방지)
# - npm (npm -v 로 확인)
# - 코드 에디터 (VS Code 추천)
```

### 2단계: 프로젝트 클론 & 설치
```bash
git clone <repo-url>
cd StartSmart
npm install
```

### 3단계: 환경변수 설정
```bash
cp .env.example .env
```
`.env` 파일을 열고 아래 키만 입력 (팀 채널에서 받기):
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```
> 다른 키는 본인 역할과 무관하므로 비워둬도 됨

### 4단계: 브랜치 생성
```bash
git checkout -b feature/ai-consulting
```

### 5단계: 작업 시작
```bash
# 내 작업 폴더: ai/consulting/ 만 수정!
# 핵심 파일: prompts.js (프롬프트 개선), index.js (생성 로직)
```

---

## 단독 테스트 방법 (서버 없이)

### 테스트 스크립트 만들기
`ai/consulting/` 폴더에 `test.js` 파일을 만들어서 단독 테스트:

```js
// ai/consulting/test.js
require('dotenv').config({ path: '../../.env' });
const { generateConsulting } = require('./index');

async function test() {
  const result = await generateConsulting({
    brand: { id: "brand_1", name: "스타벅스" },
    location: { lat: 37.5665, lng: 126.9780, address: "서울특별시 강남구 테헤란로 123" },
    conditions: {
      initialInvestment: 500000000,
      monthlyRent: 3000000,
      area: 33,
      ownerWorking: true
    },
    targetDailySales: 300,
    finance: {
      monthlyProfit: 10000000,
      paybackMonths: 50
    },
    market: {
      competitors: { total: 5, density: "high" },
      footTraffic: { weekday: "high", weekend: "medium" }
    },
    roadview: {
      overallRisk: "medium",
      riskScore: 65
    }
  });

  console.log('=== 컨설팅 결과 ===');
  console.log(JSON.stringify(result, null, 2));
}

test().catch(console.error);
```

### 실행
```bash
node ai/consulting/test.js
```

### 확인할 것
- [ ] JSON 형식이 올바른지 (`shared/interfaces.js` 참고)
- [ ] salesScenario에 3가지 값이 모두 있는지
- [ ] topRisks와 improvements가 각각 최대 3개인지
- [ ] competitiveAnalysis의 값들이 올바른 enum인지
- [ ] 모든 텍스트가 한국어로 작성되는지

---

## 프롬프트 엔지니어링 가이드

### 1. 판매량 시나리오 추론 프롬프트
```js
const salesScenarioPrompt = `
당신은 프랜차이즈 카페 창업 컨설턴트입니다.

다음 정보를 바탕으로 현실적인 판매량 시나리오를 제안해주세요:

브랜드: ${brand.name}
입지: ${location.address}
조건:
- 초기 투자금: ${conditions.initialInvestment}원
- 월세: ${conditions.monthlyRent}원
- 평수: ${conditions.area}평
- 점주 근무: ${conditions.ownerWorking ? '예' : '아니오'}

상권 분석:
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}
- 평일 유동인구: ${market.footTraffic.weekday}
- 주말 유동인구: ${market.footTraffic.weekend}

물리적 리스크:
- 전체 리스크: ${roadview.overallRisk}
- 리스크 점수: ${roadview.riskScore}/100

다음 형식으로 JSON을 반환해주세요:
{
  "conservative": 숫자,  // 보수적 판매량 (잔/일)
  "expected": 숫자,      // 기대 판매량 (잔/일)
  "optimistic": 숫자,    // 낙관적 판매량 (잔/일)
  "reason": "이유 설명"
}
`;
```

### 2. 리스크 분석 프롬프트
```js
const riskAnalysisPrompt = `
다음 재무 분석 결과를 바탕으로 핵심 리스크 Top 3를 식별하고 개선 제안을 해주세요:

재무 결과:
- 월 순이익: ${finance.monthlyProfit}원
- 회수 개월: ${finance.paybackMonths}개월
- 목표 판매량: ${targetDailySales}잔/일

다음 형식으로 JSON을 반환해주세요:
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
      "expectedImpact": "기대 효과"
    }
  ]
}
`;
```

### 3. 경쟁 환경 해석 프롬프트
```js
const competitiveAnalysisPrompt = `
다음 상권 정보를 바탕으로 경쟁 환경을 분석해주세요:

경쟁 정보:
- 경쟁 카페 수: ${market.competitors.total}개
- 경쟁 밀도: ${market.competitors.density}
- 브랜드: ${brand.name}

다음 형식으로 JSON을 반환해주세요:
{
  "intensity": "high",           // low | medium | high
  "differentiation": "possible", // possible | difficult | impossible
  "priceStrategy": "premium"     // premium | standard | budget
}
`;
```

---

## 커밋 규칙
```bash
git add ai/consulting/
git commit -m "[AI-Consulting] 작업내용"
git push origin feature/ai-consulting
```

## 주의사항
- `ai/consulting/` 폴더만 수정할 것
- 출력 JSON 형식을 절대 변경하지 말 것 (`shared/interfaces.js` 참고)
- `test.js`는 개인 테스트용이므로 `.gitignore`에 추가하거나 커밋하지 않아도 됨
- 프롬프트는 한국어로 작성하되, Claude는 영어 프롬프트도 잘 처리하므로 필요시 영어 사용 가능
