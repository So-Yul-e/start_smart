/**
 * 5개 브랜드 비교 테스트
 * 
 * 조건:
 * - 초기 투자금: 2억원
 * - 월세: 400만원
 * - 평수: 33평
 * - 점주 근무: true
 * - 대출: 창업대출 1억원, 연 4.5%, 5년, equal_payment
 * - 상권 기대 판매량: 250잔
 * - 상권 점수: 70
 */

const { calculate: calculateFinance } = require('../finance');
const { calculate: calculateDecision } = require('../decision');

// 공통 조건
const baseConditions = {
  initialInvestment: 200_000_000,   // 2억원
  monthlyRent: 4_000_000,           // 월세 400만원
  area: 33,                         // 33평
  ownerWorking: true,               // 점주 근무
  loans: [
    {
      type: "startup",
      principal: 100_000_000,       // 창업대출 1억
      apr: 0.045,                   // 연 4.5%
      termMonths: 60,               // 5년
      repaymentType: "equal_payment"
    }
  ]
};

const market = {
  expectedDailySales: 250,          // 상권 평균 기대 판매량
  competitors: { total: 7, density: "high" },
  marketScore: 70
};

const roadview = {
  overallRisk: "medium",
  riskScore: 65
};

const targetDailySales = 300;      // 목표 일 판매량
const scenarios = [200, 250, 300];  // 시나리오

// 브랜드 데이터 (사용자 제공 데이터를 엔진 형식으로 변환)
// brands.json에서 기본값을 가져와서 사용자 제공 데이터와 병합
const brandConfigs = [
  {
    id: "brand_ediya",
    name: "이디야커피",
    defaults: {
      avgPrice: 3800,
      cogsRate: 0.36,              // brands.json에서
      laborRate: 0.21,             // brands.json에서
      utilitiesRate: 0.03,        // brands.json에서
      etcFixed: 1150000,          // brands.json에서
      royaltyRate: 0.03,          // monthlyRoyalty 3% -> 0.03
      marketingRate: 0.015,       // monthlyMarketing 1.5% -> 0.015
      ownerWorkingMultiplier: 0.6,
      expectedDailySales: null
    },
    avgMonthlySales: 34_200_000,
    avgSalesPerPyeong: 3_420_000,
    brandDeclineRate: 0.08         // 3년간 -8%
  },
  {
    id: "brand_mega",
    name: "메가커피",
    defaults: {
      avgPrice: 3500,
      cogsRate: 0.35,              // brands.json에서
      laborRate: 0.20,             // brands.json에서
      utilitiesRate: 0.03,         // brands.json에서
      etcFixed: 1100000,           // brands.json에서
      royaltyRate: 0.02,           // monthlyRoyalty 2% -> 0.02
      marketingRate: 0.015,        // monthlyMarketing 1.5% -> 0.015
      ownerWorkingMultiplier: 0.6,
      expectedDailySales: null
    },
    avgMonthlySales: 31_500_000,
    avgSalesPerPyeong: 3_150_000,
    brandDeclineRate: 0.12         // 3년간 -12%
  },
  {
    id: "brand_dunkin",
    name: "던킨도너츠",
    defaults: {
      avgPrice: 3200,
      cogsRate: 0.33,              // brands.json에서
      laborRate: 0.19,             // brands.json에서
      utilitiesRate: 0.03,         // brands.json에서
      etcFixed: 1050000,           // brands.json에서
      royaltyRate: 0.04,           // monthlyRoyalty 4% -> 0.04
      marketingRate: 0.02,         // monthlyMarketing 2% -> 0.02
      ownerWorkingMultiplier: 0.6,
      expectedDailySales: null
    },
    avgMonthlySales: 28_800_000,
    avgSalesPerPyeong: 2_880_000,
    brandDeclineRate: 0.22         // 3년간 -22%
  },
  {
    id: "brand_manleap",
    name: "만렙커피",
    defaults: {
      avgPrice: 3100,
      cogsRate: 0.33,              // brands.json에서
      laborRate: 0.18,             // brands.json에서
      utilitiesRate: 0.03,         // brands.json에서
      etcFixed: 900000,            // brands.json에서
      royaltyRate: 0.02,           // monthlyRoyalty 2% -> 0.02
      marketingRate: 0.01,         // monthlyMarketing 1% -> 0.01
      ownerWorkingMultiplier: 0.6,
      expectedDailySales: null
    },
    avgMonthlySales: 27_900_000,
    avgSalesPerPyeong: 2_790_000,
    brandDeclineRate: 0.26         // 3년간 -26%
  },
  {
    id: "brand_banapresso",
    name: "바나프레소",
    defaults: {
      avgPrice: 3000,
      cogsRate: 0.34,              // brands.json에서
      laborRate: 0.19,             // brands.json에서
      utilitiesRate: 0.03,         // brands.json에서
      etcFixed: 950000,            // brands.json에서
      royaltyRate: 0.03,          // monthlyRoyalty 3% -> 0.03
      marketingRate: 0.02,         // monthlyMarketing 2% -> 0.02
      ownerWorkingMultiplier: 0.6,
      expectedDailySales: null
    },
    avgMonthlySales: 27_000_000,
    avgSalesPerPyeong: 2_700_000,
    brandDeclineRate: 0.34         // 3년간 -34%
  }
];

/**
 * 단일 브랜드 계산
 */
function calculateBrand(brand) {
  // 손익 계산
  const financeResult = calculateFinance({
    brand: brand,
    conditions: baseConditions,
    market: market,
    targetDailySales: targetDailySales,
    scenarios: scenarios
  });

  // 판단 계산
  const decisionResult = calculateDecision({
    finance: financeResult,
    market: market,
    roadview: roadview,
    conditions: baseConditions,
    brand: brand,
    targetDailySales: targetDailySales
  });

  return {
    brand: brand,
    finance: financeResult,
    decision: decisionResult
  };
}

/**
 * 숫자 포맷팅
 */
function formatNumber(num) {
  if (num === null || num === undefined) return 'N/A';
  if (typeof num === 'number') {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}만원`;
    }
    return `${num.toFixed(0)}원`;
  }
  return num.toString();
}

function formatPercent(num) {
  if (num === null || num === undefined) return 'N/A';
  return `${(num * 100).toFixed(1)}%`;
}

/**
 * 결과 출력
 */
function printResult(result, index) {
  const { brand, finance, decision } = result;
  
  console.log('\n' + '='.repeat(80));
  console.log(`${index + 1}. ${brand.name}`);
  console.log('='.repeat(80));
  
  // 브랜드 정보
  console.log(`\n📊 브랜드 정보:`);
  console.log(`   - 평균 단가: ${formatNumber(brand.defaults.avgPrice)}`);
  console.log(`   - 브랜드 감소율: ${formatPercent(brand.brandDeclineRate)}`);
  console.log(`   - 평균 월 매출: ${formatNumber(brand.avgMonthlySales)}`);
  
  // 손익 계산 결과
  console.log(`\n💰 손익 계산:`);
  console.log(`   - 월 매출: ${formatNumber(finance.monthlyRevenue)}`);
  console.log(`   - 월 순이익: ${formatNumber(finance.monthlyProfit)}`);
  console.log(`   - 회수 기간: ${finance.paybackMonths === null ? 'N/A' : finance.paybackMonths.toFixed(1) + '개월'}`);
  console.log(`   - 손익분기점: ${finance.breakEvenDailySales === null ? 'N/A' : finance.breakEvenDailySales.toFixed(0) + '잔'}`);
  
  if (finance.debt && finance.debt.monthlyPayment) {
    console.log(`   - 대출 월 상환액: ${formatNumber(finance.debt.monthlyPayment)}`);
    if (finance.debt.dscr !== null) {
      console.log(`   - DSCR: ${finance.debt.dscr.toFixed(2)}`);
    }
  }
  
  // 기대 판매량 및 GAP
  if (finance.expected) {
    console.log(`\n📈 기대 판매량 분석:`);
    console.log(`   - 상권 기대 판매량: ${finance.expected.expectedDailySales}잔`);
    console.log(`   - 목표 판매량: ${targetDailySales}잔`);
    console.log(`   - GAP: ${formatPercent(finance.expected.gapPctVsTarget)}`);
    if (finance.expected.gapWarning) {
      console.log(`   ⚠️  경고: GAP 계산 시 fallback 사용됨`);
    }
  }
  
  // 판단 결과
  console.log(`\n🎯 판단 결과:`);
  console.log(`   - 점수: ${decision.score}점`);
  console.log(`   - 성공 확률: ${formatPercent(decision.successProbability)}`);
  console.log(`   - 신호등: ${decision.signal === 'green' ? '🟢 초록' : decision.signal === 'yellow' ? '🟡 노랑' : '🔴 빨강'}`);
  console.log(`   - 생존 개월: ${decision.survivalMonths}개월`);
  console.log(`   - 리스크 레벨: ${decision.riskLevel === 'low' ? '🟢 낮음' : decision.riskLevel === 'medium' ? '🟡 중간' : '🔴 높음'}`);
  
  // Breakdown (있는 경우)
  if (decision.breakdown) {
    console.log(`\n📋 점수 Breakdown:`);
    console.log(`   - 기본 점수: ${decision.breakdown.baseScore || 'N/A'}`);
    console.log(`   - 회수 기간 감점: ${decision.breakdown.paybackDeduction || 0}`);
    console.log(`   - 순이익 감점: ${decision.breakdown.profitDeduction || 0}`);
    console.log(`   - 상권 점수 반영: ${decision.breakdown.marketScore || 'N/A'}`);
    console.log(`   - 로드뷰 리스크 감점: ${decision.breakdown.roadviewDeduction || 0}`);
    if (decision.breakdown.bonus !== undefined) {
      console.log(`   - 보너스: ${decision.breakdown.bonus}`);
    }
  }
  
  // 리스크 카드
  if (decision.riskCards && decision.riskCards.length > 0) {
    console.log(`\n⚠️  리스크 카드:`);
    decision.riskCards.forEach((card, idx) => {
      const severity = card.severity === 'high' ? '🔴' : card.severity === 'medium' ? '🟡' : '🟢';
      console.log(`   ${idx + 1}. ${severity} ${card.title} (${card.severity})`);
      console.log(`      ${card.narrative}`);
    });
  }
  
  // 민감도 분석
  if (finance.sensitivity) {
    console.log(`\n📊 민감도 분석:`);
    if (finance.sensitivity.plus10) {
      console.log(`   - 판매량 +10%: 순이익 ${formatNumber(finance.sensitivity.plus10.monthlyProfit)}, 회수 ${finance.sensitivity.plus10.paybackMonths === null ? 'N/A' : finance.sensitivity.plus10.paybackMonths.toFixed(1) + '개월'}`);
    }
    if (finance.sensitivity.minus10) {
      console.log(`   - 판매량 -10%: 순이익 ${formatNumber(finance.sensitivity.minus10.monthlyProfit)}, 회수 ${finance.sensitivity.minus10.paybackMonths === null ? 'N/A' : finance.sensitivity.minus10.paybackMonths.toFixed(1) + '개월'}`);
    }
  }
}

/**
 * 비교 테이블 출력
 */
function printComparisonTable(results) {
  console.log('\n' + '='.repeat(100));
  console.log('📊 브랜드 비교 테이블');
  console.log('='.repeat(100));
  
  console.log('\n브랜드명'.padEnd(12) + 
              '점수'.padEnd(8) + 
              '신호등'.padEnd(8) + 
              '월순이익'.padEnd(12) + 
              '회수기간'.padEnd(12) + 
              '생존개월'.padEnd(12) + 
              'GAP'.padEnd(10) + 
              '리스크');
  
  console.log('-'.repeat(100));
  
  results.forEach(result => {
    const { brand, finance, decision } = result;
    const signal = decision.signal === 'green' ? '🟢' : decision.signal === 'yellow' ? '🟡' : '🔴';
    const risk = decision.riskLevel === 'low' ? '🟢' : decision.riskLevel === 'medium' ? '🟡' : '🔴';
    const profit = finance.monthlyProfit ? `${(finance.monthlyProfit / 10000).toFixed(0)}만` : 'N/A';
    const payback = finance.paybackMonths ? `${finance.paybackMonths.toFixed(1)}개월` : 'N/A';
    const gap = finance.expected ? `${(finance.expected.gapPctVsTarget * 100).toFixed(1)}%` : 'N/A';
    
    console.log(
      brand.name.padEnd(12) +
      `${decision.score}점`.padEnd(8) +
      signal.padEnd(8) +
      profit.padEnd(12) +
      payback.padEnd(12) +
      `${decision.survivalMonths}개월`.padEnd(12) +
      gap.padEnd(10) +
      risk
    );
  });
  
  console.log('='.repeat(100));
}

/**
 * 메인 실행
 */
function main() {
  console.log('🚀 5개 브랜드 비교 테스트 시작\n');
  console.log('조건:');
  console.log(`- 초기 투자금: ${formatNumber(baseConditions.initialInvestment)}`);
  console.log(`- 월세: ${formatNumber(baseConditions.monthlyRent)}`);
  console.log(`- 평수: ${baseConditions.area}평`);
  console.log(`- 점주 근무: ${baseConditions.ownerWorking ? '예' : '아니오'}`);
  console.log(`- 대출: ${formatNumber(baseConditions.loans[0].principal)} (연 ${(baseConditions.loans[0].apr * 100).toFixed(1)}%, ${baseConditions.loans[0].termMonths}개월)`);
  console.log(`- 상권 기대 판매량: ${market.expectedDailySales}잔`);
  console.log(`- 목표 판매량: ${targetDailySales}잔`);
  
  const results = [];
  
  // 각 브랜드 계산
  brandConfigs.forEach((brand, index) => {
    try {
      const result = calculateBrand(brand);
      results.push(result);
      printResult(result, index);
    } catch (error) {
      console.error(`\n❌ ${brand.name} 계산 중 오류 발생:`, error.message);
      console.error(error.stack);
    }
  });
  
  // 비교 테이블 출력
  if (results.length > 0) {
    printComparisonTable(results);
  }
  
  console.log(`\n✅ 총 ${results.length}개 브랜드 계산 완료\n`);
}

// 실행
main();
