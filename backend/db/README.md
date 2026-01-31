# PostgreSQL 데이터베이스 설정

## ERD (Entity Relationship Diagram)

데이터베이스 구조를 시각화한 ERD 파일이 제공됩니다:

- **`ERD.md`**: Mermaid 형식 ERD (GitHub에서 바로 확인 가능)
- **`ERD.dbml`**: dbdiagram.io 형식 ERD (온라인에서 시각화 가능)
  - https://dbdiagram.io/ 에서 파일을 업로드하여 시각화 가능

ERD를 확인하려면 `ERD.md` 파일을 열어보세요.

---

## 1. PostgreSQL 설치

### macOS
```bash
# Homebrew로 설치
brew install postgresql@15
brew services start postgresql@15

# 또는 PostgreSQL 공식 사이트에서 다운로드
# https://www.postgresql.org/download/macosx/
```

### Linux
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
- PostgreSQL 공식 사이트에서 설치: https://www.postgresql.org/download/windows/

## 2. 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE startsmart;

# 사용자 생성 (선택사항)
CREATE USER startsmart_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE startsmart TO startsmart_user;

# 종료
\q
```

## 3. 환경변수 설정

`.env` 파일에 다음 내용 추가:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=startsmart
DB_USER=postgres
DB_PASSWORD=postgres
```

## 4. 데이터베이스 초기화

```bash
# 스키마 생성 및 브랜드 데이터 삽입
node backend/db/init.js
```

이 명령어는:
- 테이블 생성 (brands, analyses)
- 브랜드 데이터 12개 삽입
- 인덱스 생성

## 5. PDF에서 브랜드 데이터 추출 및 DB 삽입

```bash
# docs/data 폴더의 PDF 파일들을 분석하여 DB에 삽입
node backend/db/importFromPDFs.js
```

이 명령어는:
- `docs/data/*.pdf` 파일들을 자동으로 찾아서
- PDF 텍스트를 추출하고
- 브랜드 정보(투자금, 로열티, 마케팅비 등)를 파싱하여
- PostgreSQL DB에 직접 삽입

## 6. 테스트

```bash
# 서버 실행
node backend/server.js

# 브랜드 목록 조회 테스트
curl http://localhost:3000/api/brands
```

## 테이블 구조

### brands 테이블
- `id`: 브랜드 ID (PK)
- `name`: 브랜드명
- `position`: 포지션 (프리미엄/스탠다드)
- `initial_investment`: 초기 투자금
- `monthly_royalty`: 월 로열티 (%)
- `monthly_marketing`: 월 마케팅비 (%)
- `avg_daily_sales`: 평균 일 판매량
- `pdf_source`: PDF 원본 텍스트 (참고용, 최대 5000자)
- `created_at`, `updated_at`: 타임스탬프

### analyses 테이블
- `id`: 분석 ID (PK)
- `brand_id`: 브랜드 ID (FK)
- `location_lat`, `location_lng`: 위치 좌표
- `location_address`: 주소
- `radius`: 반경 (m)
- `initial_investment`, `monthly_rent`, `area`, `owner_working`: 조건
- `target_daily_sales`: 목표 일 판매량
- `status`: 상태 (pending, processing, completed, failed)
- `result`: 분석 결과 (JSONB)
- `error_message`: 에러 메시지
- `created_at`, `updated_at`: 타임스탬프

## 문제 해결

### 연결 오류
- PostgreSQL 서비스가 실행 중인지 확인: `brew services list` (macOS)
- 포트가 올바른지 확인: 기본값 5432
- 사용자 권한 확인
- `.env` 파일의 DB 설정 확인

### 테이블이 없음
- `node backend/db/init.js` 실행

### 브랜드 데이터가 없음
- `node backend/db/init.js` 실행 (기본 12개 브랜드)
- 또는 `node backend/db/importFromPDFs.js` 실행 (PDF에서 추출)

### PDF 파싱 오류
- PDF 파일이 `docs/data/` 폴더에 있는지 확인
- PDF 파일이 손상되지 않았는지 확인
- 추출된 데이터가 부정확할 수 있으므로, DB에 삽입 후 수동으로 확인 및 수정 권장
