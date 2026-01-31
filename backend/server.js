/**
 * StartSmart - Express 서버 진입점
 * 온보딩 세팅 후 서버 실행: node backend/server.js
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API 라우트
app.use('/api/brands', require('./routes/brands'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/result', require('./routes/result'));
app.use('/api/report', require('./routes/report'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`StartSmart 서버 실행: http://localhost:${PORT}`);
});
