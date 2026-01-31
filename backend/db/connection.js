/**
 * PostgreSQL 데이터베이스 연결
 * 
 * 지원하는 연결 방식:
 * 1. DATABASE_URL (Vercel Postgres, Supabase 등 클라우드 DB)
 * 2. 개별 환경변수 (로컬 개발: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
 */

const { Pool } = require('pg');
require('dotenv').config();

// Vercel Postgres 또는 Supabase는 DATABASE_URL을 제공
// 로컬 개발은 개별 환경변수 사용
const connectionString = process.env.DATABASE_URL || 
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

let pool;

if (connectionString) {
  // 클라우드 DB (Vercel Postgres, Supabase 등)
  pool = new Pool({
    connectionString: connectionString,
    // Vercel Postgres는 SSL 필수
    ssl: process.env.VERCEL === '1' || process.env.DATABASE_URL?.includes('vercel') ? {
      rejectUnauthorized: false
    } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  console.log('📦 클라우드 데이터베이스 연결 설정 (DATABASE_URL 사용)');
} else {
  // 로컬 개발: 개별 환경변수 사용
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'startsmart',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  console.log('💻 로컬 데이터베이스 연결 설정');
}

// 연결 테스트
pool.on('connect', () => {
  console.log('✅ PostgreSQL 데이터베이스 연결 성공');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 데이터베이스 연결 오류:', err);
});

module.exports = pool;
