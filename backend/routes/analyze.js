/**
 * 분석 실행 API
 * POST /api/analyze
 */

const router = require('express').Router();
const { runAnalysis } = require('../services/orchestrator');

// 분석 결과 임시 저장 (실제로는 DB 사용)
const analysisStore = new Map();

router.post('/', async (req, res) => {
  try {
    const { brandId, location, radius, conditions, targetDailySales } = req.body;

    // 입력 검증
    if (!brandId || !location || !conditions || !targetDailySales) {
      return res.status(400).json({
        success: false,
        error: '필수 입력값이 누락되었습니다.'
      });
    }

    // 분석 ID 생성
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 분석 상태를 pending으로 저장
    analysisStore.set(analysisId, {
      id: analysisId,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // 비동기로 분석 실행 (응답은 즉시 반환)
    runAnalysis({
      analysisId,
      brandId,
      location,
      radius: radius || 500,
      conditions,
      targetDailySales
    }, analysisStore).catch(err => {
      console.error(`[${analysisId}] 분석 실행 오류:`, err);
      const stored = analysisStore.get(analysisId);
      if (stored) {
        stored.status = 'failed';
        stored.error = err.message;
        analysisStore.set(analysisId, stored);
      }
    });

    res.json({
      success: true,
      analysisId: analysisId,
      message: '분석을 시작합니다.'
    });
  } catch (error) {
    console.error('분석 요청 오류:', error);
    res.status(500).json({
      success: false,
      error: '분석 요청 처리 중 오류가 발생했습니다.'
    });
  }
});

// 분석 스토어를 result.js에서 사용할 수 있도록 export
module.exports = router;
module.exports.analysisStore = analysisStore;
