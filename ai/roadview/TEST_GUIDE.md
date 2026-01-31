# AI-로드뷰 모듈 테스트 가이드

## 사전 준비

### 1. 의존성 설치
```bash
cd /Users/lifegoeson/Downloads/start_smart-main
npm install
```

필요한 패키지:
- `@google/generative-ai`: Gemini Vision API
- `axios`: HTTP 요청
- `dotenv`: 환경변수 관리

### 2. 환경변수 설정
`.env` 파일을 프로젝트 루트에 생성하고 다음 키를 설정:

```bash
# 필수
GEMINI_API_KEY=your_gemini_api_key_here

# 선택 (Google Street View 우선 사용)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# 선택 (Google이 없을 때 대안)
KAKAO_REST_API_KEY=your_kakao_api_key_here
```

## 테스트 실행

### 기본 테스트
```bash
node ai/roadview/test.js
```

### 예상 출력
```
=== AI-로드뷰 분석 테스트 시작 ===

테스트 위치: 위도 37.5665, 경도 126.9780
환경변수 확인:
  - GEMINI_API_KEY: 설정됨
  - GOOGLE_MAPS_API_KEY: 설정됨
  - KAKAO_REST_API_KEY: 미설정

=== 분석 결과 ===
{
  "location": {
    "lat": 37.5665,
    "lng": 126.9780
  },
  "risks": [
    {
      "type": "signage_obstruction",
      "level": "medium",
      "description": "..."
    },
    ...
  ],
  "overallRisk": "medium",
  "riskScore": 65
}

분석 소요 시간: 3.45초

=== 검증 ===
✓ 4가지 리스크 항목이 모두 포함되어 있습니다.
✓ overallRisk가 올바른 형식입니다: medium
✓ riskScore가 올바른 범위입니다: 65
✓ 모든 description이 유효한 문자열로 작성되어 있습니다.
✓ 모든 리스크 level이 올바른 형식입니다.

=== 테스트 완료 ===
```

## 테스트 검증 항목

1. ✅ 4가지 리스크 항목 모두 포함
   - signage_obstruction (간판 가림)
   - steep_slope (급경사)
   - floor_level (층위)
   - visibility (보행 가시성)

2. ✅ overallRisk 형식 검증
   - low | medium | high 중 하나

3. ✅ riskScore 범위 검증
   - 0-100 사이의 숫자

4. ✅ description 유효성
   - 모든 항목에 한국어 설명 포함

5. ✅ level 형식 검증
   - floor_level: ground | half_basement | second_floor
   - 기타: low | medium | high

## 문제 해결

### 모듈을 찾을 수 없음
```bash
Error: Cannot find module '@google/generative-ai'
```
→ `npm install` 실행 필요

### 환경변수 미설정
```
GEMINI_API_KEY: ❌ 미설정
```
→ `.env` 파일에 API 키 설정 필요

### 로드뷰 이미지를 찾을 수 없음
```
해당 위치의 로드뷰를 찾을 수 없습니다.
```
→ 다른 좌표로 테스트하거나, Google/Kakao API 키 확인

### API 호출 실패
```
Gemini API 호출 실패
```
→ API 키 유효성 확인, 네트워크 연결 확인
