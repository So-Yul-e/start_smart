# StartSmart Cafe Franchise

**AI 기반 프랜차이즈 카페 창업 현실 검증 시뮬레이터**

> "될 것 같은지"가 아니라 "수치·현장·구조상 가능한지"로 판단하게 만드는 AI 의사결정 시뮬레이터

프랜차이즈 브랜드 선택 → 입지 선택 → 조건 입력 → AI 분석 → 결과 대시보드 → PDF 리포트

---

## 프로젝트 구조

```
StartSmart/
├── frontend/              # 역할 1: UI 전체
│   ├── brand/             #   브랜드 선택 페이지
│   ├── input/             #   조건 입력 폼
│   ├── dashboard/         #   결과 대시보드
│   └── report/            #   PDF 리포트 생성
│
├── ai/
│   ├── roadview/          # 역할 2: AI-로드뷰 (비전 분석)
│   └── consulting/       # 역할 3: AI-판단 (컨설팅)
│
├── engine/                # 역할 4: 계산 엔진
│   ├── finance/           #   손익 계산
│   └── decision/          #   점수/신호등 판단
│
├── backend/               # 역할 5: 백엔드+통합
│   ├── routes/            #   API 라우트
│   ├── services/          #   오케스트레이터
│   └── market/            #   상권 분석
│
├── shared/                # 공용 인터페이스
│   └── interfaces.js
│
└── docs/                  # 문서
    ├── PRD.md
    ├── IA.md
    └── ...
```

---

## 빠른 시작

### 필수 요구사항
- **Node.js 24.x Current** (정확한 버전 필수 - 호환성 및 보안 보장)
- npm 10.0.0 이상

```bash
# 1. 클론 & 설치
git clone <repo-url>
cd StartSmart

# Node.js 버전 확인 (nvm 사용 시: nvm use)
node -v  # v24.x.x 출력 확인

npm install

# 보안 점검 (권장)
npm audit

# 2. 환경변수 설정
cp .env.example .env
# .env 파일에 API 키 입력
# ⚠️ .env 파일은 절대 Git에 커밋하지 마세요!

# 3. 서버 실행
node backend/server.js

# 4. 브라우저 접속
# http://localhost:3000
```

---

## 환경변수

```bash
PORT=3000

# AI-로드뷰 (Gemini Vision)
GEMINI_API_KEY=xxxxx

# AI-판단 (Claude)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# 지도 API (Kakao 또는 Google Maps)
KAKAO_REST_API_KEY=xxxxx
# 또는
GOOGLE_MAPS_API_KEY=xxxxx

# PDF 생성 (jsPDF 또는 Puppeteer)
# (필요시 추가)
```

---

## 사용자 플로우

```
1. 브랜드 선택 (12개)
   ↓
2. 지도에서 입지 핀 클릭
   ↓
3. 조건 입력 (투자금, 월세, 평수, 점주 근무 여부)
   ↓
4. AI 판매량 시나리오 제안 (보수/기대/낙관)
   ↓
5. 목표 판매량 입력
   ↓
6. 분석 실행
   ├─ 손익 계산
   ├─ 상권 경쟁 분석
   ├─ AI 로드뷰 물리 리스크 분석
   └─ AI 리스크 해석
   ↓
7. 결과 대시보드 확인
   ├─ 점수/신호등
   ├─ 회수 개월
   ├─ 월 순이익
   └─ AI 판단 상세
   ↓
8. 조건 수정 → 재계산 → 결과 비교
   ↓
9. PDF 리포트 출력
```

---

## 팀 역할

| 역할 | 담당 | 폴더 | API | 난이도 |
|------|------|------|-----|--------|
| 1. UI 전체 | - | `/frontend/` | - | ⭐⭐ |
| 2. AI-로드뷰 | - | `/ai/roadview/` | Gemini Vision | ⭐⭐ |
| 3. AI-판단 | - | `/ai/consulting/` | Anthropic Claude | ⭐⭐⭐ |
| 4. 계산 엔진 | - | `/engine/` | - | ⭐⭐ |
| 5. 백엔드+통합 | - | `/backend/` | - | ⭐⭐⭐ |

> 각 폴더의 `ROLE.md`에 역할별 상세 가이드가 있습니다.

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/brands` | 브랜드 목록 조회 |
| `POST` | `/api/analyze` | 분석 실행 (입지, 조건 입력) |
| `GET` | `/api/result/:analysisId` | 분석 결과 조회 (폴링) |
| `POST` | `/api/report/:analysisId` | PDF 리포트 생성 |

---

## Git 브랜치

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

## 보안

### ⚠️ 보안 체크리스트

1. **의존성 보안 점검**
   ```bash
   npm audit              # 보안 취약점 확인
   npm audit fix          # 자동 수정 가능한 취약점 해결
   ```

2. **환경변수 보안**
   - `.env` 파일은 절대 Git에 커밋하지 않기 (`.gitignore`에 포함됨)
   - API 키는 팀 채널에서만 공유 (공개 채팅 금지)
   - 해커톤 종료 후 키 삭제 또는 비활성화 권장

3. **Node.js 보안**
   - Node.js 24.x Current 사용 (최신 기능 및 보안 패치 포함)
   - 정기적으로 `npm audit` 실행

---

## 문서

| 문서 | 설명 |
|------|------|
| `docs/PRD.md` | 제품 요구사항 문서 |
| `docs/IA.md` | 정보 아키텍처 |
| `docs/TEAM_ROLES.md` | 팀 역할 분담 및 작업 순서 |
| `docs/TEAM_HARDWARE.md` | 팀원 하드웨어 사양 및 역할 배정 가이드 |
| `docs/ONBOARDING.md` | 해커톤 당일 온보딩 가이드 |
| `docs/일 판매량별 손익 비교 (200잔 _ 250잔 _ 300잔).md` | 손익 비교 분석 자료 |
| `docs/초기 투자비 (10평 기준, 강남구).md` | 초기 투자비 분석 자료 |
| `shared/interfaces.js` | 모듈 간 데이터 계약 |
| `각 폴더/ROLE.md` | 역할별 상세 가이드 |

---

## 크레딧 현황

| 플랫폼 | 총 크레딧 | 용도 |
|--------|-----------|------|
| Anthropic | $75 (5인 풀링) | Claude 리스크 분석 |
| Google Gemini | 무료 | 로드뷰 이미지 분석 |
| Kakao Maps | 무료 (일일 한도) | 지도 API |
| Google Maps | 무료 (월 $200 크레딧) | 지도 API (대안) |

**1회 분석 예상 비용**: ~$0.01 (Claude API 호출 기준)

---

## 성공 기준

- [ ] 입력 → 결과 → 수정 → 재결과 루프 정상 동작
- [ ] 재무 / 상권 / 물리 리스크가 결과에 반영
- [ ] 회수 개월 / 순이익 / 민감도 계산 정확
- [ ] AI 리스크 분석 및 개선 제안 자동 생성
- [ ] PDF 리포트 생성 성공
- [ ] 데모 시나리오 완주 가능
