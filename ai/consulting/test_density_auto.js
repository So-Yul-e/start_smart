// ai/consulting/test_density_auto.js
// 경쟁 밀도 자동 계산이 generateConsulting에서 작동하는지 확인하는 테스트

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { generateConsulting } = require('./index');

async function test() {
  console.log('=== 경쟁 밀도 자동 계산 테스트 ===\n');
  
  // 테스트 케이스 1: density가 없는 경우 (자동 계산되어야 함)
  console.log('【테스트 1: density가 없는 경우】');
  console.log('입력 데이터:');
  console.log('  - 경쟁 카페 수: 5개');
  console.log('  - 반경: 500m');
  console.log('  - density: 없음 (자동 계산 예상)\n');
  
  const input1 = {
    brand: { id: "brand_1", name: "스타벅스" },
    location: { lat: 37.5665, lng: 126.9780, address: "서울특별시 강남구 테헤란로 123" },
    conditions: {
      initialInvestment: 500000000,
      monthlyRent: 3000000,
      area: 33,
      ownerWorking: true
    },
    targetDailySales: 300,
    finance: {
      monthlyProfit: 10000000,
      paybackMonths: 50
    },
    market: {
      radiusM: 500,
      competitors: {
        total: 5
        // density 없음 - 자동 계산되어야 함
      },
      footTraffic: { weekday: "high", weekend: "medium" }
    },
    roadview: {
      overallRisk: "medium",
      riskScore: 65
    }
  };
  
  // generateConsulting 호출 전후 비교
  console.log('호출 전 market.competitors.density:', input1.market.competitors.density);
  
  try {
    const result1 = await generateConsulting(input1);
    console.log('호출 후 market.competitors.density:', input1.market.competitors.density);
    console.log('✅ 자동 계산된 density:', input1.market.competitors.density);
    console.log('   (경쟁 카페 5개, 반경 500m → 예상: "medium")\n');
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
  
  // 테스트 케이스 2: density가 이미 있는 경우 (변경되지 않아야 함)
  console.log('【테스트 2: density가 이미 있는 경우】');
  console.log('입력 데이터:');
  console.log('  - 경쟁 카페 수: 3개');
  console.log('  - 반경: 500m');
  console.log('  - density: "high" (이미 설정됨)\n');
  
  const input2 = {
    brand: { id: "brand_1", name: "스타벅스" },
    location: { lat: 37.5665, lng: 126.9780, address: "서울특별시 강남구 테헤란로 123" },
    conditions: {
      initialInvestment: 500000000,
      monthlyRent: 3000000,
      area: 33,
      ownerWorking: true
    },
    targetDailySales: 300,
    finance: {
      monthlyProfit: 10000000,
      paybackMonths: 50
    },
    market: {
      radiusM: 500,
      competitors: {
        total: 3,
        density: "high"  // 이미 설정됨 - 변경되지 않아야 함
      },
      footTraffic: { weekday: "high", weekend: "medium" }
    },
    roadview: {
      overallRisk: "medium",
      riskScore: 65
    }
  };
  
  console.log('호출 전 market.competitors.density:', input2.market.competitors.density);
  
  try {
    const result2 = await generateConsulting(input2);
    console.log('호출 후 market.competitors.density:', input2.market.competitors.density);
    if (input2.market.competitors.density === "high") {
      console.log('✅ 기존 density 값 유지됨 (변경되지 않음)\n');
    } else {
      console.log('⚠️ 경고: 기존 density 값이 변경되었습니다!\n');
    }
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
  
  console.log('=== 테스트 완료 ===');
}

test().catch(console.error);

