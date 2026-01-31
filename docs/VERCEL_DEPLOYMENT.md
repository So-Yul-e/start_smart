# Vercel 배포 가이드

## 📋 개요

Vercel은 서버리스 플랫폼이므로 **로컬 DB를 직접 사용할 수 없습니다**. 대신 클라우드 DB 서비스를 사용해야 합니다.

## 🔧 DB 옵션

### 옵션 1: Vercel Postgres (권장)
- Vercel과 완벽하게 통합
- 무료 플랜 제공 (512MB 스토리지)
- 자동 백업 및 스케일링

### 옵션 2: Supabase (무료 플랜 제공)
- PostgreSQL 호환
- 무료 플랜: 500MB 데이터베이스
- 자동 백업 및 실시간 기능

### 옵션 3: Neon (무료 플랜 제공)
- 서버리스 PostgreSQL
- 무료 플랜: 0.5GB 스토리지
- 자동 스케일링

### 옵션 4: Railway / Render
- PostgreSQL 인스턴스 제공
- 무료 플랜 제한적

## 🚀 배포 단계

### 1. Vercel Postgres 설정 (권장)

#### 1-1. Vercel 대시보드에서 Postgres 생성
1. Vercel 대시보드 → 프로젝트 선택
2. **Storage** 탭 → **Create Database** → **Postgres** 선택
3. 데이터베이스 이름 입력 후 생성

#### 1-2. 환경변수 자동 설정
Vercel Postgres를 생성하면 다음 환경변수가 자동으로 설정됩니다:
- `POSTGRES_URL` (또는 `DATABASE_URL`)
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

#### 1-3. connection.js 수정 필요
현재 `backend/db/connection.js`는 개별 환경변수(`DB_HOST`, `DB_PORT` 등)를 사용합니다.
Vercel Postgres는 `DATABASE_URL` 형식의 연결 문자열을 제공합니다.

**수정 방법:**
```javascript
// backend/db/connection.js
const { Pool } = require('pg');
require('dotenv').config();

// Vercel Postgres는 DATABASE_URL을 제공
const connectionString = process.env.DATABASE_URL || 
  process.env.POSTGRES_URL ||
  // 로컬 개발용: 개별 환경변수로 구성
  (process.env.DB_HOST ? 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}` :
    null);

const pool = new Pool(
  connectionString ? 
    { connectionString } : 
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'startsmart',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
);

// ... 나머지 코드 동일
```

### 2. Supabase 사용 시

#### 2-1. Supabase 프로젝트 생성
1. [Supabase](https://supabase.com) 가입
2. 새 프로젝트 생성
3. **Settings** → **Database** → **Connection string** 복사

#### 2-2. Vercel 환경변수 설정
1. Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**
2. 다음 환경변수 추가:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```

### 3. 데이터베이스 스키마 마이그레이션

#### 3-1. 로컬 DB 스키마 내보내기
```bash
# 로컬 PostgreSQL에서 스키마 덤프
pg_dump -h localhost -U postgres -d startsmart --schema-only > schema.sql
```

#### 3-2. 클라우드 DB에 스키마 적용
```bash
# Vercel Postgres 또는 Supabase에 연결하여 스키마 적용
psql $DATABASE_URL < schema.sql
```

또는 Supabase 대시보드의 **SQL Editor**에서 `backend/db/schema.sql` 파일 내용을 실행

#### 3-3. 초기 데이터 삽입
```bash
# 브랜드 데이터 등 초기 데이터 삽입
psql $DATABASE_URL < backend/db/init.js
# 또는
node backend/db/init.js
```

### 4. Vercel 환경변수 설정

Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**에서 다음 변수들을 설정:

#### 필수 환경변수
```
DATABASE_URL=postgresql://... (Vercel Postgres 자동 설정 또는 수동 입력)
```

#### API 키들
```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
KAKAO_REST_API_KEY=...
GOOGLE_MAPS_API_KEY=...
NAVER_MAP_CLIENT_ID=...
NAVER_MAP_CLIENT_SECRET=...
```

#### 선택적 환경변수
```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

### 5. 배포

#### 5-1. Git 연동
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel
```

#### 5-2. GitHub 연동 (권장)
1. Vercel 대시보드 → **Add New Project**
2. GitHub 저장소 선택
3. 프로젝트 설정:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (비워둠 또는 `npm install`)
   - **Output Directory**: (비워둠)
4. **Deploy** 클릭

### 6. 배포 후 확인

1. **Health Check**
   ```
   https://your-project.vercel.app/health
   ```

2. **API 테스트**
   ```
   https://your-project.vercel.app/api/brands
   ```

3. **프론트엔드 확인**
   ```
   https://your-project.vercel.app/
   ```

## ⚠️ 주의사항

### 1. 서버리스 함수 제한
- Vercel의 서버리스 함수는 최대 실행 시간 제한이 있습니다 (Hobby 플랜: 10초, Pro: 60초)
- 분석 작업이 오래 걸릴 경우 타임아웃 발생 가능
- 해결책: 백그라운드 작업을 별도 서비스로 분리 (예: Vercel Cron Jobs)

### 2. 데이터베이스 연결 풀
- 서버리스 환경에서는 연결 풀 관리가 중요
- `pg` 라이브러리의 `Pool`을 사용 중이므로 문제없음
- 단, Vercel Postgres는 자동으로 연결 풀링 제공

### 3. 환경변수 보안
- 민감한 정보는 절대 코드에 하드코딩하지 않기
- Vercel 환경변수에만 저장
- `.env` 파일은 `.gitignore`에 포함되어 있는지 확인

### 4. CORS 설정
- 프론트엔드 도메인이 변경되면 CORS 설정 업데이트 필요
- `backend/server.js`의 `cors()` 설정 확인

## 🔄 로컬 개발과 프로덕션 분리

### 환경별 설정
```javascript
// backend/db/connection.js
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

if (isProduction || isVercel) {
  // 프로덕션: DATABASE_URL 사용
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
} else {
  // 로컬 개발: 개별 환경변수 사용
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    // ...
  });
}
```

## 📚 참고 자료

- [Vercel Postgres 문서](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase 문서](https://supabase.com/docs)
- [Neon 문서](https://neon.tech/docs)
- [Vercel 배포 가이드](https://vercel.com/docs)
