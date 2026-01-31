/**
 * Finance 출력 형식 검증
 * 
 * shared/interfaces.js의 스펙과 일치하는지 검증
 * 기존 필드 유지 + 확장 필드 추가 (Backward Compatible)
 */

const { examples } = require('../../shared/interfaces');

/**
 * Finance 출력 형식 검증
 * @param {Object} result - Finance 계산 결과
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
function validateFinanceOutput(result) {
  const errors = [];
  const warnings = [];
  
  // ============================================
  // 기본 필드 확인 (shared/interfaces.js 기준)
  // ============================================
  
  // monthlyRevenue
  if (result.monthlyRevenue === undefined) {
    errors.push('필수 필드 누락: monthlyRevenue');
  } else if (typeof result.monthlyRevenue !== 'number' || result.monthlyRevenue < 0) {
    errors.push('monthlyRevenue는 0 이상의 숫자여야 합니다.');
  }
  
  // monthlyCosts 객체 구조 확인
  if (!result.monthlyCosts || typeof result.monthlyCosts !== 'object') {
    errors.push('필수 필드 누락: monthlyCosts (객체)');
  } else {
    const requiredCostFields = ['rent', 'labor', 'materials', 'utilities', 'royalty', 'marketing', 'etc'];
    for (const field of requiredCostFields) {
      if (result.monthlyCosts[field] === undefined) {
        errors.push(`monthlyCosts 필수 필드 누락: ${field}`);
      } else if (typeof result.monthlyCosts[field] !== 'number') {
        errors.push(`monthlyCosts.${field}는 숫자여야 합니다.`);
      }
    }
  }
  
  // monthlyProfit
  if (result.monthlyProfit === undefined) {
    errors.push('필수 필드 누락: monthlyProfit');
  } else if (typeof result.monthlyProfit !== 'number') {
    errors.push('monthlyProfit는 숫자여야 합니다. (음수 허용)');
  }
  
  // paybackMonths
  if (result.paybackMonths === undefined) {
    errors.push('필수 필드 누락: paybackMonths');
  } else if (result.paybackMonths !== null && (typeof result.paybackMonths !== 'number' || result.paybackMonths <= 0)) {
    errors.push('paybackMonths는 null이거나 0보다 큰 숫자여야 합니다.');
  }
  
  // breakEvenDailySales
  if (result.breakEvenDailySales === undefined) {
    errors.push('필수 필드 누락: breakEvenDailySales');
  } else if (result.breakEvenDailySales !== null && (typeof result.breakEvenDailySales !== 'number' || result.breakEvenDailySales <= 0)) {
    errors.push('breakEvenDailySales는 null이거나 0보다 큰 숫자여야 합니다.');
  }
  
  // sensitivity 객체 확인
  if (!result.sensitivity || typeof result.sensitivity !== 'object') {
    errors.push('필수 필드 누락: sensitivity (객체)');
  } else {
    if (!result.sensitivity.plus10 || typeof result.sensitivity.plus10 !== 'object') {
      errors.push('sensitivity.plus10 객체가 필요합니다.');
    } else {
      if (typeof result.sensitivity.plus10.monthlyProfit !== 'number') {
        errors.push('sensitivity.plus10.monthlyProfit는 숫자여야 합니다.');
      }
      if (result.sensitivity.plus10.paybackMonths !== null && 
          (typeof result.sensitivity.plus10.paybackMonths !== 'number' || result.sensitivity.plus10.paybackMonths <= 0)) {
        errors.push('sensitivity.plus10.paybackMonths는 null이거나 0보다 큰 숫자여야 합니다.');
      }
    }
    
    if (!result.sensitivity.minus10 || typeof result.sensitivity.minus10 !== 'object') {
      errors.push('sensitivity.minus10 객체가 필요합니다.');
    } else {
      if (typeof result.sensitivity.minus10.monthlyProfit !== 'number') {
        errors.push('sensitivity.minus10.monthlyProfit는 숫자여야 합니다.');
      }
      if (result.sensitivity.minus10.paybackMonths !== null && 
          (typeof result.sensitivity.minus10.paybackMonths !== 'number' || result.sensitivity.minus10.paybackMonths <= 0)) {
        errors.push('sensitivity.minus10.paybackMonths는 null이거나 0보다 큰 숫자여야 합니다.');
      }
    }
  }
  
  // ============================================
  // 확장 필드 확인 (새로 추가된 필드)
  // ============================================
  
  // expected 객체 확인
  if (result.expected) {
    if (result.expected.expectedDailySales === undefined || typeof result.expected.expectedDailySales !== 'number') {
      errors.push('expected.expectedDailySales는 숫자여야 합니다.');
    }
    
    if (result.expected.expectedMonthlyRevenue === undefined || typeof result.expected.expectedMonthlyRevenue !== 'number') {
      errors.push('expected.expectedMonthlyRevenue는 숫자여야 합니다.');
    }
    
    if (result.expected.gapPctVsTarget === undefined || typeof result.expected.gapPctVsTarget !== 'number') {
      errors.push('expected.gapPctVsTarget는 숫자여야 합니다.');
    }
    
    // gapWarning은 optional
    if (result.expected.gapWarning !== undefined && typeof result.expected.gapWarning !== 'boolean') {
      warnings.push('expected.gapWarning은 boolean이어야 합니다.');
    }
  } else {
    warnings.push('확장 필드 누락: expected (선택적이지만 권장)');
  }
  
  // scenarioTable 확인 (선택적)
  if (result.scenarioTable !== undefined) {
    if (!Array.isArray(result.scenarioTable)) {
      errors.push('scenarioTable은 배열이어야 합니다.');
    } else {
      result.scenarioTable.forEach((scenario, idx) => {
        if (typeof scenario.daily !== 'number' || scenario.daily <= 0) {
          errors.push(`scenarioTable[${idx}].daily는 0보다 큰 숫자여야 합니다.`);
        }
        if (typeof scenario.profit !== 'number') {
          errors.push(`scenarioTable[${idx}].profit는 숫자여야 합니다.`);
        }
        if (scenario.paybackMonths !== null && 
            (typeof scenario.paybackMonths !== 'number' || scenario.paybackMonths <= 0)) {
          errors.push(`scenarioTable[${idx}].paybackMonths는 null이거나 0보다 큰 숫자여야 합니다.`);
        }
      });
    }
  }
  
  // ============================================
  // shared/interfaces.js 호환성 확인
  // ============================================
  
  // 기존 필드 형식이 interfaces.js 예제와 일치하는지 확인
  const example = examples.financeResult;
  
  // monthlyCosts 구조 비교
  if (result.monthlyCosts && example.monthlyCosts) {
    const exampleKeys = Object.keys(example.monthlyCosts);
    const resultKeys = Object.keys(result.monthlyCosts);
    
    // 기존 필드는 모두 있어야 함
    for (const key of exampleKeys) {
      if (!resultKeys.includes(key)) {
        warnings.push(`기존 필드 누락: monthlyCosts.${key} (interfaces.js 호환성)`);
      }
    }
  }
  
  // sensitivity 구조 비교
  if (result.sensitivity && example.sensitivity) {
    if (!result.sensitivity.plus10 || !result.sensitivity.minus10) {
      errors.push('sensitivity 구조가 interfaces.js와 일치하지 않습니다.');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Finance 출력 검증 (간단한 버전, 개발 환경용)
 * @param {Object} result - Finance 계산 결과
 * @param {Boolean} throwOnError - 에러 발생 시 throw할지 여부
 */
function validateFinanceOutputSimple(result, throwOnError = false) {
  const validation = validateFinanceOutput(result);
  
  if (!validation.valid) {
    const message = `Finance 출력 검증 실패:\n${validation.errors.join('\n')}`;
    if (throwOnError) {
      throw new Error(message);
    } else {
      console.warn(message);
    }
  }
  
  if (validation.warnings.length > 0) {
    console.warn(`Finance 출력 경고:\n${validation.warnings.join('\n')}`);
  }
  
  return validation.valid;
}

module.exports = {
  validateFinanceOutput,
  validateFinanceOutputSimple
};
