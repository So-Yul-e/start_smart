/**
 * 브랜드 목록 조회 API
 * GET /api/brands
 */

const router = require('express').Router();

// 브랜드 목록 (임시 데이터 - 추후 DB 연동)
const brands = [
  {
    id: "brand_1",
    name: "스타벅스",
    position: "프리미엄",
    initialInvestment: 500000000,
    monthlyRoyalty: 5,
    monthlyMarketing: 2,
    avgDailySales: 250
  },
  {
    id: "brand_2",
    name: "이디야커피",
    position: "스탠다드",
    initialInvestment: 200000000,
    monthlyRoyalty: 3,
    monthlyMarketing: 1,
    avgDailySales: 200
  },
  {
    id: "brand_3",
    name: "투썸플레이스",
    position: "프리미엄",
    initialInvestment: 450000000,
    monthlyRoyalty: 4,
    monthlyMarketing: 2,
    avgDailySales: 230
  },
  {
    id: "brand_4",
    name: "컴포즈커피",
    position: "스탠다드",
    initialInvestment: 150000000,
    monthlyRoyalty: 2,
    monthlyMarketing: 1,
    avgDailySales: 180
  },
  {
    id: "brand_5",
    name: "메가커피",
    position: "스탠다드",
    initialInvestment: 180000000,
    monthlyRoyalty: 2.5,
    monthlyMarketing: 1,
    avgDailySales: 190
  },
  {
    id: "brand_6",
    name: "할리스커피",
    position: "프리미엄",
    initialInvestment: 400000000,
    monthlyRoyalty: 4,
    monthlyMarketing: 2,
    avgDailySales: 220
  },
  {
    id: "brand_7",
    name: "카페베네",
    position: "스탠다드",
    initialInvestment: 220000000,
    monthlyRoyalty: 3,
    monthlyMarketing: 1.5,
    avgDailySales: 200
  },
  {
    id: "brand_8",
    name: "빽다방",
    position: "스탠다드",
    initialInvestment: 120000000,
    monthlyRoyalty: 2,
    monthlyMarketing: 1,
    avgDailySales: 170
  },
  {
    id: "brand_9",
    name: "탐앤탐스",
    position: "프리미엄",
    initialInvestment: 380000000,
    monthlyRoyalty: 4,
    monthlyMarketing: 2,
    avgDailySales: 210
  },
  {
    id: "brand_10",
    name: "카페드롭탑",
    position: "스탠다드",
    initialInvestment: 160000000,
    monthlyRoyalty: 2.5,
    monthlyMarketing: 1,
    avgDailySales: 185
  },
  {
    id: "brand_11",
    name: "엔젤리너스",
    position: "프리미엄",
    initialInvestment: 420000000,
    monthlyRoyalty: 4.5,
    monthlyMarketing: 2,
    avgDailySales: 240
  },
  {
    id: "brand_12",
    name: "더벤티",
    position: "스탠다드",
    initialInvestment: 140000000,
    monthlyRoyalty: 2,
    monthlyMarketing: 1,
    avgDailySales: 175
  }
];

router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      brands: brands
    });
  } catch (error) {
    console.error('브랜드 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '브랜드 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;

// 브랜드 데이터를 다른 모듈에서도 사용할 수 있도록 export
module.exports.brands = brands;
module.exports.getBrandById = (brandId) => {
  return brands.find(b => b.id === brandId) || null;
};
