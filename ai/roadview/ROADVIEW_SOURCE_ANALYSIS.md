# 로드뷰 이미지 출처 분석 보고서

## ✅ 확인 결과

**로드뷰 이미지는 카카오에서 불러오지 않고, Google Street View API에서 불러옵니다.**

## 실제 사용 중인 API

### 1. 로드뷰 이미지 URL 생성
- **API**: Google Street View Static API
- **URL 형식**: `https://maps.googleapis.com/maps/api/streetview?size=800x600&location={lat},{lng}&key={GOOGLE_MAPS_API_KEY}&fov=90&heading=0&pitch=0`
- **사용 위치**:
  - `ai/roadview/index.js` - `getGoogleStreetViewUrl()` 함수
  - `ai/roadview/test-server.js` - `/api/roadview/image` 엔드포인트
  - `ai/roadview/test-server.js` - `/api/roadview/analyze` 엔드포인트

### 2. 실제 API 호출 테스트 결과
```json
{
  "imageUrl": "https://maps.googleapis.com/maps/api/streetview?size=800x600&location=37.499403,127.029708&key={GOOGLE_MAPS_API_KEY}&fov=90&heading=0&pitch=0"
}
```
⚠️ **보안 주의**: `{GOOGLE_MAPS_API_KEY}`를 실제 API 키로 교체하세요. API 키는 환경변수(`.env` 파일)에 저장하고 절대 코드에 하드코딩하지 마세요.

## 카카오 로드뷰 API 상태

### 코드 내 카카오 로드뷰 함수
**위치**: `ai/roadview/index.js` - `getKakaoRoadviewUrl()` 함수

**현재 상태**:
```javascript
async function getKakaoRoadviewUrl(location) {
  // Kakao Maps는 현재 REST API로 로드뷰 이미지를 직접 제공하지 않습니다.
  // 웹에서만 로드뷰를 사용할 수 있으므로, Google Street View를 사용하는 것을 권장합니다.
  throw new Error('Kakao 로드뷰는 REST API로 지원되지 않습니다. GOOGLE_MAPS_API_KEY를 설정해주세요.');
}
```

**결론**: 카카오 로드뷰는 REST API로 지원되지 않으며, 현재 구현되어 있지 않습니다.

## 데이터 출처 요약

| 데이터 항목 | 출처 |
|-----------|------|
| 주소 검색 | Kakao Maps API (네이버 실패 시) |
| 좌표 변환 | Kakao Maps API |
| 법정동 정보 | Kakao Maps API |
| **로드뷰 이미지** | **Google Street View API** |

## 카카오 로드뷰 사용 가능 여부

### REST API
- ❌ **지원되지 않음** - Kakao Maps REST API는 로드뷰 이미지를 직접 제공하지 않습니다.

### 웹 SDK
- ✅ **지원됨** - Kakao Maps JavaScript SDK를 사용하면 웹 브라우저에서 로드뷰를 표시할 수 있습니다.
- 하지만 서버 사이드에서 이미지를 가져와서 AI 분석에 사용하기는 어렵습니다.

## 권장 사항

1. **현재 상태 유지**: Google Street View API를 계속 사용
   - REST API로 이미지를 직접 가져올 수 있음
   - AI 분석에 적합한 형태로 제공됨
   - 한국 지역 커버리지 양호

2. **카카오 로드뷰 사용 시**: 
   - 웹 SDK를 사용하여 프론트엔드에서만 표시 가능
   - 서버 사이드 AI 분석에는 부적합
   - 추가 구현이 필요하며, 현재 아키텍처와 맞지 않음

## 결론

**로드뷰 이미지는 Google Street View API에서 불러오고 있으며, 카카오는 사용하지 않습니다.**

- 주소/좌표/법정동 정보: Kakao Maps API ✅
- 로드뷰 이미지: Google Street View API ✅
