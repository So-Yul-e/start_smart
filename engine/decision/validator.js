/**
 * Decision 출력 형식 검증
 * 
 * shared/interfaces.js의 스펙과 일치하는지 검증
 * 기존 필드 유지 + 확장 필드 추가 (Backward Compatible)
 */

const { examples } = require('../../shared/interfaces');

/**
 * Decision 출력 형식 검증
 * @param {Object} result - Decision 계산 결과
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
function validateDecisionOutput(result) {
  const errors = [];
  const warnings = [];
  
  // ============================================
  // 기본 필드 확인 (shared/interfaces.js 기준)
  // ============================================
  
  // score
  if (result.score === undefined) {
    errors.push('필수 필드 누락: score');
  } else if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
    errors.push('score는 0-100 사이의 숫자여야 합니다.');
  }
  
  // signal
  if (result.signal === undefined) {
    errors.push('필수 필드 누락: signal');
  } else {
    const validSignals = ['green', 'yellow', 'red'];
    if (!validSignals.includes(result.signal)) {
      errors.push(`signal은 ${validSignals.join(', ')} 중 하나여야 합니다.`);
    }
  }
  
  // survivalMonths
  if (result.survivalMonths === undefined) {
    errors.push('필수 필드 누락: survivalMonths');
  } else if (typeof result.survivalMonths !== 'number' || result.survivalMonths < 0) {
    errors.push('survivalMonths는 0 이상의 숫자여야 합니다.');
  }
  
  // riskLevel
  if (result.riskLevel === undefined) {
    errors.push('필수 필드 누락: riskLevel');
  } else {
    const validRiskLevels = ['low', 'medium', 'high'];
    if (!validRiskLevels.includes(result.riskLevel)) {
      errors.push(`riskLevel은 ${validRiskLevels.join(', ')} 중 하나여야 합니다.`);
    }
  }
  
  // riskFactors (레거시: 문자열 배열)
  if (result.riskFactors === undefined) {
    warnings.push('기존 필드 누락: riskFactors (레거시, 선택적)');
  } else {
    if (!Array.isArray(result.riskFactors)) {
      errors.push('riskFactors는 배열이어야 합니다.');
    } else {
      // 문자열 배열인지 확인 (레거시 형식)
      result.riskFactors.forEach((risk, idx) => {
        if (typeof risk !== 'string') {
          warnings.push(`riskFactors[${idx}]는 문자열이어야 합니다 (레거시 형식).`);
        }
      });
    }
  }
  
  // ============================================
  // 확장 필드 확인 (새로 추가된 필드)
  // ============================================
  
  // successProbability
  if (result.successProbability !== undefined) {
    if (typeof result.successProbability !== 'number' || 
        result.successProbability < 0 || 
        result.successProbability > 1) {
      errors.push('successProbability는 0-1 사이의 값이어야 합니다.');
    }
    
    // score와 일치하는지 확인
    if (result.score !== undefined) {
      const expectedProb = result.score / 100;
      if (Math.abs(result.successProbability - expectedProb) > 0.01) {
        warnings.push(`successProbability(${result.successProbability})가 score/100(${expectedProb})와 일치하지 않습니다.`);
      }
    }
  } else {
    warnings.push('확장 필드 누락: successProbability (선택적이지만 권장)');
  }
  
  // breakdown (신규: 점수 breakdown)
  if (result.breakdown !== undefined) {
    if (typeof result.breakdown !== 'object') {
      errors.push('breakdown은 객체여야 합니다.');
    } else {
      const breakdownFields = ['payback', 'profitability', 'gap', 'sensitivity', 'fixedCost', 'market', 'roadview'];
      breakdownFields.forEach(field => {
        if (result.breakdown[field] === undefined) {
          warnings.push(`breakdown.${field}가 없습니다.`);
        } else if (typeof result.breakdown[field] !== 'number' || 
                   result.breakdown[field] < 0 || 
                   result.breakdown[field] > 100) {
          errors.push(`breakdown.${field}는 0-100 사이의 숫자여야 합니다.`);
        }
      });
    }
  } else {
    warnings.push('확장 필드 누락: breakdown (선택적이지만 권장)');
  }
  
  // riskCards (신규: 객체 배열)
  if (result.riskCards !== undefined) {
    if (!Array.isArray(result.riskCards)) {
      errors.push('riskCards는 배열이어야 합니다.');
    } else {
      result.riskCards.forEach((card, idx) => {
        if (!card.id || typeof card.id !== 'string') {
          errors.push(`riskCards[${idx}].id는 문자열이어야 합니다.`);
        }
        if (!card.title || typeof card.title !== 'string') {
          errors.push(`riskCards[${idx}].title는 문자열이어야 합니다.`);
        }
        if (!card.severity || !['low', 'medium', 'high'].includes(card.severity)) {
          errors.push(`riskCards[${idx}].severity는 'low', 'medium', 'high' 중 하나여야 합니다.`);
        }
        if (card.evidence && typeof card.evidence !== 'object') {
          errors.push(`riskCards[${idx}].evidence는 객체여야 합니다.`);
        }
        if (!card.narrative || typeof card.narrative !== 'string') {
          warnings.push(`riskCards[${idx}].narrative는 문자열이어야 합니다.`);
        }
      });
    }
  } else {
    warnings.push('확장 필드 누락: riskCards (선택적이지만 권장)');
  }
  
  // improvementSimulations (선택적)
  if (result.improvementSimulations !== undefined) {
    if (!Array.isArray(result.improvementSimulations)) {
      errors.push('improvementSimulations는 배열이어야 합니다.');
    } else {
      result.improvementSimulations.forEach((sim, idx) => {
        if (!sim.id || typeof sim.id !== 'string') {
          errors.push(`improvementSimulations[${idx}].id는 문자열이어야 합니다.`);
        }
        if (!sim.delta || typeof sim.delta !== 'string') {
          errors.push(`improvementSimulations[${idx}].delta는 문자열이어야 합니다.`);
        }
        if (typeof sim.survivalMonths !== 'number' || sim.survivalMonths < 0) {
          errors.push(`improvementSimulations[${idx}].survivalMonths는 0 이상의 숫자여야 합니다.`);
        }
        const validSignals = ['green', 'yellow', 'red'];
        if (!validSignals.includes(sim.signal)) {
          errors.push(`improvementSimulations[${idx}].signal은 ${validSignals.join(', ')} 중 하나여야 합니다.`);
        }
      });
    }
  }
  
  // ============================================
  // shared/interfaces.js 호환성 확인
  // ============================================
  
  // 기존 필드 형식이 interfaces.js 예제와 일치하는지 확인
  const example = examples.decisionResult;
  
  // riskFactors 형식 확인 (레거시: 문자열 배열)
  if (result.riskFactors && example.riskFactors) {
    if (Array.isArray(example.riskFactors) && example.riskFactors.length > 0) {
      // 예제가 문자열 배열이면, 결과도 문자열 배열이어야 함 (레거시 호환)
      const isStringArray = result.riskFactors.every(r => typeof r === 'string');
      if (!isStringArray) {
        warnings.push('riskFactors는 문자열 배열이어야 합니다 (레거시 호환성).');
      }
    }
  }
  
  // ============================================
  // Backward Compatibility 확인
  // ============================================
  
  // riskFactors와 riskCards 병행 확인
  if (result.riskFactors && result.riskCards) {
    // riskFactors가 riskCards에서 생성되었는지 확인 (선택적)
    if (result.riskFactors.length !== result.riskCards.length) {
      warnings.push('riskFactors와 riskCards의 길이가 일치하지 않습니다.');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Decision 출력 검증 (간단한 버전, 개발 환경용)
 * @param {Object} result - Decision 계산 결과
 * @param {Boolean} throwOnError - 에러 발생 시 throw할지 여부
 */
function validateDecisionOutputSimple(result, throwOnError = false) {
  const validation = validateDecisionOutput(result);
  
  if (!validation.valid) {
    const message = `Decision 출력 검증 실패:\n${validation.errors.join('\n')}`;
    if (throwOnError) {
      throw new Error(message);
    } else {
      console.warn(message);
    }
  }
  
  if (validation.warnings.length > 0) {
    console.warn(`Decision 출력 경고:\n${validation.warnings.join('\n')}`);
  }
  
  return validation.valid;
}

module.exports = {
  validateDecisionOutput,
  validateDecisionOutputSimple
};
