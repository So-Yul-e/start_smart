// ai/consulting/test_prompt_debug.js
// 프롬프트에 반경 정보가 포함되는지 확인하는 디버깅 스크립트

const {
  getSalesScenarioPrompt,
  getRiskAnalysisPrompt,
  getCompetitiveAnalysisPrompt
} = require('./prompts');

console.log('=== 프롬프트 디버깅 테스트 ===\n');

// 테스트 데이터 1: radiusM이 있는 경우 (test_mega.js 기준)
console.log('【테스트 1: radiusM이 있는 경우】');
const data1 = {
  brand: { name: "메가커피" },
  location: { address: "서울특별시 강남구 테헤란로 123" },
  conditions: {
    initialInvestment: 200000000,
    monthlyRent: 4000000,
    area: 10,
    ownerWorking: true
  },
  market: {
    radiusM: 500,
    competitors: { total: 5, density: "high" },
    footTraffic: { weekday: "high", weekend: "medium" }
  },
  roadview: { overallRisk: "medium", riskScore: 65 },
  finance: { monthlyProfit: 8445000, paybackMonths: 23.7 },
  targetDailySales: 300
};

console.log('\n--- 판매량 시나리오 프롬프트 ---');
const prompt1 = getSalesScenarioPrompt(data1);
console.log(prompt1);
console.log('\n✅ 반경 정보 포함 확인:', prompt1.includes('반경 500m') ? '✓' : '✗');

console.log('\n--- 리스크 분석 프롬프트 ---');
const prompt2 = getRiskAnalysisPrompt(data1);
console.log(prompt2);
console.log('\n✅ 반경 정보 포함 확인:', prompt2.includes('반경 500m') ? '✓' : '✗');

console.log('\n--- 경쟁 환경 분석 프롬프트 ---');
const prompt3 = getCompetitiveAnalysisPrompt(data1);
console.log(prompt3);
console.log('\n✅ 반경 정보 포함 확인:', prompt3.includes('반경 500m') ? '✓' : '✗');

// 테스트 데이터 2: radiusM이 없고 location.radius가 있는 경우
console.log('\n\n【테스트 2: location.radius가 있는 경우】');
const data2 = {
  brand: { name: "스타벅스" },
  location: { address: "서울특별시 강남구 테헤란로 123" },
  conditions: {
    initialInvestment: 500000000,
    monthlyRent: 3000000,
    area: 33,
    ownerWorking: true
  },
  market: {
    location: { radius: 1000 },
    competitors: { total: 8, density: "high" },
    footTraffic: { weekday: "high", weekend: "medium" }
  },
  roadview: { overallRisk: "medium", riskScore: 65 },
  finance: { monthlyProfit: 10000000, paybackMonths: 50 },
  targetDailySales: 300
};

console.log('\n--- 판매량 시나리오 프롬프트 ---');
const prompt4 = getSalesScenarioPrompt(data2);
console.log(prompt4);
console.log('\n✅ 반경 정보 포함 확인:', prompt4.includes('반경 1000m') ? '✓' : '✗');

// 테스트 데이터 3: radiusM과 location.radius가 모두 없는 경우 (기본값 500m)
console.log('\n\n【테스트 3: 반경 정보가 없는 경우 (기본값 500m)】');
const data3 = {
  brand: { name: "스타벅스" },
  location: { address: "서울특별시 강남구 테헤란로 123" },
  conditions: {
    initialInvestment: 500000000,
    monthlyRent: 3000000,
    area: 33,
    ownerWorking: true
  },
  market: {
    competitors: { total: 5, density: "high" },
    footTraffic: { weekday: "high", weekend: "medium" }
  },
  roadview: { overallRisk: "medium", riskScore: 65 },
  finance: { monthlyProfit: 10000000, paybackMonths: 50 },
  targetDailySales: 300
};

console.log('\n--- 판매량 시나리오 프롬프트 ---');
const prompt5 = getSalesScenarioPrompt(data3);
console.log(prompt5);
console.log('\n✅ 반경 정보 포함 확인 (기본값 500m):', prompt5.includes('반경 500m') ? '✓' : '✗');

console.log('\n\n=== 테스트 완료 ===');

