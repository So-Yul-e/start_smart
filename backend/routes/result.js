/**
 * GET /api/result/:analysisId - 분석 결과 조회 (스텁)
 * 실제 연동 시 저장소/캐시에서 결과 반환
 */
const express = require('express');
const router = express.Router();

router.get('/:analysisId', (req, res) => {
  res.status(404).json({
    success: false,
    message: '해당 분석 결과가 없습니다. (스텁: 오케스트레이터 연동 후 결과 저장/조회 구현)',
  });
});

module.exports = router;
