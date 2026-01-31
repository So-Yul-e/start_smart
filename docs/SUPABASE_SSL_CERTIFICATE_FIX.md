# Supabase SSL 인증서 오류 해결

## 오류 메시지

```
self-signed certificate in certificate chain
```

또는

```
(node:68958) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
```

## 원인

Supabase는 self-signed certificate를 사용하며, Node.js의 `pg` 라이브러리가 기본적으로 인증서 검증을 시도합니다.

## 해결 방법

### 방법 1: connection.js 자동 처리 (이미 구현됨) ✅

`backend/db/connection.js`가 자동으로 Supabase 연결 시 `rejectUnauthorized: false`를 설정합니다.

**확인 방법:**
```bash
npm start
```

서버 로그에서 다음 메시지 확인:
```
🔒 Supabase SSL 연결 활성화 (self-signed certificate 허용)
✅ PostgreSQL 데이터베이스 연결 성공
```

### 방법 2: 연결 문자열에 uselibpqcompat 추가 (선택사항)

경고 메시지를 없애려면 연결 문자열에 `uselibpqcompat=true`를 추가할 수 있습니다:

**.env 파일:**
```bash
DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=true
```

**참고:** `connection.js`가 이미 `rejectUnauthorized: false`를 설정하므로 이 방법은 선택사항입니다.

### 방법 3: sslmode 제거 (connection.js가 자동 처리)

연결 문자열에서 `?sslmode=require`를 제거하고 `connection.js`가 자동으로 SSL을 처리하도록 할 수 있습니다:

**.env 파일:**
```bash
DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

`connection.js`가 Supabase 연결을 자동 감지하여 SSL을 활성화합니다.

## 현재 설정 상태

### ✅ 이미 구현된 것

1. **connection.js 자동 SSL 처리**
   - Supabase 연결 자동 감지
   - `rejectUnauthorized: false` 자동 설정
   - self-signed certificate 허용

2. **check-ssl.js 개선**
   - SSL 인증서 오류에 대한 상세 안내 추가

### 📝 .env 파일 권장 형식

**옵션 A: sslmode 포함 (명시적)**
```bash
DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**옵션 B: sslmode 제거 (connection.js 자동 처리)**
```bash
DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

두 방법 모두 작동합니다. `connection.js`가 자동으로 SSL을 처리합니다.

## 다른 컴퓨터에서 설정

다른 컴퓨터에서도 동일한 `.env` 파일 형식을 사용하면 됩니다:

```bash
DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[실제_비밀번호]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**중요:**
- `[실제_비밀번호]`를 실제 Supabase 비밀번호로 교체
- `connection.js`가 자동으로 SSL을 처리하므로 추가 설정 불필요

## 테스트

### 서버 실행 테스트

```bash
npm start
```

**성공 시:**
```
📦 클라우드 데이터베이스 연결 설정 (DATABASE_URL 사용)
🔒 Supabase SSL 연결 활성화 (self-signed certificate 허용)
✅ PostgreSQL 데이터베이스 연결 성공
```

### API 테스트

```bash
curl http://localhost:3000/api/brands
```

성공하면 JSON 데이터가 반환됩니다.

## 요약

- ✅ `connection.js`가 자동으로 SSL 처리
- ✅ self-signed certificate 허용 (`rejectUnauthorized: false`)
- ✅ 다른 컴퓨터에서도 동일하게 작동
- ⚠️ 경고 메시지는 무시해도 됨 (기능에는 영향 없음)

**작성일**: 2025-01-31  
**버전**: 1.0
