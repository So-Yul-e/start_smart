/**
 * 출력 검증 함수 테스트
 * 
 * Finance와 Decision 출력 검증 함수가 정상 작동하는지 테스트
 */

const { validateFinanceOutput, validateFinanceOutputSimple } = require('../finance/validator');
const { validateDecisionOutput, validateDecisionOutputSimple } = require('../decision/validator');
const { getBrandForEngine } = require('../data_local/brandLoader');
const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');

// 테스트 데이터 (비동기 로드 필요)
let testBrand = null;
const testConditions = {
  initialInvestment: 200000000,
  monthlyRent: 4000000,
  area: 10,
  ownerWorking: true
};
const testMarket = {
  expectedDailySales: 256,
  radiusM: 500,
  marketScore: 65
};
const testRoadview = {
  overallRisk: "medium",
  riskScore: 60
};

/**
 * Finance 출력 검증 테스트
 */
async function testFinanceValidation() {
  console.log('=== Finance 출력 검증 테스트 ===\n');
  
  if (!testBrand) {
    testBrand = await getBrandForEngine('brand_mega');
  }
  
  // 정상 케이스
  const financeResult = calculateFinance({
    brand: testBrand,
    conditions: testConditions,
    market: testMarket,
    targetDailySales: 300,
    scenarios: [200, 250, 300]
  });
  
  const validation = validateFinanceOutput(financeResult);
  
  console.log('검증 결과:');
  console.log(`- 유효성: ${validation.valid ? '✅ 통과' : '❌ 실패'}`);
  
  if (validation.errors.length > 0) {
    console.log('\n에러:');
    validation.errors.forEach(err => console.log(`  - ${err}`));
  }
  
  if (validation.warnings.length > 0) {
    console.log('\n경고:');
    validation.warnings.forEach(warn => console.log(`  - ${warn}`));
  }
  
  // 엣지 케이스: paybackMonths가 null인 경우
  console.log('\n--- 엣지 케이스 테스트: paybackMonths = null ---');
  const negativeFinance = {
    ...financeResult,
    monthlyProfit: -1000000,
    paybackMonths: null
  };
  
  const negativeValidation = validateFinanceOutput(negativeFinance);
  console.log(`- 유효성: ${negativeValidation.valid ? '✅ 통과' : '❌ 실패'}`);
  
  return validation.valid;
}

/**
 * Decision 출력 검증 테스트
 */
async function testDecisionValidation() {
  console.log('\n=== Decision 출력 검증 테스트 ===\n');
  
  if (!testBrand) {
    testBrand = await getBrandForEngine('brand_mega');
  }
  
  // Finance 계산
  const financeResult = calculateFinance({
    brand: testBrand,
    conditions: testConditions,
    market: testMarket,
    targetDailySales: 300
  });
  
  // Decision 계산
  const decisionResult = calculateDecision({
    finance: financeResult,
    market: testMarket,
    roadview: testRoadview,
    conditions: testConditions,
    brand: testBrand,
    targetDailySales: 300
  });
  
  const validation = validateDecisionOutput(decisionResult);
  
  console.log('검증 결과:');
  console.log(`- 유효성: ${validation.valid ? '✅ 통과' : '❌ 실패'}`);
  
  if (validation.errors.length > 0) {
    console.log('\n에러:');
    validation.errors.forEach(err => console.log(`  - ${err}`));
  }
  
  if (validation.warnings.length > 0) {
    console.log('\n경고:');
    validation.warnings.forEach(warn => console.log(`  - ${warn}`));
  }
  
  // Backward Compatibility 확인
  console.log('\n--- Backward Compatibility 확인 ---');
  console.log(`- riskFactors (레거시): ${Array.isArray(decisionResult.riskFactors) ? '✅' : '❌'}`);
  console.log(`- riskCards (신규): ${Array.isArray(decisionResult.riskCards) ? '✅' : '❌'}`);
  console.log(`- successProbability: ${typeof decisionResult.successProbability === 'number' ? '✅' : '❌'}`);
  
  return validation.valid;
}

/**
 * 간단한 검증 함수 테스트
 */
async function testSimpleValidation() {
  console.log('\n=== 간단한 검증 함수 테스트 ===\n');
  
  if (!testBrand) {
    testBrand = await getBrandForEngine('brand_mega');
  }
  
  const financeResult = calculateFinance({
    brand: testBrand,
    conditions: testConditions,
    market: testMarket,
    targetDailySales: 300
  });
  
  console.log('validateFinanceOutputSimple 실행 (경고만 출력):');
  const financeValid = validateFinanceOutputSimple(financeResult, false);
  console.log(`결과: ${financeValid ? '✅ 통과' : '❌ 실패'}\n`);
  
  const decisionResult = calculateDecision({
    finance: financeResult,
    market: testMarket,
    roadview: testRoadview
  });
  
  console.log('validateDecisionOutputSimple 실행 (경고만 출력):');
  const decisionValid = validateDecisionOutputSimple(decisionResult, false);
  console.log(`결과: ${decisionValid ? '✅ 통과' : '❌ 실패'}`);
}

// 실행
if (require.main === module) {
  (async () => {
    const financeValid = await testFinanceValidation();
    const decisionValid = await testDecisionValidation();
    await testSimpleValidation();
    
    console.log('\n=== 최종 결과 ===');
    console.log(`Finance 검증: ${financeValid ? '✅ 통과' : '❌ 실패'}`);
    console.log(`Decision 검증: ${decisionValid ? '✅ 통과' : '❌ 실패'}`);
    
    if (financeValid && decisionValid) {
      console.log('\n🎉 모든 검증 통과!');
    }
  })().catch(error => {
    console.error('에러 발생:', error);
    process.exit(1);
  });
}

module.exports = {
  testFinanceValidation,
  testDecisionValidation,
  testSimpleValidation
};
