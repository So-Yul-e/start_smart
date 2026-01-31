/**
 * 프론트엔드 설정 API
 * GET /api/config/google-maps-key
 * 
 * 프론트엔드에서 사용할 구글 지도 API 키를 제공합니다.
 * 보안: API 키 제한 설정 (HTTP referrer 제한)을 권장합니다.
 */

const router = require('express').Router();

router.get('/google-maps-key', (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'Google Maps API key is not configured'
    });
  }

  res.json({
    success: true,
    apiKey: apiKey
  });
});

module.exports = router;
