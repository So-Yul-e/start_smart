/**
 * PDF 리포트 생성 API
 * POST /api/report/:analysisId
 */

const router = require('express').Router();
const { getAnalysis } = require('../db/analysisRepository'); // DB 저장소 임포트

router.post('/:analysisId', async (req, res) => {
  const analysisId = req.params.analysisId;
  
  try {
    console.log(`[리포트 생성] 분석 ID: ${analysisId}`);
    
    // DB에서 분석 결과 조회
    let analysis;
    try {
      analysis = await getAnalysis(analysisId);
    } catch (dbError) {
      console.error('[리포트 생성] DB 조회 오류:', dbError);
      return res.status(500).json({
        success: false,
        error: '분석 결과 조회 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
    
    console.log(`[리포트 생성] 분석 조회 결과:`, {
      found: !!analysis,
      status: analysis?.status,
      hasResult: !!analysis?.result,
      resultType: typeof analysis?.result
    });

    if (!analysis) {
      console.error('[리포트 생성] 분석 결과를 찾을 수 없음');
      return res.status(404).json({
        success: false,
        error: '분석 결과를 찾을 수 없습니다.'
      });
    }

    if (analysis.status !== 'completed') {
      console.error(`[리포트 생성] 분석이 완료되지 않음. 상태: ${analysis.status}`);
      return res.status(400).json({
        success: false,
        error: '분석이 완료되지 않았습니다.',
        currentStatus: analysis.status
      });
    }

    // 분석 결과 데이터 추출
    // getAnalysis에서 이미 JSONB가 객체로 파싱되어 반환됨
    let result = analysis.result;
    
    console.log('[리포트 생성] analysis.result 타입:', typeof result);
    console.log('[리포트 생성] analysis.result 값:', result ? (typeof result === 'object' ? 'object' : String(result).substring(0, 100)) : 'null/undefined');
    
    // result가 null이거나 undefined인 경우
    if (!result) {
      console.error('[리포트 생성] result가 없습니다.');
      console.error('[리포트 생성] analysis 객체 키:', Object.keys(analysis));
      console.error('[리포트 생성] analysis 전체:', JSON.stringify(analysis, null, 2).substring(0, 500));
      return res.status(500).json({
        success: false,
        error: '분석 결과 데이터가 없습니다.'
      });
    }
    
    // result가 문자열인 경우 파싱 (PostgreSQL pg 라이브러리는 보통 자동 파싱하지만, 안전을 위해)
    if (typeof result === 'string') {
      try {
        result = JSON.parse(result);
        console.log('[리포트 생성] result 문자열 파싱 완료');
      } catch (parseError) {
        console.error('[리포트 생성] result JSON 파싱 오류:', parseError);
        console.error('[리포트 생성] 원본 result:', result.substring(0, 200));
        return res.status(500).json({
          success: false,
          error: '분석 결과 데이터 형식이 올바르지 않습니다.'
        });
      }
    }
    
    // result가 객체인지 확인
    if (typeof result !== 'object' || result === null) {
      console.error('[리포트 생성] result가 객체가 아닙니다.');
      console.error('[리포트 생성] result 타입:', typeof result);
      console.error('[리포트 생성] result 값:', result);
      return res.status(500).json({
        success: false,
        error: '분석 결과 데이터 형식이 올바르지 않습니다.'
      });
    }
    
    console.log('[리포트 생성] result 데이터 확인:', {
      hasId: !!result.id,
      hasBrand: !!result.brand,
      hasLocation: !!result.location,
      hasFinance: !!result.finance,
      hasDecision: !!result.decision,
      resultKeys: Object.keys(result).slice(0, 10)
    });
    
    // 리포트 ID 생성
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // JSON 직렬화 테스트 (순환 참조나 직렬화 불가능한 값 확인)
    try {
      JSON.stringify(result);
      console.log('[리포트 생성] result JSON 직렬화 성공');
    } catch (stringifyError) {
      console.error('[리포트 생성] result JSON 직렬화 실패:', stringifyError);
      return res.status(500).json({
        success: false,
        error: '분석 결과 데이터를 직렬화할 수 없습니다.',
        details: process.env.NODE_ENV === 'development' ? stringifyError.message : undefined
      });
    }
    
    // PDF 생성 로직
    // 주의: 프론트엔드에서 클라이언트 사이드 PDF 생성이 주 목적이지만,
    // 서버 사이드에서도 생성할 수 있도록 기본 구조 제공
    // 실제 PDF 생성은 프론트엔드에서 jsPDF를 사용하여 구현 권장
    
    // TODO: 서버 사이드 PDF 생성 구현 (선택사항)
    // const PDFDocument = require('pdfkit'); // 또는 jsPDF 서버 사이드 사용
    // const pdfBuffer = await generatePDF(result);
    // fs.writeFileSync(`./reports/${reportId}.pdf`, pdfBuffer);
    
    console.log('[리포트 생성] 리포트 응답 전송 시작');
    res.json({
      success: true,
      reportId: reportId,
      reportUrl: `/reports/${reportId}.pdf`,
      message: '리포트 데이터가 준비되었습니다. 프론트엔드에서 PDF를 생성하세요.',
      // 분석 결과 반환 (프론트엔드에서 PDF 생성 시 사용)
      data: result
    });
    console.log('[리포트 생성] 리포트 응답 전송 완료');
  } catch (error) {
    console.error('리포트 생성 오류:', error);
    console.error('스택 트레이스:', error.stack);
    res.status(500).json({
      success: false,
      error: '리포트 생성 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
