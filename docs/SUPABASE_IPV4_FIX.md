# Supabase IPv4 호환성 문제 해결

## 문제

Supabase 대시보드에서 "Not IPv4 compatible" 경고가 표시됩니다.

**원인:**
- Direct connection (`db.oetxnpgfsmmxcgnelhvd.supabase.co`)은 IPv6만 지원
- 일부 네트워크 환경에서는 IPv4만 사용 가능
- DNS 조회 실패: `could not translate host name`

## 해결 방법

### 방법 1: Session Pooler 사용 (권장) ⭐

Supabase 대시보드에서:

1. **Connection string** 탭에서
2. **Method** 드롭다운을 **"Session Pooler"** 또는 **"Connection pooling"**으로 변경
3. 연결 문자열 복사

**올바른 연결 문자열 형식:**
```
postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

또는 Session mode:
```
postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

### 방법 2: Pooler settings에서 가져오기

1. Supabase 대시보드 → **Settings** → **Database**
2. **Connection pooling** 섹션으로 스크롤
3. **Session mode** 또는 **Transaction mode** 선택
4. 연결 문자열 복사

## .env 파일 업데이트

현재 (IPv4 호환 안 됨):
```bash
CLOUD_DATABASE_URL=postgresql://postgres:mySecurePassword123@db.oetxnpgfsmmxcgnelhvd.supabase.co:5432/postgres
```

수정 후 (IPv4 호환):
```bash
CLOUD_DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:mySecurePassword123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**차이점:**
- 사용자명: `postgres` → `postgres.oetxnpgfsmmxcgnelhvd` (프로젝트 ID 포함)
- 호스트: `db.oetxnpgfsmmxcgnelhvd.supabase.co` → `aws-0-ap-northeast-2.pooler.supabase.com` (pooler 사용)
- 포트: `5432` → `6543` (pooling) 또는 `5432` (session)

## 업로드 재시도

연결 문자열을 업데이트한 후:

```bash
node backend/db/upload-to-cloud.js
```

## 연결 테스트

업로드 전에 연결을 테스트하세요:

```bash
# Session Pooler 연결 테스트
psql "postgresql://postgres.oetxnpgfsmmxcgnelhvd:mySecurePassword123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
```

연결이 성공하면 `postgres=#` 프롬프트가 나타납니다.

## 참고

- **Connection pooling** (포트 6543): 많은 동시 연결에 적합
- **Session mode** (포트 5432): 일반적인 사용에 적합, IPv4 호환
- 두 방법 모두 IPv4 네트워크에서 작동합니다
