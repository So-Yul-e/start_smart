/**
 * 데이터베이스 덤프 내보내기 스크립트
 * 현재 DB의 모든 데이터를 SQL 파일로 내보냅니다.
 * 
 * 사용법:
 * node backend/db/export-db.js
 * 
 * 출력: backend/db/dump.sql
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

const OUTPUT_FILE = path.join(__dirname, 'dump.sql');

console.log('📦 데이터베이스 덤프 내보내기 시작...\n');
console.log(`데이터베이스: ${DB_NAME}`);
console.log(`호스트: ${DB_HOST}:${DB_PORT}`);
console.log(`출력 파일: ${OUTPUT_FILE}\n`);

// pg_dump 명령어 실행
// --no-owner --no-acl: 소유자 및 권한 정보 제외
// --no-privileges: 권한 정보 제외
// SQL Editor용으로 psql 특수 명령어 제거
const pgDumpCommand = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --clean --if-exists --no-owner --no-acl --no-privileges > "${OUTPUT_FILE}"`;

exec(pgDumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ 덤프 생성 실패:', error.message);
    console.error('\n해결 방법:');
    console.error('1. PostgreSQL이 설치되어 있는지 확인: which pg_dump');
    console.error('2. pg_dump가 PATH에 있는지 확인');
    console.error('3. PostgreSQL 서비스가 실행 중인지 확인');
    console.error('4. DB 연결 정보가 올바른지 확인 (.env 파일)');
    process.exit(1);
  }

  if (stderr && !stderr.includes('WARNING')) {
    console.warn('⚠️  경고:', stderr);
  }

  // 파일 크기 확인
  if (fs.existsSync(OUTPUT_FILE)) {
    const stats = fs.statSync(OUTPUT_FILE);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ 덤프 파일 생성 완료!`);
    console.log(`📁 파일 크기: ${fileSizeKB} KB`);
    console.log(`📄 파일 위치: ${OUTPUT_FILE}\n`);
    console.log('다음 단계:');
    console.log('1. dump.sql 파일을 다른 노트북으로 복사');
    console.log('2. 다른 노트북에서: node backend/db/import-db.js');
  } else {
    console.error('❌ 덤프 파일이 생성되지 않았습니다.');
    process.exit(1);
  }
});
