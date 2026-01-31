/**
 * 데이터베이스 연결 테스트 스크립트
 * 
 * 사용법:
 * node backend/db/test-connection.js
 */

require('dotenv').config();
const pool = require('./connection');

async function testConnection() {
  try {
    console.log('🧪 데이터베이스 연결 테스트 중...\n');
    
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    
    console.log('✅ 연결 성공!');
    console.log(`   - 현재 시간: ${result.rows[0].current_time}`);
    console.log(`   - PostgreSQL 버전: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
    
    // 브랜드 테이블 확인
    const brandCount = await pool.query('SELECT COUNT(*) as count FROM brands');
    console.log(`   - 브랜드 데이터: ${brandCount.rows[0].count}개`);
    
    // 분석 테이블 확인
    const analysisCount = await pool.query('SELECT COUNT(*) as count FROM analyses');
    console.log(`   - 분석 데이터: ${analysisCount.rows[0].count}개`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 연결 실패:');
    console.error(`   오류: ${error.message}`);
    console.error(`   코드: ${error.code}`);
    
    if (error.message.includes('SSL') || error.message.includes('certificate')) {
      console.error('\n💡 SSL 인증서 오류입니다.');
      console.error('   connection.js가 자동으로 처리하지만, 연결 문자열을 확인하세요.');
    } else if (error.message.includes('Tenant') || error.message.includes('user not found')) {
      console.error('\n💡 사용자명 형식 오류입니다.');
      console.error('   Session Pooler 사용 시: postgres.PROJECT_ID 형식이어야 합니다.');
    } else if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('\n💡 인증 오류입니다.');
      console.error('   .env 파일의 비밀번호를 확인하세요.');
    }
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();
