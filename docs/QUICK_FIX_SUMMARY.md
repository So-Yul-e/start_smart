# 빠른 에러 해결 요약

## 발생한 에러들

### 1. `Cannot find module 'pg'`
**원인**: 의존성 미설치  
**해결**: ✅ `npm install` 실행 완료

### 2. `Cannot find module 'backend/server.js'`
**원인**: 잘못된 실행 위치 (`backend` 폴더에서 실행)  
**해결**: ✅ 루트 폴더에서 실행하도록 안내

### 3. `EADDRNOTAVAIL: address not available 172.16.48.47:3000`
**원인**: `.env` 파일의 `HOST=172.16.48.47`이 현재 시스템 IP와 불일치  
**해결**: ✅ `HOST=localhost`로 변경 완료

---

## ✅ 최종 해결 방법

### 1. 의존성 설치 (처음 한 번만)
```powershell
cd C:\ai_fast_builderthon\start_smart
npm install
```

### 2. 환경변수 설정 확인
`.env` 파일에서:
```bash
HOST=localhost  # 또는 HOST 줄 제거
```

### 3. 서버 실행
```powershell
npm start
```

---

## 📋 서버 실행 체크리스트

- [x] 의존성 설치 완료 (`npm install`)
- [x] `.env` 파일의 `HOST` 설정 확인
- [x] 루트 폴더에서 실행
- [ ] 서버 정상 시작 확인

---

**문서 버전**: 1.0  
**생성일**: 2025-01-15
