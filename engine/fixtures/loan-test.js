/**
 * 대출 기능 테스트
 * 
 * 1. 대출 없음 (기존 결과 유지)
 * 2. interest_only 대출 케이스
 * 3. equal_payment 대출 케이스
 * 4. dscr < 1.0 → signal = red 확인
 */

const { getBrandForEngine } = require('../data_local/brandLoader');
const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');

// 테스트 조건
const baseConditions = {
  initialInvestment: 200000000,  // 2억원
  monthlyRent: 4000000,          // 400만원
  area: 10,
  ownerWorking: true
};

const market = {
  expectedDailySales: 250,
  radiusM: 500,
  marketScore: 65
};

const roadview = {
  overallRisk: "medium",
  riskScore: 60
};

const targetDailySales = 300;

async function testNoLoan() {
  console.log('\n=== 테스트 1: 대출 없음 (기존 결과 유지) ===');
  
  const brand = await getBrandForEngine('brand_mega');
  const finance = calculateFinance({
    brand,
    conditions: baseConditions,
    market,
    targetDailySales
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions: baseConditions,
    brand,
    targetDailySales
  });
  
  console.log(`월 순이익: ${finance.monthlyProfit.toLocaleString()}원`);
  console.log(`DSCR: ${finance.debt.dscr || 'N/A'}`);
  console.log(`신호등: ${decision.signal}`);
  console.log(`점수: ${decision.score}`);
}

async function testInterestOnlyLoan() {
  console.log('\n=== 테스트 2: interest_only 대출 케이스 ===');
  
  const brand = await getBrandForEngine('brand_mega');
  const conditions = {
    ...baseConditions,
    loans: [{
      principal: 100000000,  // 1억원
      apr: 0.05,             // 5%
      termMonths: 60,        // 5년
      repaymentType: "interest_only"
    }]
  };
  
  const finance = calculateFinance({
    brand,
    conditions,
    market,
    targetDailySales
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions,
    brand,
    targetDailySales
  });
  
  console.log(`영업 이익: ${finance.operatingProfit.toLocaleString()}원`);
  console.log(`월 대출 상환액: ${finance.debt.monthlyPayment.toLocaleString()}원`);
  console.log(`월 이자: ${finance.debt.monthlyInterest.toLocaleString()}원`);
  console.log(`월 순이익: ${finance.monthlyProfit.toLocaleString()}원`);
  console.log(`DSCR: ${finance.debt.dscr?.toFixed(2) || 'N/A'}`);
  console.log(`신호등: ${decision.signal}`);
  console.log(`점수: ${decision.score}`);
}

async function testEqualPaymentLoan() {
  console.log('\n=== 테스트 3: equal_payment 대출 케이스 ===');
  
  const brand = await getBrandForEngine('brand_mega');
  const conditions = {
    ...baseConditions,
    loans: [{
      principal: 100000000,  // 1억원
      apr: 0.05,             // 5%
      termMonths: 60,        // 5년
      repaymentType: "equal_payment"
    }]
  };
  
  const finance = calculateFinance({
    brand,
    conditions,
    market,
    targetDailySales
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions,
    brand,
    targetDailySales
  });
  
  console.log(`영업 이익: ${finance.operatingProfit.toLocaleString()}원`);
  console.log(`월 대출 상환액: ${finance.debt.monthlyPayment.toLocaleString()}원`);
  console.log(`월 이자: ${finance.debt.monthlyInterest.toLocaleString()}원`);
  console.log(`월 원금: ${finance.debt.monthlyPrincipal.toLocaleString()}원`);
  console.log(`월 순이익: ${finance.monthlyProfit.toLocaleString()}원`);
  console.log(`DSCR: ${finance.debt.dscr?.toFixed(2) || 'N/A'}`);
  console.log(`신호등: ${decision.signal}`);
  console.log(`점수: ${decision.score}`);
  
  // 12개월 스케줄 미리보기
  if (finance.debt.debtSchedulePreview && finance.debt.debtSchedulePreview.length > 0) {
    console.log('\n12개월 상환 스케줄 미리보기:');
    finance.debt.debtSchedulePreview.slice(0, 3).forEach(schedule => {
      console.log(`  ${schedule.month}개월: 상환 ${schedule.payment.toLocaleString()}원 (이자 ${schedule.interest.toLocaleString()}원, 원금 ${schedule.principal.toLocaleString()}원), 잔액 ${schedule.balance.toLocaleString()}원`);
    });
  }
}

async function testLowDSCR() {
  console.log('\n=== 테스트 4: DSCR < 1.0 → signal = red 확인 ===');
  
  const brand = await getBrandForEngine('brand_mega');
  // DSCR < 1.0이 되도록 대출금을 크게 설정
  const conditions = {
    ...baseConditions,
    loans: [{
      principal: 200000000,  // 2억원 (큰 대출)
      apr: 0.08,             // 8% (높은 이자율)
      termMonths: 60,
      repaymentType: "equal_payment"
    }]
  };
  
  const finance = calculateFinance({
    brand,
    conditions,
    market,
    targetDailySales
  });
  
  const decision = calculateDecision({
    finance,
    market,
    roadview,
    conditions,
    brand,
    targetDailySales
  });
  
  console.log(`영업 이익: ${finance.operatingProfit.toLocaleString()}원`);
  console.log(`월 대출 상환액: ${finance.debt.monthlyPayment.toLocaleString()}원`);
  console.log(`DSCR: ${finance.debt.dscr?.toFixed(2) || 'N/A'}`);
  console.log(`신호등: ${decision.signal} ${decision.signal === 'red' ? '✅' : '❌'}`);
  console.log(`점수: ${decision.score}`);
  
  // 리스크 카드 확인
  const dscrRisk = decision.riskCards.find(card => card.id === 'debt_service_stress');
  if (dscrRisk) {
    console.log(`\n리스크 카드: ${dscrRisk.title}`);
    console.log(`  심각도: ${dscrRisk.severity}`);
    console.log(`  설명: ${dscrRisk.narrative}`);
  }
}

async function runAllTests() {
  console.log('='.repeat(80));
  console.log('대출 기능 테스트');
  console.log('='.repeat(80));
  
  try {
    await testNoLoan();
    await testInterestOnlyLoan();
    await testEqualPaymentLoan();
    await testLowDSCR();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 모든 테스트 완료');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testNoLoan,
  testInterestOnlyLoan,
  testEqualPaymentLoan,
  testLowDSCR
};
