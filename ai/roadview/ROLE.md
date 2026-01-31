# 역할 2: AI-로드뷰 (비전 분석)

## 담당 영역
- Gemini Vision API로 로드뷰 이미지 분석
- 물리적 입지 리스크 인식
- 간판 가림, 급경사, 층위 추정, 보행 가시성 평가

## 폴더
```
ai/roadview/
├── index.js           # 로드뷰 분석 메인 로직
├── visionAnalyzer.js  # Gemini Vision API 연동
└── ROLE.md
```

## 사용 API/크레딧
- Google Gemini Vision API (무료)
- 모델: `gemini-1.5-pro-vision` 또는 `gemini-1.5-flash`

## 입력/출력

**입력** (백엔드에서 호출):
```js
{
  location: {
    lat: 37.5665,
    lng: 126.9780
  }
}
```

**출력**:
```js
{
  location: { lat: 37.5665, lng: 126.9780 },
  risks: [
    {
      type: "signage_obstruction",  // 간판 가림
      level: "medium",                // low | medium | high
      description: "주변 건물에 의해 간판이 부분적으로 가려짐"
    },
    {
      type: "steep_slope",           // 급경사
      level: "low",
      description: "평지에 위치하여 접근성 양호"
    },
    {
      type: "floor_level",            // 층위
      level: "ground",                // ground | half_basement | second_floor
      description: "1층에 위치"
    },
    {
      type: "visibility",             // 보행 가시성
      level: "high",
      description: "보행자 시선에 잘 보이는 위치"
    }
  ],
  overallRisk: "medium",  // low | medium | high
  riskScore: 65           // 0-100 (낮을수록 위험)
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
GEMINI_API_KEY=xxxxx
```
> 다른 키는 본인 역할과 무관하므로 비워둬도 됨

### 4단계: 브랜치 생성
```bash
git checkout -b feature/ai-roadview
```

### 5단계: 작업 시작
```bash
# 내 작업 폴더: ai/roadview/ 만 수정!
# 핵심 파일: visionAnalyzer.js (Gemini Vision 연동), index.js (분석 로직)
```

---

## 단독 테스트 방법 (서버 없이)

### 테스트 스크립트 만들기
`ai/roadview/` 폴더에 `test.js` 파일을 만들어서 단독 테스트:

```js
// ai/roadview/test.js
require('dotenv').config({ path: '../../.env' });
const { analyzeRoadview } = require('./index');

async function test() {
  const result = await analyzeRoadview({
    location: {
      lat: 37.5665,
      lng: 126.9780
    }
  });

  console.log('=== 분석 결과 ===');
  console.log(JSON.stringify(result, null, 2));
}

test().catch(console.error);
```

### 실행
```bash
node ai/roadview/test.js
```

### 확인할 것
- [ ] JSON 형식이 올바른지 (`shared/interfaces.js` 참고)
- [ ] risks 배열에 4가지 타입이 모두 있는지
- [ ] overallRisk와 riskScore가 계산되는지
- [ ] description이 한국어로 작성되는지

---

## 구현 가이드

### 1. 로드뷰 이미지 가져오기
Kakao Maps 또는 Google Maps API를 사용하여 로드뷰 이미지 URL 생성:

```js
// Kakao Maps 로드뷰 URL 예시
const roadviewUrl = `https://dapi.kakao.com/v2/local/geo/roadview.json?x=${lng}&y=${lat}`;
// 또는 Google Street View Static API
const roadviewUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
```

### 2. Gemini Vision API 호출
```js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-vision' });

// 이미지 URL 또는 Base64 이미지를 프롬프트와 함께 전달
const prompt = `
이 로드뷰 이미지를 분석하여 다음 항목을 평가해주세요:
1. 간판 가림: 주변 건물이나 구조물에 의해 간판이 가려지는 정도 (low/medium/high)
2. 급경사: 입지 주변의 경사도 (low/medium/high)
3. 층위: 건물이 몇 층에 위치하는지 (ground/half_basement/second_floor)
4. 보행 가시성: 보행자가 카페를 쉽게 발견할 수 있는지 (low/medium/high)

각 항목에 대해 level과 description을 JSON 형식으로 반환해주세요.
`;

const result = await model.generateContent([prompt, roadviewImage]);
```

### 3. 결과 파싱 및 구조화
Gemini의 응답을 파싱하여 `shared/interfaces.js`에 정의된 형식으로 변환:

```js
function parseGeminiResponse(geminiResponse) {
  // JSON 파싱 및 구조화 로직
  // ...
  return {
    risks: [...],
    overallRisk: "medium",
    riskScore: calculateRiskScore(risks)
  };
}
```

---

## 커밋 규칙
```bash
git add ai/roadview/
git commit -m "[AI-Roadview] 작업내용"
git push origin feature/ai-roadview
```

## 주의사항
- `ai/roadview/` 폴더만 수정할 것
- 출력 JSON 형식을 절대 변경하지 말 것 (`shared/interfaces.js` 참고)
- `test.js`는 개인 테스트용이므로 `.gitignore`에 추가하거나 커밋하지 않아도 됨
- Gemini Vision API는 무료이지만 일일 호출 한도가 있으므로 주의
