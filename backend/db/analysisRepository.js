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

  // 입력 데이터 검증 및 로깅
  console.log('[createAnalysis] 입력 데이터:', {
    hasId: !!id,
    hasBrandId: !!brandId,
    hasLocation: !!location,
    locationType: typeof location,
    locationKeys: location ? Object.keys(location) : null,
    hasRadius: radius !== undefined,
    hasConditions: !!conditions,
    conditionsKeys: conditions ? Object.keys(conditions) : null,
    hasTargetDailySales: targetDailySales !== undefined
  });

  // location 객체 검증
  if (!location || typeof location !== 'object') {
    throw new Error('location은 객체여야 합니다.');
  }
  if (location.lat === undefined || location.lng === undefined) {
    throw new Error('location에 lat과 lng가 필요합니다.');
  }

  // conditions 객체 검증
  if (!conditions || typeof conditions !== 'object') {
    throw new Error('conditions는 객체여야 합니다.');
  }
  if (conditions.initialInvestment === undefined || 
      conditions.monthlyRent === undefined || 
      conditions.area === undefined || 
      conditions.ownerWorking === undefined) {
    throw new Error('conditions에 initialInvestment, monthlyRent, area, ownerWorking이 필요합니다.');
  }

  try {
    // 기존 분석이 있는지 확인 (같은 ID로)
    const existingCheck = await pool.query(
      'SELECT id, status, result FROM analyses WHERE id = $1',
      [id]
    );
    
    if (existingCheck.rows.length > 0) {
      const existing = existingCheck.rows[0];
      console.warn('[createAnalysis] ⚠️  이미 존재하는 분석 ID:', id, '상태:', existing.status, 'result 있음:', !!existing.result);
      // 기존 분석이 완료되어 있으면 삭제하고 새로 생성
      if (existing.status === 'completed' && existing.result) {
        console.log('[createAnalysis] 기존 완료된 분석 삭제 후 재생성');
        await pool.query('DELETE FROM analyses WHERE id = $1', [id]);
      } else {
        // 진행 중이면 기존 것 사용
        console.log('[createAnalysis] 기존 분석 사용:', existing.status);
        return existing;
      }
    }

    const result = await pool.query(
      `INSERT INTO analyses (
        id, brand_id, location_lat, location_lng, location_address, radius,
        initial_investment, monthly_rent, area, owner_working, target_daily_sales, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        id,
        brandId,
        parseFloat(location.lat),
        parseFloat(location.lng),
        location.address || null,
        radius || 500,
        parseInt(conditions.initialInvestment),
        parseInt(conditions.monthlyRent),
        parseInt(conditions.area),
        Boolean(conditions.ownerWorking),
        parseInt(targetDailySales),
        'pending'
      ]
    );

    console.log('[createAnalysis] DB 저장 성공:', result.rows[0].id, '상태:', result.rows[0].status);
    return result.rows[0];
  } catch (dbError) {
    console.error('[createAnalysis] DB 쿼리 오류:', dbError);
    console.error('[createAnalysis] DB 쿼리 오류 메시지:', dbError.message);
    console.error('[createAnalysis] DB 쿼리 오류 코드:', dbError.code);
    throw dbError;
  }
}

/**
 * 분석 결과 업데이트
 */
async function updateAnalysis(analysisId, updates) {
  const { status, result, errorMessage, progress } = updates;
  
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

  // progress 필드 추가 (진행 단계 정보)
  if (progress !== undefined) {
    updatesList.push(`progress = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(progress));
  }

  updatesList.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(analysisId);

  const query = `
    UPDATE analyses
    SET ${updatesList.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  try {
    const dbResult = await pool.query(query, values);
    return dbResult.rows[0];
  } catch (error) {
    // progress 컬럼이 없는 경우 무시하고 계속 진행
    if (error.code === '42703' && progress !== undefined) {
      console.warn('[updateAnalysis] progress 컬럼이 없습니다. 컬럼 없이 업데이트 재시도');
      // progress 없이 재시도
      const retryUpdates = { status, result, errorMessage };
      return updateAnalysis(analysisId, retryUpdates);
    }
    throw error;
  }
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
      progress,
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

  // progress가 JSONB이면 파싱
  if (row.progress && typeof row.progress === 'string') {
    try {
      row.progress = JSON.parse(row.progress);
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
    progress: row.progress || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

module.exports = {
  createAnalysis,
  updateAnalysis,
  getAnalysis
};
