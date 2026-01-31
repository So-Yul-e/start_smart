# 클라우드 DB 설정 가이드

로컬 DB 데이터를 클라우드 DB로 업로드하여 다른 노트북에서도 사용할 수 있도록 설정합니다.

## 🎯 목표

- 로컬 DB 데이터를 클라우드 DB로 업로드
- 다른 노트북에서 같은 클라우드 DB 사용
- Vercel 배포 시에도 같은 DB 사용

## ☁️ 클라우드 DB 옵션

### 1. Supabase (권장) ⭐

**장점:**
- 무료 플랜: 500MB 데이터베이스
- PostgreSQL 완전 호환
- 자동 백업
- 실시간 기능 제공
- 쉬운 설정

**단점:**
- 무료 플랜은 제한적 (프로젝트당 2개)

**설정 방법:**
1. [Supabase](https://supabase.com) 가입
2. 새 프로젝트 생성
3. **Settings** → **Database** → **Connection string** 복사
   - 형식: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - 또는 **Connection pooling** 탭에서 **Session mode** 연결 문자열 사용

### 2. Vercel Postgres

**장점:**
- Vercel과 완벽 통합
- 자동 환경변수 설정
- 무료 플랜: 512MB

**단점:**
- Vercel 프로젝트에 연결되어야 함
- Vercel 대시보드에서만 관리

**설정 방법:**
1. Vercel 대시보드 → 프로젝트 선택
2. **Storage** 탭 → **Create Database** → **Postgres**
3. 자동으로 `DATABASE_URL` 환경변수 설정됨

### 3. Neon

**장점:**
- 서버리스 PostgreSQL
- 무료 플랜: 0.5GB
- 자동 스케일링

**단점:**
- 설정이 약간 복잡할 수 있음

**설정 방법:**
1. [Neon](https://neon.tech) 가입
2. 새 프로젝트 생성
3. **Connection Details**에서 연결 문자열 복사

## 🚀 Supabase 설정 (단계별)

### 1단계: Supabase 프로젝트 생성

1. https://supabase.com 접속
2. **Start your project** 클릭
3. GitHub 계정으로 로그인 (또는 이메일)
4. **New Project** 클릭
5. 프로젝트 정보 입력:
   - **Name**: `startsmart` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (저장 필수!)
   - **Region**: 가장 가까운 지역 선택
6. **Create new project** 클릭
7. 프로젝트 생성 완료까지 1-2분 대기

### 2단계: 연결 문자열 복사

1. Supabase 대시보드 → **Settings** (왼쪽 메뉴)
2. **Database** 클릭
3. **Connection string** 섹션에서:
   - **URI** 탭 선택
   - 연결 문자열 복사
   - 형식: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - 또는 **Session mode** 사용 (권장)

### 3단계: 로컬 DB 업로드

#### 3-1. .env 파일에 클라우드 DB 연결 정보 추가

```bash
# 로컬 DB (기존)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=startsmart
DB_USER=postgres
DB_PASSWORD=postgres

# 클라우드 DB (Supabase)
CLOUD_DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

⚠️ **주의**: `[PASSWORD]` 부분을 실제 비밀번호로 교체하세요!

#### 3-2. 업로드 스크립트 실행

```bash
node backend/db/upload-to-cloud.js
```

이 스크립트는:
1. 로컬 DB에서 덤프 생성
2. 클라우드 DB에 업로드
3. 임시 덤프 파일 삭제

#### 3-3. 업로드 확인

Supabase 대시보드 → **Table Editor**에서:
- `brands` 테이블 확인
- `analyses` 테이블 확인
- 데이터가 올바르게 업로드되었는지 확인

### 4단계: 다른 노트북에서 사용

#### 4-1. .env 파일 설정

```bash
# 클라우드 DB 사용
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

또는 개별 환경변수 대신 `DATABASE_URL`만 사용하면 됩니다.

#### 4-2. 서버 실행 및 테스트

```bash
npm start

# 브랜드 목록 확인
curl http://localhost:3000/api/brands
```

## 🔄 로컬과 클라우드 DB 전환

### 로컬 DB 사용
```bash
# .env 파일
DB_HOST=localhost
DB_PORT=5432
DB_NAME=startsmart
DB_USER=postgres
DB_PASSWORD=postgres

# DATABASE_URL은 주석 처리 또는 삭제
# DATABASE_URL=...
```

### 클라우드 DB 사용
```bash
# .env 파일
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# 로컬 DB 환경변수는 주석 처리
# DB_HOST=localhost
# DB_PORT=5432
# ...
```

`backend/db/connection.js`가 자동으로 `DATABASE_URL`을 우선 사용합니다.

## 📊 데이터 동기화

### 로컬 → 클라우드 업로드
```bash
node backend/db/upload-to-cloud.js
```

### 클라우드 → 로컬 다운로드 (필요한 경우)
```bash
# Supabase에서 덤프 다운로드 (Supabase 대시보드에서 제공)
# 또는
PGPASSWORD="[PASSWORD]" pg_dump -h [HOST] -U postgres -d postgres > dump.sql
node backend/db/import-db.js
```

## ⚠️ 주의사항

### 1. 비밀번호 보안
- `.env` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.env`가 포함되어 있는지 확인
- 클라우드 DB 비밀번호는 안전하게 보관

### 2. 연결 풀링
- Supabase는 **Connection pooling**을 제공
- 많은 동시 연결이 필요한 경우 **Session mode** 사용
- `pooler.supabase.com:6543` 포트 사용 (포트 5432 아님)

### 3. SSL 연결
- Supabase는 SSL 연결 필수
- `connection.js`에서 자동으로 SSL 설정됨

### 4. 무료 플랜 제한
- Supabase: 500MB 데이터베이스
- Vercel Postgres: 512MB
- 데이터가 많으면 유료 플랜 필요

## 🔧 문제 해결

### 연결 실패
```bash
# 연결 테스트
psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# 또는
PGPASSWORD="[PASSWORD]" psql -h aws-0-[REGION].pooler.supabase.com -p 6543 -U postgres.[PROJECT_REF] -d postgres
```

### 권한 오류
- Supabase는 기본적으로 모든 권한이 부여되어 있음
- 테이블이 없다면 업로드 스크립트 재실행

### 타임아웃
- Supabase 무료 플랜은 연결 제한이 있음
- 연결 풀링 사용 (포트 6543)
- 또는 Session mode 사용

## 📝 체크리스트

### 현재 노트북
- [ ] Supabase 프로젝트 생성
- [ ] 연결 문자열 복사
- [ ] `.env`에 `CLOUD_DATABASE_URL` 추가
- [ ] `node backend/db/upload-to-cloud.js` 실행
- [ ] Supabase 대시보드에서 데이터 확인

### 다른 노트북
- [ ] `.env`에 `DATABASE_URL` 설정
- [ ] 서버 실행: `npm start`
- [ ] API 테스트: `curl http://localhost:3000/api/brands`

## 💡 팁

1. **개발 환경**: 로컬 DB 사용 (빠름)
2. **테스트 환경**: 클라우드 DB 사용 (공유 용이)
3. **프로덕션**: 클라우드 DB 사용 (안정성)

---

## 🎉 완료!

이제 다른 노트북에서도 같은 클라우드 DB를 사용할 수 있습니다!
