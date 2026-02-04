# 데이터베이스 연결 문제 해결 가이드

## 다른 컴퓨터에서 연결이 안 될 때

### 1. 환경 변수 확인

다른 컴퓨터에서 `.env` 파일이 제대로 설정되어 있는지 확인하세요.

#### 클라우드 DB (Supabase) 사용 시

`.env` 파일에 다음이 있어야 합니다:

```bash
DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
```

**확인 사항:**
- ✅ `[PASSWORD]`가 실제 Supabase 비밀번호로 교체되었는지
- ✅ 연결 문자열에 `?sslmode=require`가 포함되어 있는지
- ✅ Session Pooler (포트 6543) 사용 중인지

#### 로컬 DB 사용 시

`.env` 파일에 다음이 있어야 합니다:

```bash
# DATABASE_URL은 주석 처리 또는 삭제
# DATABASE_URL=...

DB_HOST=localhost
DB_PORT=5432
DB_NAME=startsmart
DB_USER=postgres
DB_PASSWORD=postgres
```

**확인 사항:**
- ✅ PostgreSQL이 설치되어 있고 실행 중인지
- ✅ `DB_PASSWORD`가 실제 PostgreSQL 비밀번호와 일치하는지
- ✅ `startsmart` 데이터베이스가 생성되어 있는지

---

### 2. 연결 문자열 형식 확인

#### 올바른 Supabase 연결 문자열 형식

**Session Pooler (권장 - IPv4 호환):**
```
postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
```

**Direct Connection (IPv6만 지원):**
```
postgresql://postgres:[PASSWORD]@db.oetxnpgfsmmxcgnelhvd.supabase.co:5432/postgres?sslmode=require
```

**차이점:**
- Session Pooler: 사용자명에 프로젝트 ID 포함 (`postgres.oetxnpgfsmmxcgnelhvd`)
- Session Pooler: 호스트가 `pooler.supabase.com`
- Session Pooler: 포트 6543 사용
- Direct: 사용자명은 `postgres`만
- Direct: 호스트가 `db.[PROJECT].supabase.co`
- Direct: 포트 5432 사용

---

### 3. SSL 설정 확인

Supabase는 **SSL 연결이 필수**입니다.

`backend/db/connection.js`가 자동으로 Supabase 연결 시 SSL을 활성화하지만, 연결 문자열에 `sslmode=require`를 명시하는 것을 권장합니다.

---

### 4. 연결 테스트

#### 방법 1: 서버 로그 확인

```bash
npm start
```

**성공 시:**
```
📦 클라우드 데이터베이스 연결 설정 (DATABASE_URL 사용)
🔒 Supabase SSL 연결 활성화
✅ PostgreSQL 데이터베이스 연결 성공
```

**실패 시:**
```
❌ PostgreSQL 데이터베이스 연결 오류: ...
```

#### 방법 2: psql로 직접 테스트

```bash
# Supabase 연결 테스트
psql "postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require"
```

연결이 성공하면 `postgres=#` 프롬프트가 나타납니다.

#### 방법 3: API 테스트

```bash
# 브랜드 목록 조회
curl http://localhost:3000/api/brands
```

성공하면 JSON 데이터가 반환됩니다.

---

### 5. 일반적인 오류 및 해결 방법

#### 오류 1: "could not translate host name"

**원인:** IPv4/IPv6 호환성 문제 또는 잘못된 호스트명

**해결:**
- Session Pooler 사용 (포트 6543)
- 연결 문자열의 호스트명 확인

#### 오류 2: "password authentication failed"

**원인:** 비밀번호가 잘못됨

**해결:**
1. Supabase 대시보드 → Settings → Database
2. 비밀번호 확인 또는 재설정
3. `.env` 파일의 `[PASSWORD]` 부분 업데이트

#### 오류 3: "connection timeout"

**원인:** 네트워크 문제 또는 방화벽

**해결:**
- 인터넷 연결 확인
- 방화벽에서 포트 6543 (Session Pooler) 또는 5432 (Direct) 허용 확인

#### 오류 4: "SSL connection required"

**원인:** SSL 설정 누락

**해결:**
- 연결 문자열에 `?sslmode=require` 추가
- `backend/db/connection.js`가 자동으로 SSL을 활성화하지만, 명시적으로 추가하는 것을 권장

#### 오류 5: "database does not exist"

**원인:** 로컬 DB 사용 시 데이터베이스가 생성되지 않음

**해결:**
```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE startsmart;

# 종료
\q
```

---

### 6. 다른 컴퓨터에서 설정하는 방법

#### 단계 1: 프로젝트 클론

```bash
git clone [repository-url]
cd StartSmart
npm install
```

#### 단계 2: .env 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 중 하나를 추가:

**옵션 A: 클라우드 DB (Supabase) 사용**
```bash
DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
```

**옵션 B: 로컬 DB 사용**
```bash
# DATABASE_URL 주석 처리
# DATABASE_URL=...

DB_HOST=localhost
DB_PORT=5432
DB_NAME=startsmart
DB_USER=postgres
DB_PASSWORD=postgres
```

#### 단계 3: 서버 실행 및 테스트

```bash
npm start
```

서버 로그에서 연결 성공 메시지 확인:
```
✅ PostgreSQL 데이터베이스 연결 성공
```

---

### 7. 체크리스트

다른 컴퓨터에서 연결이 안 될 때 확인할 항목:

- [ ] `.env` 파일이 프로젝트 루트에 있는가?
- [ ] `DATABASE_URL` 또는 로컬 DB 환경변수가 설정되어 있는가?
- [ ] Supabase 사용 시 비밀번호가 올바른가?
- [ ] 연결 문자열에 `?sslmode=require`가 포함되어 있는가?
- [ ] Session Pooler (포트 6543)를 사용하고 있는가?
- [ ] 로컬 DB 사용 시 PostgreSQL이 설치되어 있고 실행 중인가?
- [ ] 로컬 DB 사용 시 `startsmart` 데이터베이스가 생성되어 있는가?
- [ ] 인터넷 연결이 정상인가?
- [ ] 방화벽에서 포트가 차단되지 않았는가?

---

### 8. 빠른 진단 명령어

```bash
# .env 파일 확인 (DATABASE_URL 또는 DB_HOST 확인)
cat .env | grep -E "DATABASE_URL|DB_HOST|DB_PASSWORD"

# 서버 실행 및 연결 테스트
npm start

# API 테스트
curl http://localhost:3000/api/brands
```

---

**작성일**: 2025-01-31  
**버전**: 1.0
