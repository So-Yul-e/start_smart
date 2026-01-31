# Supabase 연결 문제 해결

## 문제: DNS 해석 실패

오류 메시지:
```
could not translate host name "db.oetxnpgfsmmxcgnelhvd.supabase.co" to address
```

## 원인

연결 문자열 형식이 잘못되었거나, Supabase 프로젝트가 아직 완전히 생성되지 않았을 수 있습니다.

## 해결 방법

### 방법 1: 올바른 연결 문자열 확인 (권장)

Supabase 대시보드에서 정확한 연결 문자열을 다시 확인하세요:

1. https://supabase.com/dashboard/project/oetxnpgfsmmxcgnelhvd 접속
2. **Settings** → **Database** 클릭
3. **Connection string** 섹션에서:
   - **URI** 탭 선택
   - **Connection pooling** 또는 **Session mode** 선택
   - 연결 문자열 복사

#### 올바른 연결 문자열 형식:

**Connection pooling (권장):**
```
postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**Session mode:**
```
postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

⚠️ **중요 차이점:**
- 사용자명: `postgres.oetxnpgfsmmxcgnelhvd` (프로젝트 ID 포함)
- 호스트: `aws-0-[REGION].pooler.supabase.com` (pooler 포함)
- 포트: `6543` (pooling) 또는 `5432` (session)

### 방법 2: 직접 연결 문자열 사용

만약 `db.oetxnpgfsmmxcgnelhvd.supabase.co` 형식을 사용해야 한다면:

1. Supabase 대시보드 → **Settings** → **Database**
2. **Connection string** → **Direct connection** 확인
3. 또는 **Connection pooling** → **Session mode** 사용

### 방법 3: 프로젝트 상태 확인

Supabase 프로젝트가 아직 생성 중일 수 있습니다:

1. 대시보드에서 프로젝트 상태 확인
2. "Setting up your project" 메시지가 있으면 완료까지 대기
3. 보통 1-2분 소요

## 수정된 업로드 스크립트

`upload-to-cloud.js`가 업데이트되어 연결 문자열을 직접 사용합니다:

```bash
# .env 파일에 올바른 연결 문자열 설정
CLOUD_DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

# 업로드 실행
node backend/db/upload-to-cloud.js
```

## 연결 테스트

업로드 전에 연결을 테스트하세요:

```bash
# 연결 문자열로 직접 테스트
psql "postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"

# 또는
PGPASSWORD="[PASSWORD]" psql -h aws-0-ap-northeast-2.pooler.supabase.com -p 6543 -U postgres.oetxnpgfsmmxcgnelhvd -d postgres
```

연결이 성공하면 `postgres=#` 프롬프트가 나타납니다.

## 다음 단계

1. Supabase 대시보드에서 올바른 연결 문자열 복사
2. `.env` 파일의 `CLOUD_DATABASE_URL` 업데이트
3. 연결 테스트 실행
4. `node backend/db/upload-to-cloud.js` 실행
