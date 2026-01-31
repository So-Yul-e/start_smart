/**
 * 브랜드 데이터 로더 (DB → data_local fallback)
 * 
 * 1차: .env에 정의된 데이터베이스에서 브랜드 정보 로드
 * 2차: 에러 발생 시 data_local/brands.json으로 fallback
 */

const dbLoader = require('./dbLoader');

/**
 * 브랜드 데이터 로드 (DB → data_local fallback)
 * @returns {Promise<Object>} 브랜드 데이터 객체
 */
async function loadBrandsData() {
  return await dbLoader.loadBrandsData();
}

/**
 * 브랜드 ID로 브랜드 정보 조회
 * @param {String} brandId - 브랜드 ID (예: "brand_mega")
 * @returns {Promise<Object|null>} 브랜드 정보 또는 null
 */
async function getBrandById(brandId) {
  return await dbLoader.getBrandById(brandId);
}

/**
 * 모든 브랜드 목록 조회
 * @returns {Promise<Array<Object>>} 브랜드 목록
 */
async function getAllBrands() {
  return await dbLoader.getAllBrands();
}

/**
 * 브랜드 정보를 엔진 입력 형식으로 변환
 * @param {String} brandId - 브랜드 ID
 * @returns {Promise<Object|null>} 엔진 입력 형식의 brand 객체
 */
async function getBrandForEngine(brandId) {
  return await dbLoader.getBrandForEngine(brandId);
}

/**
 * 브랜드 기본값 검증
 * @param {Object} brand - 브랜드 객체
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateBrandDefaults(brand) {
  const errors = [];
  const defaults = brand?.defaults;
  
  if (!defaults) {
    errors.push('brand.defaults가 없습니다.');
    return { valid: false, errors };
  }
  
  const requiredFields = ['avgPrice', 'cogsRate', 'laborRate'];
  for (const field of requiredFields) {
    if (defaults[field] === undefined || defaults[field] === null) {
      errors.push(`brand.defaults.${field}가 없습니다.`);
    }
  }
  
  // 값 범위 검증
  if (defaults.avgPrice !== undefined && defaults.avgPrice <= 0) {
    errors.push('avgPrice는 0보다 커야 합니다.');
  }
  
  if (defaults.cogsRate !== undefined && (defaults.cogsRate < 0 || defaults.cogsRate > 1)) {
    errors.push('cogsRate는 0~1 사이의 값이어야 합니다.');
  }
  
  if (defaults.laborRate !== undefined && (defaults.laborRate < 0 || defaults.laborRate > 1)) {
    errors.push('laborRate는 0~1 사이의 값이어야 합니다.');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  loadBrandsData,
  getBrandById,
  getAllBrands,
  getBrandForEngine,
  validateBrandDefaults
};
