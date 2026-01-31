# PostgreSQL 연결 에러 빠른 해결

**에러**: `ECONNREFUSED` - PostgreSQL 서버에 연결할 수 없음

---

## 🔍 원인

PostgreSQL 서비스가 실행되지 않았거나, PostgreSQL이 설치되지 않았습니다.

---

## ✅ 빠른 해결 (3단계)

### 1단계: PostgreSQL 설치 확인

```powershell
psql --version
```

**결과**:
- ✅ 버전이 나오면: 설치됨 → 2단계로
- ❌ 에러가 나오면: 미설치 → PostgreSQL 설치 필요

**PostgreSQL 설치**:
- 다운로드: https://www.postgresql.org/download/windows/
- 설치 시 비밀번호: `postgres1234` (또는 원하는 비밀번호)
- 포트: `5432` (기본값)

---

### 2단계: PostgreSQL 서비스 시작

```powershell
# 서비스 찾기
Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"}

# 서비스 시작 (서비스 이름은 버전에 따라 다름)
Start-Service -Name postgresql-x64-15  # 예시
```

**서비스 이름 확인**:
```powershell
Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"} | Select-Object Name, Status
```

---

### 3단계: 데이터베이스 생성 및 초기화

```powershell
# 1. PostgreSQL 접속
psql -U postgres

# 2. 데이터베이스 생성 (psql 프롬프트에서)
CREATE DATABASE startsmart;
\q

# 3. 데이터베이스 초기화 (루트 폴더에서)
node backend/db/init.js
```

---

## 🔧 .env 파일 확인

`.env` 파일의 비밀번호가 PostgreSQL 설치 시 설정한 비밀번호와 일치해야 합니다:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=startsmart
DB_USER=postgres
DB_PASSWORD=postgres1234  # ← 실제 비밀번호와 일치해야 함
```

---

## ✅ 체크리스트

- [ ] PostgreSQL 설치됨 (`psql --version` 성공)
- [ ] PostgreSQL 서비스 실행 중
- [ ] 포트 5432 열려 있음
- [ ] `startsmart` 데이터베이스 생성됨
- [ ] `.env` 파일의 비밀번호가 실제 비밀번호와 일치
- [ ] `node backend/db/init.js` 실행 성공

---

## 🚀 한 번에 실행

```powershell
# 1. PostgreSQL 서비스 시작
Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"} | Start-Service

# 2. 데이터베이스 초기화 (이미 생성되어 있으면 스킵)
node backend/db/init.js

# 3. 서버 실행
npm start
```

---

**문서 버전**: 1.0  
**생성일**: 2025-01-15
