/** 
 * Jest 설정 파일
 * Node.js 환경에서 CommonJS 모듈 테스트
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'engine/**/*.js',
    '!engine/**/*.test.js',
    '!engine/fixtures/**/*.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
