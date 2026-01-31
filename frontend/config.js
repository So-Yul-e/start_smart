/**
 * 프론트엔드 API 설정
 * 
 * 로컬 개발 환경에서는 기본적으로 localhost:3000을 사용합니다.
 * 다른 환경(프로덕션, 다른 IP 등)에서는 window.API_BASE_URL로 오버라이드 가능합니다.
 */

// 환경변수 또는 기본값으로 API URL을 설정합니다.
const getApiBaseUrl = () => {
  // 1. window 객체에서 설정된 값 사용 (HTML에서 주입, 프로덕션 또는 특수 환경용)
  if (window.API_BASE_URL) {
    return window.API_BASE_URL;
  }
  
  // 2. 환경변수 사용 (빌드 도구에서 주입)
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 3. 기본값: localhost (로컬 개발 환경)
  // 각자가 푸시 받아서 바로 사용할 수 있도록 localhost로 고정
  return 'http://localhost:3000';
};

// API 기본 URL
const API_BASE_URL = getApiBaseUrl();

// API 엔드포인트
const API_ENDPOINTS = {
  brands: `${API_BASE_URL}/api/brands`,
  analyze: `${API_BASE_URL}/api/analyze`,
  result: (analysisId) => `${API_BASE_URL}/api/result/${analysisId}`,
  report: (analysisId) => `${API_BASE_URL}/api/report/${analysisId}`,
  health: `${API_BASE_URL}/health`,
  googleMapsKey: `${API_BASE_URL}/api/config/google-maps-key` // 구글 지도 API 키 (프론트엔드용)
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 환경
  module.exports = { API_BASE_URL, API_ENDPOINTS };
} else {
  // 브라우저 환경
  window.API_CONFIG = { API_BASE_URL, API_ENDPOINTS };
}
