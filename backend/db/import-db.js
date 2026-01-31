/**
 * 데이터베이스 덤프 가져오기 스크립트
 * dump.sql 파일을 읽어서 현재 DB에 복원합니다.
 * 
 * 사용법:
 * node backend/db/import-db.js
 * 
 * 입력: backend/db/dump.sql
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

const DUMP_FILE = path.join(__dirname, 'dump.sql');

console.log('📥 데이터베이스 덤프 가져오기 시작...\n');

// dump.sql 파일 존재 확인
if (!fs.existsSync(DUMP_FILE)) {
  console.error(`❌ 덤프 파일을 찾을 수 없습니다: ${DUMP_FILE}`);
  console.error('\n해결 방법:');
  console.error('1. dump.sql 파일이 backend/db/ 폴더에 있는지 확인');
  console.error('2. 다른 노트북에서 export-db.js를 실행하여 dump.sql을 생성');
  process.exit(1);
}

const stats = fs.statSync(DUMP_FILE);
const fileSizeKB = (stats.size / 1024).toFixed(2);
console.log(`📁 덤프 파일: ${DUMP_FILE}`);
console.log(`📊 파일 크기: ${fileSizeKB} KB`);
console.log(`데이터베이스: ${DB_NAME}`);
console.log(`호스트: ${DB_HOST}:${DB_PORT}\n`);

// 데이터베이스가 존재하는지 확인하고, 없으면 생성
console.log('🔍 데이터베이스 확인 중...');
const checkDbCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -lqt | cut -d \\| -f 1 | grep -qw ${DB_NAME}`;

exec(checkDbCommand, (error) => {
  if (error) {
    // 데이터베이스가 없으면 생성
    console.log('📝 데이터베이스가 없습니다. 생성 중...');
    const createDbCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -c "CREATE DATABASE ${DB_NAME};"`;
    
    exec(createDbCommand, (createError) => {
      if (createError) {
        console.error('❌ 데이터베이스 생성 실패:', createError.message);
        console.error('\n수동으로 데이터베이스를 생성하세요:');
        console.error(`psql -U ${DB_USER} -c "CREATE DATABASE ${DB_NAME};"`);
        process.exit(1);
      }
      console.log('✅ 데이터베이스 생성 완료\n');
      importDump();
    });
  } else {
    console.log('✅ 데이터베이스 존재 확인\n');
    importDump();
  }
});

function importDump() {
  console.log('📥 덤프 파일 가져오기 중...');
  
  // psql 명령어로 덤프 파일 실행
  const importCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${DUMP_FILE}"`;

  exec(importCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ 덤프 가져오기 실패:', error.message);
      console.error('\n해결 방법:');
      console.error('1. PostgreSQL이 설치되어 있는지 확인: which psql');
      console.error('2. psql이 PATH에 있는지 확인');
      console.error('3. PostgreSQL 서비스가 실행 중인지 확인');
      console.error('4. DB 연결 정보가 올바른지 확인 (.env 파일)');
      console.error('5. dump.sql 파일이 손상되지 않았는지 확인');
      process.exit(1);
    }

    if (stderr && !stderr.includes('WARNING') && !stderr.includes('NOTICE')) {
      console.warn('⚠️  경고:', stderr);
    }

    console.log('✅ 덤프 가져오기 완료!\n');
    console.log('다음 단계:');
    console.log('1. 서버 실행: npm start');
    console.log('2. 브랜드 목록 확인: curl http://localhost:3000/api/brands');
  });
}
