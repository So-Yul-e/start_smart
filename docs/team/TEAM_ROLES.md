# StartSmart 팀 역할 분담

## 5명 역할 분담표

| 역할 | 담당자 | 폴더 | 주요 기능 | API | 난이도 |
|------|--------|------|-----------|-----|--------|
| 1. Frontend | - | `/frontend/` | 브랜드 선택, 입력 폼, 대시보드, PDF 리포트 | - | ⭐⭐ |
| 2. AI-로드뷰 | - | `/ai/roadview/` | 로드뷰 이미지 분석 (물리 리스크) | Gemini Vision | ⭐⭐ |
| 3. AI-판단 | - | `/ai/consulting/` | 판매량 추론, 리스크 분석, 개선 제안 | Claude | ⭐⭐⭐ |
| 4. 계산 엔진 | - | `/engine/` | 손익 계산, 점수/신호등 판단 | - | ⭐⭐ |
| 5. 백엔드+통합 | - | `/backend/` | 서버, 상권 분석, API 통합 | 지도 API | ⭐⭐⭐ |

---

## 역할별 상세 설명

### 역할 1: Frontend (UI 전체)
**담당 영역:**
- 브랜드 선택 페이지 (12개 브랜드 카드)
- 조건 입력 폼 (지도, 투자금, 월세, 평수, 점주 근무 여부, 판매량)
- 결과 대시보드 (점수/신호등, 차트, AI 판단 상세)
- PDF 리포트 생성 (jsPDF 사용)

**기술 스택:**
- HTML/CSS/JavaScript (바닐라 JS 또는 React)
- jsPDF (PDF 생성)
- Kakao Maps 또는 Google Maps API (지도)

**주요 파일:**
- `frontend/brand/` - 브랜드 선택
- `frontend/input/` - 조건 입력
- `frontend/dashboard/` - 결과 대시보드
- `frontend/report/` - PDF 리포트

**상세 가이드:** `frontend/ROLE.md`

---

### 역할 2: AI-로드뷰 (비전 분석)
**담당 영역:**
- Gemini Vision API로 로드뷰 이미지 분석
- 물리적 입지 리스크 인식
  - 간판 가림 (signage_obstruction)
  - 급경사 (steep_slope)
  - 층위 추정 (floor_level)
  - 보행 가시성 (visibility)

**기술 스택:**
- Node.js
- @google/generative-ai (Gemini Vision API)

**주요 파일:**
- `ai/roadview/index.js` - 메인 로직
- `ai/roadview/visionAnalyzer.js` - Gemini Vision 연동

**상세 가이드:** `ai/roadview/ROLE.md`

---

### 역할 3: AI-판단 (컨설팅)
**담당 영역:**
- Claude API로 판매량 시나리오 추론 (보수/기대/낙관)
- 리스크 분석 및 개선 제안 (Top 3)
- 경쟁 환경 해석 (강도, 차별화 가능성, 가격 전략)

**기술 스택:**
- Node.js
- @anthropic-ai/sdk (Claude API)

**주요 파일:**
- `ai/consulting/index.js` - 메인 로직
- `ai/consulting/prompts.js` - 프롬프트 템플릿

**상세 가이드:** `ai/consulting/ROLE.md`

---

### 역할 4: 계산 엔진
**담당 영역:**
- 손익 계산 엔진
  - 월 매출/비용/순이익 계산
  - 회수 개월 수 계산
  - 손익분기점 계산
  - 민감도 분석 (±10%)
- 점수/신호등/생존 개월 판단 엔진
  - 종합 점수 산출 (0-100)
  - 신호등 판단 (🟢🟡🔴)
  - 생존 개월 수 추정

**기술 스택:**
- Node.js
- 순수 계산 로직 (외부 API 불필요)

**주요 파일:**
- `engine/finance/index.js` - 손익 계산
- `engine/decision/index.js` - 판단 계산

**상세 가이드:** `engine/ROLE.md`

---

### 역할 5: 백엔드+통합
**담당 영역:**
- Express 서버 운영
- REST API 엔드포인트
  - GET `/api/brands` - 브랜드 목록
  - POST `/api/analyze` - 분석 실행
  - GET `/api/result/:analysisId` - 결과 조회
  - POST `/api/report/:analysisId` - PDF 리포트 생성
- AI 파이프라인 오케스트레이션
- 상권 분석 (지도 API 연동)

**기술 스택:**
- Node.js
- Express
- Kakao Maps 또는 Google Maps API

**주요 파일:**
- `backend/server.js` - Express 서버
- `backend/services/orchestrator.js` - 파이프라인 총괄
- `backend/market/` - 상권 분석

**상세 가이드:** `backend/ROLE.md`

---

## 작업 순서 (권장)

### Phase 1: 기본 구조 설정 (1일차)
1. **백엔드 담당자**: Express 서버 기본 구조 설정
2. **프론트엔드 담당자**: 정적 HTML 페이지 구조 작성
3. **계산 엔진 담당자**: 손익 계산식 구현 (Mock 데이터로 테스트)

### Phase 2: 핵심 기능 구현 (2일차)
1. **계산 엔진 담당자**: 점수/신호등 판단 로직 구현
2. **AI-로드뷰 담당자**: Gemini Vision API 연동
3. **AI-판단 담당자**: Claude API 연동 및 프롬프트 최적화
4. **백엔드 담당자**: 상권 분석 구현 (지도 API 연동)

### Phase 3: 통합 및 연동 (3일차)
1. **백엔드 담당자**: 오케스트레이터 구현 (전체 파이프라인 연결)
2. **프론트엔드 담당자**: 백엔드 API 연동
3. **전체**: 통합 테스트 및 버그 수정

### Phase 4: 완성도 향상 (4일차)
1. **프론트엔드 담당자**: PDF 리포트 생성 구현
2. **전체**: UI/UX 개선, 에러 처리, 성능 최적화
3. **전체**: 데모 시나리오 준비

---

## 공용 인터페이스

모든 모듈 간 데이터 교환은 `shared/interfaces.js`에 정의된 형식을 따라야 합니다.

**⚠️ 중요:** 이 파일은 절대 개별적으로 수정하지 마세요. 변경이 필요하면 팀 전체 동의 후 백엔드 담당자가 수정합니다.

---

## Git 브랜치 전략

```
main                      # 최종 배포 (직접 push 금지)
└── develop               # 통합 테스트
    ├── feature/frontend
    ├── feature/ai-roadview
    ├── feature/ai-consulting
    ├── feature/engine
    └── feature/backend
```

### 커밋 메시지 규칙
```
[Frontend] 브랜드 선택 UI 구현
[AI-Roadview] Gemini Vision 로드뷰 분석 연동
[AI-Consulting] Claude 리스크 분석 프롬프트 최적화
[Engine] 손익 계산 엔진 구현
[Backend] 분석 파이프라인 연결
```

---

## API 키 관리

각 역할별로 필요한 API 키:

| 역할 | 필요한 API 키 |
|------|--------------|
| Frontend | 없음 (백엔드 API 호출만) |
| AI-로드뷰 | `GEMINI_API_KEY` |
| AI-판단 | `ANTHROPIC_API_KEY` |
| 계산 엔진 | 없음 |
| 백엔드+통합 | 모든 키 (통합 테스트용) |

**⚠️ 보안 주의:**
- `.env` 파일은 절대 Git에 커밋하지 않기
- API 키는 팀 채널에서만 공유 (공개 채팅 금지)
- 해커톤 종료 후 키 삭제 또는 비활성화 권장

---

## 통신 채널

각 역할별로 독립적으로 작업하되, 다음 사항은 팀 전체와 공유:

1. **인터페이스 변경**: `shared/interfaces.js` 수정 시 팀 전체 동의 필요
2. **API 엔드포인트 변경**: 백엔드 담당자와 프론트엔드 담당자 협의
3. **에러 발생**: 해당 모듈 담당자에게 직접 연락

---

## 성공 기준

- [ ] 입력 → 결과 → 수정 → 재결과 루프 정상 동작
- [ ] 재무 / 상권 / 물리 리스크가 결과에 반영
- [ ] 회수 개월 / 순이익 / 민감도 계산 정확
- [ ] AI 리스크 분석 및 개선 제안 자동 생성
- [ ] PDF 리포트 생성 성공
- [ ] 데모 시나리오 완주 가능

---

**Last Updated:** 2026-02-01
