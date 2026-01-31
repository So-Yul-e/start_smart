/**
 * 로드뷰 API 테스트 스크립트
 * node backend/market/test-roadview.js
 */

require('dotenv').config();
const { getRoadviewImageUrl } = require('./roadviewApi');

async function testRoadview() {
  console.log('🧪 로드뷰 API 테스트 시작...\n');
  
  // 테스트 위치: 강남역
  const testLocation = {
    lat: 37.4980,
    lng: 127.0276,
    address: '서울특별시 강남구 강남대로 396'
  };
  
  console.log('📍 테스트 위치:', testLocation.address);
  console.log(`📏 좌표: (${testLocation.lat}, ${testLocation.lng})\n`);
  
  // 환경변수 확인
  console.log('🔑 API 키 확인:');
  console.log('- Google Maps:', process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'xxxxx' ? '✅' : '❌');
  console.log('- 네이버 Static Map:', process.env.NAVER_MAP_STATIC_CLIENT_ID ? '✅' : '❌');
  console.log('- 카카오맵:', process.env.KAKAO_REST_API_KEY ? '✅' : '❌');
  console.log('');
  
  try {
    console.log('🔍 로드뷰 이미지 URL 가져오기...\n');
    const result = await getRoadviewImageUrl(testLocation);
    
    console.log('✅ 로드뷰 URL 생성 완료!\n');
    console.log('📊 결과:');
    console.log(`- 소스: ${result.source}`);
    console.log(`- 이미지 URL: ${result.imageUrl}`);
    console.log(`- 위치: (${result.location.lat}, ${result.location.lng})`);
    if (result.note) {
      console.log(`- 참고: ${result.note}`);
    }
    
    console.log('\n💡 이미지 URL을 브라우저에서 열어보세요!');
    
  } catch (error) {
    console.error('\n❌ 로드뷰 URL 생성 실패:', error.message);
    console.error('상세 오류:', error);
    process.exit(1);
  }
}

// 실행
testRoadview();
