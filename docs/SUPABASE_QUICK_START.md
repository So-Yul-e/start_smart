# Supabase 빠른 시작 가이드

프로젝트 ID: `oetxnpgfsmmxcgnelhvd`

## 🔗 연결 문자열 찾기

### 1단계: Supabase 대시보드 접속
https://supabase.com/dashboard/project/oetxnpgfsmmxcgnelhvd

### 2단계: Database 연결 문자열 복사
1. 왼쪽 메뉴에서 **Settings** (⚙️) 클릭
2. **Database** 클릭
3. **Connection string** 섹션으로 스크롤
4. **URI** 탭 선택
5. 연결 문자열 복사

**연결 문자열 형식:**
```
postgresql://postgres.oetxnpgfsmmxcgnelhvd:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

또는 **Session mode** (권장):
```
postgresql://postgres.oetxnpgfsmmxcgnelhvd:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

⚠️ **중요**: `[YOUR-PASSWORD]` 부분을 프로젝트 생성 시 설정한 비밀번호로 교체하세요!

## 📝 .env 파일 설정

### 방법 1: 클라우드 DB만 사용 (다른 노트북과 공유)

`.env` 파일에 추가:
```bash
# 클라우드 DB (Supabase)
DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

# 로컬 DB 설정은 주석 처리
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=startsmart
# DB_USER=postgres
# DB_PASSWORD=postgres
```

### 방법 2: 로컬 DB → 클라우드 업로드

`.env` 파일에 추가:
```bash
# 로컬 DB (기존 설정 유지)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=startsmart
DB_USER=postgres
DB_PASSWORD=postgres

# 클라우드 DB (업로드용)
CLOUD_DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

## 🚀 로컬 DB 업로드

로컬 DB 데이터를 Supabase로 업로드:

```bash
node backend/db/upload-to-cloud.js
```

이 명령어는:
1. 로컬 DB에서 덤프 생성
2. Supabase에 업로드
3. 임시 파일 정리

## ✅ 확인

### Supabase 대시보드에서 확인
1. 왼쪽 메뉴에서 **Table Editor** 클릭
2. `brands` 테이블 확인
3. `analyses` 테이블 확인
4. 데이터가 올바르게 업로드되었는지 확인

### 로컬에서 테스트
```bash
# 서버 실행
npm start

# 브랜드 목록 확인
curl http://localhost:3000/api/brands
```

## 🔄 다른 노트북에서 사용

다른 노트북에서도 같은 Supabase DB를 사용하려면:

1. `.env` 파일에 `DATABASE_URL` 설정 (위와 동일)
2. 서버 실행: `npm start`
3. 완료!

## 💡 팁

### 연결 풀링 vs Session mode
- **Connection pooling** (포트 6543): 많은 동시 연결에 적합
- **Session mode** (포트 5432): 일반적인 사용에 적합

### 비밀번호 찾기
비밀번호를 잊어버렸다면:
1. Supabase 대시보드 → **Settings** → **Database**
2. **Reset database password** 클릭
3. 새 비밀번호 설정
4. `.env` 파일의 `DATABASE_URL` 업데이트

### 보안 주의사항
- `.env` 파일은 절대 Git에 커밋하지 마세요
- 비밀번호는 안전하게 보관하세요
- 프로덕션에서는 환경변수로 관리하세요

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 연결 가이드](https://supabase.com/docs/guides/database/connecting-to-postgres)
