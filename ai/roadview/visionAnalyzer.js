/**
 * Gemini Vision API 연동 모듈 (Gemini 3 Pro 기반)
 * 
 * 기능:
 * - Gemini 3 Pro를 사용한 로드뷰 이미지 분석
 * - 구조화된 프롬프트 (XML 태그 기반)
 * - Self-Verification 단계 포함
 * - 신뢰도 점수 산출
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// 상수 정의
const MAX_RETRIES = 3;
const IMAGE_DOWNLOAD_TIMEOUT = 10000; // 10초
const RETRY_DELAYS = [1000, 2000, 3000]; // 재시도 간격 (ms)

/**
 * Gemini 3 Pro 초기화
 */
function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * 이미지 URL을 Base64로 변환 (재시도 로직 포함)
 * @param {string} imageUrl - 이미지 URL
 * @param {number} retries - 남은 재시도 횟수
 * @returns {Promise<{mimeType: string, data: string}>} Base64 이미지 데이터
 */
async function imageUrlToBase64(imageUrl, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: IMAGE_DOWNLOAD_TIMEOUT,
        validateStatus: (status) => status === 200 // 200만 성공으로 처리
      });
      
      const base64 = Buffer.from(response.data).toString('base64');
      const mimeType = response.headers['content-type'] || 'image/jpeg';
      
      return {
        mimeType,
        data: base64
      };
    } catch (error) {
      const isLastAttempt = attempt === retries - 1;
      
      if (isLastAttempt) {
        // 마지막 시도 실패 시 상세 에러 메시지
        if (error.code === 'ECONNABORTED') {
          throw new Error('이미지 다운로드 시간 초과: 네트워크 연결을 확인해주세요.');
        } else if (error.response && error.response.status === 404) {
          throw new Error('해당 위치의 로드뷰 이미지를 찾을 수 없습니다.');
        } else if (error.response && error.response.status === 403) {
          const errorText = error.response.data?.toString() || '';
          if (errorText.includes('not activated')) {
            throw new Error('Street View Static API가 활성화되지 않았습니다. Google Cloud Console에서 "Street View Static API"를 활성화해주세요: https://console.cloud.google.com/apis/library/streetview-static-api.googleapis.com');
          }
          throw new Error('로드뷰 이미지 접근이 거부되었습니다. API 키와 권한을 확인해주세요.');
        } else {
          throw new Error(`이미지 다운로드 실패: ${error.message}`);
        }
      }
      
      // 재시도 전 대기
      const delay = RETRY_DELAYS[attempt] || 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Gemini 3 Pro 최적화 프롬프트 빌더
 * - XML 태그 기반 구조화 (Gemini 선호)
 * - 명시적 섹션 구분
 * - Self-Verification 지시 포함
 */
function buildAnalysisPrompt(context = {}) {
  const { 
    businessType = '카페/음식점',
    analysisDepth = 'standard'  // 'quick' | 'standard' | 'detailed'
  } = context;

  return `
<ROLE>
당신은 15년 경력의 상권 분석 전문가이자 부동산 입지 컨설턴트입니다.
로드뷰 이미지를 분석하여 상업 시설의 가시성과 접근성을 정밀 평가합니다.
분석적이고 객관적인 어조로, 근거 기반의 평가를 제공합니다.
</ROLE>

<TASK>
제공된 로드뷰 이미지를 분석하여 ${businessType} 운영에 영향을 미치는 
4가지 핵심 입지 요소를 평가하세요.
</TASK>

<EVALUATION_CRITERIA>
아래 4가지 항목을 각각 평가합니다:

1. **간판 가림 (signage_obstruction)**
   - 평가 대상: 간판/외관이 주변 건물, 가로수, 구조물에 의해 가려지는 정도
   - low: 간판이 거의 가려지지 않음 (80% 이상 노출)
   - medium: 일부 가려짐 (50-80% 노출)
   - high: 심각하게 가려짐 (50% 미만 노출)
   - 판단 근거: 가로수 위치, 인접 건물 돌출 정도, 현수막/배너 등

2. **급경사 (steep_slope)**
   - 평가 대상: 해당 위치 주변의 지형 경사도
   - low: 평지 또는 완만한 경사 (체감 경사 5° 미만)
   - medium: 눈에 띄는 경사 (체감 경사 5-15°)
   - high: 급경사 (체감 경사 15° 초과, 계단 필요 수준)
   - 판단 근거: 도로 기울기, 인접 건물 높이 차, 배수로/계단 존재

3. **층위 (floor_level)**
   - 평가 대상: 분석 대상 건물/공간의 위치 층수
   - ground: 1층 지면 레벨 (도로와 동일 높이)
   - half_basement: 반지하 또는 반층 아래
   - second_floor: 2층 이상
   - 판단 근거: 출입구 위치, 창문 높이, 계단 유무

4. **보행 가시성 (visibility)**
   - 평가 대상: 보행자가 자연스럽게 해당 시설을 인지할 수 있는 정도
   - low: 발견하기 어려움 (골목 안쪽, 시야 차단)
   - medium: 주의를 기울이면 발견 가능
   - high: 자연스럽게 시야에 들어옴 (주 동선 위치)
   - 판단 근거: 인도 위치, 시야각, 유동 인구 동선 예상
</EVALUATION_CRITERIA>

<OUTPUT_FORMAT>
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "analysis_result": {
    "signage_obstruction": {
      "level": "low|medium|high",
      "confidence": 0.0-1.0,
      "description": "판단 근거 (2-3문장)",
      "visual_evidence": ["발견한 시각적 증거 1", "증거 2"]
    },
    "steep_slope": {
      "level": "low|medium|high",
      "confidence": 0.0-1.0,
      "description": "판단 근거 (2-3문장)",
      "visual_evidence": ["발견한 시각적 증거 1", "증거 2"]
    },
    "floor_level": {
      "level": "ground|half_basement|second_floor",
      "confidence": 0.0-1.0,
      "description": "판단 근거 (2-3문장)",
      "visual_evidence": ["발견한 시각적 증거 1", "증거 2"]
    },
    "visibility": {
      "level": "low|medium|high",
      "confidence": 0.0-1.0,
      "description": "판단 근거 (2-3문장)",
      "visual_evidence": ["발견한 시각적 증거 1", "증거 2"]
    }
  },
  "overall_assessment": {
    "location_score": 0-100,
    "strengths": ["강점 1", "강점 2"],
    "weaknesses": ["약점 1", "약점 2"],
    "recommendation": "종합 의견 (1-2문장)"
  },
  "image_quality": {
    "analyzable": true|false,
    "issues": ["이미지 품질 문제가 있다면 기술"]
  }
}
</OUTPUT_FORMAT>

<ANALYSIS_INSTRUCTIONS>
1. 이미지를 체계적으로 스캔하세요: 전경 → 중경 → 배경 순서로
2. 각 평가 항목에 대해 시각적 증거를 먼저 찾으세요
3. 증거가 불충분하면 confidence를 낮게 설정하세요 (0.5 미만)
4. 추측보다는 관찰 가능한 사실에 기반하세요
5. 이미지가 흐리거나 분석 불가능하면 image_quality.analyzable을 false로 설정
</ANALYSIS_INSTRUCTIONS>

<SELF_VERIFICATION>
응답 전 다음을 검증하세요:
- [ ] 모든 4개 항목이 평가되었는가?
- [ ] 각 level 값이 지정된 옵션 중 하나인가?
- [ ] confidence가 0.0-1.0 범위인가?
- [ ] visual_evidence가 실제 이미지에서 관찰 가능한 내용인가?
- [ ] JSON 형식이 올바른가?
</SELF_VERIFICATION>
`.trim();
}

/**
 * Gemini 3 Pro 기반 로드뷰 이미지 분석기
 * @param {string|Object} imageInput - 이미지 URL 또는 Base64 이미지 객체
 * @param {Object} additionalContext - 추가 컨텍스트
 * @returns {Promise<Object>} 분석 결과
 */
async function analyzeImageWithGemini(imageInput, additionalContext = {}) {
  const genAI = initializeGemini();
  
  // 이미지 입력 처리
  let imageData;
  if (typeof imageInput === 'string') {
    // URL인 경우 Base64로 변환
    const converted = await imageUrlToBase64(imageInput);
    imageData = {
      mimeType: converted.mimeType,
      base64Data: converted.data
    };
  } else {
    // 이미 Base64 객체인 경우
    imageData = {
      mimeType: imageInput.mimeType || 'image/jpeg',
      base64Data: imageInput.data || imageInput.base64Data
    };
  }

  // Gemini 3 Pro 모델 초기화
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-pro-preview',
    generationConfig: {
      temperature: 0.3,  // 일관성 있는 분석을 위해 낮은 온도
      topP: 0.8,
      maxOutputTokens: 4096,  // 더 긴 응답을 위해 증가
    }
  });

  // 프롬프트 구성
  const systemPrompt = buildAnalysisPrompt(additionalContext);
  
  try {
    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64Data
        }
      }
    ]);

    const response = result.response.text();
    return parseAnalysisResult(response);
  } catch (error) {
    // Gemini API 에러 처리
    if (error.message && error.message.includes('quota')) {
      throw new Error('Gemini API 일일 사용 한도를 초과했습니다. 내일 다시 시도해주세요.');
    } else if (error.message && error.message.includes('safety')) {
      throw new Error('이미지가 안전 필터에 의해 차단되었습니다.');
    } else if (error.message && error.message.includes('not found')) {
      // 모델을 찾을 수 없는 경우 대체 모델 시도
      throw new Error(`Gemini 모델을 찾을 수 없습니다: ${error.message}`);
    } else {
      throw new Error(`Gemini API 호출 실패: ${error.message}`);
    }
  }
}

/**
 * 분석 결과 파서
 * @param {string} responseText - Gemini API 응답 텍스트
 * @returns {Object} 파싱된 결과
 */
function parseAnalysisResult(responseText) {
  try {
    // JSON 블록 추출 (마크다운 코드블록 처리)
    let cleaned = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    // 여러 JSON 객체가 있을 수 있으므로 가장 큰 것을 찾음
    const jsonMatches = cleaned.match(/\{[\s\S]*\}/g);
    if (!jsonMatches || jsonMatches.length === 0) {
      throw new Error('JSON 응답을 찾을 수 없습니다');
    }
    
    // 가장 긴 JSON 객체를 선택 (보통 전체 응답)
    const jsonText = jsonMatches.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
    
    // JSON 파싱 시도
    let result;
    try {
      result = JSON.parse(jsonText);
    } catch (parseError) {
      // JSON 파싱 실패 시 정리 시도
      let sanitized = jsonText
        .replace(/\/\*[\s\S]*?\*\//g, '')  // 블록 주석
        .replace(/\/\/.*$/gm, '')           // 라인 주석
        .replace(/,(\s*[}\]])/g, '$1')      // 후행 쉼표
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 제어 문자 제거
        .trim();
      
      try {
        result = JSON.parse(sanitized);
      } catch (secondError) {
        // 두 번째 시도도 실패하면 에러 위치 정보와 함께 던짐
        const errorPos = parseError.message.match(/position (\d+)/);
        if (errorPos) {
          const pos = parseInt(errorPos[1]);
          const start = Math.max(0, pos - 50);
          const end = Math.min(sanitized.length, pos + 50);
          throw new Error(`JSON 파싱 실패 (위치 ${pos}): ${parseError.message}\n주변 텍스트: ${sanitized.substring(start, end)}`);
        }
        throw parseError;
      }
    }
    
    // 결과 유효성 검증
    validateAnalysisResult(result);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    // 에러 발생 시 전체 응답 저장 (디버깅용)
    return {
      success: false,
      error: error.message,
      rawResponse: responseText // 전체 응답 저장
    };
  }
}

/**
 * 결과 유효성 검증 (불완전한 JSON도 처리)
 * @param {Object} result - 파싱된 결과
 */
function validateAnalysisResult(result) {
  const validLevels = {
    signage_obstruction: ['low', 'medium', 'high'],
    steep_slope: ['low', 'medium', 'high'],
    floor_level: ['ground', 'half_basement', 'second_floor'],
    visibility: ['low', 'medium', 'high']
  };

  if (!result.analysis_result) {
    throw new Error('analysis_result 필드가 없습니다.');
  }

  // 필수 필드 확인 및 기본값 설정
  for (const field of Object.keys(validLevels)) {
    const item = result.analysis_result[field];
    if (!item) {
      // 필드가 없으면 기본값 생성
      result.analysis_result[field] = {
        level: field === 'floor_level' ? 'ground' : 'medium',
        confidence: 0.5,
        description: `${field} 정보를 확인할 수 없음`,
        visual_evidence: []
      };
      continue;
    }
    
    // level 검증
    if (!validLevels[field].includes(item.level)) {
      item.level = field === 'floor_level' ? 'ground' : 'medium'; // 기본값으로 수정
    }
    
    // confidence 검증
    if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 1) {
      item.confidence = 0.5; // 기본값으로 수정
    }
    
    // description이 없으면 기본값
    if (!item.description) {
      item.description = `${field} 분석 결과`;
    }
    
    // visual_evidence가 없으면 빈 배열
    if (!Array.isArray(item.visual_evidence)) {
      item.visual_evidence = [];
    }
  }
  
  // overall_assessment가 없으면 기본값 생성
  if (!result.overall_assessment) {
    result.overall_assessment = {
      location_score: 50,
      strengths: [],
      weaknesses: [],
      recommendation: '분석 완료'
    };
  }
  
  // image_quality가 없으면 기본값 생성
  if (!result.image_quality) {
    result.image_quality = {
      analyzable: true,
      issues: []
    };
  }
}

module.exports = {
  analyzeImageWithGemini,
  imageUrlToBase64,
  buildAnalysisPrompt
};
