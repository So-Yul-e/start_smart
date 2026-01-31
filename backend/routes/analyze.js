/**
 * POST /api/analyze - 분석 실행
 * FormData: roadview(file), roadmap(file), data(JSON string)
 * 하위 호환: JSON body만 보내도 동작
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config: 5MB limit, images only
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, file.fieldname + '_' + timestamp + ext);
  }
});

const fileFilter = function (req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

const uploadFields = upload.fields([
  { name: 'roadview', maxCount: 1 },
  { name: 'roadmap', maxCount: 1 }
]);

router.post('/', function (req, res) {
  uploadFields(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: '파일 업로드 오류: ' + err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Parse analysis data from FormData 'data' field or JSON body
    var analysisData = null;
    if (req.body.data) {
      try {
        analysisData = JSON.parse(req.body.data);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'data 필드 JSON 파싱 오류' });
      }
    } else if (req.body.brandId) {
      // Direct JSON body (backward compatible)
      analysisData = req.body;
    }

    var analysisId = 'analysis_' + Date.now();

    // Log received files
    var files = req.files || {};
    var roadviewFile = files.roadview ? files.roadview[0] : null;
    var roadmapFile = files.roadmap ? files.roadmap[0] : null;

    console.log('[analyze] id:', analysisId);
    console.log('[analyze] data:', analysisData ? 'OK' : 'none');
    console.log('[analyze] roadview:', roadviewFile ? roadviewFile.filename : 'none');
    console.log('[analyze] roadmap:', roadmapFile ? roadmapFile.filename : 'none');

    res.status(202).json({
      success: true,
      analysisId: analysisId,
      message: '분석을 시작합니다.',
      images: {
        roadview: roadviewFile ? roadviewFile.filename : null,
        roadmap: roadmapFile ? roadmapFile.filename : null
      }
    });
  });
});

module.exports = router;
