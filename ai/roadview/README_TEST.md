# AI-로드뷰 분석 테스트 페이지 사용 가이드

## 빠른 시작

### 1. 서버 실행

```bash
cd /Users/lifegoeson/Downloads/start_smart-main
export GEMINI_API_KEY=your_gemini_key
export GOOGLE_MAPS_API_KEY=your_google_maps_key
node ai/roadview/test-server.js
```

### 2. 브라우저에서 접속

```
http://localhost:3000/test-page.html
```

## 기능

### 입력
- **위도 (Latitude)**: -90 ~ 90
- **경도 (Longitude)**: -180 ~ 180
- **빠른 선택 버튼**: 서울시청, 강남역, 명동, 을지로

### 분석 결과
- **종합 리스크 점수**: 0-100 (낮을수록 위험)
- **종합 리스크 레벨**: low / medium / high
- **4가지 리스크 항목**:
  - 간판 가림 (signage_obstruction)
  - 급경사 (steep_slope)
  - 층위 (floor_level)
  - 보행 가시성 (visibility)

### 분석 시간
- 약 20-30초 소요 (로드뷰 이미지 다운로드 + Gemini API 분석)

## API 엔드포인트

### POST /api/roadview/analyze

**요청:**
```json
{
  "location": {
    "lat": 37.5665,
    "lng": 126.9780
  }
}
```

**응답:**
```json
{
  "location": {
    "lat": 37.5665,
    "lng": 126.9780
  },
  "risks": [
    {
      "type": "signage_obstruction",
      "level": "low",
      "description": "..."
    },
    ...
  ],
  "overallRisk": "low",
  "riskScore": 8
}
```

## 문제 해결

### 서버가 시작되지 않음
- 포트 3000이 이미 사용 중인지 확인
- 환경변수가 올바르게 설정되었는지 확인

### 분석 실패
- Google Street View Static API가 활성화되었는지 확인
- Gemini API 키가 유효한지 확인
- 네트워크 연결 확인

### CORS 오류
- 서버가 정상적으로 실행 중인지 확인
- 브라우저 콘솔에서 에러 메시지 확인
