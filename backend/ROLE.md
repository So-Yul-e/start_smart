# 역할 5: 백엔드 + 통합

## 담당 영역
- Express 서버 운영
- REST API (브랜드 조회, 분석 실행, 결과 조회, 리포트 생성)
- AI 파이프라인 오케스트레이션
- 상권 분석 (지도 API 연동)
- 전체 모듈 연결 & 통합 테스트

## 폴더
```
backend/
├── server.js               # Express 서버 진입점
├── routes/
│   ├── brands.js           # GET /api/brands
│   ├── analyze.js          # POST /api/analyze
│   ├── result.js           # GET /api/result/:analysisId
│   └── report.js           # POST /api/report/:analysisId
├── services/
│   └── orchestrator.js     # AI 파이프라인 총괄
├── market/
│   ├── index.js            # 상권 분석 메인 로직
│   └── mapApi.js           # 지도 API 연동
└── ROLE.md
```

## 파이프라인 흐름 (orchestrator.js)
```
분석 요청 → analyzeMarket (backend/market)
         → calculateFinance (engine/finance)
         → analyzeRoadview (ai/roadview)
         → generateConsulting (ai/consulting)
         → calculateDecision (engine/decision)
         → 완성된 분석 결과 저장
```

## import 경로
```js
const { analyzeMarket } = require('../backend/market');
const { calculateFinance } = require('../engine/finance');
const { analyzeRoadview } = require('../ai/roadview');
const { generateConsulting } = require('../ai/consulting');
const { calculateDecision } = require('../engine/decision');
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
# - 모든 API 키 (다른 팀원에게 받기)
```

### 2단계: 프로젝트 클론 & 설치
```bash
git clone <repo-url>
cd StartSmart
npm install
```

### 3단계: 환경변수 설정 (전체 키 필요!)
```bash
cp .env.example .env
```
`.env`에 **모든 키** 입력 (통합 담당이므로 전부 필요):
```
PORT=3000

# AI-로드뷰 담당에게 받기
GEMINI_API_KEY=xxxxx

# AI-판단 담당에게 받기
ANTHROPIC_API_KEY=sk-ant-xxxxx

# 지도 API (본인이 설정)
KAKAO_REST_API_KEY=xxxxx
# 또는
GOOGLE_MAPS_API_KEY=xxxxx
```

### 4단계: 브랜치 생성
```bash
git checkout -b feature/backend
```

### 5단계: 서버 실행
```bash
node backend/server.js
# → http://localhost:3000 에서 확인
```

---

## 통합 테스트 방법

### 서버 실행 후 전체 플로우 테스트
1. `node backend/server.js` 실행
2. 브라우저에서 `http://localhost:3000` 접속
3. 프론트엔드에서 브랜드 선택 → 입지 선택 → 조건 입력
4. "분석하기" 클릭
5. 터미널 콘솔 로그 모니터링:
   ```
   [analysis_xxx] 📊 1/5 상권 분석 시작...
   [analysis_xxx] ✅ 상권 분석 완료
   [analysis_xxx] 💰 2/5 손익 계산 시작...
   [analysis_xxx] ✅ 손익 계산 완료
   [analysis_xxx] 🗺️ 3/5 로드뷰 분석 시작...
   [analysis_xxx] ✅ 로드뷰 분석 완료
   [analysis_xxx] 🤖 4/5 AI 컨설팅 생성 시작...
   [analysis_xxx] ✅ AI 컨설팅 생성 완료
   [analysis_xxx] ⚖️ 5/5 판단 계산 시작...
   [analysis_xxx] ✅ 판단 계산 완료
   [analysis_xxx] 🎉 분석 완료!
   ```

### 개별 모듈 테스트 (curl)
```bash
# 브랜드 목록 조회
curl http://localhost:3000/api/brands

# 분석 실행
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand_1",
    "location": {"lat": 37.5665, "lng": 126.9780, "address": "서울특별시 강남구"},
    "radius": 500,
    "conditions": {
      "initialInvestment": 500000000,
      "monthlyRent": 3000000,
      "area": 33,
      "ownerWorking": true
    },
    "targetDailySales": 300
  }'

# 결과 조회
curl http://localhost:3000/api/result/<analysisId>
```

### 같은 네트워크에서 팀원 접속 허용
```bash
# 본인 IP 확인 (Mac)
ifconfig | grep "inet " | grep -v 127.0.0.1

# 팀원에게 알려주기: http://<본인IP>:3000
# 팀원은 브라우저에서 해당 주소로 접속하여 테스트 가능
```

---

## 구현 가이드

### 1. Express 서버 설정
```js
// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// 라우트 연결
app.use('/api/brands', require('./routes/brands'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/result', require('./routes/result'));
app.use('/api/report', require('./routes/report'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### 2. 오케스트레이터 구현
```js
// backend/services/orchestrator.js
const { analyzeMarket } = require('../market');
const { calculateFinance } = require('../../engine/finance');
const { analyzeRoadview } = require('../../ai/roadview');
const { generateConsulting } = require('../../ai/consulting');
const { calculateDecision } = require('../../engine/decision');

async function runAnalysis(analysisRequest) {
  const { brandId, location, radius, conditions, targetDailySales } = analysisRequest;
  
  // 1. 상권 분석
  console.log(`[${analysisId}] 📊 1/5 상권 분석 시작...`);
  const market = await analyzeMarket(location, radius);
  
  // 2. 손익 계산
  console.log(`[${analysisId}] 💰 2/5 손익 계산 시작...`);
  const finance = calculateFinance({ brand, conditions, targetDailySales });
  
  // 3. 로드뷰 분석
  console.log(`[${analysisId}] 🗺️ 3/5 로드뷰 분석 시작...`);
  const roadview = await analyzeRoadview({ location });
  
  // 4. AI 컨설팅
  console.log(`[${analysisId}] 🤖 4/5 AI 컨설팅 생성 시작...`);
  const aiConsulting = await generateConsulting({
    brand, location, conditions, targetDailySales,
    finance, market, roadview
  });
  
  // 5. 판단 계산
  console.log(`[${analysisId}] ⚖️ 5/5 판단 계산 시작...`);
  const decision = calculateDecision({ finance, market, roadview });
  
  // 최종 결과 조합
  return {
    id: analysisId,
    status: 'completed',
    brand,
    location,
    finance,
    decision,
    aiConsulting,
    roadview,
    market,
    createdAt: new Date().toISOString()
  };
}
```

### 3. 상권 분석 구현
```js
// backend/market/index.js
const { searchNearbyCafes } = require('./mapApi');

async function analyzeMarket(location, radius) {
  // 지도 API로 반경 내 경쟁 카페 검색
  const competitors = await searchNearbyCafes(location, radius);
  
  // 경쟁 밀도 계산
  const density = calculateDensity(competitors.length, radius);
  
  // 유동인구 추정 (실제로는 별도 API 필요)
  const footTraffic = estimateFootTraffic(location);
  
  // 상권 점수 계산
  const marketScore = calculateMarketScore(competitors, footTraffic);
  
  return {
    location,
    competitors: {
      total: competitors.length,
      sameBrand: competitors.filter(c => c.brand === brandId).length,
      otherBrands: competitors.length - sameBrand,
      density
    },
    footTraffic,
    marketScore
  };
}
```

---

## 통합 시 체크리스트

### 다른 팀원 코드 머지할 때
- [ ] `git pull origin develop` 후 본인 브랜치에 머지
- [ ] 각 모듈의 export 형식이 `shared/interfaces.js`와 일치하는지 확인
- [ ] `orchestrator.js`의 import 경로 확인
- [ ] `node backend/server.js` 실행 → 에러 없는지 확인
- [ ] 전체 플로우 테스트 (브랜드 선택 → 분석 → 결과 확인)

### 에러 발생 시 확인 순서
1. 콘솔 로그에서 어느 단계에서 실패했는지 확인
2. 해당 모듈 담당자에게 연락
3. `.env` 키가 제대로 설정됐는지 확인
4. `npm install` 다시 실행 (새 의존성 추가된 경우)

---

## 커밋 규칙
```bash
git add backend/
git commit -m "[Backend] 작업내용"
git push origin feature/backend
```

## 주의사항
- `backend/` 폴더가 주 작업 영역
- 다른 모듈(ai/*, engine/*)은 직접 수정하지 말고 담당자에게 요청
- `orchestrator.js`에서 import 경로 변경 시 반드시 테스트
- API 키는 절대 Git에 커밋하지 말 것
- 상권 분석은 지도 API(Kakao 또는 Google Maps) 사용
