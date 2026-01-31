# Google 로드뷰 통합 및 데이터 정합성 개선

## ✅ 완료된 작업

### 1. Google Geocoding API 최우선 사용
- **변경 전**: Naver → Kakao → Google 순서
- **변경 후**: **Google → Naver → Kakao 순서**
- **목적**: 로드뷰 이미지(Google Street View)와 주소 검색 데이터의 정합성 확보

### 2. 데이터 정합성 확보
- Google Geocoding API로 얻은 좌표를 Google Street View API에 사용
- 동일한 좌표 시스템으로 위치 데이터 일관성 유지
- Google Place ID 추가로 위치 식별 정확도 향상

### 3. 위치 정보 명확한 표시
- 로드뷰 이미지 헤더에 위치 정보 표시:
  - 📍 주소 (formatted_address)
  - 🏘️ 법정동
  - 🌐 좌표 (위도, 경도)
  - 🆔 Google Place ID
  - 📡 데이터 출처
- 상세 정보 패널에 모든 위치 데이터 표시

## API 호출 순서

### 주소 검색 (`/api/roadview/geocode`)
1. **Google Geocoding API** (최우선)
   - 주소 → 좌표 변환
   - formatted_address 제공
   - Place ID 제공
   - 법정동 정보 추출 시도

2. **Kakao coord2regioncode API** (법정동 코드 조회)
   - Google 좌표를 사용하여 법정동 코드 조회
   - Google이 법정동 코드를 제공하지 않으므로 보조 사용

3. **Naver Geocoding API** (Google 실패 시 폴백)
   - Google API 실패 시 대안

4. **Kakao Address Search API** (최종 폴백)
   - 모든 API 실패 시 최종 대안

### 로드뷰 이미지 (`/api/roadview/image`)
- **Google Street View Static API** (단일 사용)
  - Google Geocoding으로 얻은 좌표 사용
  - 데이터 정합성 보장

## 데이터 흐름

```
사용자 주소 입력
    ↓
Google Geocoding API
    ↓
좌표 + Place ID + formatted_address
    ↓
Kakao coord2regioncode API (법정동 코드)
    ↓
최종 위치 데이터:
  - 좌표 (Google)
  - 주소 (Google)
  - 법정동 (Kakao)
  - Place ID (Google)
    ↓
Google Street View API
    ↓
로드뷰 이미지 (동일 좌표 사용)
```

## 개선 효과

### 데이터 정합성
- ✅ 주소 검색과 로드뷰 이미지가 동일한 좌표 시스템 사용
- ✅ Google Place ID로 위치 식별 정확도 향상
- ✅ 데이터 출처 명확히 표시

### 사용자 경험
- ✅ 위치 정보를 명확하게 표시
- ✅ 주소, 법정동, 좌표, Place ID 모두 표시
- ✅ 데이터 출처 표시로 신뢰성 향상

## 테스트 결과

### API 응답 예시
```json
{
  "address": "대한민국 서울특별시 강남구 강남대로92길 29",
  "location": {
    "lat": 37.4993753,
    "lng": 127.0297106
  },
  "legalDong": "서울특별시 강남구 역삼동",
  "legalDongCode": "1168010100",
  "dataSource": "Google Geocoding API + Kakao coord2regioncode API",
  "placeId": "ChIJZ47pg1ehfDURfZ11VYwOIHA",
  "formattedAddress": "대한민국 서울특별시 강남구 강남대로92길 29"
}
```

### 로드뷰 이미지 URL
```
https://maps.googleapis.com/maps/api/streetview?size=800x600&location=37.4993753,127.0297106&key=...
```

**좌표 일치 확인**: ✅ 주소 검색 좌표와 로드뷰 이미지 좌표가 정확히 일치

## 다음 단계 (선택사항)

1. **로드뷰 이미지 품질 향상**
   - heading, pitch 파라미터 최적화
   - 여러 각도에서 이미지 수집

2. **에러 처리 개선**
   - Google API 실패 시 자동 폴백
   - 사용자 친화적 에러 메시지

3. **캐싱**
   - 동일 주소 재검색 시 캐시 활용
   - API 호출 비용 절감
