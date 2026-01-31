/**
 * 통합 테스트 스크립트 (DB 없이)
 * engine 모듈 병합 후 코드 레벨 테스트
 */

require('dotenv').config();
const { calculateFinance } = require('../engine/finance');
const { calculate: calculateDecision } = require('../engine/decision');
const { analyzeMarket } = require('./market');

async function testIntegration() {
  console.log('🧪 통합 테스트 시작 (DB 없이)...\n');

  // 테스트 데이터 (engine 형식)
  const brand = {
    id: 'brand_1',
    name: '스타벅스',
    position: '프리미엄',
    initialInvestment: 500000000,
    monthlyRoyalty: 5,
    monthlyMarketing: 2,
    avgDailySales: 250,
    // engine이 요구하는 defaults 추가
    defaults: {
      avgPrice: 5000, // 평균 단가 (원/잔)
      cogsRate: 0.30, // 원가율 (30%)
      laborRate: 0.25, // 인건비율 (25%)
      utilitiesRate: 0.03, // 공과금 비율 (3%)
      etcFixed: 1500000, // 기타 고정비 (원)
      royaltyRate: 0.05, // 로열티율 (5%)
      marketingRate: 0.02, // 마케팅비율 (2%)
      ownerWorkingMultiplier: 0.6, // 점주 근무 시 인건비 감산 계수
      expectedDailySales: 250
    }
  };

  const location = {
    lat: 37.4980,
    lng: 127.0276,
    address: '서울특별시 강남구 강남대로 396'
  };

  const conditions = {
    initialInvestment: 500000000,
    monthlyRent: 3000000,
    area: 33,
    ownerWorking: true
  };

  const targetDailySales = 300;
  const radius = 500;

  try {
    console.log('📋 테스트 데이터:');
    console.log(`브랜드: ${brand.name}`);
    console.log(`위치: ${location.address}`);
    console.log(`목표 일 판매량: ${targetDailySales}잔\n`);

    // 1. 상권 분석
    console.log('1️⃣  상권 분석 실행...');
    const market = await analyzeMarket(location, radius, brand.id);
    console.log(`✅ 상권 분석 완료`);
    console.log(`   - 경쟁 카페 수: ${market.competitors.total}개`);
    console.log(`   - 같은 브랜드: ${market.competitors.sameBrand}개`);
    console.log(`   - 상권 점수: ${market.marketScore}/100\n`);

    // 2. 손익 계산
    console.log('2️⃣  손익 계산 실행...');
    const finance = calculateFinance({
      brand,
      conditions,
      market,
      targetDailySales
    });
    console.log(`✅ 손익 계산 완료`);
    console.log(`   - 월 매출: ${finance.monthlyRevenue?.toLocaleString()}원`);
    console.log(`   - 월 순이익: ${finance.monthlyProfit?.toLocaleString()}원`);
    console.log(`   - 회수 개월: ${finance.paybackMonths}개월\n`);

    // 3. 판단 계산
    console.log('3️⃣  판단 계산 실행...');
    const roadview = {
      location: { lat: location.lat, lng: location.lng },
      risks: [],
      overallRisk: 'medium',
      riskScore: 65
    };

    const decision = calculateDecision({
      finance,
      market,
      roadview,
      conditions,
      brand,
      targetDailySales
    });
    console.log(`✅ 판단 계산 완료`);
    console.log(`   - 점수: ${decision.score}/100`);
    console.log(`   - 신호등: ${decision.signal}`);
    console.log(`   - 생존 개월: ${decision.survivalMonths}개월`);
    console.log(`   - 리스크 레벨: ${decision.riskLevel}\n`);

    // 최종 결과
    console.log('📊 최종 결과 요약:');
    console.log('==================================================');
    console.log(`브랜드: ${brand.name}`);
    console.log(`위치: ${location.address}`);
    console.log(`\n💰 손익:`);
    console.log(`  월 매출: ${finance.monthlyRevenue?.toLocaleString()}원`);
    console.log(`  월 순이익: ${finance.monthlyProfit?.toLocaleString()}원`);
    console.log(`  회수 개월: ${finance.paybackMonths}개월`);
    console.log(`\n⚖️  판단:`);
    console.log(`  점수: ${decision.score}/100`);
    console.log(`  신호등: ${decision.signal}`);
    console.log(`  생존 개월: ${decision.survivalMonths}개월`);
    console.log(`  리스크 레벨: ${decision.riskLevel}`);
    if (decision.riskFactors && decision.riskFactors.length > 0) {
      console.log(`  리스크 요인: ${decision.riskFactors.length}개`);
    }
    console.log(`\n📊 상권:`);
    console.log(`  경쟁 카페: ${market.competitors.total}개`);
    console.log(`  같은 브랜드: ${market.competitors.sameBrand}개`);
    console.log(`  상권 점수: ${market.marketScore}/100`);

    console.log('\n🎉 통합 테스트 성공!');
    console.log('\n✅ 모든 모듈이 정상적으로 연동되었습니다.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 통합 테스트 실패:');
    console.error(error.message);
    if (error.stack) {
      console.error('\n스택 트레이스:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testIntegration();
