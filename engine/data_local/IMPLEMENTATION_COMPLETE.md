# 브랜드 데이터 기반 계산 시스템 구현 완료

## ✅ 완료된 작업

### 1. 브랜드 데이터 구조 생성 ✅
- **파일**: `engine/data_local/brands.json`
- **내용**: 12개 프랜차이즈의 기본값 데이터
  - 평균 단가, 원가율, 인건비율 등
  - 초기 투자금 범위
  - 메타데이터 (PDF 파일명, 출처, 업데이트 날짜)

### 2. 브랜드 데이터 로더 생성 ✅
- **파일**: `engine/data_local/brandLoader.js`
- **기능**:
  - `getBrandForEngine(brandId)`: 브랜드 ID로 데이터 로드
  - `getAllBrands()`: 모든 브랜드 목록 조회
  - `validateBrandDefaults()`: 브랜드 데이터 검증

### 3. 엔진 통합 ✅
- **파일**: `engine/fixtures/mega-gangnam.js` (업데이트)
- **변경**: 하드코딩된 브랜드 데이터 → `getBrandForEngine()` 사용

### 4. 브랜드별 테스트 ✅
- **파일**: `engine/fixtures/brand-test.js`
- **기능**: 모든 브랜드 계산 테스트 및 결과 비교

### 5. 사용 예제 작성 ✅
- **파일**: `engine/data_local/USAGE_EXAMPLE.js`
- **내용**: 4가지 사용 예제 제공

---

## 📊 테스트 결과

### 모든 브랜드 계산 성공 ✅

12개 브랜드 모두 정상적으로 계산되었습니다:

| 브랜드 | 평균 단가 | 회수 기간 | 월 순이익 | 점수 |
|--------|----------|----------|----------|------|
| 파리바게트 | 4,500원 | 16.5개월 | 1,212만원 | 82 |
| 뚜레쥬르 | 4,200원 | 17.5개월 | 1,143만원 | 82 |
| 투썸플레이스 | 5,500원 | 19.3개월 | 1,034만원 | 82 |
| 할리스 | 5,200원 | 19.4개월 | 1,032만원 | 82 |
| 탐앤탐스 | 4,200원 | 20.4개월 | 979만원 | 82 |
| 이디야커피 | 3,800원 | 22.2개월 | 901만원 | 82 |
| 빽다방 | 4,050원 | 22.4개월 | 894만원 | 82 |
| 메가커피 | 3,500원 | 23.7개월 | 845만원 | 82 |
| 던킨도너츠 | 3,200원 | 24.7개월 | 808만원 | 71 |
| 만렙커피 | 3,100원 | 25.0개월 | 799만원 | 71 |
| 컴포즈커피 | 3,250원 | 26.4개월 | 758만원 | 71 |
| 바나프레소 | 3,000원 | 28.2개월 | 709만원 | 71 |

---

## 🔧 사용 방법

### 기본 사용법

```js
const { getBrandForEngine } = require('./data_local/brandLoader');
const { calculate } = require('./finance');

// 1. 브랜드 데이터 로드
const brand = getBrandForEngine('brand_mega');

// 2. 손익 계산
const result = calculate({
  brand: brand,
  conditions: {
    initialInvestment: 200000000,
    monthlyRent: 4000000,
    area: 10,
    ownerWorking: true
  },
  market: {
    expectedDailySales: 256,
    radiusM: 500
  },
  targetDailySales: 300
});
```

### 브랜드 목록 조회

```js
const { getAllBrands } = require('./data_local/brandLoader');

const brands = getAllBrands();
// [
//   { id: "brand_mega", name: "메가커피", position: "저가형", ... },
//   { id: "brand_compose", name: "컴포즈커피", position: "저가형", ... },
//   ...
// ]
```

### 브랜드별 테스트

```bash
# 단일 브랜드 테스트
node engine/fixtures/brand-test.js brand_mega

# 모든 브랜드 테스트
node engine/fixtures/brand-test.js
```

---

## 📋 브랜드 목록 (12개)

1. **메가커피** (brand_mega) - 저가형
2. **컴포즈커피** (brand_compose) - 저가형
3. **빽다방** (brand_baek) - 중가형
4. **이디야커피** (brand_ediya) - 중가형
5. **투썸플레이스** (brand_twosome) - 프리미엄
6. **할리스** (brand_hollys) - 프리미엄
7. **탐앤탐스** (brand_tomntoms) - 중가형
8. **던킨도너츠** (brand_dunkin) - 베이커리
9. **파리바게트** (brand_paris) - 베이커리
10. **뚜레쥬르** (brand_tous) - 베이커리
11. **바나프레소** (brand_banapresso) - 저가형
12. **만렙커피** (brand_manleap) - 저가형

---

## 📝 데이터 업데이트 방법

### PDF에서 데이터 추출

1. 각 브랜드의 정보공개서 PDF 확인
2. 다음 정보 추출:
   - 평균 객단가
   - 원가율 (원재료비 / 매출)
   - 인건비율 (인건비 / 매출)
   - 로열티율, 마케팅비율
   - 초기 투자금 범위
3. `brands.json` 파일에 입력
4. `validateBrandDefaults()`로 검증

---

## 🎯 다음 단계

### 백엔드 통합
- 백엔드에서 `getBrandForEngine()` 사용하여 브랜드 데이터 로드
- `/api/brands` 엔드포인트에서 `getAllBrands()` 사용

### 프론트엔드 연동
- 브랜드 선택 시 `brandId` 전달
- 백엔드에서 해당 브랜드 데이터로 계산

### PDF 파싱 자동화 (선택적)
- PDF 파싱 라이브러리 사용하여 자동 추출
- 현재는 수동 입력 방식

---

## ✅ 검증 완료

- [x] 모든 브랜드 데이터 정상 로드
- [x] 브랜드별 계산 정상 작동
- [x] 데이터 검증 통과
- [x] 예제 코드 정상 작동
- [x] 테스트 통과

**모든 작업 완료!** 🎉
