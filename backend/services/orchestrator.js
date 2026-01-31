/**
 * AI 파이프라인 오케스트레이터
 * 역할 5: 백엔드 + 통합
 * 
 * 전체 분석 파이프라인을 관리합니다.
 */

const { analyzeMarket } = require('../market');
const { getBrandById } = require('../routes/brands');
// TODO: 다른 모듈들이 구현되면 주석 해제
// const { calculateFinance } = require('../../engine/finance');
// const { analyzeRoadview } = require('../../ai/roadview');
// const { generateConsulting } = require('../../ai/consulting');
// const { calculateDecision } = require('../../engine/decision');

/**
 * 분석 실행 함수
 * @param {Object} analysisRequest - 분석 요청 데이터
 * @param {Map} analysisStore - 분석 결과 저장소
 */
async function runAnalysis(analysisRequest, analysisStore) {
  const { analysisId, brandId, location, radius, conditions, targetDailySales } = analysisRequest;

  try {
    // 분석 상태를 processing으로 변경
    const stored = analysisStore.get(analysisId);
    if (stored) {
      stored.status = 'processing';
      analysisStore.set(analysisId, stored);
    }

    console.log(`[${analysisId}] 🚀 분석 시작...`);

    // 브랜드 정보 가져오기
    const brand = getBrandById(brandId);
    if (!brand) {
      throw new Error(`브랜드를 찾을 수 없습니다: ${brandId}`);
    }

    // 1. 상권 분석
    console.log(`[${analysisId}] 📊 1/5 상권 분석 시작...`);
    let market;
    try {
      market = await analyzeMarket(location, radius);
      console.log(`[${analysisId}] ✅ 상권 분석 완료`);
    } catch (error) {
      console.error(`[${analysisId}] ❌ 상권 분석 실패:`, error);
      throw new Error(`상권 분석 실패: ${error.message}`);
    }

    // 2. 손익 계산
    console.log(`[${analysisId}] 💰 2/5 손익 계산 시작...`);
    let finance;
    try {
      // const { calculateFinance } = require('../../engine/finance');
      // finance = calculateFinance({ brand, conditions, targetDailySales });
      // TODO: 실제 구현 후 주석 해제
      finance = {
        monthlyRevenue: 27000000,
        monthlyCosts: {
          rent: conditions.monthlyRent || 3000000,
          labor: 5000000,
          materials: 8100000,
          utilities: 500000,
          royalty: 1350000,
          marketing: 540000,
          etc: 500000
        },
        monthlyProfit: 10000000,
        paybackMonths: 50,
        breakEvenDailySales: 200,
        sensitivity: {
          plus10: { monthlyProfit: 12000000, paybackMonths: 42 },
          minus10: { monthlyProfit: 8000000, paybackMonths: 63 }
        }
      };
      console.log(`[${analysisId}] ✅ 손익 계산 완료`);
    } catch (error) {
      console.error(`[${analysisId}] ❌ 손익 계산 실패:`, error);
      throw new Error(`손익 계산 실패: ${error.message}`);
    }

    // 3. 로드뷰 분석
    console.log(`[${analysisId}] 🗺️ 3/5 로드뷰 분석 시작...`);
    let roadview;
    try {
      // const { analyzeRoadview } = require('../../ai/roadview');
      // roadview = await analyzeRoadview({ location });
      // TODO: 실제 구현 후 주석 해제
      roadview = {
        location: { lat: location.lat, lng: location.lng },
        risks: [],
        overallRisk: 'medium',
        riskScore: 65
      };
      console.log(`[${analysisId}] ✅ 로드뷰 분석 완료`);
    } catch (error) {
      console.error(`[${analysisId}] ❌ 로드뷰 분석 실패:`, error);
      throw new Error(`로드뷰 분석 실패: ${error.message}`);
    }

    // 4. AI 컨설팅
    console.log(`[${analysisId}] 🤖 4/5 AI 컨설팅 생성 시작...`);
    let aiConsulting;
    try {
      // const { generateConsulting } = require('../../ai/consulting');
      // aiConsulting = await generateConsulting({
      //   brand, location, conditions, targetDailySales,
      //   finance, market, roadview
      // });
      // TODO: 실제 구현 후 주석 해제
      aiConsulting = {
        salesScenario: { conservative: 200, expected: 250, optimistic: 300 },
        salesScenarioReason: '주변 경쟁 카페 밀도가 높고, 유동인구가 많아 기대 판매량은 250잔/일로 추정됩니다.',
        topRisks: [],
        improvements: [],
        competitiveAnalysis: { intensity: 'medium', differentiation: 'possible', priceStrategy: 'standard' }
      };
      console.log(`[${analysisId}] ✅ AI 컨설팅 생성 완료`);
    } catch (error) {
      console.error(`[${analysisId}] ❌ AI 컨설팅 생성 실패:`, error);
      throw new Error(`AI 컨설팅 생성 실패: ${error.message}`);
    }

    // 5. 판단 계산
    console.log(`[${analysisId}] ⚖️ 5/5 판단 계산 시작...`);
    let decision;
    try {
      // const { calculateDecision } = require('../../engine/decision');
      // decision = calculateDecision({ finance, market, roadview });
      // TODO: 실제 구현 후 주석 해제
      decision = {
        score: 65,
        signal: 'yellow',
        survivalMonths: 24,
        riskLevel: 'medium',
        riskFactors: []
      };
      console.log(`[${analysisId}] ✅ 판단 계산 완료`);
    } catch (error) {
      console.error(`[${analysisId}] ❌ 판단 계산 실패:`, error);
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

    // 결과 저장
    analysisStore.set(analysisId, finalResult);

    console.log(`[${analysisId}] 🎉 분석 완료!`);
    return finalResult;
  } catch (error) {
    console.error(`[${analysisId}] ❌ 분석 실패:`, error);
    
    // 실패 상태 저장
    const stored = analysisStore.get(analysisId);
    if (stored) {
      stored.status = 'failed';
      stored.error = error.message;
      analysisStore.set(analysisId, stored);
    }
    
    throw error;
  }
}

module.exports = {
  runAnalysis
};
