# 올바른 서버 실행 방법

**에러**: `Error: Cannot find module 'C:\ai_fast_builderthon\start_smart\backend\backend\server.js'`

---

## 🔍 에러 원인

**잘못된 실행 위치**: `backend` 폴더에서 `node backend/server.js` 실행

현재 위치가 `backend` 폴더인데, `backend/server.js`를 찾으려고 해서 경로가 중복됨:
- 잘못된 경로: `backend/backend/server.js` ❌
- 올바른 경로: `backend/server.js` ✅

---

## ✅ 올바른 실행 방법

### 방법 1: 루트 폴더에서 실행 (권장)

```powershell
# 1. 루트 폴더로 이동
cd C:\ai_fast_builderthon\start_smart

# 2. 서버 실행
npm start
```

또는:

```powershell
# 루트 폴더에서
node backend/server.js
```

### 방법 2: backend 폴더에서 실행 (가능하지만 비권장)

```powershell
# backend 폴더에서
cd C:\ai_fast_builderthon\start_smart\backend

# 경로를 지정하지 않고 실행
node server.js
```

---

## 📋 실행 위치별 명령어

| 현재 위치 | 올바른 명령어 | 잘못된 명령어 |
|----------|--------------|--------------|
| 루트 (`start_smart/`) | `npm start` 또는 `node backend/server.js` | `node server.js` ❌ |
| `backend/` 폴더 | `node server.js` | `node backend/server.js` ❌ |

---

## 🚀 빠른 시작 (권장)

```powershell
# 루트 폴더로 이동
cd C:\ai_fast_builderthon\start_smart

# 서버 실행
npm start
```

**예상 출력**:
```
✅ PostgreSQL 데이터베이스 연결 성공
서버가 http://localhost:3000 에서 실행 중입니다.
```

---

## 📝 프로젝트 구조

```
start_smart/                    ← 여기서 실행!
├── package.json
├── node_modules/
├── backend/
│   └── server.js               ← 실행할 파일
├── frontend/
└── ...
```

---

## ✅ 체크리스트

실행 전 확인:

- [ ] 현재 위치가 루트 폴더 (`start_smart/`)인지 확인
- [ ] `npm start` 또는 `node backend/server.js` 실행
- [ ] `backend` 폴더에서 실행하는 경우 `node server.js` 사용

---

**문서 버전**: 1.0  
**생성일**: 2025-01-15
