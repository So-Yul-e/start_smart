/**
 * 상권 분석 메인 로직
 * 역할 5: 백엔드 + 통합
 */

const { searchNearbyCafes } = require('./mapApi');
const { getBrandById } = require('../routes/brands');

/**
 * 상권 분석 실행
 * @param {Object} location - 위치 정보 { lat, lng, address }
 * @param {number} radius - 반경 (m)
 * @param {string} brandId - 브랜드 ID (같은 브랜드 필터링용, 선택사항)
 * @returns {Object} 상권 분석 결과
 */
async function analyzeMarket(location, radius, brandId = null) {
  try {
    // 지도 API로 반경 내 경쟁 카페 검색
    const competitors = await searchNearbyCafes(location, radius);

    // 브랜드명 가져오기 (같은 브랜드 필터링용)
    let brandName = null;
    if (brandId) {
      try {
        const brand = await getBrandById(brandId);
        if (brand) {
          brandName = brand.name;
        }
      } catch (error) {
        console.warn('브랜드 정보 조회 실패 (같은 브랜드 필터링 스킵):', error.message);
      }
    }

    // 같은 브랜드 카페 필터링
    let sameBrandCount = 0;
    if (brandName) {
      // 브랜드명이 카페 이름에 포함되어 있는지 확인
      // 예: "스타벅스" 브랜드면 "스타벅스 강남점", "스타벅스 역삼점" 등이 매칭됨
      sameBrandCount = competitors.filter(cafe => {
        const cafeName = cafe.name || '';
        // 브랜드명이 카페 이름에 포함되어 있는지 확인 (대소문자 무시)
        return cafeName.includes(brandName);
      }).length;
    }

    // 경쟁 밀도 계산
    const density = calculateDensity(competitors.length, radius);

    // 유동인구 추정 (실제로는 별도 API 필요)
    const footTraffic = estimateFootTraffic(location);

    // 상권 점수 계산
    const marketScore = calculateMarketScore(competitors, footTraffic, sameBrandCount);

    return {
      location: {
        lat: location.lat,
        lng: location.lng,
        radius: radius
      },
      competitors: {
        total: competitors.length,
        sameBrand: sameBrandCount,
        otherBrands: competitors.length - sameBrandCount,
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
 * @param {number} sameBrandCount - 같은 브랜드 카페 수
 * @returns {number} 0-100 점수
 */
function calculateMarketScore(competitors, footTraffic, sameBrandCount = 0) {
  let score = 100;

  // 경쟁 밀도에 따른 감점
  if (competitors.length > 10) score -= 30;
  else if (competitors.length > 5) score -= 15;
  else if (competitors.length > 2) score -= 5;

  // 같은 브랜드가 많을수록 감점 (과도한 경쟁)
  if (sameBrandCount > 3) score -= 20;
  else if (sameBrandCount > 1) score -= 10;
  else if (sameBrandCount === 1) score -= 5;

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
