/**
 * StartSmart - Express 서버
 * 역할 5: 백엔드 + 통합
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// 라우트 연결
app.use('/api/brands', require('./routes/brands'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/result', require('./routes/result'));
app.use('/api/report', require('./routes/report'));

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
