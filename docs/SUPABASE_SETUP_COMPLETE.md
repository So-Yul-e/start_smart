# ✅ Supabase DB 설정 완료 가이드

## 📋 현재 상태
- ✅ Supabase 프로젝트 생성 완료
- ✅ 로컬 DB 데이터 업로드 완료
- ✅ `brands` 테이블: 12개 행
- ✅ `analyses` 테이블: 66개 행

## 🔧 애플리케이션 설정

### 1. `.env` 파일에 Supabase 연결 문자열 추가

`.env` 파일을 열고 다음 중 하나를 추가하세요:

#### 옵션 A: Session Pooler (권장 - IPv4 호환)
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
```

#### 옵션 B: Direct Connection
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.oetxnpgfsmmxcgnelhvd.supabase.co:5432/postgres?sslmode=require
```

**⚠️ 중요:**
- `[YOUR-PASSWORD]`를 실제 Supabase 데이터베이스 비밀번호로 교체하세요
- 비밀번호에 특수문자가 있으면 URL 인코딩이 필요할 수 있습니다
- Session Pooler (포트 6543) 사용을 권장합니다 (IPv4 호환성)

### 2. Supabase 연결 문자열 확인 방법

1. Supabase 대시보드 접속:
   - https://supabase.com/dashboard/project/oetxnpgfsmmxcgnelhvd
   - 왼쪽 메뉴 → **Settings** → **Database** 클릭

2. **Connection string** 섹션에서:
   - **Session mode** (포트 6543) 또는 **Direct connection** (포트 5432) 선택
   - 연결 문자열 복사
   - `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 교체

### 3. 서버 재시작 및 연결 확인

```bash
# 서버 재시작
npm start
```

서버 시작 시 다음 메시지가 보이면 성공:
```
📦 클라우드 데이터베이스 연결 설정 (DATABASE_URL 사용)
✅ PostgreSQL 데이터베이스 연결 성공
```

### 4. 데이터 확인

```bash
# 브랜드 목록 확인
curl http://localhost:3000/api/brands

# 분석 결과 확인 (예시)
curl http://localhost:3000/api/result/analysis_1769865908980_q20opg7yt
```

## 🔄 로컬 DB와 클라우드 DB 전환

### 클라우드 DB 사용 (현재)
```bash
# .env 파일에 DATABASE_URL 설정
DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
```

### 로컬 DB 사용
```bash
# .env 파일에서 DATABASE_URL 주석 처리 또는 삭제
# DATABASE_URL=...

# 로컬 DB 환경변수 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=startsmart
DB_USER=postgres
DB_PASSWORD=postgres
```

## 🚀 다른 노트북에서 사용

다른 노트북에서도 같은 Supabase DB를 사용하려면:

1. 프로젝트 클론:
   ```bash
   git clone [repository-url]
   cd StartSmart
   npm install
   ```

2. `.env` 파일 생성 및 `DATABASE_URL` 설정:
   ```bash
   DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
   ```

3. 서버 실행:
   ```bash
   npm start
   ```

4. 완료! 이제 같은 데이터베이스를 공유합니다.

## 🔒 보안 주의사항

- ⚠️ `.env` 파일은 절대 Git에 커밋하지 마세요
- ⚠️ 비밀번호는 안전하게 보관하세요
- ⚠️ 프로덕션에서는 환경변수로 관리하세요
- ⚠️ `.gitignore`에 `.env`가 포함되어 있는지 확인하세요

## ❓ 문제 해결

### 연결 실패 시

1. **비밀번호 확인:**
   - Supabase 대시보드 → Settings → Database
   - 비밀번호 재설정 가능

2. **연결 문자열 형식 확인:**
   - `postgresql://`로 시작해야 함
   - `sslmode=require` 포함 확인
   - `[YOUR-PASSWORD]` 부분이 실제 비밀번호로 교체되었는지 확인

3. **Session Pooler vs Direct:**
   - IPv4 네트워크에서는 Session Pooler (포트 6543) 사용 권장
   - Direct connection (포트 5432)은 IPv6만 지원할 수 있음

4. **서버 로그 확인:**
   ```bash
   npm start
   # 다음 메시지 확인:
   # ✅ PostgreSQL 데이터베이스 연결 성공
   # 또는
   # ❌ PostgreSQL 데이터베이스 연결 오류: ...
   ```

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 연결 문자열 형식](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
