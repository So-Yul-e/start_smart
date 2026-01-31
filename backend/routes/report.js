/**
 * PDF 리포트 생성 API
 * POST /api/report/:analysisId
 */

const router = require('express').Router();
const { getAnalysis } = require('../db/analysisRepository'); // DB 저장소 임포트

router.post('/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    // DB에서 분석 결과 조회
    const analysis = await getAnalysis(analysisId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: '분석 결과를 찾을 수 없습니다.'
      });
    }

    if (analysis.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: '분석이 완료되지 않았습니다.'
      });
    }

    // 분석 결과 데이터 추출
    const result = analysis.result || analysis;
    
    // 리포트 ID 생성
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // PDF 생성 로직
    // 주의: 프론트엔드에서 클라이언트 사이드 PDF 생성이 주 목적이지만,
    // 서버 사이드에서도 생성할 수 있도록 기본 구조 제공
    // 실제 PDF 생성은 프론트엔드에서 jsPDF를 사용하여 구현 권장
    
    // TODO: 서버 사이드 PDF 생성 구현 (선택사항)
    // const PDFDocument = require('pdfkit'); // 또는 jsPDF 서버 사이드 사용
    // const pdfBuffer = await generatePDF(result);
    // fs.writeFileSync(`./reports/${reportId}.pdf`, pdfBuffer);
    
    res.json({
      success: true,
      reportId: reportId,
      reportUrl: `/reports/${reportId}.pdf`,
      message: '리포트 데이터가 준비되었습니다. 프론트엔드에서 PDF를 생성하세요.',
      // 분석 결과 반환 (프론트엔드에서 PDF 생성 시 사용)
      data: result
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
