/**
 * 분석 결과 저장소 (Repository)
 */

const pool = require('./connection');

/**
 * 분석 요청 저장
 */
async function createAnalysis(analysisData) {
  const {
    id,
    brandId,
    location,
    radius,
    conditions,
    targetDailySales
  } = analysisData;

  const result = await pool.query(
    `INSERT INTO analyses (
      id, brand_id, location_lat, location_lng, location_address, radius,
      initial_investment, monthly_rent, area, owner_working, target_daily_sales, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      id,
      brandId,
      location.lat,
      location.lng,
      location.address || null,
      radius,
      conditions.initialInvestment,
      conditions.monthlyRent,
      conditions.area,
      conditions.ownerWorking,
      targetDailySales,
      'pending'
    ]
  );

  return result.rows[0];
}

/**
 * 분석 결과 업데이트
 */
async function updateAnalysis(analysisId, updates) {
  const { status, result, errorMessage } = updates;
  
  const updatesList = [];
  const values = [];
  let paramIndex = 1;

  if (status) {
    updatesList.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (result !== undefined) {
    updatesList.push(`result = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(result));
  }

  if (errorMessage) {
    updatesList.push(`error_message = $${paramIndex++}`);
    values.push(errorMessage);
  }

  updatesList.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(analysisId);

  const query = `
    UPDATE analyses
    SET ${updatesList.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const dbResult = await pool.query(query, values);
  return dbResult.rows[0];
}

/**
 * 분석 결과 조회
 */
async function getAnalysis(analysisId) {
  const result = await pool.query(
    `SELECT 
      id, brand_id as "brandId", 
      location_lat as "locationLat", 
      location_lng as "locationLng", 
      location_address as "locationAddress",
      radius, initial_investment as "initialInvestment",
      monthly_rent as "monthlyRent", area, owner_working as "ownerWorking",
      target_daily_sales as "targetDailySales",
      status, result, error_message as "errorMessage",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM analyses 
    WHERE id = $1`,
    [analysisId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  
  // result가 JSONB이면 파싱
  if (row.result && typeof row.result === 'string') {
    try {
      row.result = JSON.parse(row.result);
    } catch (e) {
      // 이미 객체인 경우
    }
  }

  // 응답 형식 변환
  return {
    id: row.id,
    status: row.status,
    brand: { id: row.brandId },
    location: {
      lat: parseFloat(row.locationLat),
      lng: parseFloat(row.locationLng),
      address: row.locationAddress
    },
    conditions: {
      initialInvestment: parseInt(row.initialInvestment),
      monthlyRent: parseInt(row.monthlyRent),
      area: parseInt(row.area),
      ownerWorking: row.ownerWorking
    },
    targetDailySales: parseInt(row.targetDailySales),
    result: row.result,
    error: row.errorMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

module.exports = {
  createAnalysis,
  updateAnalysis,
  getAnalysis
};
