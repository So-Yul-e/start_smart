# StartSmart - 해커톤 당일 온보딩

## 사전 준비 (전날까지)
- [ ] Node.js 24.x Current 설치 (정확한 버전 필수!)
  - 확인: `node -v` → `v24.x.x` 출력되어야 함
  - 다운로드: https://nodejs.org/ (Current 버전)
  - 또는 nvm 사용: `nvm install 24 && nvm use 24`
  - ⚠️ **중요**: 팀원 모두 24.x 버전 사용 필수 (호환성 및 보안 문제 방지)
- [ ] Git 설치, GitHub 계정 연동
- [ ] 본인 역할 확인 (각 폴더의 `ROLE.md` 읽기)
- [ ] 보안 체크리스트 확인 (아래 "보안 주의사항" 참고)

---

## 해커톤 시작 절차

### 1. 프로젝트 클론 & 설정 (전원)
```bash
git clone <repo-url>
cd StartSmart

# Node.js 버전 확인 및 설정 (nvm 사용 시)
# nvm이 설치되어 있으면: nvm use (자동으로 .nvmrc 읽음, 24.0.0)
# 또는: nvm install 24 && nvm use 24
node -v  # v24.x.x 출력 확인

npm install
cp .env.example .env
```

### 2. API 키 설정
각 담당자가 팀 채널에 공유한 키를 `.env`에 입력:

| 키 | 담당자 |
|----|--------|
| `GEMINI_API_KEY` | 역할 2 (AI-로드뷰) |
| `ANTHROPIC_API_KEY` | 역할 3 (AI-판단) |
| `KAKAO_REST_API_KEY` 또는 `GOOGLE_MAPS_API_KEY` | 역할 5 (백엔드+통합) |

**참고:**
- Frontend 담당자: API 키 불필요 (백엔드 API 호출만)
- 계산 엔진 담당자: API 키 불필요 (순수 계산 로직)
- 백엔드 담당자: 모든 API 키 필요 (통합 테스트용)

### 3. 브랜치 생성 & 작업 시작
```bash
git checkout -b feature/<본인역할>
# 예: feature/frontend, feature/ai-roadview, feature/ai-consulting, feature/engine, feature/backend
```

### 4. 역할별 첫 작업

| 역할 | 첫 작업 | 파일 |
|------|---------|------|
| 1. Frontend | 브랜드 선택 페이지 UI 구현 | `frontend/brand/` |
| 2. AI-로드뷰 | Gemini Vision API 연동 테스트 | `ai/roadview/visionAnalyzer.js` |
| 3. AI-판단 | Claude API 프롬프트 테스트 & 개선 | `ai/consulting/prompts.js` |
| 4. 계산 엔진 | 손익 계산식 구현 (Mock 데이터) | `engine/finance/calculator.js` |
| 5. 백엔드+통합 | Express 서버 실행 & 기본 라우트 설정 | `backend/server.js` |

### 5. 서버 실행 (역할 5)
```bash
node backend/server.js
# http://localhost:3000 에서 확인
```

### 6. 통합 테스트
1. 브라우저에서 `http://localhost:3000` 접속
2. 브랜드 선택
3. 지도에서 입지 핀 클릭
4. 조건 입력 (투자금, 월세, 평수, 점주 근무 여부, 목표 판매량)
5. 분석 실행 확인 (콘솔 로그 모니터링)
6. 결과 대시보드 확인

---

## 폴더 구조
```
StartSmart/
├── frontend/        # 역할 1: Frontend
│   ├── brand/       #   브랜드 선택
│   ├── input/       #   조건 입력
│   ├── dashboard/   #   결과 대시보드
│   └── report/      #   PDF 리포트
├── ai/
│   ├── roadview/    # 역할 2: AI-로드뷰
│   └── consulting/  # 역할 3: AI-판단
├── engine/          # 역할 4: 계산 엔진
│   ├── finance/     #   손익 계산
│   └── decision/    #   점수/신호등 판단
├── backend/         # 역할 5: 백엔드+통합
│   ├── routes/      #   API 라우트
│   ├── services/    #   오케스트레이터
│   └── market/      #   상권 분석
├── shared/           # 공용 인터페이스
└── docs/             # 문서
```

---

## 역할별 단독 테스트 방법

### Frontend (역할 1)
```bash
# 정적 HTML 파일로 먼저 구현
# 브라우저에서 직접 열어서 확인
open frontend/brand/index.html
# 또는 Live Server 사용
```

### AI-로드뷰 (역할 2)
```bash
# 단독 테스트 스크립트 실행
node ai/roadview/test.js
```

### AI-판단 (역할 3)
```bash
# 단독 테스트 스크립트 실행
node ai/consulting/test.js
```

### 계산 엔진 (역할 4)
```bash
# 단독 테스트 스크립트 실행
node engine/finance/test.js
```

### 백엔드+통합 (역할 5)
```bash
# 서버 실행
node backend/server.js

# 다른 터미널에서 API 테스트
curl http://localhost:3000/api/brands
```

---

## 보안 주의사항

### ⚠️ 필수 보안 체크리스트

1. **의존성 보안 점검**
   ```bash
   npm audit              # 보안 취약점 확인
   npm audit fix          # 자동 수정 가능한 취약점 해결
   ```

2. **환경변수 보안**
   - `.env` 파일은 절대 Git에 커밋하지 않기 (`.gitignore`에 포함됨)
   - API 키는 팀 채널에서만 공유 (공개 채팅 금지)
   - `.env.example`에는 실제 키 대신 `xxxxx` 플레이스홀더만 사용

3. **Node.js 보안 업데이트**
   - Node.js 24.x Current 사용 (최신 기능 및 보안 패치 포함)
   - 정기적으로 `npm audit` 실행하여 의존성 취약점 확인
   - [KISA 보호나라 보안공지](https://www.boho.or.kr/kr/bbs/view.do?bbsId=B0000133&pageIndex=1&nttId=71912&menuNo=205020) 참고

4. **의존성 버전 관리**
   - `package.json`의 `^` 버전은 최신 보안 패치 자동 적용
   - 해커톤 전날 `npm update` 실행 권장
   - 보안 취약점 발견 시 즉시 팀에 공유

5. **API 키 관리**
   - 각 담당자만 본인 API 키 관리
   - 키 유출 시 즉시 해당 서비스에서 키 재발급
   - 해커톤 종료 후 키 삭제 또는 비활성화 권장

### 현재 사용 중인 주요 의존성 보안 상태
- Express 4.18.2: 안정 버전 (정기 업데이트 필요)
- @anthropic-ai/sdk 0.24.0: 최신 버전 유지
- @google/generative-ai 0.21.0: 최신 버전 유지
- axios 1.6.2: 최신 버전 유지
- jspdf 2.5.1: 최신 버전 유지

---

## 문제 해결 가이드

### Node.js 버전 문제
```bash
# nvm이 설치되어 있지 않다면
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 24
nvm use 24
node -v  # v24.x.x 확인
```

### npm install 실패
```bash
# 캐시 클리어 후 재시도
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### API 키 오류
- `.env` 파일이 프로젝트 루트에 있는지 확인
- 키 앞뒤 공백 제거 확인
- 팀 채널에서 키 재확인

### 포트 3000 이미 사용 중
```bash
# 다른 포트 사용 (백엔드 담당자)
# .env 파일에서 PORT 변경
PORT=3001

# 또는 기존 프로세스 종료
lsof -ti:3000 | xargs kill -9  # Mac/Linux
```

### 모듈 import 오류
- `shared/interfaces.js` 형식 확인
- 각 모듈의 export 형식 확인
- 상대 경로 확인 (`../`, `../../`)

---

## 통합 테스트 체크리스트

### Phase 1: 기본 구조 (1일차)
- [ ] Express 서버 실행 성공
- [ ] 브랜드 목록 API 동작 확인
- [ ] 프론트엔드 기본 페이지 로드 확인

### Phase 2: 핵심 기능 (2일차)
- [ ] 손익 계산 엔진 정확성 확인
- [ ] AI-로드뷰 분석 결과 확인
- [ ] AI-판단 컨설팅 결과 확인
- [ ] 상권 분석 결과 확인

### Phase 3: 통합 (3일차)
- [ ] 전체 분석 파이프라인 동작 확인
- [ ] 프론트엔드-백엔드 연동 확인
- [ ] 결과 대시보드 표시 확인

### Phase 4: 완성도 (4일차)
- [ ] PDF 리포트 생성 확인
- [ ] 에러 처리 확인
- [ ] 데모 시나리오 완주 가능

---

## 팀원 간 협업 팁

### Git 작업 흐름
1. 작업 전: `git pull origin develop` (최신 코드 가져오기)
2. 작업 중: 본인 브랜치에서만 작업
3. 작업 후: `git add <본인폴더>/`, `git commit -m "[역할] 작업내용"`, `git push`
4. 통합: 백엔드 담당자가 develop 브랜치에 머지

### 인터페이스 변경 시
- `shared/interfaces.js` 수정 전 팀 전체 동의 필요
- 변경 후 모든 팀원에게 알림
- 각 모듈의 import 경로 확인

### 에러 발생 시
1. 콘솔 로그 확인
2. 해당 모듈 담당자에게 직접 연락
3. 해결되지 않으면 팀 채널에 공유

---

## 긴급 연락
- 막히면 즉시 팀 채널에 공유
- 다른 역할 폴더 수정 필요시 반드시 협의 먼저
- 보안 취약점 발견 시 즉시 팀에 공유
- API 키 유출 시 즉시 재발급 및 팀에 알림

---

## 추가 리소스

### 문서
- `docs/PRD.md` - 제품 요구사항 문서
- `docs/IA.md` - 정보 아키텍처
- `docs/TEAM_ROLES.md` - 팀 역할 분담
- `docs/TEAM_HARDWARE.md` - 하드웨어 사양 가이드
- 각 폴더의 `ROLE.md` - 역할별 상세 가이드

### 외부 문서
- [Node.js 공식 문서](https://nodejs.org/docs/)
- [Express 공식 문서](https://expressjs.com/)
- [Gemini API 문서](https://ai.google.dev/docs)
- [Claude API 문서](https://docs.anthropic.com/)

---

**Last Updated:** 2026-02-01
