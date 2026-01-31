/**
 * PDF 리포트 생성 API
 * POST /api/report/:analysisId
 */

const router = require('express').Router();
const { analysisStore } = require('./analyze');

router.post('/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const result = analysisStore.get(analysisId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: '분석 결과를 찾을 수 없습니다.'
      });
    }

    if (result.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: '분석이 완료되지 않았습니다.'
      });
    }

    // TODO: PDF 생성 로직 구현
    // 현재는 임시 응답
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      reportId: reportId,
      reportUrl: `/reports/${reportId}.pdf`,
      message: 'PDF 리포트 생성이 완료되었습니다.'
    });
  } catch (error) {
    console.error('리포트 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '리포트 생성 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
