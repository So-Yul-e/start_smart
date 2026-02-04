# 서버 시작 체크리스트

**생성일**: 2025-01-15  
**목적**: 서버 실행 전 필수 확인 사항

---

## ✅ 사전 준비 체크리스트

### 1. 의존성 설치 확인

```powershell
# 루트 폴더에서
cd C:\ai_fast_builderthon\start_smart

# 의존성 설치 (처음 한 번만)
npm install

# 설치 확인
if (Test-Path node_modules\pg) { Write-Host "✅ pg 모듈 설치됨" }
```

**확인 사항**:
- [ ] `node_modules` 폴더가 루트에 생성됨
- [ ] `node_modules/pg` 폴더 존재
- [ ] `npm install` 에러 없음

---

### 2. 환경변수 설정 확인

`.env` 파일이 루트에 있는지 확인:

```powershell
# .env 파일 확인
if (Test-Path .env) { 
    Write-Host "✅ .env 파일 존재"
    Get-Content .env | Select-String "DB_HOST|GEMINI|ANTHROPIC|KAKAO|GOOGLE"
} else { 
    Write-Host "❌ .env 파일 없음"
}
```

**필수 환경변수**:
- [ ] `DB_HOST=localhost`
- [ ] `DB_PORT=5432`
- [ ] `DB_NAME=startsmart`
- [ ] `DB_USER=postgres`
- [ ] `DB_PASSWORD=postgres`
- [ ] `GEMINI_API_KEY=...` (AI 로드뷰 분석용)
- [ ] `ANTHROPIC_API_KEY=...` (AI 컨설팅용)
- [ ] `KAKAO_REST_API_KEY=...` 또는 `GOOGLE_MAPS_API_KEY=...` (지도 API용)

---

### 3. PostgreSQL 데이터베이스 확인

#### PostgreSQL 설치 확인

```powershell
# PostgreSQL 서비스 확인 (Windows)
Get-Service -Name postgresql*
```

**확인 사항**:
- [ ] PostgreSQL이 설치되어 있음
- [ ] PostgreSQL 서비스가 실행 중

#### 데이터베이스 생성 확인

```powershell
# PostgreSQL 접속 테스트
psql -U postgres -d startsmart -c "SELECT version();"
```

**데이터베이스가 없으면**:
```powershell
# 데이터베이스 초기화
node backend/db/init.js
```

**확인 사항**:
- [ ] `startsmart` 데이터베이스 존재
- [ ] `brands` 테이블 존재
- [ ] `analyses` 테이블 존재
- [ ] 브랜드 데이터 12개 삽입됨

---

### 4. Node.js 버전 확인

```powershell
node -v
```

**확인 사항**:
- [ ] Node.js 24.x 버전 (v24.0.0 이상)
- [ ] npm 10.0.0 이상

---

## 🚀 서버 실행

### 올바른 실행 방법

```powershell
# 루트 폴더에서 실행
cd C:\ai_fast_builderthon\start_smart
npm start
```

또는:

```powershell
node backend/server.js
```

### ❌ 잘못된 실행 방법

```powershell
# ❌ backend 폴더에서 실행하면 안 됨
cd backend
npm start  # 에러 발생!
```

---

## ✅ 서버 시작 성공 확인

서버가 정상적으로 시작되면 다음 메시지가 출력됩니다:

```
✅ PostgreSQL 데이터베이스 연결 성공
서버가 http://localhost:3000 에서 실행 중입니다.
```

**확인 사항**:
- [ ] PostgreSQL 연결 성공 메시지
- [ ] 서버 실행 메시지
- [ ] 에러 없음

---

## 🌐 브라우저 접속 확인

1. 브라우저에서 `http://localhost:3000` 접속
2. 메인 페이지가 표시되는지 확인

**확인 사항**:
- [ ] 메인 페이지 로드됨
- [ ] 브랜드 선택 페이지 접근 가능
- [ ] 에러 없음

---

## 🐛 문제 발생 시

### 에러 1: `Cannot find module 'pg'`

**원인**: 의존성 미설치

**해결**:
```powershell
cd C:\ai_fast_builderthon\start_smart
npm install
```

### 에러 2: `PostgreSQL 데이터베이스 연결 오류`

**원인**: PostgreSQL 미설치 또는 서비스 중지

**해결**:
1. PostgreSQL 설치 확인
2. PostgreSQL 서비스 시작
3. `.env` 파일의 DB 설정 확인

### 에러 3: `database "startsmart" does not exist`

**원인**: 데이터베이스 미생성

**해결**:
```powershell
node backend/db/init.js
```

---

## 📋 빠른 체크리스트

실행 전 확인:

- [ ] 루트 폴더에서 `npm install` 실행 완료
- [ ] `.env` 파일 존재 및 설정 완료
- [ ] PostgreSQL 설치 및 실행 중
- [ ] `startsmart` 데이터베이스 생성됨
- [ ] Node.js 24.x 버전 확인
- [ ] 루트 폴더에서 실행

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-15
