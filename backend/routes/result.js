/**
 * 분석 결과 조회 API
 * GET /api/result/:analysisId
 */

const router = require('express').Router();
const { analysisStore } = require('./analyze');

router.get('/:analysisId', (req, res) => {
  try {
    const { analysisId } = req.params;
    const result = analysisStore.get(analysisId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: '분석 결과를 찾을 수 없습니다.'
      });
    }

    // 상태에 따라 응답
    if (result.status === 'pending' || result.status === 'processing') {
      return res.json({
        success: true,
        status: result.status,
        message: '분석이 진행 중입니다. 잠시 후 다시 시도해주세요.'
      });
    }

    if (result.status === 'failed') {
      return res.status(500).json({
        success: false,
        status: 'failed',
        error: result.error || '분석 중 오류가 발생했습니다.'
      });
    }

    // 완료된 결과 반환
    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('결과 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '결과 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
