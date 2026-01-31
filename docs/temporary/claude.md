# StartSmart - Claude Code 작업 가이드

## 프로젝트 개요

카페 프랜차이즈 창업 타당성 검증 시뮬레이터 (AI 기반 MVP).
재무분석 + 상권분석 + 현장 리스크 + AI 컨설팅을 결합하여 데이터 기반 창업 판단을 지원한다.

## 기술 스택

- **Backend**: Node.js v24.x, Express 4.18.2
- **Frontend**: HTML/CSS/JavaScript (vanilla)
- **AI**: Claude 3.5 Sonnet (Anthropic SDK), Gemini Vision (Google GenAI)
- **지도**: Kakao Maps 또는 Google Maps API
- **PDF**: jsPDF + jsPDF-autoTable

## 디렉토리 구조 및 역할(Role) 분담

```
StartSmart/
├── frontend/          # Role 1: UI/UX (4페이지)
├── ai/
│   ├── roadview/      # Role 2: Gemini Vision 현장 리스크 분석
│   └── consulting/    # Role 3: Claude AI 리스크 컨설팅
├── engine/            # Role 4: 재무 계산 + 판정 엔진
├── backend/           # Role 5: Express 서버 + 오케스트레이션 + 상권분석
├── shared/            # 공유 데이터 계약 (interfaces.js, READ-ONLY)
└── docs/              # 문서 (PRD, IA, 팀 역할 등)
```

## 5개 역할 상세

### Role 1 - Frontend (`frontend/`)
- **담당**: 브랜드 선택, 조건 입력, 대시보드, PDF 리포트 UI
- **참고 파일**: `frontend/ROLE.md`
- **주의**: mock 데이터로 독립 개발 가능, `shared/interfaces.js` 응답 형식 준수

### Role 2 - AI Roadview (`ai/roadview/`)
- **담당**: Gemini Vision API로 로드뷰 이미지 분석 (간판, 경사, 층수, 가시성)
- **참고 파일**: `ai/roadview/ROLE.md`
- **출력**: 리스크 점수 0-100, 4개 항목별 상세

### Role 3 - AI Consulting (`ai/consulting/`)
- **담당**: Claude API로 매출 시나리오, 리스크 Top 3, 개선안 3개 생성
- **참고 파일**: `ai/consulting/ROLE.md`
- **주의**: 프롬프트는 `prompts.js`에 분리, 토큰 비용 관리 필요

### Role 4 - Engine (`engine/`)
- **담당**: 손익 계산(finance/calculator.js), 종합 판정(decision/scorer.js)
- **참고 파일**: `engine/ROLE.md`
- **출력**: 월 수익, 투자 회수 기간, 신호등(green/yellow/red), 민감도 분석

### Role 5 - Backend + Integration (`backend/`)
- **담당**: Express 서버, API 라우트, 오케스트레이터, 상권 분석(market/)
- **참고 파일**: `backend/ROLE.md`
- **API 엔드포인트**:
  - `GET /api/brands` - 브랜드 목록
  - `POST /api/analyze` - 분석 실행
  - `GET /api/result/:analysisId` - 결과 조회
  - `POST /api/report/:analysisId` - PDF 생성

## 핵심 규칙

1. **`shared/interfaces.js`는 READ-ONLY** - 모든 모듈이 이 계약을 따른다. 수정 필요 시 팀 합의 필수.
2. **환경 변수**: `.env` 파일에 API 키 관리, 절대 커밋 금지.
3. **각 역할의 ROLE.md를 반드시 먼저 읽고 작업** - 구현 스펙, 예시, 테스트 방법이 포함되어 있다.
4. **분석 파이프라인 순서**: 입력 → 상권분석 → 재무계산 → 로드뷰분석 → AI컨설팅 → 판정 → 대시보드 → PDF

## 작업 시 참고

- `docs/PRD.md` - 제품 요구사항
- `docs/IA.md` - UX 플로우 (8단계)
- `docs/TEAM_ROLES.md` - 역할별 상세 책임
- `docs/ONBOARDING.md` - 해커톤 당일 온보딩 체크리스트
