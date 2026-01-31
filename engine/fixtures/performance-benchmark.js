/**
 * 성능 벤치마크 및 병목 지점 파악
 * 
 * 측정 항목:
 * 1. Finance 계산 성능
 * 2. Decision 계산 성능
 * 3. 전체 파이프라인 성능
 * 4. 시나리오 테이블 계산 성능
 * 5. 대출 계산 성능
 * 6. 병목 지점 파악
 */

const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');
const { getBrandForEngine } = require('../data_local/brandLoader');

// 테스트 데이터
const testBrand = {
  defaults: {
    avgPrice: 3500,
    cogsRate: 0.35,
    laborRate: 0.20,
    utilitiesRate: 0.03,
    royaltyRate: 0.05,
    marketingRate: 0.02,
    etcFixed: 1100000,
    ownerWorkingMultiplier: 0.6,
    expectedDailySales: null
  },
  avgMonthlySales: 31500000,
  avgSalesPerPyeong: 3150000,
  brandDeclineRate: 0.12
};

const testConditions = {
  initialInvestment: 200_000_000,
  monthlyRent: 4_000_000,
  area: 10,
  ownerWorking: true,
  loans: [
    {
      type: "startup",
      principal: 100_000_000,
      apr: 0.045,
      termMonths: 60,
      repaymentType: "equal_payment"
    }
  ]
};

const testMarket = {
  expectedDailySales: 250,
  radiusM: 500,
  marketScore: 70,
  competitors: { total: 5, density: "high" }
};

const testRoadview = {
  overallRisk: "medium",
  riskScore: 65
};

const targetDailySales = 300;
const scenarios = [200, 250, 300, 350, 400];

/**
 * 성능 측정 헬퍼 함수
 */
function measureTime(fn, label) {
  const start = process.hrtime.bigint();
  const result = fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1_000_000; // 밀리초로 변환
  
  return {
    label,
    duration,
    result
  };
}

/**
 * 평균 실행 시간 측정
 */
function measureAverageTime(fn, label, iterations = 100) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000;
    times.push(duration);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
  
  return {
    label,
    iterations,
    avg,
    min,
    max,
    median,
    total: avg * iterations
  };
}

/**
 * 1. Finance 계산 성능 측정
 */
function benchmarkFinance() {
  console.log('\n📊 Finance 계산 성능 측정');
  console.log('='.repeat(80));
  
  const result = measureAverageTime(() => {
    return calculateFinance({
      brand: testBrand,
      conditions: testConditions,
      market: testMarket,
      targetDailySales
    });
  }, 'Finance 계산 (단일)', 1000);
  
  console.log(`  반복 횟수: ${result.iterations}회`);
  console.log(`  평균 시간: ${result.avg.toFixed(3)}ms`);
  console.log(`  최소 시간: ${result.min.toFixed(3)}ms`);
  console.log(`  최대 시간: ${result.max.toFixed(3)}ms`);
  console.log(`  중간값: ${result.median.toFixed(3)}ms`);
  console.log(`  총 시간: ${result.total.toFixed(3)}ms`);
  console.log(`  초당 처리량: ${(1000 / result.avg).toFixed(0)}회/초`);
  
  return result;
}

/**
 * 2. Decision 계산 성능 측정
 */
function benchmarkDecision() {
  console.log('\n📊 Decision 계산 성능 측정');
  console.log('='.repeat(80));
  
  // Finance 결과 미리 계산
  const financeResult = calculateFinance({
    brand: testBrand,
    conditions: testConditions,
    market: testMarket,
    targetDailySales
  });
  
  const result = measureAverageTime(() => {
    return calculateDecision({
      finance: financeResult,
      market: testMarket,
      roadview: testRoadview,
      conditions: testConditions,
      brand: testBrand,
      targetDailySales
    });
  }, 'Decision 계산 (단일)', 1000);
  
  console.log(`  반복 횟수: ${result.iterations}회`);
  console.log(`  평균 시간: ${result.avg.toFixed(3)}ms`);
  console.log(`  최소 시간: ${result.min.toFixed(3)}ms`);
  console.log(`  최대 시간: ${result.max.toFixed(3)}ms`);
  console.log(`  중간값: ${result.median.toFixed(3)}ms`);
  console.log(`  총 시간: ${result.total.toFixed(3)}ms`);
  console.log(`  초당 처리량: ${(1000 / result.avg).toFixed(0)}회/초`);
  
  return result;
}

/**
 * 3. 전체 파이프라인 성능 측정
 */
function benchmarkFullPipeline() {
  console.log('\n📊 전체 파이프라인 성능 측정');
  console.log('='.repeat(80));
  
  const result = measureAverageTime(() => {
    const finance = calculateFinance({
      brand: testBrand,
      conditions: testConditions,
      market: testMarket,
      targetDailySales
    });
    
    const decision = calculateDecision({
      finance,
      market: testMarket,
      roadview: testRoadview,
      conditions: testConditions,
      brand: testBrand,
      targetDailySales
    });
    
    return { finance, decision };
  }, '전체 파이프라인', 500);
  
  console.log(`  반복 횟수: ${result.iterations}회`);
  console.log(`  평균 시간: ${result.avg.toFixed(3)}ms`);
  console.log(`  최소 시간: ${result.min.toFixed(3)}ms`);
  console.log(`  최대 시간: ${result.max.toFixed(3)}ms`);
  console.log(`  중간값: ${result.median.toFixed(3)}ms`);
  console.log(`  총 시간: ${result.total.toFixed(3)}ms`);
  console.log(`  초당 처리량: ${(1000 / result.avg).toFixed(0)}회/초`);
  
  return result;
}

/**
 * 4. 시나리오 테이블 계산 성능 측정
 */
function benchmarkScenarioTable() {
  console.log('\n📊 시나리오 테이블 계산 성능 측정');
  console.log('='.repeat(80));
  
  const result = measureAverageTime(() => {
    return calculateFinance({
      brand: testBrand,
      conditions: testConditions,
      market: testMarket,
      targetDailySales,
      scenarios: scenarios
    });
  }, `시나리오 테이블 (${scenarios.length}개 시나리오)`, 200);
  
  console.log(`  반복 횟수: ${result.iterations}회`);
  console.log(`  시나리오 수: ${scenarios.length}개`);
  console.log(`  평균 시간: ${result.avg.toFixed(3)}ms`);
  console.log(`  시나리오당 평균: ${(result.avg / scenarios.length).toFixed(3)}ms`);
  console.log(`  초당 처리량: ${(1000 / result.avg).toFixed(0)}회/초`);
  
  return result;
}

/**
 * 5. 대출 계산 성능 측정
 */
function benchmarkLoanCalculation() {
  console.log('\n📊 대출 계산 성능 측정');
  console.log('='.repeat(80));
  
  // 대출 있는 경우
  const withLoan = measureAverageTime(() => {
    return calculateFinance({
      brand: testBrand,
      conditions: testConditions, // 대출 포함
      market: testMarket,
      targetDailySales
    });
  }, '대출 포함', 500);
  
  // 대출 없는 경우
  const withoutLoanConditions = { ...testConditions, loans: [] };
  const withoutLoan = measureAverageTime(() => {
    return calculateFinance({
      brand: testBrand,
      conditions: withoutLoanConditions,
      market: testMarket,
      targetDailySales
    });
  }, '대출 없음', 500);
  
  console.log(`  대출 포함 평균: ${withLoan.avg.toFixed(3)}ms`);
  console.log(`  대출 없음 평균: ${withoutLoan.avg.toFixed(3)}ms`);
  console.log(`  대출 계산 오버헤드: ${(withLoan.avg - withoutLoan.avg).toFixed(3)}ms`);
  console.log(`  오버헤드 비율: ${((withLoan.avg - withoutLoan.avg) / withoutLoan.avg * 100).toFixed(1)}%`);
  
  return { withLoan, withoutLoan };
}

/**
 * 6. 병목 지점 파악 (단계별 측정)
 */
function benchmarkBottlenecks() {
  console.log('\n📊 병목 지점 파악 (단계별 측정)');
  console.log('='.repeat(80));
  
  const steps = [];
  
  // Step 1: 기본 계산
  const step1 = measureAverageTime(() => {
    const avgPrice = testBrand.defaults.avgPrice;
    const monthlyRevenue = targetDailySales * avgPrice * 30;
    return monthlyRevenue;
  }, '기본 매출 계산', 10000);
  steps.push({ name: '기본 매출 계산', time: step1.avg });
  
  // Step 2: 비용 계산
  const step2 = measureAverageTime(() => {
    const avgPrice = testBrand.defaults.avgPrice;
    const monthlyRevenue = targetDailySales * avgPrice * 30;
    const costs = {
      rent: testConditions.monthlyRent,
      labor: monthlyRevenue * testBrand.defaults.laborRate * (testConditions.ownerWorking ? 0.6 : 1),
      materials: monthlyRevenue * testBrand.defaults.cogsRate,
      utilities: monthlyRevenue * testBrand.defaults.utilitiesRate,
      royalty: monthlyRevenue * testBrand.defaults.royaltyRate,
      marketing: monthlyRevenue * testBrand.defaults.marketingRate,
      etc: testBrand.defaults.etcFixed
    };
    return costs;
  }, '비용 계산', 10000);
  steps.push({ name: '비용 계산', time: step2.avg });
  
  // Step 3: 대출 계산
  const step3 = measureAverageTime(() => {
    if (!testConditions.loans || testConditions.loans.length === 0) return 0;
    // 간단한 대출 계산 시뮬레이션
    const loan = testConditions.loans[0];
    const monthlyRate = loan.apr / 12;
    const payment = loan.principal * (monthlyRate * Math.pow(1 + monthlyRate, loan.termMonths)) / 
                    (Math.pow(1 + monthlyRate, loan.termMonths) - 1);
    return payment;
  }, '대출 계산', 10000);
  steps.push({ name: '대출 계산', time: step3.avg });
  
  // Step 4: 민감도 분석
  const step4 = measureAverageTime(() => {
    const avgPrice = testBrand.defaults.avgPrice;
    const plus10Revenue = targetDailySales * 1.1 * avgPrice * 30;
    const minus10Revenue = targetDailySales * 0.9 * avgPrice * 30;
    return { plus10Revenue, minus10Revenue };
  }, '민감도 분석', 10000);
  steps.push({ name: '민감도 분석', time: step4.avg });
  
  // Step 5: Decision 점수 계산
  const financeResult = calculateFinance({
    brand: testBrand,
    conditions: testConditions,
    market: testMarket,
    targetDailySales
  });
  
  const step5 = measureAverageTime(() => {
    const { calculateScore } = require('../decision/scorer');
    return calculateScore(financeResult, testMarket, testRoadview);
  }, 'Decision 점수 계산', 1000);
  steps.push({ name: 'Decision 점수 계산', time: step5.avg });
  
  // 결과 출력
  steps.sort((a, b) => b.time - a.time);
  
  console.log('\n  병목 지점 순위 (느린 순):');
  steps.forEach((step, index) => {
    const percentage = (step.time / steps.reduce((sum, s) => sum + s.time, 0) * 100).toFixed(1);
    console.log(`  ${index + 1}. ${step.name.padEnd(25)} ${step.time.toFixed(3)}ms (${percentage}%)`);
  });
  
  return steps;
}

/**
 * 7. 메모리 사용량 측정
 */
function benchmarkMemory() {
  console.log('\n📊 메모리 사용량 측정');
  console.log('='.repeat(80));
  
  const initialMemory = process.memoryUsage();
  
  // 여러 번 계산하여 메모리 누수 확인
  for (let i = 0; i < 100; i++) {
    const finance = calculateFinance({
      brand: testBrand,
      conditions: testConditions,
      market: testMarket,
      targetDailySales,
      scenarios: scenarios
    });
    
    const decision = calculateDecision({
      finance,
      market: testMarket,
      roadview: testRoadview,
      conditions: testConditions,
      brand: testBrand,
      targetDailySales
    });
  }
  
  // 강제 가비지 컬렉션 (Node.js --expose-gc 옵션 필요)
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = process.memoryUsage();
  
  console.log('  초기 메모리:');
  console.log(`    힙 사용량: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`    힙 총량: ${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`);
  console.log('  최종 메모리:');
  console.log(`    힙 사용량: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`    힙 총량: ${(finalMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`);
  console.log('  증가량:');
  console.log(`    힙 사용량: ${((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`);
  console.log(`    힙 총량: ${((finalMemory.heapTotal - initialMemory.heapTotal) / 1024 / 1024).toFixed(2)}MB`);
  
  return {
    initial: initialMemory,
    final: finalMemory
  };
}

/**
 * 메인 실행 함수
 */
function runBenchmarks() {
  console.log('🚀 성능 벤치마크 시작\n');
  console.log('테스트 환경:');
  console.log(`  Node.js 버전: ${process.version}`);
  console.log(`  플랫폼: ${process.platform}`);
  console.log(`  아키텍처: ${process.arch}`);
  
  const results = {};
  
  // 1. Finance 계산
  results.finance = benchmarkFinance();
  
  // 2. Decision 계산
  results.decision = benchmarkDecision();
  
  // 3. 전체 파이프라인
  results.fullPipeline = benchmarkFullPipeline();
  
  // 4. 시나리오 테이블
  results.scenarioTable = benchmarkScenarioTable();
  
  // 5. 대출 계산
  results.loan = benchmarkLoanCalculation();
  
  // 6. 병목 지점
  results.bottlenecks = benchmarkBottlenecks();
  
  // 7. 메모리 사용량
  results.memory = benchmarkMemory();
  
  // 종합 요약
  console.log('\n' + '='.repeat(80));
  console.log('📊 성능 벤치마크 종합 요약');
  console.log('='.repeat(80));
  
  console.log('\n주요 성능 지표:');
  console.log(`  Finance 계산: ${results.finance.avg.toFixed(3)}ms (${(1000 / results.finance.avg).toFixed(0)}회/초)`);
  console.log(`  Decision 계산: ${results.decision.avg.toFixed(3)}ms (${(1000 / results.decision.avg).toFixed(0)}회/초)`);
  console.log(`  전체 파이프라인: ${results.fullPipeline.avg.toFixed(3)}ms (${(1000 / results.fullPipeline.avg).toFixed(0)}회/초)`);
  console.log(`  시나리오 테이블 (${scenarios.length}개): ${results.scenarioTable.avg.toFixed(3)}ms`);
  
  console.log('\n병목 지점 Top 3:');
  results.bottlenecks.slice(0, 3).forEach((step, index) => {
    console.log(`  ${index + 1}. ${step.name}: ${step.time.toFixed(3)}ms`);
  });
  
  console.log('\n✅ 벤치마크 완료');
}

// 실행
if (require.main === module) {
  runBenchmarks();
}

module.exports = {
  runBenchmarks,
  benchmarkFinance,
  benchmarkDecision,
  benchmarkFullPipeline,
  benchmarkScenarioTable,
  benchmarkLoanCalculation,
  benchmarkBottlenecks,
  benchmarkMemory
};
