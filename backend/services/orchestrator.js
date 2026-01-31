/**
 * AI 파이프라인 오케스트레이터
 * 역할 5: 백엔드 + 통합
 * 
 * 전체 분석 파이프라인을 관리합니다.
 */

const { analyzeMarket } = require('../market');
const { getBrandById } = require('../routes/brands');
// Engine 모듈 (병합 완료)
const { calculateFinance } = require('../../engine/finance');
const { calculate: calculateDecision } = require('../../engine/decision');
// Engine 브랜드 로더 (defaults 포함, 이름 기반 매핑)
const { getBrandForEngine, getBrandForEngineByName } = require('../../engine/data_local/brandLoader');
// AI 모듈
const { generateConsulting } = require('../../ai/consulting');

/**
 * 분석 실행 함수
 * @param {Object} analysisRequest - 분석 요청 데이터
 * @param {Function} updateAnalysis - 분석 결과 업데이트 함수 (DB 저장)
 */
async function runAnalysis(analysisRequest, updateAnalysis) {
  console.log('[runAnalysis] 함수 호출됨!', {
    hasRequest: !!analysisRequest,
    hasUpdateAnalysis: typeof updateAnalysis === 'function',
    requestKeys: analysisRequest ? Object.keys(analysisRequest) : []
  });
  
  const { analysisId, brandId, location, radius, conditions, targetDailySales } = analysisRequest;
  const startTime = Date.now();

  console.log(`[${analysisId}] 🚀 분석 시작 준비...`, {
    analysisId,
    brandId,
    hasLocation: !!location,
    hasConditions: !!conditions,
    targetDailySales
  });

  try {
    // 분석 상태를 processing으로 변경
    console.log(`[${analysisId}] 📝 상태를 processing으로 변경 중...`);
    try {
      const updateResult = await updateAnalysis(analysisId, { status: 'processing' });
      console.log(`[${analysisId}] ✅ 상태 변경 완료:`, updateResult ? '성공' : '실패');
    } catch (updateError) {
      console.error(`[${analysisId}] ❌ 상태 변경 실패:`, updateError);
      throw updateError;
    }

    console.log(`[${analysisId}] 🚀 분석 시작...`);

    // 브랜드 정보 가져오기 (이름 기반 매핑)
    // 1차: DB에서 브랜드 정보 조회
    const dbBrand = await getBrandById(brandId);
    if (!dbBrand) {
      throw new Error(`브랜드를 찾을 수 없습니다: ${brandId}`);
    }

    // 2차: 브랜드 이름으로 engine의 brandLoader에서 찾기 (defaults 포함)
    let brand = await getBrandForEngineByName(dbBrand.name);
    
    // 3차: engine에 없으면 DB brand를 engine 형식으로 변환 (기본값 사용)
    if (!brand) {
      console.warn(`⚠️  engine에 ${dbBrand.name} 브랜드 데이터가 없어 기본값을 사용합니다.`);
      brand = {
        id: dbBrand.id,
        name: dbBrand.name,
        position: dbBrand.position,
        initialInvestment: dbBrand.initialInvestment,
        monthlyRoyalty: dbBrand.monthlyRoyalty,
        monthlyMarketing: dbBrand.monthlyMarketing,
        avgDailySales: dbBrand.avgDailySales,
        // engine이 요구하는 defaults 추가 (기본값)
        defaults: {
          avgPrice: 4000, // 평균 단가 (원/잔)
          cogsRate: 0.35, // 원가율 (35%)
          laborRate: 0.20, // 인건비율 (20%)
          utilitiesRate: 0.03, // 공과금 비율 (3%)
          etcFixed: 1000000, // 기타 고정비 (원)
          royaltyRate: dbBrand.monthlyRoyalty / 100 || 0.05, // 로열티율
          marketingRate: dbBrand.monthlyMarketing / 100 || 0.02, // 마케팅비율
          ownerWorkingMultiplier: 0.6, // 점주 근무 시 인건비 감산 계수
          expectedDailySales: dbBrand.avgDailySales || null
        }
      };
    } else {
      // engine에서 찾은 경우, DB의 추가 정보도 병합
      brand = {
        ...brand,
        id: dbBrand.id, // DB의 ID 사용
        position: dbBrand.position || brand.position,
        initialInvestment: dbBrand.initialInvestment,
        monthlyRoyalty: dbBrand.monthlyRoyalty,
        monthlyMarketing: dbBrand.monthlyMarketing,
        avgDailySales: dbBrand.avgDailySales
      };
    }

    // 1. 상권 분석
    const step1Start = Date.now();
    console.log(`[${analysisId}] 📊 1/5 상권 분석 시작...`);
    let market;
    try {
      market = await analyzeMarket(location, radius, brandId);
      const step1Time = ((Date.now() - step1Start) / 1000).toFixed(2);
      console.log(`[${analysisId}] ✅ 상권 분석 완료 (${step1Time}초)`);
    } catch (error) {
      const step1Time = ((Date.now() - step1Start) / 1000).toFixed(2);
      console.error(`[${analysisId}] ❌ 상권 분석 실패 (${step1Time}초):`, error);
      throw new Error(`상권 분석 실패: ${error.message}`);
    }

    // 2. 손익 계산
    const step2Start = Date.now();
    console.log(`[${analysisId}] 💰 2/5 손익 계산 시작...`);
    let finance;
    try {
      finance = calculateFinance({
        brand,
        conditions,
        market, // 상권 분석 결과 전달
        targetDailySales
      });
      const step2Time = ((Date.now() - step2Start) / 1000).toFixed(2);
      console.log(`[${analysisId}] ✅ 손익 계산 완료 (${step2Time}초)`);
    } catch (error) {
      const step2Time = ((Date.now() - step2Start) / 1000).toFixed(2);
      console.error(`[${analysisId}] ❌ 손익 계산 실패 (${step2Time}초):`, error);
      throw new Error(`손익 계산 실패: ${error.message}`);
    }

    // 3. 로드뷰 분석
    // 참고: 카카오 로드뷰는 서버 사이드에서 직접 호출 불가 (JavaScript API만 제공)
    // 따라서 Google Street View Static API를 사용하여 로드뷰 이미지 URL을 가져온 후,
    // ai/roadview 모듈에 전달하여 Gemini Vision API로 분석합니다.
    // 프론트엔드에서는 카카오 로드뷰 JavaScript API로 사용자에게 로드뷰를 표시할 수 있습니다.
    const step3Start = Date.now();
    console.log(`[${analysisId}] 🗺️ 3/5 로드뷰 분석 시작...`);
    let roadview;
    try {
      // Google Street View API로 로드뷰 이미지 URL 가져오기
      const { getRoadviewImageUrl } = require('../market/roadviewApi');
      const roadviewInfo = await getRoadviewImageUrl(location);
      
      // AI 로드뷰 분석 모듈 호출
      // ai/roadview 모듈은 이미지 URL을 받아서 다운로드하고 Gemini Vision API로 분석합니다.
      try {
        const { analyzeRoadview } = require('../../ai/roadview');
        roadview = await analyzeRoadview({
          location,
          imageUrl: roadviewInfo.imageUrl, // Google Street View 이미지 URL
          source: roadviewInfo.source // 'google' | 'naver' | 'kakao'
        });
        const step3Time = ((Date.now() - step3Start) / 1000).toFixed(2);
        console.log(`[${analysisId}] ✅ 로드뷰 분석 완료 (${step3Time}초, 소스: ${roadviewInfo.source})`);
      } catch (roadviewError) {
        // ai/roadview 모듈이 아직 구현되지 않았거나 오류 발생 시 기본값 사용
        const step3Time = ((Date.now() - step3Start) / 1000).toFixed(2);
        console.warn(`[${analysisId}] ⚠️  ai/roadview 모듈 호출 실패 (${step3Time}초): ${roadviewError.message}`);
        console.warn(`[${analysisId}] ⚠️  기본값으로 대체합니다.`);
        roadview = {
          location: { lat: location.lat, lng: location.lng },
          risks: [],
          overallRisk: 'medium',
          riskScore: 65,
          roadviewUrl: roadviewInfo.imageUrl, // 로드뷰 이미지 URL (프론트엔드에서 사용 가능)
          source: roadviewInfo.source
        };
      }
    } catch (error) {
      const step3Time = ((Date.now() - step3Start) / 1000).toFixed(2);
      console.error(`[${analysisId}] ❌ 로드뷰 이미지 URL 가져오기 실패 (${step3Time}초):`, error);
      // 로드뷰 분석 실패 시에도 기본값으로 계속 진행
      roadview = {
        location: { lat: location.lat, lng: location.lng },
        risks: [],
        overallRisk: 'medium',
        riskScore: 65
      };
      console.warn(`[${analysisId}] ⚠️  로드뷰 분석 실패, 기본값으로 대체합니다.`);
    }

    // 4. AI 컨설팅
    const step4Start = Date.now();
    console.log(`[${analysisId}] 🤖 4/5 AI 컨설팅 생성 시작...`);
    let aiConsulting;
    try {
      // AI 컨설팅에 타임아웃 설정 (30초)
      const consultingPromise = generateConsulting({
        brand, location, conditions, targetDailySales,
        finance, market, roadview
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI 컨설팅 타임아웃 (30초)')), 30000);
      });
      
      aiConsulting = await Promise.race([consultingPromise, timeoutPromise]);
      const step4Time = ((Date.now() - step4Start) / 1000).toFixed(2);
      console.log(`[${analysisId}] ✅ AI 컨설팅 생성 완료 (${step4Time}초)`);
    } catch (error) {
      const step4Time = ((Date.now() - step4Start) / 1000).toFixed(2);
      console.error(`[${analysisId}] ❌ AI 컨설팅 생성 실패 (${step4Time}초):`, error);
      // AI 컨설팅 실패 시 기본값 사용 (전체 분석 실패로 이어지지 않도록)
      aiConsulting = {
        salesScenario: { conservative: 200, expected: 250, optimistic: 300 },
        salesScenarioReason: 'AI 컨설팅 생성 중 오류가 발생하여 기본값을 사용합니다.',
        topRisks: [],
        improvements: [],
        competitiveAnalysis: { intensity: 'medium', differentiation: 'possible', priceStrategy: 'standard' }
      };
      console.warn(`[${analysisId}] ⚠️  AI 컨설팅 기본값 사용`);
    }

    // 5. 판단 계산
    const step5Start = Date.now();
    console.log(`[${analysisId}] ⚖️ 5/5 판단 계산 시작...`);
    let decision;
    try {
      decision = calculateDecision({
        finance,
        market,
        roadview,
        conditions, // 개선 시뮬레이션용
        brand,      // 개선 시뮬레이션용
        targetDailySales // 개선 시뮬레이션용
      });
      const step5Time = ((Date.now() - step5Start) / 1000).toFixed(2);
      console.log(`[${analysisId}] ✅ 판단 계산 완료 (${step5Time}초)`);
    } catch (error) {
      const step5Time = ((Date.now() - step5Start) / 1000).toFixed(2);
      console.error(`[${analysisId}] ❌ 판단 계산 실패 (${step5Time}초):`, error);
      throw new Error(`판단 계산 실패: ${error.message}`);
    }

    // 최종 결과 조합
    const finalResult = {
      id: analysisId,
      status: 'completed',
      brand: {
        id: brand.id,
        name: brand.name,
        position: brand.position,
        initialInvestment: brand.initialInvestment,
        monthlyRoyalty: brand.monthlyRoyalty,
        monthlyMarketing: brand.monthlyMarketing,
        avgDailySales: brand.avgDailySales
      },
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address || ''
      },
      finance,
      decision,
      aiConsulting,
      roadview,
      market,
      createdAt: new Date().toISOString()
    };

    // 결과 저장 (DB)
    await updateAnalysis(analysisId, {
      status: 'completed',
      result: finalResult
    });

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${analysisId}] 🎉 분석 완료! (총 ${totalTime}초 소요)`);
    return finalResult;
  } catch (error) {
    console.error(`[${analysisId}] ❌ 분석 실패:`, error);
    
    // 실패 상태 저장 (DB)
    await updateAnalysis(analysisId, {
      status: 'failed',
      errorMessage: error.message
    });
    
    throw error;
  }
}

module.exports = {
  runAnalysis
};
