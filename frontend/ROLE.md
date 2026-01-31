# 역할 1: Frontend (UI 전체)

## 담당 영역
- 브랜드 선택 페이지
- 조건 입력 폼
- 결과 대시보드
- PDF 리포트 생성 (클라이언트 사이드)

## 폴더
```
frontend/
├── brand/          # 브랜드 선택 페이지
├── input/          # 조건 입력 폼
├── dashboard/      # 결과 대시보드
└── report/         # PDF 리포트 생성
```

## 주요 기능

### 1. 브랜드 선택 (`brand/`)
- 12개 브랜드 카드 리스트
- 브랜드명, 포지션 태그 표시
- 선택 CTA: "이 브랜드로 분석하기"

### 2. 조건 입력 (`input/`)
- 지도 인터랙션 (입지 핀 클릭)
- 기본 입력: 초기 투자금, 월세, 평수, 점주 근무 여부
- 판매량 설정: AI 제안 시나리오 표시 + 목표 판매량 입력

### 3. 결과 대시보드 (`dashboard/`)
- 핵심 카드: 점수/신호등, 생존 개월, 회수 개월, 월 순이익
- 차트: 손익 구조 스택 차트, 민감도 ±10% 그래프
- AI 판단 상세: 핵심 리스크 Top 3, 개선 제안, 경쟁 환경 해석
- 시뮬레이션 비교: Before/After 카드

### 4. PDF 리포트 (`report/`)
- jsPDF를 사용한 클라이언트 사이드 PDF 생성
- 요약 페이지, 차트 페이지, AI 판단 코멘트 페이지

---

## 세팅 가이드

### 1단계: 사전 준비
```bash
# 필요한 것
# - Node.js 24.x Current (node -v 로 확인, v24.x.x 출력되어야 함)
#   ⚠️ 팀원 모두 24.x 버전 사용 필수 (호환성 및 보안 문제 방지)
# - npm (npm -v 로 확인)
# - 코드 에디터 (VS Code 추천)
```

### 2단계: 프로젝트 클론 & 설치
```bash
git clone <repo-url>
cd StartSmart
npm install
```

### 3단계: 환경변수 설정
```bash
cp .env.example .env
```
`.env` 파일은 프론트엔드에서 직접 사용하지 않지만, 백엔드 API 호출 시 필요합니다.

### 4단계: 브랜치 생성
```bash
git checkout -b feature/frontend
```

### 5단계: 작업 시작
```bash
# 내 작업 폴더: frontend/ 만 수정!
# 각 페이지별로 HTML/CSS/JS 파일 생성
```

---

## 단독 테스트 방법 (백엔드 없이)

### 정적 HTML 테스트
각 페이지를 정적 HTML로 먼저 구현하고, 나중에 백엔드 API와 연동:

```html
<!-- frontend/brand/index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>브랜드 선택 - StartSmart</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="brand-list">
    <!-- 브랜드 카드들 -->
  </div>
  <script src="script.js"></script>
</body>
</html>
```

### Mock 데이터 사용
```js
// frontend/brand/script.js
// 백엔드 API가 준비되기 전까지 Mock 데이터 사용
const mockBrands = [
  { id: "brand_1", name: "스타벅스", position: "프리미엄" },
  // ...
];

// 나중에 실제 API 호출로 교체
// fetch('/api/brands').then(res => res.json()).then(data => { ... });
```

---

## API 연동

### 브랜드 목록 조회
```js
fetch('/api/brands')
  .then(res => res.json())
  .then(data => {
    // data.brands 배열을 사용하여 브랜드 카드 렌더링
  });
```

### 분석 실행
```js
const analyzeRequest = {
  brandId: "brand_1",
  location: { lat: 37.5665, lng: 126.9780, address: "..." },
  radius: 500,
  conditions: { /* ... */ },
  targetDailySales: 300
};

fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(analyzeRequest)
})
  .then(res => res.json())
  .then(data => {
    // data.analysisId를 사용하여 결과 폴링
    pollResult(data.analysisId);
  });
```

### 결과 조회 (폴링)
```js
function pollResult(analysisId) {
  const interval = setInterval(() => {
    fetch(`/api/result/${analysisId}`)
      .then(res => res.json())
      .then(data => {
        if (data.result.status === 'completed') {
          clearInterval(interval);
          // 결과 대시보드 표시
          displayDashboard(data.result);
        } else if (data.result.status === 'failed') {
          clearInterval(interval);
          // 에러 처리
        }
        // pending 또는 processing 상태면 계속 폴링
      });
  }, 2000); // 2초마다 폴링
}
```

---

## 커밋 규칙
```bash
git add frontend/
git commit -m "[Frontend] 작업내용"
git push origin feature/frontend
```

## 주의사항
- `frontend/` 폴더만 수정할 것
- 백엔드 API 형식은 `shared/interfaces.js` 참고
- PDF 생성은 클라이언트 사이드에서 jsPDF 사용
- 지도 API는 Kakao Maps 또는 Google Maps 사용
