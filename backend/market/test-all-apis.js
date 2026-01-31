/**
 * 모든 지도 API 테스트 스크립트
 * node backend/market/test-all-apis.js
 */

require('dotenv').config();
const { searchNearbyCafes } = require('./mapApi');

async function testAllAPIs() {
  console.log('🧪 모든 지도 API 테스트 시작...\n');
  
  // 테스트 위치: 강남역
  const testLocation = {
    lat: 37.4980,
    lng: 127.0276,
    address: '서울특별시 강남구 강남대로 396'
  };
  
  const testRadius = 500; // 500m
  
  console.log('📍 테스트 위치:', testLocation.address);
  console.log('📏 반경:', testRadius, 'm\n');
  
  // 환경변수 확인
  console.log('🔑 API 키 확인:');
  console.log('- 소상공인시장진흥공단:', process.env.SMALL_BUSINESS_MARKET_API_KEY ? '✅' : '❌');
  console.log('- 카카오맵:', process.env.KAKAO_REST_API_KEY ? '✅' : '❌');
  console.log('- 네이버지도:', process.env.NAVER_MAP_CLIENT_ID ? '✅' : '❌');
  console.log('- 구글맵:', process.env.GOOGLE_MAPS_API_KEY ? '✅' : '❌');
  console.log('');
  
  try {
    console.log('🔍 카페 검색 실행 중...\n');
    const cafes = await searchNearbyCafes(testLocation, testRadius);
    
    console.log('✅ 검색 완료!\n');
    console.log(`📊 검색된 카페 수: ${cafes.length}개\n`);
    
    if (cafes.length > 0) {
      console.log('📋 카페 목록 (최대 10개):');
      cafes.slice(0, 10).forEach((cafe, index) => {
        console.log(`${index + 1}. ${cafe.name}`);
        console.log(`   주소: ${cafe.address}`);
        console.log(`   거리: ${cafe.distance}m`);
        console.log(`   좌표: (${cafe.lat}, ${cafe.lng})`);
        console.log('');
      });
    } else {
      console.log('⚠️  검색된 카페가 없습니다.');
      console.log('다른 위치나 반경으로 테스트해보세요.');
    }
    
  } catch (error) {
    console.error('❌ 검색 실패:', error.message);
    console.error('상세 오류:', error);
    process.exit(1);
  }
}

// 실행
testAllAPIs();
