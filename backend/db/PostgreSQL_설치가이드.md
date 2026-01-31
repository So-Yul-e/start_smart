# PostgreSQL 설치 가이드 (macOS)

## 현재 상황
- `psql` 명령어를 찾을 수 없음
- PostgreSQL이 설치되지 않았거나 PATH에 없음

## 설치 방법

### 방법 1: Homebrew로 설치 (권장)

#### 1-1. Homebrew 설치 확인
```bash
which brew
```

#### 1-2. Homebrew가 없으면 설치
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 1-3. PostgreSQL 설치
```bash
# PostgreSQL 15 설치
brew install postgresql@15

# 또는 최신 버전
brew install postgresql
```

#### 1-4. PostgreSQL 서비스 시작
```bash
# PostgreSQL 15인 경우
brew services start postgresql@15

# 최신 버전인 경우
brew services start postgresql
```

#### 1-5. PATH 설정 (필요한 경우)
```bash
# PostgreSQL 15인 경우
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 또는 최신 버전인 경우
echo 'export PATH="/opt/homebrew/opt/postgresql/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 방법 2: PostgreSQL 공식 설치 프로그램 사용

1. https://www.postgresql.org/download/macosx/ 접속
2. **Postgres.app** 또는 **EnterpriseDB** 설치 프로그램 다운로드
3. 설치 후 PATH 설정

### 방법 3: Postgres.app 사용 (가장 간단)

1. https://postgresapp.com/ 접속
2. 다운로드 및 설치
3. 앱 실행 후 자동으로 PostgreSQL 시작
4. PATH 설정:
```bash
sudo mkdir -p /etc/paths.d &&
echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp
```

## 설치 확인

```bash
# psql 명령어 확인
which psql

# PostgreSQL 버전 확인
psql --version

# PostgreSQL 서비스 상태 확인
brew services list
```

## 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 또는 postgres 사용자로 접속
psql postgres
```

접속 후:
```sql
-- 데이터베이스 생성
CREATE DATABASE startsmart;

-- 비밀번호 설정 (선택사항)
ALTER USER postgres WITH PASSWORD 'postgres1234';

-- 종료
\q
```

## 문제 해결

### psql 명령어를 찾을 수 없는 경우
1. PostgreSQL이 설치되었는지 확인
2. PATH에 PostgreSQL bin 디렉토리가 포함되어 있는지 확인
3. 터미널 재시작 또는 `source ~/.zshrc` 실행

### 연결 오류가 발생하는 경우
1. PostgreSQL 서비스가 실행 중인지 확인: `brew services list`
2. 포트 확인: 기본값 5432
3. 사용자 권한 확인

## 다음 단계

PostgreSQL 설치 후:
1. 데이터베이스 생성: `CREATE DATABASE startsmart;`
2. 비밀번호 설정: `ALTER USER postgres WITH PASSWORD 'postgres1234';`
3. 스키마 생성: `node backend/db/init.js`
4. DBeaver 연결 테스트
