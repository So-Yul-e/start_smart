# Supabase "Tenant or user not found" 오류 해결

## 오류 메시지

```
FATAL: Tenant or user not found
```

## 원인

사용자명 형식이 잘못되었거나, 연결 문자열이 올바르지 않을 수 있습니다.

## 해결 방법

### 1단계: Supabase 대시보드에서 정확한 연결 문자열 확인

1. https://supabase.com/dashboard/project/oetxnpgfsmmxcgnelhvd 접속
2. **Settings** → **Database** 클릭
3. **Connection string** 섹션에서:
   - **Method**: **"Session Pooler"** 또는 **"Connection pooling"** 선택
   - **Type**: **"URI"** 선택
   - 연결 문자열 복사

### 2단계: 연결 문자열 형식 확인

올바른 형식 예시:

**Session Pooler (포트 6543):**
```
postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**Session mode (포트 5432):**
```
postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

⚠️ **중요**: 
- 사용자명은 `postgres.oetxnpgfsmmxcgnelhvd` 형식이어야 함 (프로젝트 ID 포함)
- 비밀번호는 프로젝트 생성 시 설정한 비밀번호 사용

### 3단계: 연결 테스트

업로드 전에 연결을 직접 테스트하세요:

```bash
# 연결 문자열로 직접 테스트
psql "postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
```

연결이 성공하면:
- `postgres=#` 프롬프트가 나타남
- `\q` 입력하여 종료

연결이 실패하면:
- 비밀번호가 올바른지 확인
- 연결 문자열이 정확한지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 4단계: 비밀번호 재설정 (필요한 경우)

비밀번호를 잊어버렸거나 확인이 필요한 경우:

1. Supabase 대시보드 → **Settings** → **Database**
2. **Reset database password** 클릭
3. 새 비밀번호 설정
4. `.env` 파일의 `CLOUD_DATABASE_URL` 업데이트

### 5단계: .env 파일 확인

`.env` 파일의 `CLOUD_DATABASE_URL`이 다음 형식인지 확인:

```bash
CLOUD_DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[실제_비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

⚠️ **주의사항:**
- `[실제_비밀번호]`를 프로젝트 생성 시 설정한 비밀번호로 교체
- 사용자명에 프로젝트 ID(`oetxnpgfsmmxcgnelhvd`)가 포함되어야 함
- 호스트는 `pooler.supabase.com` 형식이어야 함

### 6단계: 업로드 재시도

```bash
node backend/db/upload-to-cloud.js
```

## 대안: Supabase SQL Editor 사용

스크립트가 계속 실패하는 경우, Supabase 대시보드의 SQL Editor를 사용할 수 있습니다:

1. Supabase 대시보드 → **SQL Editor** 클릭
2. **New query** 클릭
3. `dump.sql` 파일 내용을 복사하여 붙여넣기
4. **Run** 클릭

또는:

1. 로컬에서 덤프 파일 생성:
   ```bash
   node backend/db/export-db.js
   ```

2. `backend/db/dump.sql` 파일 내용을 Supabase SQL Editor에 붙여넣기

## 문제 해결 체크리스트

- [ ] Supabase 대시보드에서 연결 문자열 다시 복사
- [ ] 사용자명에 프로젝트 ID가 포함되어 있는지 확인
- [ ] 비밀번호가 올바른지 확인
- [ ] 연결 문자열로 직접 연결 테스트
- [ ] Supabase 프로젝트가 활성화되어 있는지 확인
- [ ] `.env` 파일의 `CLOUD_DATABASE_URL` 형식 확인
