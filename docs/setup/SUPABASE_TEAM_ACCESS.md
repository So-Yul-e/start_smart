# Supabase 팀 멤버 접근 권한 설정 가이드

다른 사람이 Supabase 프로젝트에 접근할 수 있도록 권한을 부여하는 방법입니다.

## 🎯 방법 비교

| 방법 | 장점 | 단점 | 권장도 |
|------|------|------|--------|
| **팀 멤버 초대** | ✅ 간단<br>✅ 대시보드 접근 가능<br>✅ 권한 관리 쉬움 | ⚠️ Supabase 계정 필요 | ⭐⭐⭐⭐⭐ |
| **연결 문자열 공유** | ✅ 빠른 설정<br>✅ 계정 불필요 | ❌ 대시보드 접근 불가<br>❌ 보안 위험 | ⭐⭐⭐ |
| **새 DB 사용자 생성** | ✅ 세밀한 권한 제어 | ❌ 복잡한 설정<br>❌ 관리 어려움 | ⭐⭐ |

## 🚀 방법 1: 팀 멤버 초대 (권장)

**⚠️ 참고:** Supabase 무료 플랜에서는 팀 기능이 제한적일 수 있습니다. 팀 메뉴가 보이지 않으면 **방법 2: 연결 문자열 공유**를 사용하세요.

### 1단계: Supabase 대시보드 접속

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `start_smart` (또는 `oetxnpgfsmmxcgnelhvd`)

### 2단계: 팀 설정 열기

**옵션 A: Settings에서 찾기**
1. 왼쪽 메뉴에서 **Settings** (⚙️) 클릭
2. **Team** 또는 **Members** 탭 확인

**옵션 B: 상단 메뉴에서 찾기**
1. 대시보드 상단의 프로젝트 이름 옆 드롭다운 클릭
2. **Team** 또는 **Organization** 메뉴 확인

**옵션 C: 조직(Organization) 생성**
- 무료 플랜에서 팀 기능이 없다면:
  1. 상단 우측 프로필 아이콘 클릭
  2. **Create Organization** 또는 **New Organization** 클릭
  3. 조직 생성 후 프로젝트를 조직으로 이동

**팀 메뉴가 없다면?** → **방법 2: 연결 문자열 공유**를 사용하세요.

### 3단계: 멤버 초대

1. **Invite member** 또는 **Add member** 버튼 클릭
2. 초대할 사람의 **이메일 주소** 입력
3. **역할(Role)** 선택:
   - **Owner**: 모든 권한 (프로젝트 삭제 포함)
   - **Admin**: 대부분의 권한 (프로젝트 삭제 제외)
   - **Developer**: 개발 권한 (DB 접근, API 키 확인 등)
   - **Viewer**: 읽기 전용 권한
4. **Send invitation** 클릭

### 4단계: 초대 수락

초대받은 사람은:
1. 이메일에서 초대 링크 클릭
2. Supabase 계정으로 로그인 (또는 회원가입)
3. 프로젝트 접근 권한 획득

### 멤버 권한 상세

| 역할 | 대시보드 접근 | DB 접근 | API 키 | 프로젝트 설정 | 비용 관리 |
|------|--------------|---------|-------|--------------|----------|
| **Owner** | ✅ 전체 | ✅ 전체 | ✅ 전체 | ✅ 전체 | ✅ 전체 |
| **Admin** | ✅ 전체 | ✅ 전체 | ✅ 전체 | ✅ 대부분 | ❌ |
| **Developer** | ✅ 제한적 | ✅ 읽기/쓰기 | ✅ 확인 | ❌ | ❌ |
| **Viewer** | ✅ 읽기만 | ✅ 읽기만 | ✅ 확인만 | ❌ | ❌ |

## 🔑 방법 2: 연결 문자열 공유 (빠른 방법)

팀 멤버 초대 없이 빠르게 DB 접근만 허용하려면:

### 1단계: 연결 문자열 확인

1. Supabase 대시보드 → **Settings** → **Database**
2. **Connection string** 섹션에서:
   - **Session mode** (포트 6543) 선택
   - 연결 문자열 복사

### 2단계: 비밀번호 포함 연결 문자열 생성

```bash
# 형식
postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
```

**⚠️ 중요:**
- `[PASSWORD]`를 실제 Supabase 데이터베이스 비밀번호로 교체
- 비밀번호에 특수문자가 있으면 URL 인코딩 필요
  - 예: `!` → `%21`, `@` → `%40`, `#` → `%23`

### 3단계: 안전하게 공유

**보안 주의사항:**
- ✅ 비밀번호는 **암호화된 채널**로 공유 (예: Signal, 암호화된 메시지)
- ✅ `.env` 파일로 공유 (Git에 커밋하지 않기)
- ❌ 일반 이메일, 슬랙, 카카오톡 등으로 공유 금지
- ❌ GitHub, GitLab 등 공개 저장소에 커밋 금지

### 4단계: 다른 사람의 `.env` 파일 설정

다른 사람의 `.env` 파일에 추가:

```bash
DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
```

### 5단계: 연결 테스트

```bash
# 서버 실행
npm start

# 연결 확인
curl http://localhost:3000/api/brands
```

## 🔐 방법 3: 새 데이터베이스 사용자 생성 (고급)

더 세밀한 권한 제어가 필요한 경우:

### 1단계: SQL Editor 열기

1. Supabase 대시보드 → **SQL Editor** 클릭
2. **New query** 클릭

### 2단계: 새 사용자 생성

```sql
-- 새 사용자 생성
CREATE USER new_user WITH PASSWORD 'secure_password_here';

-- 특정 테이블에만 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.brands TO new_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.analyses TO new_user;

-- 시퀀스 권한 부여 (ID 자동 증가용)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO new_user;
```

### 3단계: 연결 문자열 생성

```bash
# 새 사용자용 연결 문자열
postgresql://new_user:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
```

## 📋 권장 방법 선택 가이드

### 팀 멤버 초대를 선택하는 경우:
- ✅ 팀원이 대시보드에서 데이터 확인이 필요
- ✅ 장기적인 협업
- ✅ 권한 관리가 중요
- ✅ 여러 사람이 동시에 작업

### 연결 문자열 공유를 선택하는 경우:
- ✅ 빠른 임시 접근
- ✅ 대시보드 접근 불필요
- ✅ 단기적인 협업
- ✅ 외부 개발자/컨설턴트

## ⚠️ 보안 주의사항

### 1. 비밀번호 관리
- 비밀번호는 **강력하게** 설정
- 정기적으로 비밀번호 변경
- 비밀번호는 안전하게 공유

### 2. 접근 권한 최소화
- 필요한 권한만 부여
- 불필요한 사용자는 제거
- 정기적으로 접근 로그 확인

### 3. 환경변수 보안
- `.env` 파일은 `.gitignore`에 포함 확인
- 공개 저장소에 커밋하지 않기
- 프로덕션에서는 환경변수로 관리

### 4. 연결 모니터링
- Supabase 대시보드 → **Database** → **Connection Pooling**에서 연결 확인
- 비정상적인 접근 패턴 감지

## 🔄 멤버 제거 방법

### 팀 멤버 제거:
1. Supabase 대시보드 → **Settings** → **Team**
2. 제거할 멤버 찾기
3. **Remove** 또는 **Delete** 클릭

### 연결 문자열 비활성화:
1. Supabase 대시보드 → **Settings** → **Database**
2. **Reset database password** 클릭
3. 새 비밀번호 설정
4. 기존 연결 문자열 무효화됨

## 📚 참고 자료

- [Supabase 팀 관리 문서](https://supabase.com/docs/guides/platform/team-management)
- [PostgreSQL 사용자 권한 관리](https://www.postgresql.org/docs/current/user-manag.html)
- [Supabase 보안 모범 사례](https://supabase.com/docs/guides/platform/security)

## ❓ 문제 해결

### 초대 이메일이 오지 않는 경우:
1. 스팸 폴더 확인
2. 이메일 주소 확인
3. Supabase 대시보드에서 초대 상태 확인

### 연결이 안 되는 경우:
1. 비밀번호 확인
2. 연결 문자열 형식 확인
3. 네트워크 방화벽 확인
4. Supabase 프로젝트 상태 확인 (일시 중지되지 않았는지)

### 권한 오류가 발생하는 경우:
1. 사용자 역할 확인
2. 테이블 권한 확인
3. RLS (Row Level Security) 정책 확인
