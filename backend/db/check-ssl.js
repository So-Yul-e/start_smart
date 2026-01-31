/**
 * Supabase SSL 설정 확인 스크립트
 * 
 * 사용법:
 * node backend/db/check-ssl.js
 */

require('dotenv').config();
const { Pool } = require('pg');

// 여러 환경변수 이름 확인
const connectionString = process.env.DATABASE_URL || 
  process.env.CLOUD_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

// 로컬 DB 환경변수 확인
const hasLocalDB = process.env.DB_HOST || process.env.DB_NAME;

if (!connectionString && !hasLocalDB) {
  console.error('❌ 데이터베이스 연결 정보가 설정되지 않았습니다.\n');
  
  console.error('📋 현재 환경변수 상태:');
  console.error(`   - DATABASE_URL: ${process.env.DATABASE_URL ? '✅ 설정됨' : '❌ 없음'}`);
  console.error(`   - CLOUD_DATABASE_URL: ${process.env.CLOUD_DATABASE_URL ? '✅ 설정됨' : '❌ 없음'}`);
  console.error(`   - DB_HOST: ${process.env.DB_HOST ? '✅ 설정됨' : '❌ 없음'}`);
  console.error(`   - DB_NAME: ${process.env.DB_NAME ? '✅ 설정됨' : '❌ 없음'}`);
  console.error('');
  
  console.error('💡 해결 방법:\n');
  console.error('옵션 1: 클라우드 DB (Supabase) 사용');
  console.error('   .env 파일에 다음을 추가하세요:');
  console.error('   DATABASE_URL=postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require');
  console.error('');
  console.error('옵션 2: 로컬 DB 사용');
  console.error('   .env 파일에 다음을 추가하세요:');
  console.error('   DB_HOST=localhost');
  console.error('   DB_PORT=5432');
  console.error('   DB_NAME=startsmart');
  console.error('   DB_USER=postgres');
  console.error('   DB_PASSWORD=postgres');
  console.error('');
  console.error('⚠️  참고: 로컬 DB는 SSL이 필요하지 않습니다.');
  process.exit(1);
}

if (!connectionString && hasLocalDB) {
  console.log('💻 로컬 데이터베이스 설정 감지됨');
  console.log(`   - 호스트: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   - 포트: ${process.env.DB_PORT || 5432}`);
  console.log(`   - 데이터베이스: ${process.env.DB_NAME || 'startsmart'}`);
  console.log('');
  console.log('ℹ️  로컬 DB는 SSL이 필요하지 않습니다.');
  console.log('   이 스크립트는 클라우드 DB (Supabase) SSL 설정 확인용입니다.\n');
  process.exit(0);
}

console.log('🔍 Supabase SSL 설정 확인 중...\n');

// 연결 문자열 분석
const isSupabase = connectionString.includes('supabase.com') || connectionString.includes('supabase.co');
const hasSSLMode = connectionString.includes('sslmode=');
const sslMode = connectionString.match(/sslmode=([^&]+)/)?.[1];

// 사용자명 추출
const userMatch = connectionString.match(/postgresql:\/\/([^:]+):/);
const username = userMatch ? userMatch[1] : '알 수 없음';
const isCorrectUsernameFormat = username.includes('.'); // Session Pooler는 postgres.PROJECT_ID 형식

console.log('📋 연결 정보:');
console.log(`   - Supabase 연결: ${isSupabase ? '✅ 예' : '❌ 아니오'}`);
console.log(`   - 사용자명: ${username}`);
if (isSupabase && !isCorrectUsernameFormat) {
  console.log(`   ⚠️  경고: Session Pooler 사용 시 사용자명은 'postgres.PROJECT_ID' 형식이어야 합니다`);
}
console.log(`   - sslmode 파라미터: ${hasSSLMode ? '✅ 있음' : '❌ 없음'}`);
if (hasSSLMode) {
  console.log(`   - sslmode 값: ${sslMode}`);
}
console.log(`   - 호스트: ${connectionString.match(/@([^:]+)/)?.[1] || '알 수 없음'}`);
console.log(`   - 포트: ${connectionString.match(/:(\d+)\//)?.[1] || '알 수 없음'}`);
console.log('');

// SSL 설정 확인
if (isSupabase) {
  console.log('🔒 Supabase SSL 설정:');
  
  if (!hasSSLMode) {
    console.log('   ⚠️  경고: 연결 문자열에 sslmode=require가 없습니다.');
    console.log('   💡 connection.js가 자동으로 SSL을 활성화하지만, 명시적으로 추가하는 것을 권장합니다.');
    console.log('   📝 수정 예시:');
    console.log(`      ${connectionString}${connectionString.includes('?') ? '&' : '?'}sslmode=require`);
  } else if (sslMode !== 'require' && sslMode !== 'prefer') {
    console.log(`   ⚠️  경고: sslmode가 '${sslMode}'입니다. 'require' 또는 'prefer'를 권장합니다.`);
  } else {
    console.log('   ✅ SSL 설정이 올바릅니다.');
  }
  
  console.log('');
}

// 실제 연결 테스트
console.log('🧪 실제 연결 테스트 중...\n');

const isVercel = process.env.VERCEL === '1' || connectionString.includes('vercel');
const requiresSSL = isSupabase || isVercel || connectionString.includes('sslmode=require');

const pool = new Pool({
  connectionString: connectionString,
  // Supabase의 경우 self-signed certificate 문제 해결을 위해 rejectUnauthorized: false 필수
  ssl: requiresSSL ? {
    rejectUnauthorized: false
  } : undefined,
  connectionTimeoutMillis: 5000,
});

pool.query('SELECT NOW() as current_time, version() as pg_version')
  .then(result => {
    console.log('✅ 연결 성공!');
    console.log(`   - 현재 시간: ${result.rows[0].current_time}`);
    console.log(`   - PostgreSQL 버전: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
    console.log(`   - SSL 사용: ${requiresSSL ? '✅ 예' : '❌ 아니오'}`);
    
    if (isSupabase && !requiresSSL) {
      console.log('\n⚠️  경고: Supabase 연결인데 SSL이 활성화되지 않았습니다!');
      console.log('   connection.js의 SSL 자동 감지 로직을 확인하세요.');
    }
    
    pool.end();
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 연결 실패:');
    console.error(`   오류: ${error.message}`);
    
    if (error.message.includes('SSL') || error.message.includes('ssl')) {
      console.error('\n💡 SSL 관련 오류입니다. 다음을 확인하세요:');
      console.error('   1. 연결 문자열에 ?sslmode=require 추가');
      console.error('   2. connection.js에서 SSL이 활성화되는지 확인');
    } else if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('\n💡 인증 오류입니다. 다음을 확인하세요:');
      console.error('   1. .env 파일의 비밀번호가 실제 Supabase 비밀번호와 일치하는지');
      console.error('   2. 비밀번호에 특수문자가 있으면 URL 인코딩이 필요할 수 있음');
      console.error('   3. Supabase 대시보드 → Settings → Database에서 비밀번호 확인');
    } else if (error.message.includes('Tenant') || error.message.includes('user not found')) {
      console.error('\n💡 사용자명 형식 오류입니다. Session Pooler 사용 시:');
      console.error('   ❌ 잘못된 형식: postgres:[PASSWORD]@...');
      console.error('   ✅ 올바른 형식: postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@...');
      console.error('');
      console.error('   📝 수정 방법:');
      console.error('   1. Supabase 대시보드 → Settings → Database');
      console.error('   2. Connection string → Session mode 선택');
      console.error('   3. 연결 문자열 복사 (사용자명에 프로젝트 ID 포함됨)');
      console.error('   4. .env 파일의 DATABASE_URL 업데이트');
      console.error('');
      console.error('   예시:');
      console.error('   postgresql://postgres.oetxnpgfsmmxcgnelhvd:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require');
    } else if (error.message.includes('self-signed') || error.message.includes('certificate')) {
      console.error('\n💡 SSL 인증서 오류입니다. connection.js가 자동으로 처리하지만, 다음을 확인하세요:');
      console.error('   1. connection.js에서 rejectUnauthorized: false 설정 확인');
      console.error('   2. 연결 문자열에 ?sslmode=require가 있으면 connection.js의 SSL 설정이 적용됨');
      console.error('   3. 서버를 재시작하여 변경사항 적용');
      console.error('');
      console.error('   💡 참고: 이 오류는 check-ssl.js에서만 발생할 수 있습니다.');
      console.error('   실제 서버(npm start)에서는 connection.js가 자동으로 처리합니다.');
    } else if (error.message.includes('host') || error.message.includes('DNS')) {
      console.error('\n💡 호스트명 오류입니다. 연결 문자열의 호스트명을 확인하세요.');
      console.error('   Session Pooler 사용 권장: aws-0-ap-northeast-2.pooler.supabase.com:6543');
    }
    
    pool.end();
    process.exit(1);
  });
