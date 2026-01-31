/**
 * AI 숫자 주장 검증 레이어
 * AI가 언급한 숫자를 엔진 결과로 검증
 */

/**
 * AI 주장 검증
 * @param {Object} aiConsulting - AI Consulting 결과
 * @param {Object} finance - Finance 엔진 결과
 * @param {Object} decision - Decision 엔진 결과
 * @returns {Array} 검증된 주장 배열
 */
function validateAIClaims({ aiConsulting, finance, decision }) {
  const claims = [];
  
  // AI improvements에서 숫자 추출 및 검증
  if (Array.isArray(aiConsulting?.improvements)) {
    aiConsulting.improvements.forEach((imp, idx) => {
      const claim = {
        id: `claim_${idx}`,
        source: 'improvements',
        title: imp.title,
        description: imp.description,
        expectedImpact: imp.expectedImpact,
        verified: false,
        engineValue: null,
        discrepancy: null
      };
      
      // expectedImpact에서 숫자 추출 (예: "paybackMonths: 50 → 45")
      const numbers = extractNumbers(imp.expectedImpact);
      
      // 엔진 시뮬레이션과 매칭
      if (Array.isArray(decision?.improvementSimulations)) {
        const matchingSim = findMatchingSimulation(imp, decision.improvementSimulations);
        if (matchingSim) {
          claim.verified = true;
          claim.engineValue = {
            paybackMonths: matchingSim.paybackMonths,
            survivalMonths: matchingSim.survivalMonths,
            signal: matchingSim.signal
          };
          
          // 불일치 확인
          if (numbers.paybackMonths && matchingSim.paybackMonths) {
            claim.discrepancy = Math.abs(numbers.paybackMonths - matchingSim.paybackMonths);
          }
        }
      }
      
      claims.push(claim);
    });
  }
  
  // AI topRisks에서 숫자 추출 및 검증 (선택적)
  if (Array.isArray(aiConsulting?.topRisks)) {
    aiConsulting.topRisks.forEach((risk, idx) => {
      const numbers = extractNumbers(risk.description || '');
      if (Object.keys(numbers).length > 0) {
        const claim = {
          id: `risk_claim_${idx}`,
          source: 'topRisks',
          title: risk.title,
          description: risk.description,
          expectedImpact: null,
          verified: false,
          engineValue: null,
          discrepancy: null
        };
        
        // finance나 decision에서 매칭되는 값 찾기
        if (numbers.paybackMonths && finance?.paybackMonths) {
          claim.verified = true;
          claim.engineValue = {
            paybackMonths: finance.paybackMonths
          };
          claim.discrepancy = Math.abs(numbers.paybackMonths - finance.paybackMonths);
        }
        
        claims.push(claim);
      }
    });
  }
  
  return claims;
}

/**
 * 텍스트에서 숫자 추출
 * @param {string} text - 추출할 텍스트
 * @returns {Object} 추출된 숫자 객체
 */
function extractNumbers(text) {
  if (!text || typeof text !== 'string') return {};
  
  const numbers = {};
  
  // "paybackMonths: 50 → 45" 형식에서 숫자 추출
  const paybackMatch = text.match(/paybackMonths?[:\s]+(\d+)/i);
  if (paybackMatch) {
    numbers.paybackMonths = parseInt(paybackMatch[1], 10);
  }
  
  // "회수 기간: 50개월" 형식에서 숫자 추출
  const paybackKRMatch = text.match(/(?:회수\s*기간|회수기간)[:\s]*(\d+)\s*개?월/i);
  if (paybackKRMatch && !numbers.paybackMonths) {
    numbers.paybackMonths = parseInt(paybackKRMatch[1], 10);
  }
  
  // "monthlyProfit: +15%" 형식에서 퍼센트 추출
  const profitPercentMatch = text.match(/monthlyProfit[:\s]*\+?(\d+)%/i);
  if (profitPercentMatch) {
    numbers.profitPercent = parseInt(profitPercentMatch[1], 10);
  }
  
  // "월 순이익: +15%" 형식에서 퍼센트 추출
  const profitPercentKRMatch = text.match(/(?:월\s*순이익|월순이익)[:\s]*\+?(\d+)%/i);
  if (profitPercentKRMatch && !numbers.profitPercent) {
    numbers.profitPercent = parseInt(profitPercentKRMatch[1], 10);
  }
  
  return numbers;
}

/**
 * AI 제안과 엔진 시뮬레이션 매칭
 * @param {Object} aiImprovement - AI 개선 제안
 * @param {Array} engineSimulations - 엔진 시뮬레이션 배열
 * @returns {Object|null} 매칭된 시뮬레이션 또는 null
 */
function findMatchingSimulation(aiImprovement, engineSimulations) {
  if (!aiImprovement || !Array.isArray(engineSimulations) || engineSimulations.length === 0) {
    return null;
  }
  
  // 간단한 키워드 매칭
  const aiTitle = (aiImprovement.title || '').toLowerCase();
  const aiDescription = (aiImprovement.description || '').toLowerCase();
  
  for (const sim of engineSimulations) {
    const simDelta = (sim.delta || '').toLowerCase();
    const simTitle = (sim.title || '').toLowerCase();
    const simDescription = (sim.description || '').toLowerCase();
    
    // 제목이나 설명에서 키워드 매칭
    if (aiTitle.includes(simDelta) || 
        simDelta.includes(aiTitle) ||
        aiTitle.includes(simTitle) ||
        simTitle.includes(aiTitle) ||
        aiDescription.includes(simDelta) ||
        simDescription.includes(aiTitle)) {
      return sim;
    }
  }
  
  return null;
}

module.exports = {
  validateAIClaims,
  extractNumbers,
  findMatchingSimulation
};
