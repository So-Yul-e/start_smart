/**
 * 대출 상환 계산 (Amortization)
 * 
 * 지원 상환 방식:
 * - equal_payment: 원리금 균등 상환
 * - equal_principal: 원금 균등 상환
 * - interest_only: 이자만 상환
 */

/**
 * 원리금 균등 상환 계산
 * @param {Number} principal - 대출 원금
 * @param {Number} apr - 연 이자율 (0-1)
 * @param {Number} termMonths - 대출 기간 (개월)
 * @returns {Object} { monthlyPayment, schedule }
 */
function calculateEqualPayment(principal, apr, termMonths) {
  const monthlyRate = apr / 12;
  
  // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
  let monthlyPayment;
  if (monthlyRate === 0) {
    monthlyPayment = principal / termMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, termMonths);
    monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);
  }
  
  // 12개월 스케줄 생성
  const schedule = [];
  let balance = principal;
  
  for (let month = 1; month <= Math.min(12, termMonths); month++) {
    const interest = balance * monthlyRate;
    const principalPayment = monthlyPayment - interest;
    balance = Math.max(0, balance - principalPayment);
    
    schedule.push({
      month,
      payment: Math.round(monthlyPayment),
      interest: Math.round(interest),
      principal: Math.round(principalPayment),
      balance: Math.round(balance)
    });
  }
  
  return {
    monthlyPayment: Math.round(monthlyPayment),
    schedule
  };
}

/**
 * 원금 균등 상환 계산
 * @param {Number} principal - 대출 원금
 * @param {Number} apr - 연 이자율 (0-1)
 * @param {Number} termMonths - 대출 기간 (개월)
 * @returns {Object} { monthlyPayment, schedule }
 */
function calculateEqualPrincipal(principal, apr, termMonths) {
  const monthlyRate = apr / 12;
  const monthlyPrincipal = principal / termMonths;
  
  // 12개월 스케줄 생성
  const schedule = [];
  let balance = principal;
  
  for (let month = 1; month <= Math.min(12, termMonths); month++) {
    const interest = balance * monthlyRate;
    const monthlyPayment = monthlyPrincipal + interest;
    balance = Math.max(0, balance - monthlyPrincipal);
    
    schedule.push({
      month,
      payment: Math.round(monthlyPayment),
      interest: Math.round(interest),
      principal: Math.round(monthlyPrincipal),
      balance: Math.round(balance)
    });
  }
  
  // 첫 달 상환액을 대표값으로 사용
  const firstMonthPayment = schedule[0]?.payment || 0;
  
  return {
    monthlyPayment: firstMonthPayment,
    schedule
  };
}

/**
 * 이자만 상환 계산
 * @param {Number} principal - 대출 원금
 * @param {Number} apr - 연 이자율 (0-1)
 * @param {Number} termMonths - 대출 기간 (개월)
 * @returns {Object} { monthlyPayment, schedule }
 */
function calculateInterestOnly(principal, apr, termMonths) {
  const monthlyRate = apr / 12;
  const monthlyPayment = principal * monthlyRate; // 이자만
  
  // 12개월 스케줄 생성
  const schedule = [];
  const balance = principal; // 원금은 변하지 않음
  
  for (let month = 1; month <= Math.min(12, termMonths); month++) {
    schedule.push({
      month,
      payment: Math.round(monthlyPayment),
      interest: Math.round(monthlyPayment),
      principal: 0,
      balance: Math.round(balance)
    });
  }
  
  return {
    monthlyPayment: Math.round(monthlyPayment),
    schedule
  };
}

/**
 * 대출 상환 계산 메인 함수
 * @param {Array<Object>} loans - 대출 배열
 * @returns {Object} { totalMonthlyPayment, totalMonthlyInterest, totalMonthlyPrincipal, debtSchedulePreview, loansDetail }
 */
function amortizeLoans(loans) {
  if (!loans || loans.length === 0) {
    return {
      totalMonthlyPayment: 0,
      totalMonthlyInterest: 0,
      totalMonthlyPrincipal: 0,
      balanceAfterMonth: 0,
      debtSchedulePreview: [],
      loansDetail: []
    };
  }
  
  let totalMonthlyPayment = 0;
  let totalMonthlyInterest = 0;
  let totalMonthlyPrincipal = 0;
  let totalBalanceAfterMonth = 0;
  const debtSchedulePreview = [];
  const loansDetail = [];
  
  // 각 대출별 계산
  for (const loan of loans) {
    const { principal, apr, termMonths, repaymentType } = loan;
    
    // 입력 검증
    if (!principal || principal <= 0) {
      throw new Error(`대출 원금이 유효하지 않습니다: ${principal}`);
    }
    if (apr < 0 || apr >= 1) {
      throw new Error(`연 이자율은 0-1 사이여야 합니다: ${apr}`);
    }
    if (!termMonths || termMonths <= 0) {
      throw new Error(`대출 기간이 유효하지 않습니다: ${termMonths}`);
    }
    
    let result;
    switch (repaymentType) {
      case 'equal_payment':
        result = calculateEqualPayment(principal, apr, termMonths);
        break;
      case 'equal_principal':
        result = calculateEqualPrincipal(principal, apr, termMonths);
        break;
      case 'interest_only':
        result = calculateInterestOnly(principal, apr, termMonths);
        break;
      default:
        throw new Error(`지원하지 않는 상환 방식입니다: ${repaymentType}`);
    }
    
    const firstMonth = result.schedule[0];
    totalMonthlyPayment += result.monthlyPayment;
    totalMonthlyInterest += firstMonth?.interest || 0;
    totalMonthlyPrincipal += firstMonth?.principal || 0;
    totalBalanceAfterMonth += firstMonth?.balance || principal;
    
    loansDetail.push({
      principal,
      apr,
      termMonths,
      repaymentType,
      monthlyPayment: result.monthlyPayment,
      monthlyInterest: firstMonth?.interest || 0,
      monthlyPrincipal: firstMonth?.principal || 0,
      balanceAfterMonth: firstMonth?.balance || principal
    });
  }
  
  // 12개월 통합 스케줄 생성 (모든 대출 합산)
  for (let month = 1; month <= 12; month++) {
    let monthPayment = 0;
    let monthInterest = 0;
    let monthPrincipal = 0;
    let monthBalance = 0;
    
    for (const loan of loans) {
      const { principal, apr, termMonths, repaymentType } = loan;
      let result;
      
      switch (repaymentType) {
        case 'equal_payment':
          result = calculateEqualPayment(principal, apr, termMonths);
          break;
        case 'equal_principal':
          result = calculateEqualPrincipal(principal, apr, termMonths);
          break;
        case 'interest_only':
          result = calculateInterestOnly(principal, apr, termMonths);
          break;
      }
      
      if (result.schedule[month - 1]) {
        monthPayment += result.schedule[month - 1].payment;
        monthInterest += result.schedule[month - 1].interest;
        monthPrincipal += result.schedule[month - 1].principal;
        monthBalance += result.schedule[month - 1].balance;
      }
    }
    
    debtSchedulePreview.push({
      month,
      payment: Math.round(monthPayment),
      interest: Math.round(monthInterest),
      principal: Math.round(monthPrincipal),
      balance: Math.round(monthBalance)
    });
  }
  
  return {
    totalMonthlyPayment: Math.round(totalMonthlyPayment),
    totalMonthlyInterest: Math.round(totalMonthlyInterest),
    totalMonthlyPrincipal: Math.round(totalMonthlyPrincipal),
    balanceAfterMonth: Math.round(totalBalanceAfterMonth),
    debtSchedulePreview,
    loansDetail
  };
}

module.exports = {
  amortizeLoans,
  calculateEqualPayment,
  calculateEqualPrincipal,
  calculateInterestOnly
};
