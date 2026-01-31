/**
 * AI Consulting - 메인 로직
 * 
 * Claude API를 사용하여 매출 시나리오, 리스크 분석, 개선안을 생성합니다.
 * 토큰 비용 관리를 위해 프롬프트를 최적화하고 응답을 캐싱할 수 있습니다.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const Anthropic = require('@anthropic-ai/sdk');
const {
  getSalesScenarioPrompt,
  getRiskAnalysisPrompt,
  getCompetitiveAnalysisPrompt
} = require('./prompts');

// Claude API 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// 사용할 모델 버전
// 참고: 현재 API 키로 접근 가능한 모델은 claude-3-haiku-20240307
// Sonnet 모델에 접근하려면 API 키 권한 확인 필요
// ROLE.md에 명시된 claude-3-5-sonnet-20241022는 현재 접근 불가
// 중요: claude-3-haiku-20240307 모델의 최대 max_tokens는 4096입니다.
const MODEL = 'claude-3-haiku-20240307';
const MAX_TOKENS_LIMIT = 4096; // 모델별 최대 토큰 제한

/**
 * JSON 응답 파싱 (안전한 파싱)
 * JSON 문자열 내부의 따옴표를 자동으로 이스케이프 처리합니다.
 * @param {string} text - Claude 응답 텍스트
 * @returns {Object} 파싱된 JSON 객체
 */
function parseJSONResponse(text) {
  // JSON 코드 블록 제거 (```json ... ``` 또는 ``` ... ```)
  let cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  // JSON 객체만 추출 (중괄호로 시작하고 끝나는 부분)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  // JSON 문자열 값 내부의 따옴표를 이스케이프 처리
  // 상태 머신 방식으로 문자열 값을 찾아서 내부 따옴표를 이스케이프
  let result = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const nextChars = cleaned.substring(i + 1, i + 20); // 다음 20자 확인
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      if (!inString) {
        // 문자열 시작
        inString = true;
        result += char;
      } else {
        // 문자열 끝인지 확인
        // 다음 문자가 공백 후 : 또는 , 또는 } 또는 ]이면 문자열 끝
        const isStringEnd = /^\s*([:,\}\]])/.test(nextChars);
        if (isStringEnd) {
          // 문자열 끝
          inString = false;
          result += char;
        } else {
          // 문자열 내부의 따옴표 - 이스케이프 처리
          result += '\\"';
        }
      }
    } else {
      result += char;
    }
  }
  
  cleaned = result;
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // 첫 번째 시도 실패 시, 더 간단한 방법으로 재시도
    try {
      // 문자열 값 내부의 따옴표를 직접 이스케이프
      // 패턴: "key": "value with "quotes" inside"
      let fixed = cleaned;
      
      // "medium", "high", "low" 같은 패턴을 찾아서 이스케이프
      fixed = fixed.replace(/"([^"]+)":\s*"([^"]*)"([^"]*)"([^"]*)"/g, (match, key, val1, val2, val3) => {
        // 값 부분에 따옴표가 있는 경우 (예: "medium", "high", "low")
        if (val2) {
          const escapedVal = `"${val1}\\"${val2}\\"${val3}"`;
          return `"${key}": ${escapedVal}`;
        }
        return match;
      });
      
      return JSON.parse(fixed);
    } catch (secondError) {
      console.error('JSON 파싱 오류:', error.message);
      console.error('수정 시도 후 오류:', secondError.message);
      console.error('원본 텍스트 (전체):', text);
      console.error('원본 텍스트 길이:', text.length);
      console.error('처리된 텍스트:', cleaned.substring(0, 500));
      
      // 불완전한 JSON 감지 (중괄호 불일치 확인)
      const openBraces = (text.match(/\{/g) || []).length;
      const closeBraces = (text.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        console.error(`⚠️ 불완전한 JSON 감지: 열린 중괄호 ${openBraces}개, 닫힌 중괄호 ${closeBraces}개`);
        console.error('💡 max_tokens를 늘려서 재시도하세요.');
      }
      
      // 문자열 내부 따옴표 문제 감지
      const unescapedQuotes = cleaned.match(/"[^"]*"[^,}\]]*"[^"]*"/g);
      if (unescapedQuotes) {
        console.error('⚠️ JSON 문자열 내부에 따옴표가 감지되었습니다.');
        console.error('💡 프롬프트에서 JSON 내부 문자열에 따옴표를 사용하지 않도록 수정하세요.');
        console.error('감지된 패턴:', unescapedQuotes.slice(0, 3));
      }
      
      throw new Error('Claude 응답을 JSON으로 파싱할 수 없습니다. 응답이 잘렸을 수 있습니다.');
    }
  }
}

/**
 * Claude API 호출 헬퍼 함수
 * @param {string} prompt - 프롬프트 텍스트
 * @param {number} maxTokens - 최대 토큰 수 (기본값: 4096, 최대값: 모델 제한에 따름)
 * @returns {Promise<Object>} 파싱된 JSON 응답
 */
async function callClaude(prompt, maxTokens = MAX_TOKENS_LIMIT) {
  // 모델 제한 확인
  if (maxTokens > MAX_TOKENS_LIMIT) {
    console.warn(`⚠️ 경고: max_tokens(${maxTokens})가 모델 최대값(${MAX_TOKENS_LIMIT})을 초과합니다. ${MAX_TOKENS_LIMIT}로 제한합니다.`);
    maxTokens = MAX_TOKENS_LIMIT;
  }
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('텍스트 응답이 아닙니다.');
    }

    // 응답이 완전한지 확인 (stop_reason 체크)
    if (message.stop_reason === 'max_tokens') {
      console.warn('⚠️ 경고: 응답이 max_tokens 제한으로 인해 잘렸을 수 있습니다.');
      console.warn(`   stop_reason: ${message.stop_reason}`);
      console.warn(`   사용된 토큰: ${message.usage.output_tokens}/${maxTokens}`);
    }

    return parseJSONResponse(content.text);
  } catch (error) {
    console.error('Claude API 호출 오류:', error);
    throw error;
  }
}

/**
 * 판매량 시나리오 생성
 * @param {Object} data - 입력 데이터
 * @returns {Promise<Object>} 판매량 시나리오 결과
 */
async function generateSalesScenario(data) {
  const prompt = getSalesScenarioPrompt(data);
  const result = await callClaude(prompt);

  // 응답 검증
  if (!result.conservative || !result.expected || !result.optimistic || !result.reason) {
    throw new Error('판매량 시나리오 응답 형식이 올바르지 않습니다.');
  }

  return {
    salesScenario: {
      conservative: Number(result.conservative),
      expected: Number(result.expected),
      optimistic: Number(result.optimistic)
    },
    salesScenarioReason: result.reason
  };
}

/**
 * 리스크 분석 및 개선안 생성
 * @param {Object} data - 입력 데이터
 * @returns {Promise<Object>} 리스크 분석 결과
 */
async function generateRiskAnalysis(data) {
  const prompt = getRiskAnalysisPrompt(data);
  // 리스크 분석은 응답이 길 수 있으므로 최대값 사용
  const result = await callClaude(prompt, MAX_TOKENS_LIMIT);

  // 응답 검증
  if (!Array.isArray(result.topRisks) || !Array.isArray(result.improvements)) {
    throw new Error('리스크 분석 응답 형식이 올바르지 않습니다.');
  }

  // 리스크 우선순위 정렬 함수
  // 1순위: impact 레벨 (high > medium > low)
  // 2순위: 같은 impact 내에서는 재무 리스크 우선 (월 순이익 → 회수 기간 → 상권 → 물리적)
  function getRiskPriority(risk) {
    const impactOrder = { high: 1, medium: 2, low: 3 };
    const impactScore = impactOrder[risk.impact] || 99;
    
    // 제목/설명에서 리스크 유형 추정 (재무 리스크 우선)
    const title = (risk.title || '').toLowerCase();
    const description = (risk.description || '').toLowerCase();
    
    let typeScore = 3; // 기본값 (물리적/기타)
    if (title.includes('순이익') || title.includes('적자') || description.includes('순이익') || description.includes('적자')) {
      typeScore = 0; // 월 순이익 리스크 (최우선)
    } else if (title.includes('회수') || description.includes('회수')) {
      typeScore = 1; // 회수 기간 리스크
    } else if (title.includes('경쟁') || description.includes('경쟁')) {
      typeScore = 2; // 상권 경쟁도 리스크
    }
    
    return impactScore * 10 + typeScore; // impact가 우선, 같은 impact 내에서 type으로 정렬
  }

  // 우선순위에 따라 정렬 후 최대 3개로 제한
  const topRisks = result.topRisks
    .sort((a, b) => getRiskPriority(a) - getRiskPriority(b))
    .slice(0, 3)
    .map(risk => ({
      title: risk.title,
      description: risk.description,
      impact: risk.impact // high | medium | low
    }));

  const improvements = result.improvements.slice(0, 3).map(improvement => ({
    title: improvement.title,
    description: improvement.description,
    expectedImpact: improvement.expectedImpact
  }));

  return {
    topRisks,
    improvements
  };
}

/**
 * 경쟁 환경 분석 생성
 * @param {Object} data - 입력 데이터
 * @returns {Promise<Object>} 경쟁 환경 분석 결과
 */
async function generateCompetitiveAnalysis(data) {
  const prompt = getCompetitiveAnalysisPrompt(data);
  const result = await callClaude(prompt);

  // 응답 검증
  const validIntensity = ['low', 'medium', 'high'].includes(result.intensity);
  const validDifferentiation = ['possible', 'difficult', 'impossible'].includes(result.differentiation);
  const validPriceStrategy = ['premium', 'standard', 'budget'].includes(result.priceStrategy);

  if (!validIntensity || !validDifferentiation || !validPriceStrategy) {
    throw new Error('경쟁 환경 분석 응답 형식이 올바르지 않습니다.');
  }

  return {
    competitiveAnalysis: {
      intensity: result.intensity,
      differentiation: result.differentiation,
      priceStrategy: result.priceStrategy
    }
  };
}

/**
 * AI 컨설팅 메인 함수
 * 
 * @param {Object} input - 입력 데이터
 * @param {Object} input.brand - 브랜드 정보 { id, name }
 * @param {Object} input.location - 위치 정보 { lat, lng, address }
 * @param {Object} input.conditions - 창업 조건 { initialInvestment, monthlyRent, area, ownerWorking }
 * @param {number} input.targetDailySales - 목표 일 판매량
 * @param {Object} input.finance - 재무 분석 결과 { monthlyProfit, paybackMonths }
 * @param {Object} input.market - 상권 분석 결과 { competitors: { total, density }, footTraffic: { weekday, weekend } }
 * @param {Object} input.roadview - 로드뷰 분석 결과 { overallRisk, riskScore }
 * @returns {Promise<Object>} AI 컨설팅 결과
 * 
 * @example
 * const result = await generateConsulting({
 *   brand: { id: "brand_1", name: "스타벅스" },
 *   location: { lat: 37.5665, lng: 126.9780, address: "서울특별시 강남구 테헤란로 123" },
 *   conditions: { initialInvestment: 500000000, monthlyRent: 3000000, area: 33, ownerWorking: true },
 *   targetDailySales: 300,
 *   finance: { monthlyProfit: 10000000, paybackMonths: 50 },
 *   market: { competitors: { total: 5, density: "high" }, footTraffic: { weekday: "high", weekend: "medium" } },
 *   roadview: { overallRisk: "medium", riskScore: 65 }
 * });
 */
async function generateConsulting(input) {
  try {
    // 입력 검증
    if (!input.brand || !input.location || !input.conditions || !input.finance || !input.market || !input.roadview) {
      throw new Error('필수 입력 데이터가 누락되었습니다.');
    }

    // 병렬 처리로 API 호출 최적화 (토큰 비용은 동일하지만 응답 시간 단축)
    const [salesScenario, riskAnalysis, competitiveAnalysis] = await Promise.all([
      generateSalesScenario(input),
      generateRiskAnalysis(input),
      generateCompetitiveAnalysis(input)
    ]);

    // 결과 병합
    return {
      ...salesScenario,
      ...riskAnalysis,
      ...competitiveAnalysis
    };
  } catch (error) {
    console.error('AI 컨설팅 생성 오류:', error);
    throw error;
  }
}

module.exports = {
  generateConsulting
};

