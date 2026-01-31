/**
 * POST /api/report/:analysisId - PDF 리포트 생성 (스텁)
 * 실제 연동 시 jspdf 등으로 PDF 생성
 */
const express = require('express');
const router = express.Router();

router.post('/:analysisId', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'PDF 리포트 생성 미구현. (스텁: report 모듈 연동 후 구현)',
  });
});

module.exports = router;
