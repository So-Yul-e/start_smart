# 에러 해결 가이드

**에러**: `Error: Cannot find module 'pg'`

---

## 🔍 에러 원인

1. **의존성 미설치**: `node_modules`에 `pg` 모듈이 없음
2. **잘못된 실행 위치**: `backend` 폴더에서 `npm start` 실행 시도
   - `package.json`은 **루트 폴더**에 있음
   - `node_modules`도 **루트 폴더**에 설치되어야 함

---

## ✅ 해결 방법

### 방법 1: 루트에서 의존성 설치 및 실행 (권장)

```powershell
# 1. 루트 폴더로 이동
cd C:\ai_fast_builderthon\start_smart

# 2. 의존성 설치 (처음 한 번만)
npm install

# 3. 서버 실행 (루트에서 실행)
npm start
```

또는:

```powershell
# 루트에서 직접 실행
node backend/server.js
```

### 방법 2: package.json 확인

`package.json`의 `scripts` 섹션을 보면:
```json
"scripts": {
  "start": "node backend/server.js"
}
```

이 스크립트는 **루트 폴더**에서 실행해야 합니다.

---

## 📋 배포 상태 확인

### 현재 상태

✅ **로컬 개발 환경** (배포 아님)
- `package.json`에 의존성 정의됨
- `pg` 모듈이 `dependencies`에 포함됨
- `node_modules` 폴더가 루트에 있어야 함

### 배포 관련 파일 확인

- ❌ 배포 스크립트 없음 (`.sh` 파일 없음)
- ❌ 배포 설정 파일 없음 (`deploy*` 파일 없음)
- ✅ 로컬 개발 환경으로 보임

**결론**: 다른 사람이 배포한 것이 아니라, **로컬 개발 환경 설정이 필요**합니다.

---

## 🚀 올바른 실행 절차

### 1. 의존성 설치 (처음 한 번만)

```powershell
# 루트 폴더에서
cd C:\ai_fast_builderthon\start_smart
npm install
```

**예상 출력**:
```
added 150 packages, and audited 151 packages in 30s
```

### 2. 환경변수 설정 확인

`.env` 파일이 루트에 있는지 확인:
```powershell
# .env 파일 확인 (있으면 내용 확인)
if (Test-Path .env) { Write-Host ".env 파일 존재" } else { Write-Host ".env 파일 없음 - 생성 필요" }
```

필요한 환경변수:
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_NAME=startsmart`
- `DB_USER=postgres`
- `DB_PASSWORD=postgres`
- `GEMINI_API_KEY=...`
- `ANTHROPIC_API_KEY=...`
- `KAKAO_REST_API_KEY=...` 또는 `GOOGLE_MAPS_API_KEY=...`

### 3. PostgreSQL 데이터베이스 확인

PostgreSQL이 설치되어 있고 실행 중인지 확인:
```powershell
# PostgreSQL 서비스 확인 (Windows)
Get-Service -Name postgresql*
```

데이터베이스가 없으면:
```powershell
# 데이터베이스 초기화
node backend/db/init.js
```

### 4. 서버 실행

```powershell
# 루트 폴더에서
npm start
```

또는:

```powershell
node backend/server.js
```

**예상 출력**:
```
✅ PostgreSQL 데이터베이스 연결 성공
서버가 http://localhost:3000 에서 실행 중입니다.
```

---

## 🔧 문제 해결 체크리스트

- [ ] 루트 폴더에서 `npm install` 실행
- [ ] `node_modules` 폴더가 루트에 생성되었는지 확인
- [ ] `node_modules/pg` 폴더가 존재하는지 확인
- [ ] `.env` 파일이 루트에 있는지 확인
- [ ] PostgreSQL이 설치되어 있고 실행 중인지 확인
- [ ] 루트 폴더에서 `npm start` 실행 (backend 폴더가 아님)

---

## 📝 참고

### 프로젝트 구조

```
start_smart/
├── package.json          ← 여기!
├── node_modules/         ← 여기에 설치됨
├── backend/
│   └── server.js         ← 실행할 파일
├── frontend/
└── ...
```

### 올바른 실행 위치

✅ **올바름**: 루트 폴더에서 `npm start`
❌ **잘못됨**: `backend` 폴더에서 `npm start`

---

**문서 버전**: 1.0  
**생성일**: 2025-01-15
