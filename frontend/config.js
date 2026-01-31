/**
 * 프론트엔드 API 설정
 * 
 * 환경변수 또는 기본값으로 API URL을 설정합니다.
 * 개발 환경에서는 백엔드 담당자가 알려준 로컬 IP를 사용하세요.
 */

// 환경변수에서 API URL 가져오기 (빌드 시 주입 가능)
// 또는 window 객체에서 설정 (HTML에서 주입)
const getApiBaseUrl = () => {
  // 1. window 객체에서 설정된 값 사용 (HTML에서 주입)
  if (window.API_BASE_URL) {
    return window.API_BASE_URL;
  }
  
  // 2. 환경변수 사용 (빌드 도구에서 주입)
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 3. 현재 호스트 기반으로 자동 설정 (동일 호스트의 백엔드 사용)
  // 예: http://172.16.48.47:3000/input/ -> http://172.16.48.47:3000
  if (window.location.hostname) {
    return window.location.protocol + '//' + window.location.hostname + ':3000';
  }
  
  // 4. 기본값: localhost (fallback)
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
  health: `${API_BASE_URL}/health`
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 환경
  module.exports = { API_BASE_URL, API_ENDPOINTS };
} else {
  // 브라우저 환경
  window.API_CONFIG = { API_BASE_URL, API_ENDPOINTS };
}
