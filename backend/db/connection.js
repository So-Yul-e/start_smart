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
  // Supabase는 SSL 필수, 연결 문자열에 sslmode가 없으면 자동으로 SSL 적용
  const isSupabase = connectionString.includes('supabase.com') || connectionString.includes('supabase.co');
  const isVercel = process.env.VERCEL === '1' || connectionString.includes('vercel');
  const requiresSSL = isSupabase || isVercel;
  
  // 연결 문자열에서 sslmode 파라미터 제거 (connection.js의 ssl 옵션이 우선 적용되도록)
  // sslmode=require가 있으면 pg 라이브러리가 자동으로 SSL을 처리하려고 하는데,
  // 이때 self-signed certificate 검증이 실패할 수 있음
  let cleanConnectionString = connectionString;
  if (requiresSSL && connectionString.includes('sslmode=')) {
    // sslmode와 uselibpqcompat 파라미터 제거
    cleanConnectionString = connectionString
      .replace(/[?&]sslmode=[^&]*/g, '')  // sslmode=require 제거
      .replace(/[?&]uselibpqcompat=[^&]*/g, '');  // uselibpqcompat 제거
    
    // ?가 남아있는데 다른 파라미터가 없으면 제거
    if (cleanConnectionString.includes('?')) {
      const parts = cleanConnectionString.split('?');
      if (parts[1] === '' || !parts[1].includes('=')) {
        cleanConnectionString = parts[0];
      }
    }
  }
  
  // Supabase의 경우 self-signed certificate 문제 해결을 위해 rejectUnauthorized: false 필수
  pool = new Pool({
    connectionString: cleanConnectionString,
    // Supabase와 Vercel Postgres는 SSL 필수
    // rejectUnauthorized: false는 self-signed certificate를 허용 (Supabase 사용 시 필요)
    ssl: requiresSSL ? {
      rejectUnauthorized: false
    } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  console.log('📦 클라우드 데이터베이스 연결 설정 (DATABASE_URL 사용)');
  if (isSupabase) {
    console.log('🔒 Supabase SSL 연결 활성화 (self-signed certificate 허용)');
  }
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
  console.error('❌ 연결 오류 메시지:', err.message);
  console.error('❌ 연결 오류 코드:', err.code);
  console.error('❌ 연결 오류 스택:', err.stack);
  
  // 배포 환경에서 연결 오류 발생 시 상세 정보 로깅
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    console.error('❌ 배포 환경 연결 오류 상세:');
    console.error('   - DATABASE_URL 존재:', !!process.env.DATABASE_URL);
    console.error('   - 연결 문자열 길이:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
    console.error('   - 호스트:', connectionString ? (connectionString.match(/@([^:]+)/)?.[1] || '알 수 없음') : '없음');
  }
});

module.exports = pool;
