/**
 * 리포트 생성 직접 테스트
 * 서버 로그를 확인하기 위한 스크립트
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testReportDirect() {
  console.log('🧪 리포트 생성 직접 테스트\n');
  
  // 최근 분석 ID 가져오기
  try {
    const brandsResponse = await axios.get(`${API_BASE_URL}/api/brands`);
    const firstBrand = brandsResponse.data.brands[0];
    
    console.log('1️⃣ 분석 실행...');
    const analyzeResponse = await axios.post(`${API_BASE_URL}/api/analyze`, {
      brandId: firstBrand.id,
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
    });
    
    const analysisId = analyzeResponse.data.analysisId;
    console.log(`   분석 ID: ${analysisId}\n`);
    
    // 분석 완료 대기
    console.log('2️⃣ 분석 완료 대기...');
    let result = null;
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const resultResponse = await axios.get(`${API_BASE_URL}/api/result/${analysisId}`);
      
      if (resultResponse.data.success && resultResponse.data.result) {
        const resultData = resultResponse.data.result;
        if (resultData.id || resultData.status === 'completed') {
          result = resultData.result || resultData;
          console.log(`   ✅ 분석 완료 (${i + 1}회 시도)\n`);
          break;
        }
      }
      console.log(`   ⏳ 대기 중... (${i + 1}/15)`);
    }
    
    if (!result) {
      console.error('❌ 분석이 완료되지 않았습니다.');
      return;
    }
    
    // 리포트 생성 테스트
    console.log('3️⃣ 리포트 생성 테스트...');
    console.log('   서버 콘솔에서 [리포트 생성] 로그를 확인하세요!\n');
    
    try {
      const reportResponse = await axios.post(`${API_BASE_URL}/api/report/${analysisId}`);
      console.log('✅ 리포트 생성 성공!');
      console.log('   리포트 ID:', reportResponse.data.reportId);
      console.log('   리포트 URL:', reportResponse.data.reportUrl);
    } catch (error) {
      console.error('❌ 리포트 생성 실패!');
      console.error('   상태 코드:', error.response?.status);
      console.error('   응답 데이터:', JSON.stringify(error.response?.data, null, 2));
      console.error('\n   ⚠️  서버 콘솔의 [리포트 생성] 로그를 확인하세요!');
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    if (error.response) {
      console.error('   응답:', error.response.data);
    }
  }
}

testReportDirect();
