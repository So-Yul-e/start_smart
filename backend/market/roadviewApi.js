/**
 * 카카오 로드뷰 API 연동
 * 역할 5: 백엔드 + 통합
 * 
 * 카카오 로드뷰 이미지 URL을 가져오는 함수
 */

const axios = require('axios');

/**
 * 카카오 로드뷰 파노라마 ID 조회 및 이미지 URL 생성
 * 
 * ⚠️ 중요: 카카오 로드뷰는 서버 사이드 REST API를 제공하지 않습니다.
 * JavaScript API를 통해서만 접근 가능하므로, 서버 사이드에서는:
 * 1. 로드뷰 페이지 링크 생성 (사용자가 브라우저에서 확인)
 * 2. Google Street View Static API 사용 (실제 로드뷰 이미지)
 * 
 * @param {Object} location - 위치 정보 { lat, lng }
 * @returns {Object} 로드뷰 정보 { roadviewUrl, imageUrl (있는 경우) }
 */
async function getKakaoRoadview(location) {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  
  if (!apiKey) {
    throw new Error('KAKAO_REST_API_KEY가 설정되지 않았습니다.');
  }

  try {
    // 카카오 로드뷰는 서버 사이드 REST API를 제공하지 않습니다.
    // JavaScript API를 통해서만 접근 가능합니다.
    // 
    // 서버 사이드에서 할 수 있는 것:
    // 1. 로드뷰 페이지 링크 생성
    const roadviewUrl = `https://map.kakao.com/link/roadview/${location.lat},${location.lng}`;
    
    // 2. 로드뷰 이미지를 직접 가져오려면 JavaScript API가 필요합니다.
    //    서버 사이드에서는 불가능하므로, 프론트엔드에서 JavaScript API 사용 필요
    
    return {
      roadviewUrl,
      location: { lat: location.lat, lng: location.lng },
      note: '카카오 로드뷰는 JavaScript API를 통해서만 접근 가능합니다. 서버 사이드에서는 로드뷰 페이지 링크만 제공할 수 있습니다.',
      source: 'kakao',
      requiresJavaScript: true
    };
    
  } catch (error) {
    console.error('카카오 로드뷰 API 오류:', error.message);
    throw error;
  }
}

/**
 * Google Street View Static API로 로드뷰 이미지 URL 생성
 * @param {Object} location - 위치 정보 { lat, lng }
 * @param {Object} options - 옵션 { size, heading, pitch, fov }
 * @returns {string} 로드뷰 이미지 URL
 */
function getGoogleStreetViewUrl(location, options = {}) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || apiKey === 'xxxxx') {
    throw new Error('GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.');
  }

  const {
    size = '640x640',
    heading = 0,
    pitch = 0,
    fov = 90
  } = options;

  const url = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${location.lat},${location.lng}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${apiKey}`;
  
  return url;
}

/**
 * 네이버 Static Map 이미지 URL 생성
 * 
 * ⚠️ 중요: 네이버는 로드뷰 API를 제공하지 않습니다.
 * 이 함수는 일반 지도 이미지만 반환합니다 (로드뷰 아님).
 * 
 * AI 로드뷰 분석에는 부적합하므로, Google Street View API 사용을 권장합니다.
 * 
 * @param {Object} location - 위치 정보 { lat, lng }
 * @param {Object} options - 옵션 { width, height }
 * @returns {string} 지도 이미지 URL (로드뷰 아님)
 */
function getNaverRoadviewUrl(location, options = {}) {
  const clientId = process.env.NAVER_MAP_STATIC_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('NAVER_MAP_STATIC_CLIENT_ID가 설정되지 않았습니다.');
  }

  const {
    width = 640,
    height = 640
  } = options;

  // 네이버 Static Map API를 사용하여 일반 지도 이미지 생성
  // ⚠️ 네이버는 로드뷰 API를 제공하지 않으므로, 이는 지도 이미지일 뿐입니다.
  const url = `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=${width}&h=${height}&center=${location.lng},${location.lat}&level=3&markers=type:d|size:mid|color:0xFF0000|label:위치|${location.lat},${location.lng}&X-NCP-APIGW-API-KEY-ID=${clientId}`;
  
  return url;
}

/**
 * 로드뷰 이미지 URL 가져오기 (우선순위: Google > 네이버 > 카카오)
 * @param {Object} location - 위치 정보 { lat, lng }
 * @returns {Object} 로드뷰 정보 { imageUrl, source }
 */
async function getRoadviewImageUrl(location) {
  try {
    // 1순위: Google Street View
    if (process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'xxxxx') {
      try {
        const imageUrl = getGoogleStreetViewUrl(location);
        return {
          imageUrl,
          source: 'google',
          location: { lat: location.lat, lng: location.lng }
        };
      } catch (error) {
        console.warn('Google Street View 실패, 다음 API 시도:', error.message);
      }
    }

    // 2순위: 네이버 Static Map
    if (process.env.NAVER_MAP_STATIC_CLIENT_ID) {
      try {
        const imageUrl = getNaverRoadviewUrl(location);
        return {
          imageUrl,
          source: 'naver',
          location: { lat: location.lat, lng: location.lng }
        };
      } catch (error) {
        console.warn('네이버 로드뷰 실패:', error.message);
      }
    }

    // 3순위: 카카오 로드뷰 (JavaScript API 필요)
    if (process.env.KAKAO_REST_API_KEY) {
      try {
        // 카카오 로드뷰는 서버 사이드에서 직접 호출 불가
        // 대신 로드뷰 페이지 URL 반환
        const roadviewUrl = `https://map.kakao.com/link/roadview/${location.lat},${location.lng}`;
        return {
          imageUrl: roadviewUrl,
          source: 'kakao',
          location: { lat: location.lat, lng: location.lng },
          note: '카카오 로드뷰는 JavaScript API를 사용해야 합니다. 이 URL은 로드뷰 페이지 링크입니다.'
        };
      } catch (error) {
        console.warn('카카오 로드뷰 실패:', error.message);
      }
    }

    throw new Error('사용 가능한 로드뷰 API가 없습니다.');
  } catch (error) {
    console.error('로드뷰 이미지 URL 가져오기 실패:', error.message);
    throw error;
  }
}

module.exports = {
  getKakaoRoadview,
  getGoogleStreetViewUrl,
  getNaverRoadviewUrl,
  getRoadviewImageUrl
};
