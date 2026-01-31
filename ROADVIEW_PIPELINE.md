# 거리뷰 파이프라인 구현 완료 (백엔드)

## ✅ 구현 완료 사항

### 1. 백엔드 API 엔드포인트

**POST `/api/roadview/analyze`**

프론트엔드에서 업로드한 이미지를 Gemini로 분석하는 API입니다.

#### 요청 형식 (multipart/form-data)

```
POST /api/roadview/analyze
Content-Type: multipart/form-data

필수 필드:
- address: 주소 문자열
- lat: 위도 (숫자)
- lng: 경도 (숫자)

선택 필드:
- roadview: 거리뷰 이미지 파일 (JPEG/PNG)
- roadmap: 로드맵 이미지 파일 (JPEG/PNG)
- metadata: JSON 문자열 (경쟁 분석 메타데이터)
```

#### 메타데이터 형식 (JSON 문자열)

```json
{
  "competitorCount100m": 5,
  "competitorCount300m": 15,
  "competitorCount500m": 30,
  "competitionPercentile": 60,
  "competitionDensity": "높음"
}
```

#### 응답 형식

```json
{
  "success": true,
  "location": {
    "address": "서울시 강남구 역삼동",
    "lat": 37.498,
    "lng": 127.028
  },
  "metadata": {
    "competitorCount100m": 5,
    "competitorCount300m": 15,
    "competitionPercentile": 60
  },
  "results": {
    "roadview": {
      "success": true,
      "analysis_result": {
        "signage_obstruction": {
          "level": "medium",
          "confidence": 0.85,
          "description": "...",
          "visual_evidence": ["..."]
        },
        "steep_slope": { ... },
        "floor_level": { ... },
        "visibility": { ... }
      },
      "overall_assessment": {
        "location_score": 75,
        "strengths": ["..."],
        "weaknesses": ["..."],
        "recommendation": "..."
      }
    },
    "roadmap": {
      "success": true,
      "analysis_result": { ... }
    }
  }
}
```

---

## 🔧 기술 스택

### 백엔드
- **Express**: 웹 프레임워크
- **Multer**: 파일 업로드 처리 (메모리 스토리지)
- **Gemini Vision API**: 이미지 AI 분석
- **@google/generative-ai**: Gemini SDK

### 제한사항
- 파일 크기: 최대 5MB
- 파일 수: 최대 2개 (roadview, roadmap)
- 파일 형식: 이미지 파일만 (JPEG, PNG 등)

---

## 📝 구현 세부사항

### 1. Multer 설정 (`backend/routes/roadview.js`)

```javascript
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 2
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});
```

### 2. 이미지 분석 프로세스

1. **이미지 수신**: Multer로 multipart/form-data 파싱
2. **Base64 변환**: Buffer를 Base64 문자열로 변환
3. **Gemini 전송**: `analyzeImageWithGemini()` 함수 호출
4. **결과 반환**: 분석 결과를 JSON 형식으로 반환

### 3. Gemini 프롬프트 개선

- **거리뷰 이미지**: 4가지 입지 요소 분석 (간판 가림, 급경사, 층위, 보행 가시성)
- **로드맵 이미지**: 4가지 상권 요소 분석 (상권 구조, 접근성, 경쟁 환경, 입지 특성)
- **메타데이터 활용**: 경쟁 분석 결과를 컨텍스트로 제공

---

## 🧪 테스트 방법

### cURL 테스트

```bash
curl -X POST http://localhost:3000/api/roadview/analyze \
  -F "address=서울시 강남구 역삼동" \
  -F "lat=37.498" \
  -F "lng=127.028" \
  -F "metadata={\"competitorCount100m\":5,\"competitorCount300m\":15}" \
  -F "roadview=@/path/to/roadview.jpg" \
  -F "roadmap=@/path/to/roadmap.jpg"
```

### JavaScript (프론트엔드 예시)

```javascript
const formData = new FormData();
formData.append('address', '서울시 강남구 역삼동');
formData.append('lat', '37.498');
formData.append('lng', '127.028');
formData.append('metadata', JSON.stringify({
  competitorCount100m: 5,
  competitorCount300m: 15,
  competitorCount500m: 30,
  competitionPercentile: 60,
  competitionDensity: '높음'
}));
formData.append('roadview', roadviewBlob, 'roadview.jpg');
formData.append('roadmap', roadmapBlob, 'roadmap.jpg');

const response = await fetch('/api/roadview/analyze', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('분석 결과:', result);
```

---

## ⚠️ 주의사항

### 1. 환경변수 설정
```bash
GEMINI_API_KEY=your_gemini_api_key
```

### 2. 에러 처리
- 이미지 파일이 없으면 400 에러
- Gemini API 실패 시 상세 에러 메시지 반환
- 파일 크기 초과 시 Multer 에러

### 3. 성능 고려사항
- 이미지 분석은 시간이 걸릴 수 있음 (5-10초)
- 타임아웃 설정 필요 (현재 미설정)
- 동시 요청 제한 고려

---

## 📊 API 사용 예시

### 성공 응답
```json
{
  "success": true,
  "location": {
    "address": "서울시 강남구 역삼동",
    "lat": 37.498,
    "lng": 127.028
  },
  "metadata": { ... },
  "results": {
    "roadview": {
      "success": true,
      "analysis_result": { ... }
    }
  }
}
```

### 실패 응답
```json
{
  "success": false,
  "error": "최소 1개 이상의 이미지가 필요합니다. (roadview 또는 roadmap)"
}
```

---

## 🔄 다음 단계 (프론트엔드)

프론트엔드에서 다음 작업이 필요합니다:

1. **카카오맵 거리뷰 캡처**
   - 카카오맵 SDK 로드뷰 렌더링
   - html2canvas로 캡처

2. **로드맵 캡처**
   - 경쟁사 마커 포함 지도 렌더링
   - html2canvas로 캡처

3. **이미지 압축**
   - browser-image-compression 사용
   - 최대 1MB로 압축

4. **API 호출**
   - FormData로 이미지 업로드
   - 결과 표시

---

**구현 일시**: 2026-01-31  
**구현자**: AI Assistant
