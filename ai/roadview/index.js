/**
 * AI-로드뷰 분석 메인 모듈
 * 
 * 기능:
 * - 좌표 기반 로드뷰 이미지 자동 수집 (Google Street View 우선, Kakao 대안)
 * - Gemini Vision API를 통한 물리적 입지 리스크 분석
 * - 4가지 리스크 항목 평가 및 종합 점수 계산
 * - shared/interfaces.js에 정의된 형식으로 결과 반환
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { analyzeImageWithGemini } = require('./visionAnalyzer');
const axios = require('axios');

// 상수 정의
const REQUIRED_RISK_TYPES = [
  'signage_obstruction',  // 간판 가림
  'steep_slope',          // 급경사
  'floor_level',          // 층위
  'visibility'            // 보행 가시성
];

// 리스크 점수 계산 가중치
const RISK_WEIGHTS = {
  signage_obstruction: 0.25,  // 간판 가림
  steep_slope: 0.20,           // 급경사
  floor_level: 0.30,           // 층위 (가장 중요)
  visibility: 0.25             // 보행 가시성
};

/**
 * Google Street View 이미지 URL 생성
 * @param {Object} location - { lat: number, lng: number }
 * @returns {string} 이미지 URL
 */
function getGoogleStreetViewUrl(location) {
  const { lat, lng } = location;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY 환경변수가 필요합니다.');
  }
  
  // 640x640 크기, 90도 시야각, 정면(heading=0), 수평(pitch=0)
  return `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${lat},${lng}&key=${apiKey}&fov=90&heading=0&pitch=0`;
}

/**
 * Kakao 로드뷰 이미지 URL 획득
 * 참고: Kakao Maps는 REST API로 로드뷰 이미지를 직접 제공하지 않습니다.
 * 이 함수는 향후 Kakao 로드뷰 API가 지원될 때를 대비한 플레이스홀더입니다.
 * @param {Object} location - { lat: number, lng: number }
 * @returns {Promise<string>} 이미지 URL
 */
async function getKakaoRoadviewUrl(location) {
  // Kakao Maps는 현재 REST API로 로드뷰 이미지를 직접 제공하지 않습니다.
  // 웹에서만 로드뷰를 사용할 수 있으므로, Google Street View를 사용하는 것을 권장합니다.
  throw new Error('Kakao 로드뷰는 REST API로 지원되지 않습니다. GOOGLE_MAPS_API_KEY를 설정해주세요.');
}

/**
 * 로드뷰 이미지 URL 가져오기 (Google 우선, Kakao 대안)
 * @param {Object} location - { lat: number, lng: number }
 * @returns {Promise<string>} 이미지 URL
 */
async function getRoadviewImageUrl(location) {
  // Google Street View 우선 사용 (Kakao는 REST API로 로드뷰 이미지를 제공하지 않음)
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleApiKey) {
    return getGoogleStreetViewUrl(location);
  }
  
  // Google API 키가 없으면 에러
  throw new Error('GOOGLE_MAPS_API_KEY 환경변수가 필요합니다. Google Street View API를 사용하여 로드뷰 이미지를 가져옵니다.');
}

/**
 * Gemini 3 Pro 응답을 기존 인터페이스 형식으로 변환
 * @param {Object} geminiResult - Gemini API 분석 결과
 * @returns {Object} shared/interfaces.js 형식의 결과
 */
function convertToLegacyFormat(geminiResult) {
  if (!geminiResult.success || !geminiResult.data) {
    throw new Error(geminiResult.error || 'Gemini 분석 결과가 유효하지 않습니다.');
  }

  const analysis = geminiResult.data.analysis_result;
  
  // 필드명 매핑 (새 형식 -> 기존 형식)
  const fieldMapping = {
    signage_obstruction: 'signage_obstruction',
    steep_slope: 'steep_slope',
    floor_level: 'floor_level',
    visibility: 'visibility'
  };

  // 기존 형식으로 변환
  const risks = Object.keys(fieldMapping).map(key => {
    const item = analysis[key];
    if (!item) {
      throw new Error(`필수 항목 누락: ${key}`);
    }

    return {
      type: fieldMapping[key],
      level: item.level,
      description: item.description || `${key} 분석 결과`
    };
  });

  // location_score를 riskScore로 변환
  // location_score: 높을수록 좋은 위치 (0-100)
  // riskScore: 낮을수록 위험 (0-100) -> 반전 필요
  const locationScore = geminiResult.data.overall_assessment?.location_score;
  const riskScore = locationScore !== undefined ? 100 - locationScore : undefined;

  return {
    risks,
    riskScore,
    // 추가 정보 (선택적)
    _metadata: {
      confidence: Object.values(analysis).reduce((sum, item) => sum + (item.confidence || 0), 0) / 4,
      imageQuality: geminiResult.data.image_quality,
      strengths: geminiResult.data.overall_assessment?.strengths,
      weaknesses: geminiResult.data.overall_assessment?.weaknesses,
      locationScore: locationScore // 원본 점수도 보관
    }
  };
}

/**
 * 리스크 레벨을 점수로 변환
 * @param {string} level - low | medium | high | ground | half_basement | second_floor
 * @param {string} type - 리스크 타입
 * @returns {number} 점수 (0-100, 낮을수록 위험)
 */
function levelToScore(level, type) {
  if (type === 'floor_level') {
    // 층위의 경우: 1층이 가장 좋음 (점수 낮음 = 위험 낮음)
    switch (level) {
      case 'ground': return 0;           // 1층 (위험 낮음)
      case 'half_basement': return 30;   // 반지하 (중간 위험)
      case 'second_floor': return 50;    // 2층 이상 (높은 위험)
      default: return 50;
    }
  } else {
    // 다른 리스크 항목의 경우
    switch (level) {
      case 'low': return 0;       // 위험 낮음
      case 'medium': return 30;   // 중간 위험
      case 'high': return 60;     // 높은 위험
      default: return 30;
    }
  }
}

/**
 * 리스크 점수 계산 (가중 평균)
 * @param {Array} risks - 리스크 배열
 * @returns {number} 전체 리스크 점수 (0-100, 낮을수록 위험)
 */
function calculateRiskScore(risks) {
  if (!risks || risks.length === 0) {
    return 50; // 기본값 (중간 위험)
  }

  let totalScore = 0;
  let totalWeight = 0;

  risks.forEach(risk => {
    const weight = RISK_WEIGHTS[risk.type] || 0.25;
    const score = levelToScore(risk.level, risk.type);
    totalScore += score * weight;
    totalWeight += weight;
  });

  // 가중 평균 계산
  const averageScore = totalWeight > 0 ? totalScore / totalWeight : 50;
  
  // 0-100 범위로 정규화 및 반올림
  return Math.round(Math.min(100, Math.max(0, averageScore)));
}

/**
 * 전체 리스크 레벨 계산
 * @param {Array} risks - 리스크 배열
 * @returns {string} low | medium | high
 */
function calculateOverallRisk(risks) {
  const score = calculateRiskScore(risks);
  
  // 점수가 낮을수록 위험이 낮음
  if (score <= 20) {
    return 'low';      // 위험 낮음
  } else if (score <= 50) {
    return 'medium';   // 중간 위험
  } else {
    return 'high';     // 높은 위험
  }
}

/**
 * 리스크 항목 검증 및 기본값 설정
 * @param {Array} parsedRisks - 파싱된 리스크 배열
 * @returns {Array} 검증 및 정규화된 리스크 배열
 */
function validateAndNormalizeRisks(parsedRisks) {
  const risksMap = {};
  
  // 파싱된 리스크를 맵에 저장
  if (parsedRisks && Array.isArray(parsedRisks)) {
    parsedRisks.forEach(risk => {
      if (risk && risk.type && REQUIRED_RISK_TYPES.includes(risk.type)) {
        risksMap[risk.type] = risk;
      }
    });
  }

  // 필수 항목 확인 및 기본값 설정
  const risks = REQUIRED_RISK_TYPES.map(type => {
    if (risksMap[type]) {
      const risk = risksMap[type];
      
      // level 검증
      let validLevel = risk.level;
      if (type === 'floor_level') {
        if (!['ground', 'half_basement', 'second_floor'].includes(risk.level)) {
          validLevel = 'ground'; // 기본값
        }
      } else {
        if (!['low', 'medium', 'high'].includes(risk.level)) {
          validLevel = 'medium'; // 기본값
        }
      }

      return {
        type,
        level: validLevel,
        description: risk.description || `${type} 분석 결과`
      };
    } else {
      // 누락된 항목에 대한 기본값
      const defaultLevel = type === 'floor_level' ? 'ground' : 'medium';
      const defaultDescriptions = {
        signage_obstruction: '간판 가림 정보를 확인할 수 없음',
        steep_slope: '경사도 정보를 확인할 수 없음',
        floor_level: '1층에 위치한 것으로 추정',
        visibility: '가시성 정보를 확인할 수 없음'
      };

      return {
        type,
        level: defaultLevel,
        description: defaultDescriptions[type] || `${type} 분석 결과`
      };
    }
  });

  return risks;
}

/**
 * 로드뷰 분석 메인 함수
 * 
 * @param {Object} input - 입력 데이터
 * @param {Object} input.location - 위치 정보
 * @param {number} input.location.lat - 위도
 * @param {number} input.location.lng - 경도
 * 
 * @returns {Promise<Object>} 분석 결과
 * @returns {Object} result.location - 위치 정보
 * @returns {Array} result.risks - 리스크 배열 (4가지 항목)
 * @returns {string} result.overallRisk - 전체 리스크 레벨 (low | medium | high)
 * @returns {number} result.riskScore - 리스크 점수 (0-100, 낮을수록 위험)
 * 
 * @throws {Error} 유효하지 않은 입력 또는 분석 실패 시
 */
async function analyzeRoadview(input) {
  // 입력 검증
  if (!input || !input.location) {
    throw new Error('location 정보가 필요합니다.');
  }
  
  const { location } = input;
  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    throw new Error('유효한 location (lat, lng)이 필요합니다.');
  }
  
  if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
    throw new Error('유효한 좌표 범위를 벗어났습니다. (lat: -90~90, lng: -180~180)');
  }

  try {
    // 1. 로드뷰 이미지 URL 가져오기
    const imageUrl = await getRoadviewImageUrl(location);

    // 2. Gemini 3 Pro Vision API 호출
    const geminiResult = await analyzeImageWithGemini(imageUrl, {
      businessType: '카페/음식점',
      analysisDepth: 'standard'
    });

    // Gemini 응답이 실패한 경우 에러 처리
    if (!geminiResult.success) {
      console.error('Gemini 응답 파싱 실패:', geminiResult.error);
      // 전체 응답을 파일로 저장 (디버깅용)
      const fs = require('fs');
      const debugFile = 'gemini_response_debug.json';
      try {
        fs.writeFileSync(debugFile, geminiResult.rawResponse || 'No response');
        console.error(`전체 응답이 ${debugFile}에 저장되었습니다.`);
      } catch (e) {
        console.error('원본 응답 (처음 1000자):', (geminiResult.rawResponse || '').substring(0, 1000));
      }
      throw new Error(`Gemini 분석 실패: ${geminiResult.error}`);
    }

    // 3. Gemini 3 Pro 응답을 기존 인터페이스 형식으로 변환
    const converted = convertToLegacyFormat(geminiResult);

    // 4. 리스크 항목 검증 및 구조화
    const risks = validateAndNormalizeRisks(converted.risks);

    // 5. 리스크 점수 계산 (변환된 점수 사용, 없으면 계산)
    const riskScore = converted.riskScore || calculateRiskScore(risks);
    const overallRisk = calculateOverallRisk(risks);

    // 6. 최종 결과 반환 (shared/interfaces.js 형식 준수)
    return {
      location: {
        lat: location.lat,
        lng: location.lng
      },
      risks,
      overallRisk,
      riskScore,
      _metadata: converted._metadata || null // 메타데이터 포함 (reportModel에서 사용)
    };
  } catch (error) {
    // 에러 메시지 개선
    if (error.message.includes('로드뷰를 찾을 수 없습니다')) {
      throw new Error('해당 위치의 로드뷰를 찾을 수 없습니다. 다른 위치를 선택해주세요.');
    } else if (error.message.includes('일일 사용 한도')) {
      throw new Error('AI 분석 서비스의 일일 사용 한도를 초과했습니다. 내일 다시 시도해주세요.');
    } else {
      throw new Error(`로드뷰 분석 실패: ${error.message}`);
    }
  }
}

module.exports = {
  analyzeRoadview,
  convertToLegacyFormat,
  validateAndNormalizeRisks,
  calculateRiskScore,
  calculateOverallRisk
};
