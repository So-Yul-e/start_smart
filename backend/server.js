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
// HOST 설정:
// - 특정 IP (예: <로컬IP>): 해당 IP로만 바인딩 (보안상 안전, 권장)
// - 0.0.0.0: 모든 네트워크 인터페이스에서 접근 가능 (보안상 취약, 개발 환경에서만)
// - localhost/127.0.0.1: 로컬에서만 접근 (가장 안전, 다른 기기 접근 불가)
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`🚀 Server running on http://${displayHost}:${PORT}`);
  console.log(`📊 Health check: http://${displayHost}:${PORT}/health`);
  
  if (HOST === '0.0.0.0') {
    console.log(`⚠️  보안 경고: 모든 네트워크 인터페이스에서 접근 가능합니다.`);
    console.log(`🌐 다른 기기에서 접근: http://<로컬IP>:${PORT}`);
  } else if (HOST !== 'localhost' && HOST !== '127.0.0.1') {
    console.log(`🌐 다른 기기에서 접근: http://${HOST}:${PORT}`);
  } else {
    console.log(`🔒 로컬에서만 접근 가능 (다른 기기 접근 불가)`);
  }
});

module.exports = app;
