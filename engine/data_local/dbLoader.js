/**
 * 데이터베이스 브랜드 데이터 로더
 * 
 * .env에 정의된 데이터베이스에서 브랜드 정보를 가져옴
 * 에러 발생 시 data_local/brands.json으로 fallback
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// data_local fallback 경로
const BRANDS_DATA_PATH = path.join(__dirname, 'brands.json');

/**
 * 데이터베이스 연결 (MySQL 또는 PostgreSQL)
 */
async function connectDatabase() {
  const dbType = process.env.DB_TYPE || 'mysql';
  const useDatabase = process.env.USE_DATABASE === 'true' || process.env.USE_DATABASE === '1';
  
  // 데이터베이스 사용 안 함
  if (!useDatabase) {
    return null;
  }
  
  try {
    if (dbType === 'mysql') {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'startsmart'
      });
      return { type: 'mysql', connection };
    } else if (dbType === 'postgresql' || dbType === 'postgres') {
      const { Pool } = require('pg');
      const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'startsmart'
      });
      return { type: 'postgresql', connection: pool };
    } else {
      console.warn(`지원하지 않는 데이터베이스 타입: ${dbType}`);
      return null;
    }
  } catch (error) {
    console.warn('데이터베이스 연결 실패:', error.message);
    return null;
  }
}

/**
 * 데이터베이스에서 브랜드 데이터 조회
 * @param {Object} db - 데이터베이스 연결 객체
 * @returns {Promise<Array>} 브랜드 배열
 */
async function fetchBrandsFromDB(db) {
  if (!db) {
    return null;
  }
  
  try {
    if (db.type === 'mysql') {
      const [rows] = await db.connection.execute(`
        SELECT 
          id, name, position,
          avg_price as avgPrice,
          cogs_rate as cogsRate,
          labor_rate as laborRate,
          utilities_rate as utilitiesRate,
          etc_fixed as etcFixed,
          royalty_rate as royaltyRate,
          marketing_rate as marketingRate,
          owner_working_multiplier as ownerWorkingMultiplier,
          expected_daily_sales as expectedDailySales,
          initial_investment_min as initialInvestmentMin,
          initial_investment_max as initialInvestmentMax,
          pdf_file as pdfFile,
          source,
          last_updated as lastUpdated
        FROM brands
        WHERE active = 1
        ORDER BY id
      `);
      
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        position: row.position,
        defaults: {
          avgPrice: row.avgPrice,
          cogsRate: row.cogsRate,
          laborRate: row.laborRate,
          utilitiesRate: row.utilitiesRate || 0.03,
          etcFixed: row.etcFixed,
          royaltyRate: row.royaltyRate,
          marketingRate: row.marketingRate,
          ownerWorkingMultiplier: row.ownerWorkingMultiplier || 0.6,
          expectedDailySales: row.expectedDailySales
        },
        initialInvestmentRange: {
          min: row.initialInvestmentMin,
          max: row.initialInvestmentMax || row.initialInvestmentMin
        },
        metadata: {
          pdfFile: row.pdfFile,
          source: row.source || 'database',
          lastUpdated: row.lastUpdated
        }
      }));
    } else if (db.type === 'postgresql') {
      const result = await db.connection.query(`
        SELECT 
          id, name, position,
          avg_price as "avgPrice",
          cogs_rate as "cogsRate",
          labor_rate as "laborRate",
          utilities_rate as "utilitiesRate",
          etc_fixed as "etcFixed",
          royalty_rate as "royaltyRate",
          marketing_rate as "marketingRate",
          owner_working_multiplier as "ownerWorkingMultiplier",
          expected_daily_sales as "expectedDailySales",
          initial_investment_min as "initialInvestmentMin",
          initial_investment_max as "initialInvestmentMax",
          pdf_file as "pdfFile",
          source,
          last_updated as "lastUpdated"
        FROM brands
        WHERE active = true
        ORDER BY id
      `);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        position: row.position,
        defaults: {
          avgPrice: row.avgPrice,
          cogsRate: row.cogsRate,
          laborRate: row.laborRate,
          utilitiesRate: row.utilitiesRate || 0.03,
          etcFixed: row.etcFixed,
          royaltyRate: row.royaltyRate,
          marketingRate: row.marketingRate,
          ownerWorkingMultiplier: row.ownerWorkingMultiplier || 0.6,
          expectedDailySales: row.expectedDailySales
        },
        initialInvestmentRange: {
          min: row.initialInvestmentMin,
          max: row.initialInvestmentMax || row.initialInvestmentMin
        },
        metadata: {
          pdfFile: row.pdfFile,
          source: row.source || 'database',
          lastUpdated: row.lastUpdated
        }
      }));
    }
  } catch (error) {
    console.error('데이터베이스 조회 실패:', error.message);
    throw error;
  }
  
  return null;
}

/**
 * data_local에서 브랜드 데이터 로드 (fallback)
 */
function loadBrandsFromLocal() {
  try {
    const data = fs.readFileSync(BRANDS_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('로컬 데이터 로드 실패:', error.message);
    throw new Error('브랜드 데이터를 로드할 수 없습니다.');
  }
}

/**
 * 브랜드 데이터 로드 (DB → data_local fallback)
 * @returns {Promise<Object>} 브랜드 데이터 객체
 */
async function loadBrandsData() {
  let db = null;
  let brands = null;
  
  // 1차: 데이터베이스에서 로드 시도
  try {
    db = await connectDatabase();
    if (db) {
      console.log('📊 데이터베이스에서 브랜드 데이터 로드 시도...');
      brands = await fetchBrandsFromDB(db);
      
      if (brands && brands.length > 0) {
        console.log(`✅ 데이터베이스에서 ${brands.length}개 브랜드 로드 성공`);
        
        // 연결 종료
        if (db.type === 'mysql') {
          await db.connection.end();
        } else if (db.type === 'postgresql') {
          await db.connection.end();
        }
        
        return { brands, source: 'database' };
      }
    }
  } catch (error) {
    console.warn('⚠️ 데이터베이스 로드 실패, data_local로 fallback:', error.message);
    
    // 연결 종료
    if (db) {
      try {
        if (db.type === 'mysql') {
          await db.connection.end();
        } else if (db.type === 'postgresql') {
          await db.connection.end();
        }
      } catch (closeError) {
        // 무시
      }
    }
  }
  
  // 2차: data_local에서 로드 (fallback)
  try {
    console.log('📁 data_local에서 브랜드 데이터 로드 시도...');
    const localData = loadBrandsFromLocal();
    console.log(`✅ data_local에서 ${localData.brands.length}개 브랜드 로드 성공`);
    return { ...localData, source: 'local' };
  } catch (error) {
    console.error('❌ data_local 로드도 실패:', error.message);
    throw new Error('브랜드 데이터를 로드할 수 없습니다.');
  }
}

/**
 * 브랜드 ID로 브랜드 정보 조회
 * @param {String} brandId - 브랜드 ID
 * @returns {Promise<Object|null>} 브랜드 정보 또는 null
 */
async function getBrandById(brandId) {
  const data = await loadBrandsData();
  const brand = data.brands.find(b => b.id === brandId);
  
  if (!brand) {
    console.warn(`브랜드를 찾을 수 없습니다: ${brandId}`);
    return null;
  }
  
  return brand;
}

/**
 * 모든 브랜드 목록 조회
 * @returns {Promise<Array<Object>>} 브랜드 목록
 */
async function getAllBrands() {
  const data = await loadBrandsData();
  return data.brands.map(brand => ({
    id: brand.id,
    name: brand.name,
    position: brand.position,
    initialInvestmentRange: brand.initialInvestmentRange,
    metadata: brand.metadata
  }));
}

/**
 * 브랜드 정보를 엔진 입력 형식으로 변환
 * @param {String} brandId - 브랜드 ID
 * @returns {Promise<Object|null>} 엔진 입력 형식의 brand 객체
 */
async function getBrandForEngine(brandId) {
  const brand = await getBrandById(brandId);
  
  if (!brand) {
    return null;
  }
  
  return {
    id: brand.id,
    name: brand.name,
    defaults: brand.defaults
  };
}

module.exports = {
  loadBrandsData,
  getBrandById,
  getAllBrands,
  getBrandForEngine,
  connectDatabase
};
