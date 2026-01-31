/**
 * GET /api/brands - 브랜드 목록 조회
 * shared/interfaces.js 형식 준수
 */
const express = require('express');
const router = express.Router();

const MOCK_BRANDS = [
  { id: 'brand_1', name: '스타벅스', position: '프리미엄', initialInvestment: 500000000, monthlyRoyalty: 5, monthlyMarketing: 2, avgDailySales: 250 },
  { id: 'brand_2', name: '이디야', position: '스탠다드', initialInvestment: 200000000, monthlyRoyalty: 4, monthlyMarketing: 1, avgDailySales: 200 },
  { id: 'brand_3', name: '투썸플레이스', position: '프리미엄', initialInvestment: 350000000, monthlyRoyalty: 5, monthlyMarketing: 2, avgDailySales: 220 },
  { id: 'brand_4', name: '메가커피', position: '저가', initialInvestment: 80000000, monthlyRoyalty: 3, monthlyMarketing: 1, avgDailySales: 300 },
  { id: 'brand_5', name: '컴포즈커피', position: '저가', initialInvestment: 70000000, monthlyRoyalty: 3, monthlyMarketing: 1, avgDailySales: 280 },
  { id: 'brand_6', name: '빽다방', position: '스탠다드', initialInvestment: 150000000, monthlyRoyalty: 4, monthlyMarketing: 1, avgDailySales: 230 },
  { id: 'brand_7', name: '할리스', position: '프리미엄', initialInvestment: 400000000, monthlyRoyalty: 5, monthlyMarketing: 2, avgDailySales: 200 },
  { id: 'brand_8', name: '탐앤탐스', position: '스탠다드', initialInvestment: 180000000, monthlyRoyalty: 4, monthlyMarketing: 1, avgDailySales: 210 },
  { id: 'brand_9', name: '스타벅스 리저브', position: '프리미엄', initialInvestment: 600000000, monthlyRoyalty: 6, monthlyMarketing: 2, avgDailySales: 180 },
  { id: 'brand_10', name: '더벤티', position: '저가', initialInvestment: 90000000, monthlyRoyalty: 3, monthlyMarketing: 1, avgDailySales: 260 },
  { id: 'brand_11', name: '요거트아이스크림', position: '스탠다드', initialInvestment: 250000000, monthlyRoyalty: 4, monthlyMarketing: 1, avgDailySales: 190 },
  { id: 'brand_12', name: '엔젤리너스', position: '프리미엄', initialInvestment: 450000000, monthlyRoyalty: 5, monthlyMarketing: 2, avgDailySales: 210 },
];

router.get('/', (req, res) => {
  res.json({ success: true, brands: MOCK_BRANDS });
});

module.exports = router;
