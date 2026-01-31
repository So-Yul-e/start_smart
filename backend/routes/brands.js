/**
 * 브랜드 목록 조회 API
 * GET /api/brands
 */

const router = require('express').Router();
const pool = require('../db/connection');

// 브랜드 목록 (DB에서 조회)
async function getAllBrands() {
  const result = await pool.query(
    'SELECT id, name, position, initial_investment as "initialInvestment", monthly_royalty as "monthlyRoyalty", monthly_marketing as "monthlyMarketing", avg_daily_sales as "avgDailySales" FROM brands ORDER BY id'
  );
  return result.rows;
}

// 브랜드 ID로 조회
async function getBrandById(brandId) {
  const result = await pool.query(
    'SELECT id, name, position, initial_investment as "initialInvestment", monthly_royalty as "monthlyRoyalty", monthly_marketing as "monthlyMarketing", avg_daily_sales as "avgDailySales" FROM brands WHERE id = $1',
    [brandId]
  );
  return result.rows[0] || null;
}

// 하위 호환성을 위한 임시 데이터 (DB 연결 실패 시 사용)
const fallbackBrands = [
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

router.get('/', async (req, res) => {
  try {
    const brands = await getAllBrands();
    res.json({
      success: true,
      brands: brands
    });
  } catch (error) {
    console.error('브랜드 목록 조회 오류:', error);
    // DB 연결 실패 시 fallback 데이터 사용
    res.json({
      success: true,
      brands: fallbackBrands,
      warning: '데이터베이스 연결 실패로 임시 데이터를 사용합니다.'
    });
  }
});

// 브랜드 데이터를 다른 모듈에서도 사용할 수 있도록 export
module.exports = router;
module.exports.getBrandById = getBrandById;
module.exports.getAllBrands = getAllBrands;
// 하위 호환성을 위한 fallback
module.exports.brands = fallbackBrands;