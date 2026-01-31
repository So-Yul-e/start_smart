/**
 * StartSmart 공통 기본값 (Constants)
 * 
 * 모든 엔진에서 공통으로 사용하는 기본값
 * - 시간대 분포 프로필 (Time Profiles)
 * - 요일/휴일 보정 배수 (Day Type Multipliers)
 * - 유동인구 보정 범위 (Foot Traffic Index Clamp)
 */

/**
 * 시간대 분포 프로필 (Time Profiles)
 * 
 * 각 시간대별 판매량 비중 (합계 1.0)
 * 다음 단계(인력 산정 모듈)에서 사용
 */
const timeProfiles = {
  takeout_franchise: {
    morning: 0.28,    // 오픈~11시
    lunch: 0.32,     // 11~14시
    afternoon: 0.22, // 14~17시
    evening: 0.12,   // 17~21시
    night: 0.05,     // 21~24시
    dawn: 0.01       // 0시~오픈
  },
  stay_dessert: {
    morning: 0.20,
    lunch: 0.25,
    afternoon: 0.30,
    evening: 0.18,
    night: 0.06,
    dawn: 0.01
  }
};

/**
 * 요일/휴일 보정 배수 (Day Type Multipliers)
 * 
 * 상권 타입 × 요일/휴일 조합에 따른 매출 배수
 * weekday = 1.0 기준
 */
const dayTypeMultipliers = {
  office: {
    weekday: 1.00,
    weekend: 0.65,
    holiday: 0.60,
    seollal: 0.45,
    chuseok: 0.45
  },
  residential: {
    weekday: 1.00,
    weekend: 1.20,
    holiday: 1.15,
    seollal: 0.95,
    chuseok: 0.95
  },
  station: {
    weekday: 1.00,
    weekend: 1.10,
    holiday: 1.05,
    seollal: 0.85,
    chuseok: 0.85
  },
  tourism: {
    weekday: 1.00,
    weekend: 1.15,
    holiday: 1.20,
    seollal: 0.70,
    chuseok: 0.70
  },
  university: {
    weekday: 1.00,
    weekend: 0.80,
    holiday: 0.75,
    seollal: 0.60,
    chuseok: 0.60
  },
  mixed: {
    weekday: 1.00,
    weekend: 1.00,
    holiday: 1.00,
    seollal: 0.80,
    chuseok: 0.80
  }
};

/**
 * 유동인구 보정 범위 (Foot Traffic Index Clamp)
 * 
 * footTrafficIndex의 최소/최대값 제한
 */
const footTrafficIndexClamp = {
  min: 0.6,  // 최소 60% (40% 감소)
  max: 1.6  // 최대 160% (60% 증가)
};

/**
 * Exit Plan 기본값 (브랜드 Exit Defaults)
 * 
 * 데이터가 없을 때 안전하게 동작하도록 하는 Fallback 기본값
 */
const DEFAULT_EXIT_DEFAULTS = {
  contractYears: 3,
  penaltyRule: "remaining_months",
  monthlyRoyalty: 300000,
  fixedPenalty: 0,
  interiorCostRatio: 0.35,
  interiorSalvageCurve: [
    { from: 0, to: 6, salvageRate: 0.05 },
    { from: 6, to: 12, salvageRate: 0.10 },
    { from: 12, to: 18, salvageRate: 0.20 },
    { from: 18, to: 60, salvageRate: 0.30 }
  ],
  goodwillRecoveryCurve: [
    { from: 0, to: 6, recoveryRate: 0.00 },
    { from: 6, to: 12, recoveryRate: 0.10 },
    { from: 12, to: 18, recoveryRate: 0.30 },
    { from: 18, to: 60, recoveryRate: 0.60 }
  ]
};

/**
 * Exit Plan 입력 기본값 (Conditions Exit Inputs)
 * 
 * 사용자 입력이 없을 때 사용하는 기본값
 */
const DEFAULT_EXIT_INPUTS = {
  keyMoney: 0,
  pyeong: 10,
  demolitionBase: 15000000,
  demolitionPerPyeong: 1000000,
  workingCapital: 0
};

module.exports = {
  timeProfiles,
  dayTypeMultipliers,
  footTrafficIndexClamp,
  DEFAULT_EXIT_DEFAULTS,
  DEFAULT_EXIT_INPUTS
};
