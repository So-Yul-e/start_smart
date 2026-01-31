/**
 * 로컬 DB를 클라우드 DB로 업로드하는 스크립트
 * 
 * 사용법:
 * 1. Supabase 또는 다른 클라우드 DB의 DATABASE_URL을 .env에 설정
 * 2. node backend/db/upload-to-cloud.js
 * 
 * .env 파일에 추가:
 * CLOUD_DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'startsmart';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

// 클라우드 DB 연결 정보
const CLOUD_DATABASE_URL = process.env.CLOUD_DATABASE_URL || process.env.DATABASE_URL;

if (!CLOUD_DATABASE_URL) {
  console.error('❌ 클라우드 DB 연결 정보가 없습니다.');
  console.error('\n.env 파일에 다음을 추가하세요:');
  console.error('CLOUD_DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres');
  console.error('\n또는 Supabase의 경우:');
  console.error('1. Supabase 대시보드 → Settings → Database');
  console.error('2. Connection string 복사');
  console.error('3. .env 파일에 CLOUD_DATABASE_URL로 추가');
  process.exit(1);
}

const DUMP_FILE = path.join(__dirname, 'dump.sql');

console.log('☁️  로컬 DB를 클라우드 DB로 업로드 시작...\n');
console.log('📦 1단계: 로컬 DB 덤프 생성 중...\n');

// 1단계: 로컬 DB 덤프 생성
const pgDumpCommand = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --clean --if-exists --no-owner --no-acl > "${DUMP_FILE}"`;

exec(pgDumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ 덤프 생성 실패:', error.message);
    console.error('\n해결 방법:');
    console.error('1. PostgreSQL이 설치되어 있는지 확인: which pg_dump');
    console.error('2. 로컬 PostgreSQL 서비스가 실행 중인지 확인');
    console.error('3. DB 연결 정보가 올바른지 확인 (.env 파일)');
    process.exit(1);
  }

  if (stderr && !stderr.includes('WARNING')) {
    console.warn('⚠️  경고:', stderr);
  }

  if (!fs.existsSync(DUMP_FILE)) {
    console.error('❌ 덤프 파일이 생성되지 않았습니다.');
    process.exit(1);
  }

  const stats = fs.statSync(DUMP_FILE);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  console.log(`✅ 덤프 파일 생성 완료! (${fileSizeKB} KB)\n`);

  // 2단계: 클라우드 DB에 업로드
  console.log('☁️  2단계: 클라우드 DB에 업로드 중...\n');
  
  // Supabase 연결 문자열을 직접 사용 (psql이 자동으로 파싱)
  // 연결 문자열 형식:
  // - Direct: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
  // - Pooler: postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
  // - Session: postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
  
  console.log(`클라우드 DB 연결 정보 확인 중...\n`);
  
  // 연결 문자열에서 호스트 추출 (정보 표시용)
  const hostMatch = CLOUD_DATABASE_URL.match(/@([^:]+):(\d+)\//);
  if (hostMatch) {
    console.log(`  호스트: ${hostMatch[1]}:${hostMatch[2]}`);
    console.log(`  연결 문자열 형식: ${hostMatch[1].includes('pooler') ? 'Pooler' : 'Direct'}\n`);
  }

  // psql은 연결 문자열을 직접 지원하므로 그대로 사용
  // SSL은 Supabase가 자동으로 처리
  const uploadCommand = `psql "${CLOUD_DATABASE_URL}" -f "${DUMP_FILE}"`;

  exec(uploadCommand, (uploadError, uploadStdout, uploadStderr) => {
    if (uploadError) {
      console.error('❌ 클라우드 DB 업로드 실패:', uploadError.message);
      console.error('\n해결 방법:');
      console.error('1. 클라우드 DB 연결 정보가 올바른지 확인');
      console.error('2. 클라우드 DB가 실행 중인지 확인');
      console.error('3. 방화벽 설정 확인 (Supabase는 자동 허용)');
      console.error('4. DATABASE_URL에 비밀번호가 올바르게 포함되어 있는지 확인');
      process.exit(1);
    }

    if (uploadStderr && !uploadStderr.includes('WARNING') && !uploadStderr.includes('NOTICE')) {
      console.warn('⚠️  경고:', uploadStderr);
    }

    console.log('✅ 클라우드 DB 업로드 완료!\n');
    console.log('📋 다음 단계:');
    console.log('1. .env 파일에 DATABASE_URL 설정:');
    console.log(`   DATABASE_URL=${CLOUD_DATABASE_URL}`);
    console.log('2. 다른 노트북에서도 같은 DATABASE_URL 사용');
    console.log('3. 서버 실행: npm start');
    console.log('4. 테스트: curl http://localhost:3000/api/brands\n');
    
    // 임시 덤프 파일 삭제 (선택사항)
    console.log('🗑️  임시 덤프 파일 삭제 중...');
    fs.unlinkSync(DUMP_FILE);
    console.log('✅ 완료!\n');
  });
});
