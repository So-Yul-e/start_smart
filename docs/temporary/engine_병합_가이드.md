# Engine 모듈 병합 가이드

## feature/engine 브랜치를 feature/backend에 병합하기

### 1단계: 원격 브랜치 가져오기

```bash
# 현재 feature/backend 브랜치에 있는지 확인
git status

# 원격 브랜치 정보 가져오기
git fetch origin

# feature/engine 브랜치 확인
git branch -r | grep engine
```

### 2단계: feature/engine 브랜치 병합

```bash
# feature/backend 브랜치에서 (현재 브랜치)
git merge origin/feature/engine
```

또는 더 안전한 방법:

```bash
# feature/engine 브랜치를 로컬로 가져오기
git checkout -b feature/engine origin/feature/engine

# 다시 feature/backend로 돌아오기
git checkout feature/backend

# 병합
git merge feature/engine
```

### 3단계: 병합 후 확인

```bash
# engine 폴더가 제대로 병합되었는지 확인
ls -la engine/

# engine/finance/index.js 확인
cat engine/finance/index.js

# engine/decision/index.js 확인
cat engine/decision/index.js
```

### 4단계: orchestrator.js 수정

병합 후 `backend/services/orchestrator.js`에서 TODO 주석을 해제하고 실제 함수를 사용하도록 수정:

```javascript
// TODO 주석 해제
const { calculateFinance } = require('../../engine/finance');
const { calculateDecision } = require('../../engine/decision');

// Mock 데이터 대신 실제 함수 호출
finance = calculateFinance({ brand, conditions, targetDailySales });
decision = calculateDecision({ finance, market, roadview });
```

### 5단계: 테스트

```bash
# 서버 실행
node backend/server.js

# 다른 터미널에서 분석 요청 테스트
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand_1",
    "location": {"lat": 37.4980, "lng": 127.0276, "address": "서울특별시 강남구"},
    "radius": 500,
    "conditions": {
      "initialInvestment": 500000000,
      "monthlyRent": 3000000,
      "area": 33,
      "ownerWorking": true
    },
    "targetDailySales": 300
  }'
```

### 6단계: 충돌 해결 (필요 시)

병합 중 충돌이 발생하면:

```bash
# 충돌 파일 확인
git status

# 충돌 해결 후
git add .
git commit -m "[Backend] feature/engine 병합 완료"
```

### 7단계: 푸시

```bash
git push origin feature/backend
```

## 확인 사항

병합 후 다음을 확인하세요:

- [ ] `engine/finance/index.js`에 `calculateFinance` 함수가 export되어 있는지
- [ ] `engine/decision/index.js`에 `calculateDecision` 함수가 export되어 있는지
- [ ] `shared/interfaces.js`의 형식과 일치하는지
- [ ] `orchestrator.js`에서 실제 함수를 호출하도록 수정했는지
- [ ] 테스트가 정상적으로 동작하는지

## 문제 해결

### "fatal: refusing to merge unrelated histories" 에러

```bash
git merge origin/feature/engine --allow-unrelated-histories
```

### 충돌 발생 시

1. 충돌 파일 확인: `git status`
2. 충돌 해결: 파일을 열어서 `<<<<<<<`, `=======`, `>>>>>>>` 마커 제거
3. 해결 후: `git add .` → `git commit`
