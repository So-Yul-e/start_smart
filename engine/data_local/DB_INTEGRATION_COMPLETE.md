# 데이터베이스 연동 완료

## ✅ 완료된 작업

### 1. 데이터베이스 로더 생성 ✅
- **파일**: `engine/data_local/dbLoader.js`
- **기능**:
  - MySQL/PostgreSQL 지원
  - DB 연결 실패 시 자동으로 `data_local/brands.json`으로 fallback
  - 에러 핸들링 및 로깅

### 2. 브랜드 로더 업데이트 ✅
- **파일**: `engine/data_local/brandLoader.js`
- **변경사항**:
  - `dbLoader` 모듈 사용
  - 모든 함수가 `async`로 변경
  - 하위 호환성 유지

### 3. 데이터베이스 스키마 생성 ✅
- **파일**: 
  - `engine/data_local/db-schema.sql` (MySQL)
  - `engine/data_local/db-schema-postgresql.sql` (PostgreSQL)
- **내용**: 브랜드 테이블 스키마 및 샘플 데이터

### 4. 환경변수 설정 파일 생성 ✅
- **파일**: `.env.example`
- **내용**: 데이터베이스 연결 정보 템플릿

### 5. Fixture 파일 업데이트 ✅
- `engine/fixtures/multi-brand-comparison.js` - async/await 적용
- `engine/fixtures/mega-gangnam.js` - async/await 적용
- `engine/fixtures/brand-test.js` - async/await 적용
- `engine/fixtures/validator-test.js` - async/await 적용

---

## 🔧 사용 방법

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
DB_PASSWORD=password
DB_NAME=startsmart
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

### 4. 사용 예시

```js
const { getBrandForEngine } = require('./data_local/brandLoader');

// async/await 사용 필요
async function example() {
  const brand = await getBrandForEngine('brand_mega');
  console.log(brand);
}
```

---

## 📊 동작 방식

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

---

## ⚙️ 설정 옵션

### 데이터베이스 비활성화

`.env`에서 `USE_DATABASE=false`로 설정하면 항상 `data_local/brands.json`을 사용합니다.

```bash
USE_DATABASE=false
```

### 지원하는 데이터베이스

- **MySQL**: `DB_TYPE=mysql`
- **PostgreSQL**: `DB_TYPE=postgresql` 또는 `DB_TYPE=postgres`

---

## 🔍 테스트

### Fallback 테스트 (DB 연결 안 함)

```bash
# .env에 USE_DATABASE=false 설정 또는 DB 정보 제거
node engine/fixtures/multi-brand-comparison.js
```

출력:
```
📁 data_local에서 브랜드 데이터 로드 시도...
✅ data_local에서 12개 브랜드 로드 성공
```

### DB 연결 테스트

```bash
# .env에 올바른 DB 정보 설정
USE_DATABASE=true
DB_TYPE=mysql
DB_HOST=localhost
...

node engine/fixtures/multi-brand-comparison.js
```

출력:
```
📊 데이터베이스에서 브랜드 데이터 로드 시도...
✅ 데이터베이스에서 12개 브랜드 로드 성공
```

---

## ⚠️ 주의사항

1. **비동기 함수**: 모든 브랜드 로더 함수가 `async`로 변경되었습니다.
2. **에러 처리**: DB 연결 실패 시 자동으로 fallback되므로 안전합니다.
3. **성능**: DB 연결은 각 호출마다 수행되므로, 필요시 연결 풀링을 고려하세요.

---

## 📝 다음 단계

- [ ] 연결 풀링 추가 (성능 최적화)
- [ ] 캐싱 메커니즘 추가
- [ ] 데이터베이스 마이그레이션 스크립트 작성

---

## ✅ 체크리스트

- [x] DB 로더 생성
- [x] Fallback 메커니즘 구현
- [x] MySQL/PostgreSQL 지원
- [x] 스키마 파일 생성
- [x] 환경변수 설정 파일 생성
- [x] Fixture 파일 업데이트
- [x] 테스트 통과 확인

**모든 작업 완료!** 🎉
