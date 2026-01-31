/**
 * 분석 실행 API
 * POST /api/analyze
 */

const router = require('express').Router();
const { runAnalysis } = require('../services/orchestrator');
const { createAnalysis, updateAnalysis } = require('../db/analysisRepository');

router.post('/', async (req, res) => {
  try {
    console.log('[분석 요청] 요청 받음');
    console.log('[분석 요청] 요청 본문:', JSON.stringify(req.body, null, 2));
    
    const { brandId, location, radius, conditions, targetDailySales, roadviewAnalysis } = req.body;

    // 입력 검증
    console.log('[분석 요청] 입력 검증 시작:', {
      hasBrandId: !!brandId,
      hasLocation: !!location,
      hasConditions: !!conditions,
      hasTargetDailySales: !!targetDailySales
    });
    
    if (!brandId || !location || !conditions || !targetDailySales) {
      console.error('[분석 요청] 필수 입력값 누락:', {
        brandId: !!brandId,
        location: !!location,
        conditions: !!conditions,
        targetDailySales: !!targetDailySales
      });
      return res.status(400).json({
        success: false,
        error: '필수 입력값이 누락되었습니다.'
      });
    }

    // 분석 ID 생성 (타임스탬프 + 랜덤 문자열로 고유성 보장)
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('[분석 요청] 분석 ID 생성:', analysisId);
    console.log('[분석 요청] 현재 시간:', new Date().toISOString());

    // DB에 분석 요청 저장
    console.log('[분석 요청] DB 저장 시작...');
    try {
      await createAnalysis({
        id: analysisId,
        brandId,
        location,
        radius: radius || 500,
        conditions,
        targetDailySales
      });
      console.log('[분석 요청] DB 저장 완료');
    } catch (dbError) {
      console.error('[분석 요청] DB 저장 실패:', dbError);
      console.error('[분석 요청] DB 저장 실패 스택:', dbError.stack);
      throw dbError;
    }

    // 비동기로 분석 실행 (응답은 즉시 반환)
    console.log('[분석 요청] 분석 실행 시작...');
    console.log('[분석 요청] runAnalysis 함수 타입:', typeof runAnalysis);
    console.log('[분석 요청] runAnalysis 함수 존재:', !!runAnalysis);
    
    if (typeof runAnalysis !== 'function') {
      console.error('[분석 요청] ❌ runAnalysis가 함수가 아닙니다!');
      return res.status(500).json({
        success: false,
        error: '분석 실행 함수를 찾을 수 없습니다.'
      });
    }
    
    // 분석 실행 (비동기, await 없음)
    console.log('[분석 요청] runAnalysis 호출 전...');
    try {
      const analysisPromise = runAnalysis({
        analysisId,
        brandId,
        location,
        radius: radius || 500,
        conditions,
        targetDailySales,
        roadviewAnalysis // 프론트엔드에서 전송한 로드뷰 분석 결과
      }, updateAnalysis);
      
      console.log('[분석 요청] runAnalysis Promise 생성됨:', !!analysisPromise);
      console.log('[분석 요청] Promise 타입:', analysisPromise instanceof Promise ? 'Promise' : typeof analysisPromise);
      
      analysisPromise.catch(async (err) => {
        console.error(`[${analysisId}] 분석 실행 오류:`, err);
        console.error(`[${analysisId}] 분석 실행 오류 스택:`, err.stack);
        await updateAnalysis(analysisId, {
          status: 'failed',
          errorMessage: err.message
        });
      });
    } catch (syncError) {
      console.error('[분석 요청] runAnalysis 동기 오류:', syncError);
      console.error('[분석 요청] runAnalysis 동기 오류 스택:', syncError.stack);
      await updateAnalysis(analysisId, {
        status: 'failed',
        errorMessage: syncError.message
      });
    }

    console.log('[분석 요청] 응답 전송:', analysisId);
    res.json({
      success: true,
      analysisId: analysisId,
      message: '분석을 시작합니다.'
    });
  } catch (error) {
    console.error('[분석 요청] 오류 발생:', error);
    console.error('[분석 요청] 오류 메시지:', error.message);
    console.error('[분석 요청] 오류 스택:', error.stack);
    res.status(500).json({
      success: false,
      error: '분석 요청 처리 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
