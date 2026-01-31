/**
 * 분석 결과 조회 API
 * GET /api/result/:analysisId
 */

const router = require('express').Router();
const { getAnalysis } = require('../db/analysisRepository');

router.get('/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log(`[결과 조회] ========== 요청 받음 ==========`);
    console.log(`[결과 조회] 분석 ID: ${analysisId}`);
    console.log(`[결과 조회] 환경:`, {
      isVercel,
      isProduction,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    const analysis = await getAnalysis(analysisId);

    if (!analysis) {
      console.log(`[결과 조회] 분석을 찾을 수 없음: ${analysisId}`);
      return res.status(404).json({
        success: false,
        status: 'not_found',
        error: '분석 결과를 찾을 수 없습니다.'
      });
    }

    console.log(`[결과 조회] 분석 상태: ${analysis.status}, result 있음: ${!!analysis.result}, result 타입: ${typeof analysis.result}`);
    console.log(`[결과 조회] 생성 시간: ${analysis.createdAt}, 업데이트 시간: ${analysis.updatedAt}`);

    // 상태에 따라 응답
    if (analysis.status === 'pending' || analysis.status === 'processing') {
      console.log(`[결과 조회] 분석 진행 중 응답 (status: ${analysis.status})`);
      return res.json({
        success: true,
        status: analysis.status,
        message: '분석이 진행 중입니다. 잠시 후 다시 시도해주세요.'
      });
    }

    if (analysis.status === 'failed') {
      console.log(`[결과 조회] 분석 실패: ${analysis.errorMessage || '알 수 없는 오류'}`);
      return res.status(500).json({
        success: false,
        status: 'failed',
        error: analysis.errorMessage || analysis.error || '분석 중 오류가 발생했습니다.'
      });
    }

    // completed 상태
    if (analysis.status === 'completed') {
      if (!analysis.result) {
        console.warn(`[결과 조회] 분석 완료이지만 result가 없음: ${analysisId}`);
        return res.status(500).json({
          success: false,
          status: 'completed_no_data',
          error: '분석이 완료되었지만 결과 데이터가 없습니다.'
        });
      }
      console.log(`[결과 조회] 분석 완료, 결과 반환`);
      return res.json({
        success: true,
        status: 'completed',
        result: analysis.result
      });
    }

    // 예상치 못한 상태
    console.warn(`[결과 조회] 예상치 못한 상태: ${analysis.status}`);
    return res.json({
      success: true,
      status: analysis.status || 'unknown',
      message: '분석 상태를 확인할 수 없습니다.'
    });
  } catch (error) {
    console.error('[결과 조회] ❌ 오류 발생:', error);
    console.error('[결과 조회] ❌ 오류 메시지:', error.message);
    console.error('[결과 조회] ❌ 오류 스택:', error.stack);
    console.error('[결과 조회] ❌ 오류 코드:', error.code);
    console.error('[결과 조회] ❌ 오류 타입:', error.constructor.name);
    res.status(500).json({
      success: false,
      status: 'error',
      error: '결과 조회 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
