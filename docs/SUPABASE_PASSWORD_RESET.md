# Supabase 비밀번호 재설정 및 연결 확인

## 문제: "Tenant or user not found" 오류

이 오류는 보통 다음 중 하나의 문제입니다:
1. 비밀번호가 잘못됨
2. 사용자명 형식이 잘못됨
3. 연결 문자열이 잘못됨

## 해결 방법

### 방법 1: 비밀번호 재설정 (권장)

1. https://supabase.com/dashboard/project/oetxnpgfsmmxcgnelhvd 접속
2. **Settings** → **Database** 클릭
3. **Database Settings** 섹션으로 스크롤
4. **Reset database password** 버튼 클릭
5. 새 비밀번호 설정 (기억하기 쉬운 것으로)
6. `.env` 파일의 `CLOUD_DATABASE_URL` 업데이트

### 방법 2: 연결 문자열 다시 복사

1. Supabase 대시보드 → **Settings** → **Database**
2. **Connection string** 섹션에서:
   - **Method**: **"Session Pooler"** 선택
   - **Type**: **"URI"** 선택
   - 연결 문자열을 **전체 복사** (비밀번호 포함)
3. `.env` 파일에 붙여넣기

### 방법 3: 연결 문자열 형식 확인

올바른 Session Pooler 연결 문자열 형식:

```
postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**확인 사항:**
- ✅ 사용자명: `postgres.oetxnpgfsmmxcgnelhvd` (프로젝트 ID 포함)
- ✅ 호스트: `aws-0-ap-northeast-2.pooler.supabase.com` (pooler 포함)
- ✅ 포트: `6543` (pooling) 또는 `5432` (session)
- ✅ 비밀번호: 프로젝트 생성 시 설정한 비밀번호

## 연결 테스트

비밀번호를 재설정하거나 연결 문자열을 업데이트한 후:

```bash
# 연결 테스트
psql "postgresql://postgres.oetxnpgfsmmxcgnelhvd:[새_비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres" -c "SELECT version();"
```

연결이 성공하면 PostgreSQL 버전 정보가 표시됩니다.

## 업로드 재시도

연결 테스트가 성공하면:

```bash
node backend/db/upload-to-cloud.js
```

## 대안: Supabase SQL Editor 사용

스크립트가 계속 실패하는 경우:

1. 로컬에서 덤프 파일 생성:
   ```bash
   node backend/db/export-db.js
   ```

2. Supabase 대시보드 → **SQL Editor** 클릭
3. **New query** 클릭
4. `backend/db/dump.sql` 파일 내용을 복사하여 붙여넣기
5. **Run** 클릭

이 방법은 연결 문자열 문제를 우회할 수 있습니다.
