/**
 * 지도 API 연동
 * 역할 5: 백엔드 + 통합
 * 
 * 우선순위:
 * 1. 소상공인시장진흥공단 API (가장 정확한 상권 데이터)
 * 2. Kakao Maps API
 * 3. 네이버지도 API
 * 4. Google Maps API
 */

const axios = require('axios');

/**
 * 반경 내 카페 검색
 * @param {Object} location - 위치 정보 { lat, lng, address }
 * @param {number} radius - 반경 (m)
 * @returns {Array} 카페 목록
 */
async function searchNearbyCafes(location, radius) {
  try {
    // 소상공인시장진흥공단 API 우선 사용 (가장 정확한 상권 데이터)
    if (process.env.SMALL_BUSINESS_MARKET_API_KEY) {
      return await searchWithSmallBusiness(location, radius);
    }
    // Kakao Maps API
    else if (process.env.KAKAO_REST_API_KEY) {
      return await searchWithKakao(location, radius);
    }
    // 네이버지도 API
    else if (process.env.NAVER_MAP_CLIENT_ID) {
      return await searchWithNaver(location, radius);
    }
    // Google Maps API
    else if (process.env.GOOGLE_MAPS_API_KEY) {
      return await searchWithGoogle(location, radius);
    } else {
      console.warn('지도 API 키가 설정되지 않았습니다. 임시 데이터를 반환합니다.');
      return getMockCafes(location, radius);
    }
  } catch (error) {
    console.error('지도 API 검색 오류:', error);
    // 오류 발생 시 임시 데이터 반환
    return getMockCafes(location, radius);
  }
}

/**
 * 소상공인시장진흥공단 API로 카페 검색
 * 반경 내 상가업소 조회 (/storeListInRadius)
 */
async function searchWithSmallBusiness(location, radius) {
  const apiKey = process.env.SMALL_BUSINESS_MARKET_API_KEY;
  const baseUrl = 'http://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius';
  
  // 반경을 km로 변환 (API는 km 단위 사용)
  const radiusKm = (radius / 1000).toFixed(2);
  
  const params = {
    serviceKey: apiKey,
    pageNo: 1,
    numOfRows: 100, // 최대 100개
    radius: radiusKm, // km 단위
    cx: location.lng, // 경도
    cy: location.lat, // 위도
    indsLclsCd: 'Q12' // 카페/커피숍 업종 코드 (Q12)
  };

  try {
    const response = await axios.get(baseUrl, { params });
    
    // XML 응답 파싱 (간단한 파싱, 실제로는 xml2js 등 사용 권장)
    if (response.data.response?.body?.items?.item) {
      const items = Array.isArray(response.data.response.body.items.item) 
        ? response.data.response.body.items.item 
        : [response.data.response.body.items.item];
      
      return items.map(store => ({
        name: store.bizesNm || store.bizNm || '카페',
        address: store.rdnmAdr || store.rdnm || store.adongNm || '',
        lat: parseFloat(store.lat) || location.lat,
        lng: parseFloat(store.lon) || location.lng,
        distance: Math.round(parseFloat(store.dist) || 0),
        category: store.indsLclsNm || '카페',
        storeType: store.indsMclsNm || ''
      }));
    }
    
    // 데이터가 없거나 다른 형식인 경우
    console.warn('소상공인시장진흥공단 API 응답 형식이 예상과 다릅니다.');
    return [];
  } catch (error) {
    console.error('소상공인시장진흥공단 API 오류:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Kakao Maps API로 카페 검색
 */
async function searchWithKakao(location, radius) {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  const url = 'https://dapi.kakao.com/v2/local/search/keyword.json';
  
  const params = {
    query: '카페',
    x: location.lng,
    y: location.lat,
    radius: radius
  };

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`
      },
      params: params
    });

    return response.data.documents.map(place => ({
      name: place.place_name,
      address: place.address_name,
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
      distance: parseInt(place.distance)
    }));
  } catch (error) {
    console.error('Kakao Maps API 오류:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 네이버지도 API로 카페 검색
 * 네이버 로컬 API 사용
 */
async function searchWithNaver(location, radius) {
  const clientId = process.env.NAVER_MAP_CLIENT_ID;
  const url = 'https://openapi.naver.com/v1/search/local.json';
  
  const params = {
    query: '카페',
    display: 100, // 최대 100개
    start: 1,
    sort: 'random'
  };

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': process.env.NAVER_MAP_CLIENT_SECRET || ''
      },
      params: params
    });

    if (response.data.items) {
      // 반경 내 카페만 필터링
      const cafes = response.data.items
        .map(place => {
          // 위도/경도가 있으면 거리 계산
          if (place.mapy && place.mapx) {
            const lat = parseFloat(place.mapy) / 10000000;
            const lng = parseFloat(place.mapx) / 10000000;
            const distance = calculateDistance(location.lat, location.lng, lat, lng);
            
            if (distance <= radius) {
              return {
                name: place.title?.replace(/<[^>]*>/g, '') || '카페',
                address: place.address || place.roadAddress || '',
                lat: lat,
                lng: lng,
                distance: Math.round(distance)
              };
            }
          }
          return null;
        })
        .filter(cafe => cafe !== null);
      
      return cafes;
    }
    
    return [];
  } catch (error) {
    console.error('네이버지도 API 오류:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Google Maps API로 카페 검색
 */
async function searchWithGoogle(location, radius) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  
  const params = {
    location: `${location.lat},${location.lng}`,
    radius: radius,
    type: 'cafe',
    key: apiKey
  };

  try {
    const response = await axios.get(url, { params });
    
    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API 오류: ${response.data.status}`);
    }

    return response.data.results.map(place => ({
      name: place.name,
      address: place.vicinity,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      distance: place.geometry.location.distance || 0
    }));
  } catch (error) {
    console.error('Google Maps API 오류:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 두 좌표 간 거리 계산 (Haversine 공식)
 * @param {number} lat1 - 위도1
 * @param {number} lon1 - 경도1
 * @param {number} lat2 - 위도2
 * @param {number} lon2 - 경도2
 * @returns {number} 거리 (m)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 지구 반지름 (m)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 임시 카페 데이터 (API 키가 없을 때 사용)
 */
function getMockCafes(location, radius) {
  // 임시 데이터 반환
  return [
    {
      name: '임시 카페 1',
      address: '서울특별시 강남구',
      lat: location.lat + 0.001,
      lng: location.lng + 0.001,
      distance: 100
    },
    {
      name: '임시 카페 2',
      address: '서울특별시 강남구',
      lat: location.lat - 0.001,
      lng: location.lng - 0.001,
      distance: 150
    }
  ];
}

module.exports = {
  searchNearbyCafes,
  calculateDistance
};
