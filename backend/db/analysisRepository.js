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
    console.error('[createAnalysis] ❌ DB 쿼리 오류:', dbError);
    console.error('[createAnalysis] ❌ 오류 메시지:', dbError.message);
    console.error('[createAnalysis] ❌ 오류 코드:', dbError.code);
    console.error('[createAnalysis] ❌ 오류 스택:', dbError.stack);
    
    // 배포 환경에서 연결 오류 상세 로깅
    if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
      console.error('[createAnalysis] ❌ 배포 환경 DB 오류 상세:');
      console.error('   - DATABASE_URL 존재:', !!process.env.DATABASE_URL);
      console.error('   - 연결 문자열 길이:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
    }
    
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
    console.error('[updateAnalysis] ❌ DB 업데이트 오류:', error);
    console.error('[updateAnalysis] ❌ 오류 메시지:', error.message);
    console.error('[updateAnalysis] ❌ 오류 코드:', error.code);
    console.error('[updateAnalysis] ❌ 오류 스택:', error.stack);
    
    // progress 컬럼이 없는 경우 무시하고 계속 진행
    if (error.code === '42703' && progress !== undefined) {
      console.warn('[updateAnalysis] ⚠️  progress 컬럼이 없습니다. 컬럼 없이 업데이트 재시도');
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
  let result;
  let hasProgressColumn = true;
  
  // progress 컬럼이 있는지 확인하기 위해 먼저 시도
  try {
    result = await pool.query(
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
  } catch (error) {
    // progress 컬럼이 없는 경우 (에러 코드 42703: undefined_column)
    if (error.code === '42703') {
      console.warn('[getAnalysis] progress 컬럼이 없습니다. progress 없이 조회 재시도');
      hasProgressColumn = false;
      // progress 없이 재시도
      result = await pool.query(
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
    } else {
      // 다른 에러는 상세 로깅 후 throw
      console.error('[getAnalysis] ❌ DB 조회 오류:', error);
      console.error('[getAnalysis] ❌ 오류 메시지:', error.message);
      console.error('[getAnalysis] ❌ 오류 코드:', error.code);
      console.error('[getAnalysis] ❌ 오류 스택:', error.stack);
      throw error;
    }
  }

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

  // progress가 JSONB이면 파싱 (컬럼이 있는 경우만)
  if (hasProgressColumn && row.progress && typeof row.progress === 'string') {
    try {
      row.progress = JSON.parse(row.progress);
    } catch (e) {
      // 이미 객체인 경우
    }
  } else if (!hasProgressColumn) {
    // progress 컬럼이 없으면 null로 설정
    row.progress = null;
  }

  // 응답 형식 변환
  // result JSONB에 conditions가 있으면 우선 사용 (loans, exitInputs 포함)
  let conditions = {
    initialInvestment: parseInt(row.initialInvestment),
    monthlyRent: parseInt(row.monthlyRent),
    area: parseInt(row.area),
    ownerWorking: row.ownerWorking
  };
  
  // result JSONB에서 conditions를 가져와서 병합 (loans, exitInputs 포함)
  if (row.result && row.result.conditions) {
    conditions = {
      ...conditions,
      ...row.result.conditions
    };
  }

  return {
    id: row.id,
    status: row.status,
    brand: { id: row.brandId },
    location: {
      lat: parseFloat(row.locationLat),
      lng: parseFloat(row.locationLng),
      address: row.locationAddress
    },
    conditions: conditions,
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
