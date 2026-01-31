# HOST 에러 해결 가이드

**에러**: `Error: listen EADDRNOTAVAIL: address not available 172.16.48.47:3000`

---

## 🔍 에러 원인

`.env` 파일에 `HOST=172.16.48.47`로 설정되어 있는데, 이 IP 주소가 현재 시스템에 할당되지 않았습니다.

**가능한 원인**:
1. WiFi 네트워크 변경으로 IP 주소가 변경됨
2. 다른 컴퓨터의 IP 주소가 설정되어 있음
3. 네트워크 인터페이스가 비활성화됨

---

## ✅ 해결 방법

### 방법 1: localhost로 변경 (가장 간단, 권장)

`.env` 파일을 열어서:

```bash
# 기존 (잘못된 IP)
HOST=172.16.48.47

# 변경 (로컬에서만 접근)
HOST=localhost
```

또는 `HOST` 줄을 완전히 제거 (기본값 `localhost` 사용)

### 방법 2: 현재 IP 주소 확인 후 설정

**Windows에서 현재 IP 확인**:
```powershell
ipconfig | findstr IPv4
```

출력 예시:
```
IPv4 주소 . . . . . . . . . . . . : 192.168.0.100
```

`.env` 파일에 올바른 IP 설정:
```bash
HOST=192.168.0.100
```

### 방법 3: 모든 네트워크 인터페이스에서 접근 (개발 환경만)

`.env` 파일:
```bash
HOST=0.0.0.0
```

⚠️ **주의**: 보안상 취약할 수 있으므로 개발 환경에서만 사용하세요.

---

## 🚀 빠른 해결 (권장)

### 1. `.env` 파일 수정

`.env` 파일을 열어서 `HOST` 줄을 찾아:

**옵션 A**: `localhost`로 변경
```bash
HOST=localhost
```

**옵션 B**: `HOST` 줄 삭제 (기본값 사용)

### 2. 서버 재시작

```powershell
npm start
```

---

## 📋 HOST 설정 옵션 비교

| 설정 | 설명 | 보안 | 사용 시나리오 |
|------|------|------|-------------|
| `HOST=localhost` | 로컬에서만 접근 | 🔒 가장 안전 | 로컬 개발 (권장) |
| `HOST=127.0.0.1` | 로컬에서만 접근 | 🔒 가장 안전 | 로컬 개발 |
| `HOST=<로컬IP>` | 특정 IP로만 바인딩 | ✅ 안전 | 팀원과 공유 (권장) |
| `HOST=0.0.0.0` | 모든 인터페이스 | ⚠️ 취약 | 개발 환경만 |

---

## 🔧 현재 IP 확인 방법

### Windows
```powershell
ipconfig | findstr IPv4
```

### PowerShell (더 자세한 정보)
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object IPAddress, InterfaceAlias
```

---

## ✅ 체크리스트

- [ ] `.env` 파일에서 `HOST` 설정 확인
- [ ] `HOST=localhost`로 변경 또는 제거
- [ ] 서버 재시작 (`npm start`)
- [ ] 에러 없이 서버 시작 확인

---

## 📝 참고

- **로컬 개발**: `HOST=localhost` 권장
- **팀원과 공유**: 현재 IP 확인 후 `HOST=<현재IP>` 설정
- **IP 변경 시**: WiFi 재연결 시 IP가 변경될 수 있으므로 주의

---

**문서 버전**: 1.0  
**생성일**: 2025-01-15
