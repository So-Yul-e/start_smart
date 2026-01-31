/**
 * StartSmart 백엔드 서버
 * 
 * Express 기반 REST API 서버
 * - 경쟁 밀도 분석 API
 * - 기존 분석 API (브랜드, 상권 분석 등)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (프론트엔드)
app.use(express.static(path.join(__dirname, '../frontend')));

// API 라우트
app.use('/api/competition', require('./routes/competition'));
app.use('/api/roadview', require('./routes/roadview'));
// 기존 라우트들 (향후 추가)
// app.use('/api/brands', require('./routes/brands'));
// app.use('/api/analyze', require('./routes/analyze'));

// 루트 경로
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '서버 내부 오류가 발생했습니다.'
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 리소스를 찾을 수 없습니다.'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 StartSmart 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  console.log(`📊 경쟁 밀도 분석 API: POST /api/competition/analyze`);
  console.log(`🖼️  거리뷰 이미지 분석 API: POST /api/roadview/analyze`);
});

module.exports = app;
