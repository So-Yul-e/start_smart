# 백엔드 API 연동 가이드

프론트엔드 개발자를 위한 백엔드 API 사용 가이드입니다.

## 🚀 서버 실행

```bash
# 프로젝트 루트에서
node backend/server.js
# 또는
npm start
```

서버가 실행되면 `http://localhost:3000`에서 접근 가능합니다.

### 🌐 다른 기기에서 접근하기 (같은 WiFi 네트워크)

프론트엔드 개발자가 다른 기기(노트북, 모바일 등)에서 접근하려면:

1. **백엔드 담당자가 로컬 IP 확인:**
   ```bash
   # Mac
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   
   # Linux
   hostname -I
   ```
   
   예시 출력: `192.168.0.10` 또는 `10.0.0.5`

2. **서버 실행 후 프론트엔드 개발자에게 알려주기:**
   ```
   백엔드 서버 주소: http://<로컬IP>:3000
   ```
   
   ⚠️ **IP 주소는 환경변수로 관리하세요!** 하드코딩하지 마세요.
   ⚠️ **IP 주소는 네트워크 환경에 따라 변경될 수 있습니다.** 서버 실행 전에 매번 확인하세요.

3. **프론트엔드에서 API 호출 시 (환경변수 사용):**
   
   **방법 1: config.js 사용 (권장)**
   ```html
   <!-- HTML 파일의 <head> 섹션에 추가 -->
   <script>
     // 백엔드 담당자가 알려준 로컬 IP 주소 (환경변수로 관리)
     window.API_BASE_URL = 'http://<로컬IP>:3000';
   </script>
   <script src="config.js"></script>
   <script src="your-app.js"></script>
   ```
   
   ```javascript
   // your-app.js에서 사용
   fetch(window.API_CONFIG.API_ENDPOINTS.brands)
     .then(res => res.json())
     .then(data => { ... });
   ```
   
   **방법 2: 직접 환경변수 사용**
   ```javascript
   // .env.local 파일에 설정 (Git에 커밋하지 않음)
   // REACT_APP_API_URL=http://<로컬IP>:3000
   
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
   fetch(`${API_BASE_URL}/api/brands`)
     .then(res => res.json())
     .then(data => { ... });
   ```
   
   ⚠️ **중요**: IP 주소는 하드코딩하지 말고 환경변수나 설정 파일로 관리하세요!

⚠️ **주의사항:**
- 백엔드 서버를 실행한 컴퓨터와 프론트엔드 개발자의 기기가 **같은 WiFi 네트워크**에 연결되어 있어야 합니다.
- 방화벽 설정에 따라 포트 3000이 차단될 수 있습니다. 필요시 방화벽에서 포트를 열어주세요.

## 📡 API 엔드포인트

### 1. 헬스 체크
```bash
GET /health
```

**응답:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-31T10:00:00.000Z"
}
```

### 2. 브랜드 목록 조회
```bash
GET /api/brands
```

**응답:**
```json
{
  "success": true,
  "brands": [
    {
      "id": "brand_2",
      "name": "이디야",
      "position": "스탠다드",
      "initialInvestment": 200000000,
      "monthlyRoyalty": 3,
      "monthlyMarketing": 1,
      "avgDailySales": 200
    }
    // ... 총 12개 브랜드
  ]
}
```

**프론트엔드 사용 예시:**
```javascript
fetch('/api/brands')
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('브랜드 목록:', data.brands);
      // 브랜드 카드 렌더링
    }
  });
```

### 3. 분석 실행
```bash
POST /api/analyze
Content-Type: application/json
```

**요청 본문:**
```json
{
  "brandId": "brand_2",
  "location": {
    "lat": 37.4980,
    "lng": 127.0276,
    "address": "서울특별시 강남구 강남대로 396"
  },
  "radius": 500,
  "conditions": {
    "initialInvestment": 200000000,
    "monthlyRent": 3000000,
    "area": 33,
    "ownerWorking": true
  },
  "targetDailySales": 250
}
```

**응답:**
```json
{
  "success": true,
  "analysisId": "analysis_1706692800000_abc123",
  "message": "분석을 시작합니다."
}
```

**프론트엔드 사용 예시:**
```javascript
fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    brandId: selectedBrand.id,
    location: {
      lat: mapLocation.lat,
      lng: mapLocation.lng,
      address: mapLocation.address
    },
    radius: 500,
    conditions: {
      initialInvestment: parseInt(document.getElementById('investment').value),
      monthlyRent: parseInt(document.getElementById('rent').value),
      area: parseInt(document.getElementById('area').value),
      ownerWorking: document.getElementById('ownerWorking').checked
    },
    targetDailySales: parseInt(document.getElementById('targetSales').value)
  })
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // analysisId를 저장하고 결과 폴링 시작
      pollResult(data.analysisId);
    }
  });
```

### 4. 분석 결과 조회
```bash
GET /api/result/:analysisId
```

**응답 (진행 중):**
```json
{
  "success": true,
  "status": "processing",
  "message": "분석이 진행 중입니다. 잠시 후 다시 시도해주세요."
}
```

**응답 (완료):**
```json
{
  "success": true,
  "result": {
    "id": "analysis_1706692800000_abc123",
    "status": "completed",
    "brand": {
      "id": "brand_2",
      "name": "이디야",
      "position": "스탠다드",
      "initialInvestment": 200000000,
      "monthlyRoyalty": 3,
      "monthlyMarketing": 1,
      "avgDailySales": 200
    },
    "location": {
      "lat": 37.4980,
      "lng": 127.0276,
      "address": "서울특별시 강남구 강남대로 396"
    },
    "finance": {
      "monthlyRevenue": 27000000,
      "monthlyCosts": {
        "rent": 3000000,
        "labor": 5000000,
        "materials": 8100000,
        "utilities": 500000,
        "royalty": 1350000,
        "marketing": 540000,
        "etc": 500000
      },
      "monthlyProfit": 10000000,
      "netProfitRatio": 0.37,
      "breakEvenSales": 15000000,
      "paybackPeriodMonths": 24
    },
    "decision": {
      "score": 75,
      "grade": "GREEN",
      "survivalMonths": 36,
      "paybackPeriodMonths": 24
    },
    "aiConsulting": {
      "summary": "이 위치는 높은 유동인구를 가지고 있으나...",
      "strengths": ["높은 유동인구", "접근성 용이"],
      "weaknesses": ["치열한 경쟁", "간판 가시성 문제"],
      "recommendations": ["차별화된 메뉴 개발", "온라인 마케팅 강화"]
    },
    "roadview": {
      "location": { "lat": 37.4980, "lng": 127.0276 },
      "risks": [
        {
          "type": "signage_obstruction",
          "level": "medium",
          "description": "주변 건물에 의해 간판이 부분적으로 가려짐"
        }
      ],
      "overallRisk": "medium",
      "riskScore": 65
    },
    "market": {
      "location": { "lat": 37.4980, "lng": 127.0276, "radius": 500 },
      "competitors": {
        "total": 5,
        "sameBrand": 0,
        "otherBrands": 5,
        "density": "medium"
      },
      "footTraffic": "high",
      "marketScore": 75
    },
    "createdAt": "2025-01-31T10:00:00.000Z"
  }
}
```

**프론트엔드 사용 예시 (폴링):**
```javascript
function pollResult(analysisId) {
  const interval = setInterval(() => {
    fetch(`/api/result/${analysisId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.result) {
          // 분석 완료
          clearInterval(interval);
          displayDashboard(data.result);
        } else if (data.status === 'failed') {
          // 분석 실패
          clearInterval(interval);
          alert('분석 중 오류가 발생했습니다.');
        }
        // pending 또는 processing 상태면 계속 폴링
      })
      .catch(error => {
        console.error('결과 조회 오류:', error);
        clearInterval(interval);
      });
  }, 2000); // 2초마다 폴링
}
```

### 5. 리포트 생성
```bash
POST /api/report/:analysisId
```

**응답:**
```json
{
  "success": true,
  "reportUrl": "/reports/analysis_1706692800000_abc123.pdf"
}
```

## 🔧 CORS 설정

백엔드 서버는 이미 CORS가 활성화되어 있습니다:
```javascript
app.use(cors());
```

따라서 프론트엔드에서 `fetch` 또는 `axios`를 사용하여 API를 호출할 수 있습니다.

**다른 기기에서 접근할 때:**
- CORS는 모든 origin을 허용하도록 설정되어 있으므로, 로컬 IP로 접근해도 문제없습니다.
- 프론트엔드에서 API 호출 시 절대 경로를 사용하세요:
  ```javascript
  // ❌ 잘못된 예시 (상대 경로)
  fetch('/api/brands')
  
  // ✅ 올바른 예시 (절대 경로)
  fetch('http://192.168.0.10:3000/api/brands')
  ```

## 📝 데이터 형식

모든 API의 요청/응답 형식은 `shared/interfaces.js` 파일을 참고하세요.

## 🧪 테스트 방법

### 1. 브랜드 목록 조회 테스트
```bash
curl http://localhost:3000/api/brands
```

### 2. 분석 실행 테스트
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand_2",
    "location": {
      "lat": 37.4980,
      "lng": 127.0276,
      "address": "서울특별시 강남구 강남대로 396"
    },
    "radius": 500,
    "conditions": {
      "initialInvestment": 200000000,
      "monthlyRent": 3000000,
      "area": 33,
      "ownerWorking": true
    },
    "targetDailySales": 250
  }'
```

### 3. 결과 조회 테스트
```bash
# 위에서 받은 analysisId를 사용
curl http://localhost:3000/api/result/analysis_1706692800000_abc123
```

## ⚠️ 주의사항

1. **분석은 비동기로 실행됩니다**: `POST /api/analyze`를 호출하면 즉시 `analysisId`를 반환하고, 실제 분석은 백그라운드에서 진행됩니다.

2. **결과는 폴링으로 조회합니다**: 분석이 완료될 때까지 `GET /api/result/:analysisId`를 주기적으로 호출해야 합니다.

3. **에러 처리**: 모든 API는 `success: false`와 `error` 필드를 반환할 수 있으므로, 프론트엔드에서 에러 처리를 구현해야 합니다.

4. **서버 실행 필수**: 프론트엔드에서 API를 호출하려면 반드시 백엔드 서버가 실행 중이어야 합니다.

## 📞 문의

백엔드 관련 문의사항이 있으면 백엔드 담당자(소율)에게 연락하세요.
