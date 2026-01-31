/**
 * 수요 배수 (Demand Multiplier) 생성
 * 
 * 상권 타입, 요일/휴일, 유동인구 지수를 기반으로 수요 배수 계산
 * 
 * @param {Object} market - 상권 정보
 * @param {String} market.tradeAreaType - 상권 타입 ("office" | "residential" | "station" | "tourism" | "university" | "mixed")
 * @param {String} market.dayType - 요일/휴일 타입 ("weekday" | "weekend" | "holiday" | "seollal" | "chuseok")
 * @param {Number} market.footTrafficIndex - 유동인구 지수 (1.0 기준, 1.2=+20%, 0.8=-20%)
 * @param {Object} defaults - 기본값 객체 (dayTypeMultipliers, footTrafficIndexClamp 포함)
 * @returns {Number} 수요 배수
 */
function buildDemandMultiplier(market, defaults) {
  const { dayTypeMultipliers, footTrafficIndexClamp } = defaults;
  
  // 1. 요일/휴일 보정 배수 계산
  const tradeAreaType = market?.tradeAreaType || 'mixed';
  const dayType = market?.dayType || 'weekday';
  
  const dayMap = dayTypeMultipliers || {};
  const dayTypeMultiplier =
    (dayMap[tradeAreaType]?.[dayType]) ??
    (dayMap.mixed?.[dayType]) ??
    1.0;

  // 2. 유동인구 지수 보정 (clamp 적용)
  const clampMin = footTrafficIndexClamp?.min ?? 0.6;
  const clampMax = footTrafficIndexClamp?.max ?? 1.6;
  const footTrafficIndex = market?.footTrafficIndex ?? 1.0;
  const fti = Math.max(clampMin, Math.min(clampMax, footTrafficIndex));

  // 3. MVP: timeProfileFitMultiplier = 1.0 (나중에 확장)
  const timeProfileFitMultiplier = 1.0;

  // 4. 최종 수요 배수 = 요일/휴일 배수 × 유동인구 지수 × 시간대 분포 적합도
  return dayTypeMultiplier * fti * timeProfileFitMultiplier;
}

module.exports = {
  buildDemandMultiplier
};
