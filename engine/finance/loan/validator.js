/**
 * 대출 입력 검증
 * 
 * conditions.loans[] 검증
 */

/**
 * 대출 입력 검증
 * @param {Array<Object>} loans - 대출 배열
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateLoans(loans) {
  const errors = [];
  
  if (!loans || !Array.isArray(loans)) {
    return { valid: true, errors: [] };  // 대출이 없으면 유효 (선택적)
  }
  
  if (loans.length === 0) {
    return { valid: true, errors: [] };  // 빈 배열도 유효
  }
  
  const validRepaymentTypes = ['equal_payment', 'equal_principal', 'interest_only'];
  
  loans.forEach((loan, index) => {
    // principal 검증
    if (loan.principal === undefined || loan.principal === null) {
      errors.push(`loans[${index}].principal이 필요합니다.`);
    } else if (typeof loan.principal !== 'number' || loan.principal <= 0) {
      errors.push(`loans[${index}].principal은 0보다 큰 숫자여야 합니다.`);
    }
    
    // apr 검증
    if (loan.apr === undefined || loan.apr === null) {
      errors.push(`loans[${index}].apr이 필요합니다.`);
    } else if (typeof loan.apr !== 'number' || loan.apr < 0 || loan.apr >= 1) {
      errors.push(`loans[${index}].apr은 0-1 사이의 숫자여야 합니다. (예: 0.05 = 5%)`);
    }
    
    // termMonths 검증
    if (loan.termMonths === undefined || loan.termMonths === null) {
      errors.push(`loans[${index}].termMonths가 필요합니다.`);
    } else if (typeof loan.termMonths !== 'number' || loan.termMonths <= 0 || !Number.isInteger(loan.termMonths)) {
      errors.push(`loans[${index}].termMonths는 1 이상의 정수여야 합니다.`);
    }
    
    // repaymentType 검증
    if (loan.repaymentType === undefined || loan.repaymentType === null) {
      errors.push(`loans[${index}].repaymentType이 필요합니다.`);
    } else if (!validRepaymentTypes.includes(loan.repaymentType)) {
      errors.push(`loans[${index}].repaymentType은 ${validRepaymentTypes.join(', ')} 중 하나여야 합니다.`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateLoans
};
