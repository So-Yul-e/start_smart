# 브랜드 데이터 관리

## 📁 파일 구조

```
engine/data_local/
├── brands.json              # 브랜드 기본값 데이터 (JSON)
├── brandLoader.js           # 브랜드 데이터 로더
├── dbLoader.js              # 데이터베이스 로더 (DB → JSON fallback)
├── db-schema.sql            # MySQL 스키마
├── db-schema-postgresql.sql # PostgreSQL 스키마
├── README.md                # 본 문서
└── *.pdf                    # 각 브랜드 정보공개서 PDF (12개)
```

## 🔄 데이터 로드 순서

1. **데이터베이스** (1차): `.env`에 정의된 DB에서 로드
2. **brands.json** (2차): DB 에러 시 자동 fallback

## ⚙️ 설정 방법

### 데이터베이스 사용 (선택)

`.env` 파일에 추가:
```bash
USE_DATABASE=true
DB_TYPE=mysql  # 또는 postgresql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=startsmart
```

### JSON 파일만 사용 (기본)

`.env`에 `USE_DATABASE=false` 설정하거나 DB 정보를 제거하면 자동으로 `brands.json` 사용

## 📊 브랜드 데이터 구조

### brands.json 구조

```json
{
  "brands": [
    {
      "id": "brand_mega",
      "name": "메가커피",
      "position": "저가형",
      "defaults": {
        "avgPrice": 3500,
        "cogsRate": 0.35,
        "laborRate": 0.20,
        "utilitiesRate": 0.03,
        "etcFixed": 1100000,
        "royaltyRate": 0.05,
        "marketingRate": 0.02,
        "ownerWorkingMultiplier": 0.6,
        "expectedDailySales": null
      },
      "initialInvestmentRange": {
        "min": 76000000,
        "max": 76000000,
        "note": "본사 기준 창업비"
      },
      "metadata": {
        "pdfFile": "메가커피.pdf",
        "source": "정보공개서",
        "lastUpdated": "2024"
      }
    }
  ]
}
```

## 🔧 사용 방법

### 1. 브랜드 데이터 로드

```js
const { getBrandForEngine, getAllBrands } = require('./data_local/brandLoader');

// 특정 브랜드 조회
const brand = getBrandForEngine('brand_mega');

// 모든 브랜드 목록 조회
const brands = getAllBrands();
```

### 2. 엔진에서 사용

```js
const { getBrandForEngine } = require('./data_local/brandLoader');
const { calculate } = require('./finance');

// 브랜드 데이터 로드
const brand = getBrandForEngine('brand_mega');

// 손익 계산
const result = calculate({
  brand: brand,
  conditions: { ... },
  market: { ... },
  targetDailySales: 300
});
```

## 📝 데이터 업데이트 방법

### PDF에서 데이터 추출

각 브랜드의 정보공개서 PDF에서 다음 정보를 추출하여 `brands.json`에 입력:

1. **평균 단가 (avgPrice)**: 정보공개서의 평균 객단가
2. **원가율 (cogsRate)**: 원재료비 / 매출 비율
3. **인건비율 (laborRate)**: 인건비 / 매출 비율
4. **공과금 비율 (utilitiesRate)**: 공과금 / 매출 비율
5. **기타 고정비 (etcFixed)**: 로열티 + 기타비용 (고정)
6. **로열티율 (royaltyRate)**: 로열티 / 매출 비율
7. **마케팅비율 (marketingRate)**: 마케팅비 / 매출 비율
8. **초기 투자금 범위**: 정보공개서의 창업비 범위

### 데이터 검증

```js
const { validateBrandDefaults } = require('./data_local/brandLoader');

const brand = getBrandById('brand_mega');
const validation = validateBrandDefaults(brand);

if (!validation.valid) {
  console.error('검증 실패:', validation.errors);
}
```

## ⚠️ 주의사항

1. **데이터 출처**: 모든 데이터는 정보공개서 PDF에서 추출
2. **업데이트 주기**: 정보공개서 갱신 시 `brands.json`도 업데이트 필요
3. **기본값 우선순위**: 
   - `market.expectedDailySales` → `brand.defaults.expectedDailySales` → `targetDailySales`
4. **데이터 정확성**: PDF 파싱이 어려운 경우 수동으로 입력

## 📋 브랜드 목록

1. 메가커피 (brand_mega)
2. 컴포즈커피 (brand_compose)
3. 빽다방 (brand_baek)
4. 이디야커피 (brand_ediya)
5. 투썸플레이스 (brand_twosome)
6. 할리스 (brand_hollys)
7. 탐앤탐스 (brand_tomntoms)
8. 던킨도너츠 (brand_dunkin)
9. 파리바게트 (brand_paris)
10. 뚜레쥬르 (brand_tous)
11. 바나프레소 (brand_banapresso)
12. 만렙커피 (brand_manleap)
