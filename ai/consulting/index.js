/**
 * AI 컨설팅 메인 로직
 * Claude API를 사용하여 판매량 시나리오, 리스크 분석, 개선 제안, 경쟁 환경 분석 생성
 */

require('dotenv').config({ path: '../../.env' });
const Anthropic = require('@anthropic-ai/sdk');
const {
  createSalesScenarioPrompt,
  createRiskAnalysisPrompt,
  createImprovementPrompt,
  createCompetitiveAnalysisPrompt
} = require('./prompts');

// Claude API 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * AI 컨설팅 생성 메인 함수
 * @param {Object} input - 입력 데이터
 * @param {Object} input.brand - 브랜드 정보
 * @param {Object} input.location - 위치 정보
 * @param {Object} input.conditions - 조건 (투자금, 월세, 평수 등)
 * @param {Number} input.targetDailySales - 목표 일 판매량
 * @param {Object} input.finance - 손익 계산 결과
 * @param {Object} input.market - 상권 분석 결과
 * @param {Object} input.roadview - 로드뷰 분석 결과
 * @returns {Promise<Object>} AI 컨설팅 결과
 */
async function generateConsulting(input) {
  const {
    brand,
    location,
    conditions,
    targetDailySales,
    finance,
    market,
    roadview
  } = input;

  try {
    // 1. 판매량 시나리오 추론
    const salesScenarioResult = await callClaude(
      createSalesScenarioPrompt({ brand, location, conditions, market, finance })
    );
    const salesScenario = parseJSONResponse(salesScenarioResult, 'salesScenario');

    // 2. 리스크 분석
    const riskAnalysisResult = await callClaude(
      createRiskAnalysisPrompt({ brand, location, conditions, finance, market, roadview })
    );
    const riskAnalysis = parseJSONResponse(riskAnalysisResult, 'riskAnalysis');

    // 3. 개선 제안
    const improvementResult = await callClaude(
      createImprovementPrompt({ brand, location, conditions, finance, market, roadview, targetDailySales })
    );
    const improvements = parseJSONResponse(improvementResult, 'improvements');

    // 4. 경쟁 환경 분석
    const competitiveResult = await callClaude(
      createCompetitiveAnalysisPrompt({ brand, market })
    );
    const competitiveAnalysis = parseJSONResponse(competitiveResult, 'competitiveAnalysis');

    // 최종 결과 조합
    return {
      salesScenario: {
        conservative: salesScenario.conservative || 200,
        expected: salesScenario.expected || 250,
        optimistic: salesScenario.optimistic || 300
      },
      salesScenarioReason: salesScenario.reason || '주변 경쟁 카페 밀도와 유동인구를 고려한 판매량 추정입니다.',
      topRisks: (riskAnalysis.topRisks || []).slice(0, 3), // 최대 3개
      improvements: (improvements.improvements || []).slice(0, 3), // 최대 3개
      competitiveAnalysis: competitiveAnalysis || {
        intensity: 'medium',
        differentiation: 'possible',
        priceStrategy: 'standard'
      }
    };
  } catch (error) {
    console.error('AI 컨설팅 생성 오류:', error);
    // 에러 발생 시 기본값 반환
    return {
      salesScenario: {
        conservative: 200,
        expected: 250,
        optimistic: 300
      },
      salesScenarioReason: 'AI 분석 중 오류가 발생하여 기본값을 사용합니다.',
      topRisks: [],
      improvements: [],
      competitiveAnalysis: {
        intensity: 'medium',
        differentiation: 'possible',
        priceStrategy: 'standard'
      }
    };
  }
}

/**
 * Claude API 호출
 * @param {String} prompt - 프롬프트 텍스트
 * @returns {Promise<String>} Claude 응답 텍스트
 */
async function callClaude(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // 응답 텍스트 추출
    const textContent = message.content.find(block => block.type === 'text');
    return textContent ? textContent.text : '';
  } catch (error) {
    console.error('Claude API 호출 오류:', error);
    throw new Error(`Claude API 호출 실패: ${error.message}`);
  }
}

/**
 * JSON 응답 파싱
 * @param {String} responseText - Claude 응답 텍스트
 * @param {String} context - 컨텍스트 (에러 메시지용)
 * @returns {Object} 파싱된 JSON 객체
 */
function parseJSONResponse(responseText, context) {
  try {
    // JSON 코드 블록 제거 (```json ... ```)
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanedText);
    return parsed;
  } catch (error) {
    console.error(`${context} JSON 파싱 오류:`, error);
    console.error('원본 응답:', responseText);
    return {};
  }
}

module.exports = {
  generateConsulting
};
