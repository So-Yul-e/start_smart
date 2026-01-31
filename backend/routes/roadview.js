/**
 * 거리뷰 분석 API 라우트
 * 
 * POST /api/roadview/analyze - 프론트엔드에서 업로드한 이미지를 Gemini로 분석
 * 
 * Request (multipart/form-data):
 * - roadview: 이미지 파일 (선택)
 * - roadmap: 이미지 파일 (선택)
 * - address: 주소 문자열
 * - lat: 위도
 * - lng: 경도
 * - metadata: JSON 문자열 (경쟁 분석 메타데이터)
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const { analyzeImageWithGemini } = require('../../ai/roadview/visionAnalyzer');

// Multer 설정 (메모리 스토리지 사용)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
    files: 2 // 최대 2개 파일 (roadview, roadmap)
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

/**
 * 거리뷰 이미지 분석
 * POST /api/roadview/analyze
 */
router.post('/analyze', upload.fields([
  { name: 'roadview', maxCount: 1 },
  { name: 'roadmap', maxCount: 1 }
]), async (req, res, next) => {
  try {
    const { address, lat, lng, metadata } = req.body;
    const files = req.files;

    // 필수 파라미터 검증
    if (!address || !lat || !lng) {
      return res.status(400).json({
        success: false,
        error: '필수 파라미터가 누락되었습니다. (address, lat, lng)'
      });
    }

    // 최소 1개 이미지는 필요
    if (!files || (!files.roadview && !files.roadmap)) {
      return res.status(400).json({
        success: false,
        error: '최소 1개 이상의 이미지가 필요합니다. (roadview 또는 roadmap)'
      });
    }

    console.log(`[Roadview API] 분석 요청: ${address} (${lat}, ${lng})`);
    console.log(`[Roadview API] 업로드된 파일: roadview=${!!files.roadview}, roadmap=${!!files.roadmap}`);

    // 메타데이터 파싱
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        console.warn('[Roadview API] 메타데이터 파싱 실패:', e.message);
      }
    }

    // 이미지를 Base64로 변환하여 Gemini에 전송
    const analysisResults = {};

    // 거리뷰 이미지 분석
    if (files.roadview && files.roadview[0]) {
      const roadviewFile = files.roadview[0];
      const roadviewBase64 = roadviewFile.buffer.toString('base64');
      
      console.log('[Roadview API] 거리뷰 이미지 분석 시작...');
      
      try {
        const roadviewResult = await analyzeImageWithGemini(
          {
            mimeType: roadviewFile.mimetype || 'image/jpeg',
            base64Data: roadviewBase64
          },
          {
            businessType: '카페/음식점',
            analysisDepth: 'standard',
            imageType: 'roadview',
            address: address,
            metadata: parsedMetadata
          }
        );

        if (roadviewResult.success) {
          analysisResults.roadview = roadviewResult;
          console.log('[Roadview API] 거리뷰 분석 완료');
        } else {
          console.error('[Roadview API] 거리뷰 분석 실패:', roadviewResult.error);
          analysisResults.roadview = {
            success: false,
            error: roadviewResult.error
          };
        }
      } catch (error) {
        console.error('[Roadview API] 거리뷰 분석 오류:', error);
        analysisResults.roadview = {
          success: false,
          error: error.message || '거리뷰 분석 중 오류가 발생했습니다.'
        };
      }
    }

    // 로드맵 이미지 분석
    if (files.roadmap && files.roadmap[0]) {
      const roadmapFile = files.roadmap[0];
      const roadmapBase64 = roadmapFile.buffer.toString('base64');
      
      console.log('[Roadview API] 로드맵 이미지 분석 시작...');
      
      try {
        const roadmapResult = await analyzeImageWithGemini(
          {
            mimeType: roadmapFile.mimetype || 'image/jpeg',
            base64Data: roadmapBase64
          },
          {
            businessType: '카페/음식점',
            analysisDepth: 'standard',
            imageType: 'roadmap',
            address: address,
            metadata: parsedMetadata
          }
        );

        if (roadmapResult.success) {
          analysisResults.roadmap = roadmapResult;
          console.log('[Roadview API] 로드맵 분석 완료');
        } else {
          console.error('[Roadview API] 로드맵 분석 실패:', roadmapResult.error);
          analysisResults.roadmap = {
            success: false,
            error: roadmapResult.error
          };
        }
      } catch (error) {
        console.error('[Roadview API] 로드맵 분석 오류:', error);
        analysisResults.roadmap = {
          success: false,
          error: error.message || '로드맵 분석 중 오류가 발생했습니다.'
        };
      }
    }

    // 결과 반환
    const hasSuccess = Object.values(analysisResults).some(r => r.success);
    
    if (!hasSuccess) {
      return res.status(500).json({
        success: false,
        error: '모든 이미지 분석이 실패했습니다.',
        results: analysisResults
      });
    }

    res.json({
      success: true,
      location: {
        address: address,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      metadata: parsedMetadata,
      results: analysisResults
    });

  } catch (error) {
    console.error('[Roadview API] 분석 오류:', error);
    next(error);
  }
});

module.exports = router;
