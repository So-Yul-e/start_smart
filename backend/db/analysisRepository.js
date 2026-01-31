/**
 * 분석 결과 저장소 (Repository)
 */

const pool = require('./connection');

// DB 연결 실패 시 메모리 저장소 사용 (fallback)
const memoryStore = {
  analyses: new Map(),
  brands: new Map()
};

// DB 연결 테스트
let dbAvailable = false;
(async () => {
  try {
    await pool.query('SELECT 1');
    dbAvailable = true;
    console.log('✅ PostgreSQL 데이터베이스 연결 성공');
  } catch (error) {
    console.warn('⚠️ PostgreSQL 데이터베이스 연결 실패, 메모리 저장소 사용:', error.message);
    dbAvailable = false;
  }
})();

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

  // DB 사용 가능 여부 확인
  if (!dbAvailable) {
    // 메모리 저장소 사용
    console.log('[createAnalysis] 메모리 저장소 사용 (DB 없음)');
    const analysisRecord = {
      id,
      brandId,
      locationLat: parseFloat(location.lat),
      locationLng: parseFloat(location.lng),
      locationAddress: location.address || null,
      radius: radius || 500,
      initialInvestment: parseInt(conditions.initialInvestment),
      monthlyRent: parseInt(conditions.monthlyRent),
      area: parseInt(conditions.area),
      ownerWorking: Boolean(conditions.ownerWorking),
      targetDailySales: parseInt(targetDailySales),
      status: 'pending',
      result: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    memoryStore.analyses.set(id, analysisRecord);
    console.log('[createAnalysis] 메모리 저장소에 저장 완료:', id);
    return analysisRecord;
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
    
    // DB 오류 시 메모리 저장소로 fallback
    console.log('[createAnalysis] DB 오류로 메모리 저장소 사용');
    dbAvailable = false;
    
    const analysisRecord = {
      id,
      brandId,
      locationLat: parseFloat(location.lat),
      locationLng: parseFloat(location.lng),
      locationAddress: location.address || null,
      radius: radius || 500,
      initialInvestment: parseInt(conditions.initialInvestment),
      monthlyRent: parseInt(conditions.monthlyRent),
      area: parseInt(conditions.area),
      ownerWorking: Boolean(conditions.ownerWorking),
      targetDailySales: parseInt(targetDailySales),
      status: 'pending',
      result: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    memoryStore.analyses.set(id, analysisRecord);
    console.log('[createAnalysis] 메모리 저장소에 저장 완료:', id);
    return analysisRecord;
  }
}

/**
 * 분석 결과 업데이트
 */
async function updateAnalysis(analysisId, updates) {
  const { status, result, errorMessage } = updates;
  
  // DB 사용 불가 시 메모리 저장소 사용
  if (!dbAvailable) {
    const existing = memoryStore.analyses.get(analysisId);
    if (!existing) {
      console.warn('[updateAnalysis] 메모리 저장소에 분석이 없음:', analysisId);
      return null;
    }
    
    if (status) existing.status = status;
    if (result !== undefined) existing.result = result;
    if (errorMessage) existing.errorMessage = errorMessage;
    existing.updatedAt = new Date();
    
    memoryStore.analyses.set(analysisId, existing);
    console.log('[updateAnalysis] 메모리 저장소 업데이트 완료:', analysisId, '상태:', status);
    return existing;
  }

  try {
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
  } catch (dbError) {
    console.error('[updateAnalysis] DB 오류, 메모리 저장소로 fallback:', dbError.message);
    dbAvailable = false;
    
    // 메모리 저장소로 fallback
    const existing = memoryStore.analyses.get(analysisId);
    if (!existing) {
      return null;
    }
    
    if (status) existing.status = status;
    if (result !== undefined) existing.result = result;
    if (errorMessage) existing.errorMessage = errorMessage;
    existing.updatedAt = new Date();
    
    memoryStore.analyses.set(analysisId, existing);
    return existing;
  }
}

/**
 * 분석 결과 조회
 */
async function getAnalysis(analysisId) {
  // DB 사용 불가 시 메모리 저장소 사용
  if (!dbAvailable) {
    const stored = memoryStore.analyses.get(analysisId);
    if (!stored) {
      return null;
    }
    
    // 응답 형식 변환
    return {
      id: stored.id,
      status: stored.status,
      brand: { id: stored.brandId },
      location: {
        lat: parseFloat(stored.locationLat),
        lng: parseFloat(stored.locationLng),
        address: stored.locationAddress
      },
      conditions: {
        initialInvestment: parseInt(stored.initialInvestment),
        monthlyRent: parseInt(stored.monthlyRent),
        area: parseInt(stored.area),
        ownerWorking: stored.ownerWorking
      },
      targetDailySales: parseInt(stored.targetDailySales),
      result: stored.result,
      error: stored.errorMessage,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt
    };
  }

  try {
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
  } catch (dbError) {
    console.error('[getAnalysis] DB 오류, 메모리 저장소로 fallback:', dbError.message);
    dbAvailable = false;
    
    // 메모리 저장소로 fallback
    const stored = memoryStore.analyses.get(analysisId);
    if (!stored) {
      return null;
    }
    
    return {
      id: stored.id,
      status: stored.status,
      brand: { id: stored.brandId },
      location: {
        lat: parseFloat(stored.locationLat),
        lng: parseFloat(stored.locationLng),
        address: stored.locationAddress
      },
      conditions: {
        initialInvestment: parseInt(stored.initialInvestment),
        monthlyRent: parseInt(stored.monthlyRent),
        area: parseInt(stored.area),
        ownerWorking: stored.ownerWorking
      },
      targetDailySales: parseInt(stored.targetDailySales),
      result: stored.result,
      error: stored.errorMessage,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt
    };
  }
}

module.exports = {
  createAnalysis,
  updateAnalysis,
  getAnalysis
};
