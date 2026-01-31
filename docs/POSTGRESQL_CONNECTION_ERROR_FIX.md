# PostgreSQL 연결 에러 해결 가이드

**에러**: `ECONNREFUSED` - PostgreSQL 서버에 연결할 수 없음

---

## 🔍 에러 원인 분석

### 확인된 문제점

1. **PostgreSQL 서비스가 실행되지 않음**
   - `Get-Service postgresql*` 결과: 서비스 없음
   - 포트 5432 연결 실패

2. **가능한 원인**:
   - PostgreSQL이 설치되지 않음
   - PostgreSQL 서비스가 중지됨
   - 다른 포트에서 실행 중
   - 방화벽 차단

---

## ✅ 해결 방법

### 1단계: PostgreSQL 설치 확인

#### Windows에서 PostgreSQL 설치 확인

```powershell
# PostgreSQL 설치 경로 확인
where.exe psql

# 또는
Get-Command psql -ErrorAction SilentlyContinue
```

**결과**:
- ✅ 경로가 나오면: PostgreSQL 설치됨
- ❌ 경로가 없으면: PostgreSQL 미설치

#### PostgreSQL 미설치인 경우

1. **PostgreSQL 다운로드 및 설치**
   - 공식 사이트: https://www.postgresql.org/download/windows/
   - 설치 시 포트: `5432` (기본값)
   - 비밀번호: `.env` 파일의 `DB_PASSWORD`와 동일하게 설정

2. **설치 후 확인**
   ```powershell
   # PostgreSQL 버전 확인
   psql --version
   ```

---

### 2단계: PostgreSQL 서비스 시작

#### Windows 서비스 확인 및 시작

```powershell
# PostgreSQL 서비스 확인
Get-Service -Name postgresql* | Select-Object Name, Status, DisplayName

# 서비스가 있으면 시작
Start-Service -Name postgresql-x64-*  # 버전에 따라 이름이 다를 수 있음
```

**서비스 이름 확인 방법**:
```powershell
# 모든 PostgreSQL 관련 서비스 찾기
Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"}
```

#### 수동으로 PostgreSQL 시작 (서비스가 없는 경우)

```powershell
# PostgreSQL 설치 경로로 이동 (기본 경로)
cd "C:\Program Files\PostgreSQL\15\bin"

# PostgreSQL 서버 시작
.\pg_ctl.exe -D "C:\Program Files\PostgreSQL\15\data" start
```

---

### 3단계: 데이터베이스 생성 확인

#### PostgreSQL 접속 테스트

```powershell
# psql로 접속 시도
psql -U postgres -h localhost -p 5432
```

**성공하면**:
```
postgres=#
```

**실패하면**:
- 비밀번호 확인 필요
- 또는 PostgreSQL이 실행되지 않음

#### 데이터베이스 생성

```sql
-- PostgreSQL 접속 후 실행
CREATE DATABASE startsmart;

-- 데이터베이스 목록 확인
\l

-- 종료
\q
```

---

### 4단계: 환경변수 확인

`.env` 파일 확인:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=startsmart
DB_USER=postgres
DB_PASSWORD=postgres1234  # 실제 비밀번호와 일치해야 함
```

**중요**: `.env`의 `DB_PASSWORD`가 PostgreSQL 설치 시 설정한 비밀번호와 일치해야 합니다.

---

### 5단계: 데이터베이스 초기화

```powershell
# 루트 폴더에서
node backend/db/init.js
```

이 명령어는:
- 테이블 생성 (brands, analyses)
- 브랜드 데이터 12개 삽입
- 인덱스 생성

---

## 🔧 문제 해결 체크리스트

### PostgreSQL 설치 확인
- [ ] `psql --version` 명령어 실행 가능
- [ ] PostgreSQL 설치 경로 존재

### PostgreSQL 서비스 확인
- [ ] PostgreSQL 서비스가 실행 중
- [ ] 포트 5432가 열려 있음

### 데이터베이스 확인
- [ ] `startsmart` 데이터베이스 존재
- [ ] `postgres` 사용자로 접속 가능
- [ ] 비밀번호가 `.env`와 일치

### 환경변수 확인
- [ ] `.env` 파일에 DB 설정 있음
- [ ] `DB_PASSWORD`가 실제 비밀번호와 일치

### 연결 테스트
- [ ] `psql -U postgres -d startsmart` 접속 성공
- [ ] `node backend/db/init.js` 실행 성공

---

## 🚀 빠른 해결 방법

### 시나리오 1: PostgreSQL 미설치

1. **PostgreSQL 설치**
   - https://www.postgresql.org/download/windows/
   - 설치 시 비밀번호: `postgres1234` (또는 원하는 비밀번호)
   - 포트: `5432` (기본값)

2. **`.env` 파일 수정**
   ```bash
   DB_PASSWORD=postgres1234  # 설치 시 설정한 비밀번호
   ```

3. **데이터베이스 생성**
   ```powershell
   psql -U postgres
   CREATE DATABASE startsmart;
   \q
   ```

4. **데이터베이스 초기화**
   ```powershell
   node backend/db/init.js
   ```

### 시나리오 2: PostgreSQL 설치됨, 서비스 중지

1. **서비스 시작**
   ```powershell
   # 서비스 이름 확인
   Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"}
   
   # 서비스 시작
   Start-Service -Name <서비스이름>
   ```

2. **연결 테스트**
   ```powershell
   psql -U postgres -d startsmart
   ```

### 시나리오 3: 비밀번호 불일치

1. **`.env` 파일의 비밀번호 확인**
   ```bash
   DB_PASSWORD=postgres1234  # 실제 비밀번호로 변경
   ```

2. **또는 PostgreSQL 비밀번호 변경**
   ```sql
   -- psql 접속 후
   ALTER USER postgres WITH PASSWORD 'postgres1234';
   ```

---

## 📋 연결 테스트 스크립트

```powershell
# PostgreSQL 연결 테스트
Write-Host "=== PostgreSQL 연결 테스트 ===" -ForegroundColor Cyan

# 1. PostgreSQL 설치 확인
Write-Host "`n1. PostgreSQL 설치 확인..." -ForegroundColor Yellow
$psqlPath = where.exe psql 2>$null
if ($psqlPath) {
    Write-Host "✅ PostgreSQL 설치됨: $psqlPath" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL 미설치" -ForegroundColor Red
    Write-Host "   다운로드: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit
}

# 2. 서비스 확인
Write-Host "`n2. PostgreSQL 서비스 확인..." -ForegroundColor Yellow
$service = Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"} | Select-Object -First 1
if ($service) {
    Write-Host "✅ 서비스 발견: $($service.DisplayName)" -ForegroundColor Green
    if ($service.Status -eq 'Running') {
        Write-Host "✅ 서비스 실행 중" -ForegroundColor Green
    } else {
        Write-Host "⚠️  서비스 중지됨 - 시작 필요" -ForegroundColor Yellow
        Write-Host "   명령어: Start-Service -Name $($service.Name)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  PostgreSQL 서비스를 찾을 수 없음" -ForegroundColor Yellow
}

# 3. 포트 확인
Write-Host "`n3. 포트 5432 확인..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($portTest) {
    Write-Host "✅ 포트 5432 열려 있음" -ForegroundColor Green
} else {
    Write-Host "❌ 포트 5432 연결 실패" -ForegroundColor Red
    Write-Host "   PostgreSQL 서비스가 실행되지 않았을 수 있음" -ForegroundColor Yellow
}

# 4. .env 파일 확인
Write-Host "`n4. .env 파일 확인..." -ForegroundColor Yellow
if (Test-Path .env) {
    $dbHost = (Get-Content .env | Select-String "DB_HOST=").ToString().Split('=')[1]
    $dbPort = (Get-Content .env | Select-String "DB_PORT=").ToString().Split('=')[1]
    $dbName = (Get-Content .env | Select-String "DB_NAME=").ToString().Split('=')[1]
    $dbUser = (Get-Content .env | Select-String "DB_USER=").ToString().Split('=')[1]
    Write-Host "✅ .env 파일 존재" -ForegroundColor Green
    Write-Host "   Host: $dbHost" -ForegroundColor Gray
    Write-Host "   Port: $dbPort" -ForegroundColor Gray
    Write-Host "   Database: $dbName" -ForegroundColor Gray
    Write-Host "   User: $dbUser" -ForegroundColor Gray
} else {
    Write-Host "❌ .env 파일 없음" -ForegroundColor Red
}

Write-Host "`n=== 테스트 완료 ===" -ForegroundColor Cyan
```

---

## 📝 참고 문서

- `backend/db/README.md` - 데이터베이스 설정 가이드
- `backend/db/PostgreSQL_설치가이드.md` - PostgreSQL 설치 가이드
- `backend/db/DBeaver_연결가이드.md` - DBeaver 연결 가이드

---

**문서 버전**: 1.0  
**생성일**: 2025-01-15
