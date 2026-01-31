# Supabase 연결 문제 최종 해결

## 문제

다른 컴퓨터에서 Supabase DB 연결이 안 되는 경우:
1. "Tenant or user not found" 오류
2. "self-signed certificate in certificate chain" 오류

## 해결 방법

### 1. .env 파일 확인

`.env` 파일에 다음 형식으로 설정:

```bash
DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[실제_비밀번호]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**중요:**
- 사용자명: `postgres.oetxnpgfsmmxcgnelhvd` (프로젝트 ID 포함)
- 호스트: `aws-1-ap-northeast-2.pooler.supabase.com` (Session mode)
- 포트: `5432` (Session mode) 또는 `6543` (Transaction mode)
- `?sslmode=require` 포함 (선택사항, connection.js가 자동 처리)

### 2. connection.js 자동 처리

`backend/db/connection.js`가 자동으로:
- Supabase 연결 감지
- `sslmode=require` 파라미터 제거 (자체 SSL 설정 사용)
- `rejectUnauthorized: false` 설정 (self-signed certificate 허용)

**따라서 `.env` 파일에 `?sslmode=require`가 있어도 문제없습니다.**

### 3. 연결 테스트

```bash
# 연결 테스트
node backend/db/test-connection.js
```

또는

```bash
# 서버 실행
npm start
```

**성공 시:**
```
📦 클라우드 데이터베이스 연결 설정 (DATABASE_URL 사용)
🔒 Supabase SSL 연결 활성화 (self-signed certificate 허용)
✅ PostgreSQL 데이터베이스 연결 성공
```

## 다른 컴퓨터에서 설정

1. 프로젝트 클론:
   ```bash
   git clone [repository-url]
   cd StartSmart
   npm install
   ```

2. `.env` 파일 생성:
   ```bash
   DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[실제_비밀번호]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
   ```

3. 서버 실행:
   ```bash
   npm start
   ```

## 문제 해결 체크리스트

- [ ] `.env` 파일에 `DATABASE_URL`이 있는가?
- [ ] 사용자명이 `postgres.oetxnpgfsmmxcgnelhvd` 형식인가? (프로젝트 ID 포함)
- [ ] 비밀번호가 실제 Supabase 비밀번호와 일치하는가?
- [ ] 호스트가 `pooler.supabase.com` 형식인가?
- [ ] 서버 로그에 "🔒 Supabase SSL 연결 활성화" 메시지가 나오는가?
- [ ] 서버 로그에 "✅ PostgreSQL 데이터베이스 연결 성공" 메시지가 나오는가?

## 오류별 해결 방법

### "Tenant or user not found"
- 사용자명에 프로젝트 ID가 포함되어 있는지 확인
- Supabase 대시보드에서 연결 문자열 다시 복사

### "self-signed certificate in certificate chain"
- `connection.js`가 자동으로 처리함
- 서버를 재시작해보세요

### "password authentication failed"
- `.env` 파일의 비밀번호 확인
- Supabase 대시보드에서 비밀번호 재설정

---

**작성일**: 2025-01-31  
**버전**: 1.0
