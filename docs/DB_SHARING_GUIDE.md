# 데이터베이스 공유 가이드

다른 노트북에서 현재 DB 데이터를 테스트하는 방법입니다.

## 📋 방법 비교

| 방법 | 장점 | 단점 | 권장도 |
|------|------|------|--------|
| **DB 덤프 내보내기/가져오기** | ✅ 안전<br>✅ 간단<br>✅ 오프라인 가능 | ⚠️ 수동 작업 필요 | ⭐⭐⭐⭐⭐ |
| **네트워크 직접 접근** | ✅ 실시간 동기화 | ❌ 보안 위험<br>❌ 복잡한 설정<br>❌ 같은 네트워크 필요 | ⭐⭐ |
| **클라우드 DB 사용** | ✅ 어디서나 접근<br>✅ 자동 백업 | ⚠️ 인터넷 필요<br>⚠️ 비용 발생 가능 | ⭐⭐⭐⭐ |

## 🚀 방법 1: DB 덤프 내보내기/가져오기 (권장)

### 현재 노트북 (데이터 내보내기)

#### 1단계: 덤프 파일 생성
```bash
# 프로젝트 루트에서 실행
node backend/db/export-db.js
```

이 명령어는 `backend/db/dump.sql` 파일을 생성합니다.

#### 2단계: 덤프 파일 복사
- `backend/db/dump.sql` 파일을 USB, 클라우드 스토리지, 또는 Git에 업로드
- 또는 다른 노트북으로 직접 전송

### 다른 노트북 (데이터 가져오기)

#### 1단계: PostgreSQL 설치
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Linux
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# PostgreSQL 공식 사이트에서 설치
```

#### 2단계: 데이터베이스 생성
```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE startsmart;

# 종료
\q
```

#### 3단계: 환경변수 설정
`.env` 파일에 다음 내용 추가:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=startsmart
DB_USER=postgres
DB_PASSWORD=postgres
```

#### 4단계: 덤프 파일 가져오기
```bash
# dump.sql 파일을 backend/db/ 폴더에 복사한 후
node backend/db/import-db.js
```

#### 5단계: 확인
```bash
# 서버 실행
npm start

# 브랜드 목록 확인
curl http://localhost:3000/api/brands
```

---

## 🌐 방법 2: 네트워크 직접 접근 (비권장)

⚠️ **보안 경고**: 이 방법은 보안 위험이 있으므로 개발 환경에서만 사용하세요.

### 현재 노트북 (DB 서버)

#### 1단계: PostgreSQL 설정 파일 수정
```bash
# PostgreSQL 설정 파일 위치 확인
# macOS: /opt/homebrew/var/postgresql@15/postgresql.conf
# Linux: /etc/postgresql/15/main/postgresql.conf

# listen_addresses 수정
listen_addresses = '*'  # 또는 특정 IP
```

#### 2단계: pg_hba.conf 수정
```bash
# pg_hba.conf 파일 수정
# macOS: /opt/homebrew/var/postgresql@15/pg_hba.conf
# Linux: /etc/postgresql/15/main/pg_hba.conf

# 추가
host    all    all    0.0.0.0/0    md5
```

#### 3단계: PostgreSQL 재시작
```bash
# macOS
brew services restart postgresql@15

# Linux
sudo systemctl restart postgresql
```

#### 4단계: 방화벽 포트 열기
```bash
# macOS
sudo pfctl -f /etc/pf.conf

# Linux
sudo ufw allow 5432/tcp
```

### 다른 노트북 (DB 클라이언트)

`.env` 파일 수정:
```bash
DB_HOST=<현재_노트북_IP주소>
DB_PORT=5432
DB_NAME=startsmart
DB_USER=postgres
DB_PASSWORD=postgres
```

---

## ☁️ 방법 3: 클라우드 DB 사용 (장기적 권장)

### Supabase 사용 (무료)

#### 1단계: Supabase 프로젝트 생성
1. [Supabase](https://supabase.com) 가입
2. 새 프로젝트 생성
3. **Settings** → **Database** → **Connection string** 복사

#### 2단계: 로컬 DB 데이터 업로드
```bash
# 로컬 DB 덤프 생성
node backend/db/export-db.js

# Supabase에 업로드
PGPASSWORD="<supabase_password>" psql -h <supabase_host> -U postgres -d postgres -f backend/db/dump.sql
```

#### 3단계: 환경변수 설정
`.env` 파일:
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

#### 4단계: 다른 노트북에서 사용
- 같은 `DATABASE_URL` 사용
- 어디서나 같은 데이터 접근 가능

---

## 🔧 문제 해결

### 덤프 파일이 너무 큼
```bash
# 압축하여 전송
gzip backend/db/dump.sql
# 전송 후
gunzip backend/db/dump.sql.gz
```

### psql 명령어를 찾을 수 없음
```bash
# macOS
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

# Linux
export PATH="/usr/lib/postgresql/15/bin:$PATH"
```

### 권한 오류
```bash
# PostgreSQL 사용자 권한 확인
psql -U postgres -c "\du"

# 권한 부여
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE startsmart TO postgres;"
```

---

## 📝 체크리스트

### 현재 노트북
- [ ] `node backend/db/export-db.js` 실행
- [ ] `backend/db/dump.sql` 파일 확인
- [ ] 덤프 파일을 다른 노트북으로 전송

### 다른 노트북
- [ ] PostgreSQL 설치
- [ ] 데이터베이스 생성 (`CREATE DATABASE startsmart;`)
- [ ] `.env` 파일 설정
- [ ] `dump.sql` 파일을 `backend/db/` 폴더에 복사
- [ ] `node backend/db/import-db.js` 실행
- [ ] 서버 실행 및 테스트

---

## 💡 팁

1. **정기적인 백업**: 중요한 데이터는 정기적으로 덤프 파일로 백업
2. **Git에 업로드 금지**: `dump.sql` 파일은 `.gitignore`에 포함 (민감한 데이터 포함 가능)
3. **클라우드 스토리지 사용**: Google Drive, Dropbox 등으로 덤프 파일 공유
4. **압축 사용**: 큰 덤프 파일은 압축하여 전송 시간 단축
