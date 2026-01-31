# Engine 폴더

Finance & Decision 계산 엔진

## 📁 구조

```
engine/
├── finance/          # 손익 계산 엔진
│   ├── index.js      #   손익 계산 메인 로직
│   ├── calculator.js #   계산식 구현
│   └── validator.js  #   출력 검증
├── decision/         # 점수/신호등 판단 엔진
│   ├── index.js      #   판단 메인 로직
│   ├── scorer.js     #   점수 산출 로직
│   └── validator.js  #   출력 검증
├── fixtures/         # 테스트 시나리오
└── data_local/       # 브랜드 데이터
```

## 📚 핵심 문서

- **[ROLE.md](./ROLE.md)** - 역할 정의 및 입출력 스펙
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API 문서
- **[BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md)** - 백엔드 통합 가이드
- **[EXAMPLE_INPUT_OUTPUT.md](./EXAMPLE_INPUT_OUTPUT.md)** - 입출력 예시

## 🧪 테스트

### 단위 테스트 실행
```bash
npm test
```

### 통합 테스트 실행
```bash
node fixtures/mega-gangnam.js
node fixtures/integration-scenarios.js
```

## ✅ 상태

- ✅ Finance 계산 엔진 완성
- ✅ Decision 판단 엔진 완성
- ✅ 검증 함수 구현
- ✅ 단위 테스트 (61개 테스트 통과)
- ✅ 통합 테스트
- ✅ 문서화 완료

**전체 진행률**: 95% (프로덕션 준비 완료)
