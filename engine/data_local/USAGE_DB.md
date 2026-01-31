# 데이터베이스 연동 사용 가이드

## 빠른 시작

### 1. 환경변수 설정

`.env` 파일 생성:

```bash
# 데이터베이스 사용 여부
USE_DATABASE=true

# MySQL 설정
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=startsmart
```

### 2. 데이터베이스 스키마 생성

```bash
# MySQL
mysql -u root -p < engine/data_local/db-schema.sql

# PostgreSQL
psql -U postgres -f engine/data_local/db-schema-postgresql.sql
```

### 3. 패키지 설치

```bash
# MySQL 사용 시
npm install mysql2

# PostgreSQL 사용 시
npm install pg
```

---

## 동작 방식

### 우선순위
1. **데이터베이스** (1차): `.env`에 정의된 DB에서 로드
2. **data_local/brands.json** (2차): DB 에러 시 자동 fallback

### 로그 예시

**DB 연결 성공:**
```
📊 데이터베이스에서 브랜드 데이터 로드 시도...
✅ 데이터베이스에서 12개 브랜드 로드 성공
```

**DB 연결 실패 (Fallback):**
```
📊 데이터베이스에서 브랜드 데이터 로드 시도...
⚠️ 데이터베이스 로드 실패, data_local로 fallback: Connection refused
📁 data_local에서 브랜드 데이터 로드 시도...
✅ data_local에서 12개 브랜드 로드 성공
```

---

## 코드 사용 예시

### 기본 사용법

```js
const { getBrandForEngine } = require('./data_local/brandLoader');

// async/await 필수
async function example() {
  const brand = await getBrandForEngine('brand_mega');
  console.log(brand);
}
```

### 모든 브랜드 조회

```js
const { getAllBrands } = require('./data_local/brandLoader');

async function example() {
  const brands = await getAllBrands();
  console.log(brands);
}
```

---

## 데이터베이스 비활성화

`.env`에서 `USE_DATABASE=false`로 설정하면 항상 `data_local/brands.json`을 사용합니다.

```bash
USE_DATABASE=false
```

---

## 주의사항

1. **비동기 함수**: 모든 브랜드 로더 함수가 `async`로 변경되었습니다.
2. **에러 처리**: DB 연결 실패 시 자동으로 fallback되므로 안전합니다.
3. **성능**: DB 연결은 각 호출마다 수행됩니다. 필요시 연결 풀링을 고려하세요.
