# 데이터베이스 연동 가이드

## 개요

브랜드 데이터는 다음 순서로 로드됩니다:
1. **데이터베이스** (1차): .env에 정의된 DB에서 로드
2. **data_local/brands.json** (2차): DB 에러 시 fallback

## 설정 방법

### 1. .env 파일 설정

`.env` 파일에 데이터베이스 정보를 추가:

```bash
# 데이터베이스 사용 여부
USE_DATABASE=true

# MySQL 설정
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=startsmart

# 또는 PostgreSQL
# DB_TYPE=postgresql
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=password
# DB_NAME=startsmart
```

### 2. 데이터베이스 스키마 생성

#### MySQL
```bash
mysql -u root -p < engine/data_local/db-schema.sql
```

#### PostgreSQL
```bash
psql -U postgres -f engine/data_local/db-schema-postgresql.sql
```

### 3. 필요한 패키지 설치

#### MySQL 사용 시
```bash
npm install mysql2
```

#### PostgreSQL 사용 시
```bash
npm install pg
```

## 동작 방식

### 정상 케이스 (DB 연결 성공)
```
📊 데이터베이스에서 브랜드 데이터 로드 시도...
✅ 데이터베이스에서 12개 브랜드 로드 성공
```

### Fallback 케이스 (DB 연결 실패)
```
📊 데이터베이스에서 브랜드 데이터 로드 시도...
⚠️ 데이터베이스 로드 실패, data_local로 fallback: Connection refused
📁 data_local에서 브랜드 데이터 로드 시도...
✅ data_local에서 12개 브랜드 로드 성공
```

## 데이터베이스 비활성화

`.env`에서 `USE_DATABASE=false`로 설정하면 항상 `data_local/brands.json`을 사용합니다.

```bash
USE_DATABASE=false
```

## 주의사항

1. **비동기 함수**: `getBrandForEngine()`, `getAllBrands()` 등이 이제 `async` 함수입니다.
2. **에러 처리**: DB 연결 실패 시 자동으로 fallback되므로 안전합니다.
3. **성능**: DB 연결은 첫 호출 시에만 수행되며, 이후 재사용됩니다.

## 사용 예시

```js
const { getBrandForEngine } = require('./data_local/brandLoader');

// async/await 사용 필요
async function example() {
  const brand = await getBrandForEngine('brand_mega');
  console.log(brand);
}
```

## 마이그레이션

기존 `brands.json` 데이터를 데이터베이스로 마이그레이션하려면:

```js
const { loadBrandsData } = require('./data_local/brandLoader');
const localData = require('./brands.json');

// localData.brands를 DB에 INSERT
```
