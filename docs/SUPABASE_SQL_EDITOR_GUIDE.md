# Supabase SQL Editor로 DB 업로드 가이드

## 현재 상황

덤프 파일이 성공적으로 생성되었습니다 (523.21 KB).
하지만 `psql` 명령어로 업로드하는 데 "Tenant or user not found" 오류가 발생합니다.

## 해결 방법: Supabase SQL Editor 사용

### 1단계: 덤프 파일 확인

덤프 파일 위치: `backend/db/dump.sql`

### 2단계: Supabase SQL Editor 열기

1. https://supabase.com/dashboard/project/oetxnpgfsmmxcgnelhvd 접속
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. **New query** 버튼 클릭

### 3단계: 덤프 파일 내용 복사

터미널에서:
```bash
# 덤프 파일 내용 확인 (선택사항)
cat backend/db/dump.sql

# 또는 파일을 열어서 전체 내용 복사
```

또는:
```bash
# 덤프 파일을 텍스트 에디터로 열기
open backend/db/dump.sql
```

### 4단계: SQL Editor에 붙여넣기 및 실행

1. Supabase SQL Editor의 쿼리 입력창에 덤프 파일 내용 전체 붙여넣기
2. **Run** 버튼 클릭 (또는 `Cmd+Enter` / `Ctrl+Enter`)
3. 실행 완료까지 대기

### 5단계: 확인

1. 왼쪽 메뉴에서 **Table Editor** 클릭
2. `brands` 테이블 확인
3. `analyses` 테이블 확인
4. 데이터가 올바르게 업로드되었는지 확인

## 주의사항

### 덤프 파일이 큰 경우

덤프 파일이 매우 큰 경우 (수 MB 이상):
- SQL Editor는 쿼리 크기 제한이 있을 수 있습니다
- 이 경우 덤프 파일을 여러 부분으로 나누어 실행하거나
- `psql` 명령어 문제를 해결해야 합니다

### 오류 발생 시

SQL Editor에서 오류가 발생하면:
1. 오류 메시지 확인
2. 해당 부분만 수정하여 재실행
3. 또는 덤프 파일을 다시 생성

## 대안: 덤프 파일을 작은 부분으로 나누기

덤프 파일이 너무 큰 경우:

```bash
# 덤프 파일을 여러 부분으로 나누기
split -l 1000 backend/db/dump.sql backend/db/dump_part_

# 각 부분을 순서대로 SQL Editor에 실행
```

## 다음 단계

SQL Editor로 업로드가 완료되면:

1. `.env` 파일에 `DATABASE_URL` 설정:
   ```bash
   DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:aidirectors123!@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
   ```

2. 서버 실행 및 테스트:
   ```bash
   npm start
   curl http://localhost:3000/api/brands
   ```

3. 다른 노트북에서도 같은 `DATABASE_URL` 사용
