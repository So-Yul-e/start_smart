/**
 * StartSmart - Express 서버
 * 역할 5: 백엔드 + 통합
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
  }
}));

// 라우트 연결
app.use('/api/brands', require('./routes/brands'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/result', require('./routes/result'));
app.use('/api/report', require('./routes/report'));
app.use('/api/config', require('./routes/config'));
// app.use('/api/competition', require('./routes/competition')); // 파일이 없어서 주석 처리
app.use('/api/roadview', require('./routes/roadview'));
app.use('/api/consulting', require('./routes/consulting'));

// 루트 경로
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 리소스를 찾을 수 없습니다.'
  });
});

// 서버 시작 (로컬 개발 환경에서만)
// Vercel에서는 서버리스 함수로 실행되므로 app.listen()을 호출하지 않음
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  const PORT = process.env.PORT || 3000;
  // HOST 설정:
  // - localhost/127.0.0.1: 로컬에서만 접근 (기본값, 로컬 개발 환경)
  // - 0.0.0.0: 모든 네트워크 인터페이스에서 접근 가능 (다른 기기에서 접근 필요 시)
  // - 특정 IP: 해당 IP로만 바인딩 (HOST 환경변수로 설정 가능)
  // 
  // 기본값은 localhost로 설정하여 각자가 푸시 받아서 바로 사용할 수 있도록 함
  let HOST = process.env.HOST || 'localhost';
  
  // HOST가 IP 주소로 설정된 경우 경고 (로컬 개발 환경에서는 불필요)
  if (HOST !== 'localhost' && HOST !== '127.0.0.1' && HOST !== '0.0.0.0') {
    const ipPattern = /^\d+\.\d+\.\d+\.\d+$/;
    if (ipPattern.test(HOST)) {
      console.warn(`⚠️  HOST 환경 변수에 IP 주소(${HOST})가 설정되어 있습니다.`);
      console.warn(`💡 로컬 개발 환경에서는 HOST 환경변수를 제거하거나 HOST=localhost로 설정하세요.`);
      console.warn(`💡 다른 기기에서 접근하려면 HOST=0.0.0.0을 사용하세요.`);
    }
  }

  app.listen(PORT, HOST, (err) => {
    if (err) {
      console.error(`❌ 서버 시작 실패: ${err.message}`);
      if (err.code === 'EADDRNOTAVAIL') {
        console.error(`❌ IP 주소 ${HOST}를 사용할 수 없습니다.`);
        console.error(`💡 해결 방법:`);
        console.error(`   1. .env 파일에서 HOST 환경 변수를 제거하거나`);
        console.error(`   2. HOST=localhost 또는 HOST=0.0.0.0으로 설정하세요.`);
      }
      process.exit(1);
    }
    
    const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`🚀 Server running on http://${displayHost}:${PORT}`);
    console.log(`📊 Health check: http://${displayHost}:${PORT}/health`);
    // console.log(`📊 경쟁 밀도 분석 API: POST /api/competition/analyze`); // competition 라우트 비활성화
    console.log(`🖼️  거리뷰 이미지 분석 API: POST /api/roadview/analyze`);
    console.log(`💬 리포트 Q&A API: POST /api/consulting/chat`);
    
    if (HOST === '0.0.0.0') {
      console.log(`⚠️  보안 경고: 모든 네트워크 인터페이스에서 접근 가능합니다.`);
      console.log(`🌐 다른 기기에서 접근: http://<로컬IP>:${PORT}`);
    } else if (HOST !== 'localhost' && HOST !== '127.0.0.1') {
      console.log(`🌐 다른 기기에서 접근: http://${HOST}:${PORT}`);
    } else {
      console.log(`🔒 로컬에서만 접근 가능 (다른 기기 접근 불가)`);
    }
  });
} else {
  console.log('🌐 Vercel 서버리스 환경에서 실행 중');
}

module.exports = app;
