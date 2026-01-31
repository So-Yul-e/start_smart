/**
 * 리포트 기반 Q&A API
 * POST /api/consulting/chat
 * 
 * reportModel을 기반으로 한 AI 컨설팅 Q&A 서비스
 */

const router = require('express').Router();
const { getAnalysis } = require('../db/analysisRepository');
const Anthropic = require('@anthropic-ai/sdk');

// Claude API 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// 사용할 모델 버전
const MODEL = 'claude-3-haiku-20240307';
const MAX_TOKENS = 2048;

/**
 * POST /api/consulting/chat
 * 리포트 기반 Q&A
 * 
 * @body {string} analysisId - 분석 ID
 * @body {string} message - 사용자 질문
 */
router.post('/chat', async (req, res) => {
  try {
    const { analysisId, message } = req.body;
    
    if (!analysisId || !message) {
      return res.status(400).json({
        success: false,
        error: 'analysisId와 message가 필요합니다.'
      });
    }
    
    // 분석 결과 로드
    const analysis = await getAnalysis(analysisId);
    if (!analysis || !analysis.result) {
      return res.status(404).json({
        success: false,
        error: '분석 결과를 찾을 수 없습니다.'
      });
    }
    
    const { reportModel, finance, decision } = analysis.result;
    
    // reportModel이 없으면 에러 반환
    if (!reportModel) {
      return res.status(400).json({
        success: false,
        error: 'reportModel이 없습니다. 분석 결과에 reportModel이 포함되어 있지 않습니다.'
      });
    }
    
    // System prompt 구성
    const systemPrompt = `You are a financial consultant analyzing a franchise cafe startup feasibility report.

CRITICAL RULES:
1. When mentioning numbers, use ONLY the values from reportModel:
   - reportModel.executive.paybackMonths
   - reportModel.executive.monthlyProfit
   - reportModel.finance.monthlyRevenue
   - reportModel.gap.gapPctVsTarget
   - reportModel.executive.score
   - reportModel.executive.survivalMonths
   - etc.

2. If you need to make assumptions or estimates, label them clearly as "가정" or "추정".

3. Base your analysis on the provided reportModel data.

4. Always respond in Korean.

5. Be concise and professional.

ReportModel Data:
${JSON.stringify(reportModel, null, 2)}`;
    
    // Claude API 호출
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });
    
    const answer = response.content[0].text;
    
    res.json({
      success: true,
      answer: answer,
      analysisId: analysisId,
      model: MODEL
    });
    
  } catch (error) {
    console.error('[Consulting Chat] 오류:', error);
    
    // Anthropic API 에러 처리
    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        error: 'AI API 인증 오류가 발생했습니다. API 키를 확인하세요.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    if (error.status === 429) {
      return res.status(503).json({
        success: false,
        error: 'AI API 요청 한도를 초과했습니다. 잠시 후 다시 시도하세요.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Q&A 처리 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
