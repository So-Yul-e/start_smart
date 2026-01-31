/**
 * AI Consulting - 유틸리티 함수
 * 
 * 경쟁 밀도 계산 등 공통 유틸리티 함수를 제공합니다.
 */

/**
 * 경쟁 밀도 계산 함수
 * 경쟁 카페 수와 반경을 기반으로 경쟁 밀도를 계산합니다.
 * 
 * @param {number} competitorCount - 경쟁 카페 수
 * @param {number} radiusM - 반경 (미터, 기본값: 500)
 * @returns {string} 경쟁 밀도 ("low" | "medium" | "high")
 * 
 * @example
 * calculateDensity(5, 500)  // "high"
 * calculateDensity(4, 500)  // "medium"
 * calculateDensity(2, 500)  // "low"
 */
function calculateDensity(competitorCount, radiusM = 500) {
  // 반경에 따라 기준을 조정
  // 반경이 500m가 아닌 경우, 면적 비율을 고려하여 기준 조정
  // 면적 = π * r² 이므로, 반경이 2배가 되면 면적은 4배가 됨
  // 하지만 실제로는 선형적으로 조정하는 것이 더 실용적
  const baseRadius = 500; // 기준 반경
  const ratio = radiusM / baseRadius;
  
  // 기준값을 반경 비율에 따라 조정
  // 예: 반경이 1000m면 기준값도 2배로 조정
  const highThreshold = Math.ceil(7 * ratio);
  const mediumThreshold = Math.ceil(4 * ratio);
  
  if (competitorCount >= highThreshold) {
    return "high";
  } else if (competitorCount >= mediumThreshold) {
    return "medium";
  } else {
    return "low";
  }
}

module.exports = {
  calculateDensity
};

