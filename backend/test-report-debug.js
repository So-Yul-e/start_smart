/**
 * 리포트 생성 디버깅 스크립트
 * 서버 로그를 직접 확인하기 위한 스크립트
 */

require('dotenv').config();
const { getAnalysis } = require('./db/analysisRepository');

async function debugReport() {
  console.log('🔍 리포트 생성 디버깅 시작...\n');
  
  // 최근 분석 ID 가져오기
  const pool = require('./db/connection');
  const result = await pool.query(
    'SELECT id, status, result IS NULL as result_null FROM analyses ORDER BY created_at DESC LIMIT 1'
  );
  
  if (result.rows.length === 0) {
    console.error('❌ 분석 결과가 없습니다. 먼저 분석을 실행하세요.');
    process.exit(1);
  }
  
  const analysisId = result.rows[0].id;
  const status = result.rows[0].status;
  const resultNull = result.rows[0].result_null;
  
  console.log(`📌 분석 ID: ${analysisId}`);
  console.log(`📊 상태: ${status}`);
  console.log(`📦 result 필드: ${resultNull ? 'NULL' : '있음'}\n`);
  
  if (status !== 'completed') {
    console.error(`❌ 분석이 완료되지 않았습니다. 상태: ${status}`);
    process.exit(1);
  }
  
  if (resultNull) {
    console.error('❌ result 필드가 NULL입니다. DB에 결과가 저장되지 않았습니다.');
    process.exit(1);
  }
  
  // getAnalysis 함수로 조회
  console.log('🔍 getAnalysis 함수로 조회...\n');
  try {
    const analysis = await getAnalysis(analysisId);
    
    console.log('✅ getAnalysis 성공');
    console.log('📋 analysis 객체 키:', Object.keys(analysis));
    console.log('📋 analysis.status:', analysis.status);
    console.log('📋 analysis.result 타입:', typeof analysis.result);
    console.log('📋 analysis.result 존재:', !!analysis.result);
    
    if (analysis.result) {
      if (typeof analysis.result === 'object') {
        console.log('📋 analysis.result 키:', Object.keys(analysis.result).slice(0, 10));
        console.log('📋 analysis.result.id:', analysis.result.id);
        console.log('📋 analysis.result.brand:', !!analysis.result.brand);
      } else {
        console.log('📋 analysis.result 값 (처음 200자):', String(analysis.result).substring(0, 200));
      }
    }
    
    // JSON 직렬화 테스트
    console.log('\n🔍 JSON 직렬화 테스트...');
    try {
      const json = JSON.stringify(analysis.result);
      console.log('✅ JSON 직렬화 성공 (길이:', json.length, '자)');
    } catch (stringifyError) {
      console.error('❌ JSON 직렬화 실패:', stringifyError.message);
    }
    
    console.log('\n✅ 디버깅 완료!');
    
  } catch (error) {
    console.error('❌ getAnalysis 실패:', error);
    console.error('스택 트레이스:', error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

debugReport().catch(error => {
  console.error('💥 디버깅 스크립트 실행 중 오류:', error);
  process.exit(1);
});
