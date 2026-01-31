/**
 * 통합 테스트 스크립트
 * engine 모듈 병합 후 전체 파이프라인 테스트
 */

require('dotenv').config();
const { runAnalysis } = require('./services/orchestrator');
const { createAnalysis, updateAnalysis } = require('./db/analysisRepository');

async function testIntegration() {
  console.log('🧪 통합 테스트 시작...\n');

  // DB에서 실제 브랜드 ID 조회
  const pool = require('./db/connection');
  const brandResult = await pool.query('SELECT id, name FROM brands ORDER BY id LIMIT 1');
  const actualBrandId = brandResult.rows[0]?.id || 'brand_2'; // 기본값
  
  console.log(`📌 사용할 브랜드 ID: ${actualBrandId} (${brandResult.rows[0]?.name || '알 수 없음'})\n`);

  // 테스트 데이터
  const testRequest = {
    analysisId: `test_${Date.now()}`,
    brandId: actualBrandId, // DB에 실제로 있는 브랜드 ID
    location: {
      lat: 37.4980,
      lng: 127.0276,
      address: '서울특별시 강남구 강남대로 396'
    },
    radius: 500,
    conditions: {
      initialInvestment: 500000000,
      monthlyRent: 3000000,
      area: 33,
      ownerWorking: true
    },
    targetDailySales: 300
  };

  try {
    console.log('📋 테스트 요청 데이터:');
    console.log(JSON.stringify(testRequest, null, 2));
    console.log('\n');

    // DB에 분석 요청 저장
    console.log('1️⃣  분석 요청 DB 저장...');
    await createAnalysis({
      id: testRequest.analysisId,
      brandId: testRequest.brandId,
      location: testRequest.location,
      radius: testRequest.radius,
      conditions: testRequest.conditions,
      targetDailySales: testRequest.targetDailySales
    });
    console.log('✅ DB 저장 완료\n');

    // 분석 실행
    console.log('2️⃣  분석 파이프라인 실행...');
    const result = await runAnalysis(testRequest, updateAnalysis);
    console.log('\n✅ 분석 완료!\n');

    // 결과 확인
    console.log('📊 분석 결과 요약:');
    console.log('==================================================');
    console.log(`브랜드: ${result.brand.name}`);
    console.log(`위치: ${result.location.address}`);
    console.log(`\n💰 손익 계산:`);
    console.log(`  - 월 매출: ${result.finance.monthlyRevenue?.toLocaleString()}원`);
    console.log(`  - 월 순이익: ${result.finance.monthlyProfit?.toLocaleString()}원`);
    console.log(`  - 회수 개월: ${result.finance.paybackMonths}개월`);
    console.log(`\n⚖️  판단 결과:`);
    console.log(`  - 점수: ${result.decision.score}/100`);
    console.log(`  - 신호등: ${result.decision.signal}`);
    console.log(`  - 생존 개월: ${result.decision.survivalMonths}개월`);
    console.log(`  - 리스크 레벨: ${result.decision.riskLevel}`);
    console.log(`\n📊 상권 분석:`);
    console.log(`  - 경쟁 카페 수: ${result.market.competitors.total}개`);
    console.log(`  - 같은 브랜드: ${result.market.competitors.sameBrand}개`);
    console.log(`  - 상권 점수: ${result.market.marketScore}/100`);

    console.log('\n🎉 통합 테스트 성공!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 통합 테스트 실패:');
    console.error(error);
    console.error('\n스택 트레이스:');
    console.error(error.stack);
    process.exit(1);
  }
}

testIntegration();
