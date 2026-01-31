/**
 * 상권 분석 메인 로직
 * 역할 5: 백엔드 + 통합
 */

const { searchNearbyCafes } = require('./mapApi');

/**
 * 상권 분석 실행
 * @param {Object} location - 위치 정보 { lat, lng, address }
 * @param {number} radius - 반경 (m)
 * @returns {Object} 상권 분석 결과
 */
async function analyzeMarket(location, radius) {
  try {
    // 지도 API로 반경 내 경쟁 카페 검색
    const competitors = await searchNearbyCafes(location, radius);

    // 경쟁 밀도 계산
    const density = calculateDensity(competitors.length, radius);

    // 유동인구 추정 (실제로는 별도 API 필요)
    const footTraffic = estimateFootTraffic(location);

    // 상권 점수 계산
    const marketScore = calculateMarketScore(competitors, footTraffic);

    return {
      location: {
        lat: location.lat,
        lng: location.lng,
        radius: radius
      },
      competitors: {
        total: competitors.length,
        sameBrand: 0, // TODO: brandId와 비교하여 계산
        otherBrands: competitors.length,
        density: density
      },
      footTraffic: footTraffic,
      marketScore: marketScore
    };
  } catch (error) {
    console.error('상권 분석 오류:', error);
    throw new Error(`상권 분석 실패: ${error.message}`);
  }
}

/**
 * 경쟁 밀도 계산
 * @param {number} count - 경쟁 카페 수
 * @param {number} radius - 반경 (m)
 * @returns {string} low | medium | high
 */
function calculateDensity(count, radius) {
  const area = Math.PI * (radius / 1000) ** 2; // km²
  const densityPerKm2 = count / area;

  if (densityPerKm2 < 5) return 'low';
  if (densityPerKm2 < 15) return 'medium';
  return 'high';
}

/**
 * 유동인구 추정 (임시 로직)
 * @param {Object} location - 위치 정보
 * @returns {Object} 유동인구 정보
 */
function estimateFootTraffic(location) {
  // TODO: 실제 유동인구 API 연동
  // 현재는 임시 데이터
  return {
    weekday: 'medium', // low | medium | high
    weekend: 'medium',
    peakHours: ['08:00-10:00', '12:00-14:00', '18:00-20:00']
  };
}

/**
 * 상권 점수 계산
 * @param {Array} competitors - 경쟁 카페 목록
 * @param {Object} footTraffic - 유동인구 정보
 * @returns {number} 0-100 점수
 */
function calculateMarketScore(competitors, footTraffic) {
  let score = 100;

  // 경쟁 밀도에 따른 감점
  if (competitors.length > 10) score -= 30;
  else if (competitors.length > 5) score -= 15;
  else if (competitors.length > 2) score -= 5;

  // 유동인구에 따른 가감점
  const trafficScore = {
    high: 10,
    medium: 0,
    low: -20
  };
  score += trafficScore[footTraffic.weekday] || 0;

  return Math.max(0, Math.min(100, score));
}

module.exports = {
  analyzeMarket
};
