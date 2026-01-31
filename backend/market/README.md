# 상권 분석 모듈

## 테스트 결과 요약

### ✅ 완료된 작업
1. **XML 파싱 추가**: 소상공인시장진흥공단 API의 XML 응답 처리
2. **Fallback 로직**: 여러 API를 순차적으로 시도
3. **에러 처리**: 각 API 실패 시 다음 API 자동 시도
4. **테스트 스크립트**: `test.js`, `test-all-apis.js` 추가

### ⚠️ 현재 이슈

#### 1. 소상공인시장진흥공단 API
- **상태**: XML 파싱 완료, 하지만 테스트 위치에서 NODATA_ERROR
- **원인**: 해당 위치에 데이터가 없거나 API 파라미터 문제 가능
- **해결**: 다른 위치로 테스트 필요

#### 2. 카카오맵 API
- **상태**: KA Header 오류 (401)
- **원인**: 서버 사이드에서 KA 헤더 형식 문제
- **해결**: 카카오 REST API 문서 확인 필요

#### 3. 네이버지도 API
- **상태**: Client Secret 필요 (401)
- **원인**: `.env`에 `NAVER_MAP_CLIENT_SECRET` 없음
- **해결**: 네이버 클라우드 플랫폼에서 Client Secret 발급 후 `.env`에 추가

#### 4. 구글맵 API
- **상태**: REQUEST_DENIED
- **원인**: API 키 권한 문제 가능
- **해결**: Google Cloud Console에서 API 키 권한 확인

## 테스트 방법

### 개별 테스트
```bash
# 상권 분석 모듈 테스트
node backend/market/test.js

# 모든 지도 API 테스트
node backend/market/test-all-apis.js
```

### 서버에서 테스트
```bash
# 서버 실행
node backend/server.js

# 다른 터미널에서 분석 요청
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand_1",
    "location": {"lat": 37.4980, "lng": 127.0276, "address": "서울특별시 강남구"},
    "radius": 500,
    "conditions": {
      "initialInvestment": 500000000,
      "monthlyRent": 3000000,
      "area": 33,
      "ownerWorking": true
    },
    "targetDailySales": 300
  }'
```

## 다음 단계

1. **네이버지도 Client Secret 추가**: `.env`에 `NAVER_MAP_CLIENT_SECRET` 추가
2. **카카오맵 API 헤더 수정**: 서버 사이드용 헤더 형식 확인
3. **다른 위치로 테스트**: 강남역 외 다른 위치로 테스트
4. **API 키 권한 확인**: 각 API의 키 권한 및 설정 확인
