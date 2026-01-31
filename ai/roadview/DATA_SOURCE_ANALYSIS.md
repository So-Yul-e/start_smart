# 데이터 정합성 분석 보고서

## 현재 표시되는 데이터
- **주소**: 서울 강남구 강남대로92길 29
- **좌표**: 37.499403, 127.029708
- **법정동**: 서울 강남구 역삼동
- **법정동 코드**: 1168010100

## 코드 실행 경로 분석

### 1. 네이버 Geocoding API (최우선)
**위치**: `test-server.js` 55-105줄

**동작**:
- 네이버 API가 성공하면 **즉시 return** (93-98줄)
- 이때 `legalDongCode`는 **null로 반환**됨 (79줄에서 null로 초기화, 이후 설정 없음)
- 법정동 이름만 추출 (81-88줄)

**문제점**: 
- 네이버 API는 법정동 코드를 제공하지 않음
- 성공 시 바로 return하므로 다른 API 호출 불가

### 2. Kakao 주소 검색 API (네이버 실패 시)
**위치**: `test-server.js` 107-153줄

**동작**:
- Kakao API는 `result.address.b_code`에서 법정동 코드 제공 (133줄)
- 성공 시 바로 return (143-148줄)

**가능성**: Kakao API가 호출되었다면 법정동 코드를 제공할 수 있음

### 3. Google Geocoding API (Kakao 실패 시)
**위치**: `test-server.js` 159-239줄

**동작**:
- Google API는 법정동 코드를 직접 제공하지 않음
- Kakao 좌표→행정구역 변환 API 호출 (204-232줄)
- Kakao `coord2regioncode` API에서 법정동 코드 조회 (226줄)

**가능성**: Google → Kakao coord2regioncode 경로로 법정동 코드 조회 가능

## ✅ 실제 데이터 출처 확인 (2024년 확인)

### 확인된 실행 경로: 네이버 API 실패 → Kakao API 성공

**서버 로그 확인 결과**:
```
[Naver 주소 검색 요청] 주소: 서울 강남구 강남대로92길 29
Naver API 오류: Request failed with status code 401
[Kakao 주소 검색 요청] 주소: 서울 강남구 강남대로92길 29
[Kakao 검색 성공] 좌표: 37.4994031006711, 127.029708406711
[Kakao 검색 결과] 법정동: 서울 강남구 역삼동, 법정동 코드: 1168010100
```

**데이터 출처**:
- **주소**: Kakao 주소 검색 API (`/v2/local/search/address.json`) - `address_name`
- **좌표**: Kakao 주소 검색 API - `x` (경도), `y` (위도)
- **법정동 이름**: Kakao API의 `region_3depth_name` 조합 (서울 강남구 역삼동)
- **법정동 코드**: Kakao API의 `b_code` (1168010100)

**API 응답 예시**:
```json
{
  "address": "서울 강남구 강남대로92길 29",
  "location": {
    "lat": 37.4994031006711,
    "lng": 127.029708406711
  },
  "legalDong": "서울 강남구 역삼동",
  "legalDongCode": "1168010100",
  "dataSource": "Kakao Address Search API"
}
```

## 데이터 정합성 검증 필요 사항

1. **실제 호출된 API 확인**
   - 서버 콘솔 로그 확인 필요
   - `[Naver 주소 검색 요청]`, `[Kakao 주소 검색 요청]`, `[Google Geocoding 요청]` 로그 확인

2. **법정동 코드 검증**
   - 코드 `1168010100`이 실제로 "서울 강남구 역삼동"과 일치하는지 확인
   - 행정안전부 법정동 코드표와 대조

3. **좌표 정확성 검증**
   - 좌표 `37.499403, 127.029708`이 실제 주소와 일치하는지 확인
   - Google Maps, Naver Maps에서 검증

## 권장 개선 사항

1. **네이버 API 성공 시에도 법정동 코드 조회**
   - 네이버 API가 성공해도 바로 return하지 말고
   - Kakao `coord2regioncode` API를 추가로 호출하여 법정동 코드 조회

2. **로깅 강화**
   - 각 API 호출 시 상세 로그 기록
   - 어떤 API에서 어떤 데이터를 가져왔는지 명확히 표시

3. **데이터 출처 표시**
   - 프론트엔드에 데이터 출처 표시 (예: "데이터 출처: Kakao Maps API")
