# DBeaver 연결 가이드

## .env 파일 설정
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=startsmart
DB_USER=postgres
DB_PASSWORD=postgres1234
```

## DBeaver 연결 설정

### 1. 새 데이터베이스 연결 생성
1. DBeaver 실행
2. 상단 메뉴: **Database** → **New Database Connection**
3. 또는 왼쪽 상단 **새 연결** 버튼 클릭

### 2. PostgreSQL 선택
- 데이터베이스 목록에서 **PostgreSQL** 선택
- **Next** 클릭

### 3. 연결 정보 입력

#### Main 탭
- **Host**: `localhost` (또는 `.env`의 `DB_HOST` 값)
- **Port**: `5432` (또는 `.env`의 `DB_PORT` 값)
- **Database**: `startsmart` (또는 `.env`의 `DB_NAME` 값)
- **Username**: `postgres` (또는 `.env`의 `DB_USER` 값)
- **Password**: `postgres1234` (또는 `.env`의 `DB_PASSWORD` 값)
  - **Save password** 체크 (선택사항)

#### Driver properties 탭 (선택사항)
- 기본값으로 사용 가능

### 4. 연결 테스트
- **Test Connection** 버튼 클릭
- 성공 메시지가 나오면 **Finish** 클릭

### 5. 연결 확인
- 왼쪽 데이터베이스 탐색기에서 연결이 나타나는지 확인
- `startsmart` 데이터베이스를 확장하면 `brands`, `analyses` 테이블이 보입니다

## 문제 해결

### 연결 실패 시
1. **PostgreSQL이 실행 중인지 확인**
   ```bash
   # macOS
   brew services list
   # postgresql@15가 started 상태여야 함
   ```

2. **포트 확인**
   - 기본값: 5432
   - 다른 포트 사용 시 `.env`와 DBeaver 설정이 일치하는지 확인

3. **사용자 권한 확인**
   - `postgres` 사용자가 `startsmart` 데이터베이스에 접근 권한이 있는지 확인
   ```sql
   -- psql에서 실행
   GRANT ALL PRIVILEGES ON DATABASE startsmart TO postgres;
   ```

4. **방화벽 확인**
   - localhost 연결이므로 일반적으로 문제 없음

### 드라이버 다운로드 필요 시
- DBeaver가 자동으로 PostgreSQL 드라이버를 다운로드할 수 있음
- 수동 다운로드가 필요한 경우 DBeaver가 안내

## 테이블 확인

연결 후 다음 쿼리로 데이터 확인:

```sql
-- 브랜드 목록 조회
SELECT * FROM brands;

-- 분석 결과 조회
SELECT * FROM analyses ORDER BY created_at DESC LIMIT 10;
```
