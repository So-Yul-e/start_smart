# 네이버 Static Map API 로드뷰 이미지 수신 가능성 분석

## ✅ 확인 결과

**네이버 Static Map API로는 로드뷰 이미지를 받을 수 없습니다.**

## 테스트 결과

### 1. 네이버 Static Map API
- **기능**: 일반 지도 이미지 제공 (지도, 마커, 경로 등)
- **로드뷰 지원**: ❌ 지원하지 않음
- **용도**: 정적 지도 이미지 생성

### 2. 네이버 로드뷰 API 확인
다음 엔드포인트들을 테스트했으나 모두 404 Not Found:
- `https://naveropenapi.apigw.ntruss.com/map-roadview/v1/panorama`
- `https://naveropenapi.apigw.ntruss.com/map-roadview/v2/panorama`
- `https://naveropenapi.apigw.ntruss.com/map-static/v2/roadview`
- `https://naveropenapi.apigw.ntruss.com/map-roadview/static`

**결론**: 네이버는 REST API로 로드뷰 이미지를 제공하지 않습니다.

## 네이버 Maps API 기능 비교

| API 종류 | 기능 | 로드뷰 지원 |
|---------|------|------------|
| Static Map API | 정적 지도 이미지 | ❌ |
| Geocoding API | 주소 ↔ 좌표 변환 | ❌ |
| Reverse Geocoding API | 좌표 → 주소 변환 | ❌ |
| JavaScript SDK | 동적 지도 (웹) | ✅ (웹에서만) |

## 네이버 로드뷰 사용 방법

### 웹 브라우저 (JavaScript SDK)
- ✅ **지원됨**: 네이버 Maps JavaScript SDK를 사용하면 웹 브라우저에서 로드뷰를 표시할 수 있습니다.
- ❌ **서버 사이드**: REST API로 이미지를 직접 가져올 수 없습니다.

### REST API
- ❌ **지원되지 않음**: 네이버는 로드뷰 이미지를 REST API로 제공하지 않습니다.

## 현재 시스템과의 호환성

### 현재 사용 중인 API
- **로드뷰 이미지**: Google Street View Static API
  - REST API로 이미지 URL 직접 제공
  - 서버 사이드에서 이미지 다운로드 가능
  - AI 분석에 적합

### 네이버로 전환 시 문제점
1. **REST API 부재**: 네이버는 로드뷰 이미지를 REST API로 제공하지 않음
2. **서버 사이드 제한**: JavaScript SDK는 브라우저에서만 동작
3. **AI 분석 부적합**: 이미지를 직접 가져올 수 없어 Gemini Vision API 분석 불가

## 대안 비교

| 제공자 | REST API | 서버 사이드 | AI 분석 가능 | 한국 커버리지 |
|--------|----------|------------|-------------|--------------|
| **Google Street View** | ✅ | ✅ | ✅ | 양호 |
| **Kakao Maps** | ❌ | ❌ | ❌ | - |
| **Naver Maps** | ❌ | ❌ | ❌ | - |

## 결론 및 권장사항

### 결론
**네이버 Static Map API로는 로드뷰 이미지를 받을 수 없습니다.**

### 권장사항
1. **현재 상태 유지**: Google Street View API를 계속 사용
   - REST API로 이미지 직접 제공
   - 서버 사이드 AI 분석에 적합
   - 한국 지역 커버리지 양호

2. **네이버 사용 시 제약사항**:
   - 웹 브라우저에서만 로드뷰 표시 가능 (JavaScript SDK)
   - 서버 사이드에서 이미지를 가져올 수 없음
   - AI 분석에 사용 불가

3. **하이브리드 접근** (선택사항):
   - 프론트엔드: 네이버 로드뷰 표시 (사용자에게 보여주기)
   - 백엔드: Google Street View API 사용 (AI 분석용)
   - 두 시스템을 병행 사용

## 참고사항

- 네이버 Maps API 공식 문서: https://www.ncloud.com/product/applicationService/maps
- Google Street View Static API: https://developers.google.com/maps/documentation/streetview
- 테스트 스크립트: `ai/roadview/test-naver-staticmap.js`
