// ai/consulting/test_mega_pdf.js
// PDF 리포트(초안_컨셉_StartSmart Final Report.pdf)의 메가커피 조건을 기준으로 작성된 테스트 파일

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// 환경변수 로드 확인 (디버깅용)
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('❌ 오류: ANTHROPIC_API_KEY가 로드되지 않았습니다.');
  console.error('   .env 파일 경로를 확인해주세요.');
  process.exit(1);
}

if (apiKey === 'sk-ant-xxxxx' || apiKey.length < 20) {
  console.error('❌ 오류: ANTHROPIC_API_KEY가 올바르게 설정되지 않았습니다.');
  console.error('   현재 값:', apiKey ? `${apiKey.substring(0, 20)}... (길이: ${apiKey.length})` : '없음');
  console.error('   .env 파일에서 ANTHROPIC_API_KEY가 한 줄로 되어 있는지 확인해주세요.');
  console.error('   Anthropic Console: https://console.anthropic.com/');
  process.exit(1);
}

console.log('✅ 환경변수 로드 확인: ANTHROPIC_API_KEY가 설정되었습니다.');
console.log('   API Key:', apiKey.substring(0, 20) + '...' + apiKey.substring(apiKey.length - 10));

const { generateConsulting } = require('./index');

async function test() {
  // PDF 리포트의 메가커피 조건 기준
  // PDF 리포트 주요 정보:
  // - 초기 투자금: 180,000,000원 (1.8억)
  // - 월 임대료: 4,500,000원 (450만원)
  // - 면적: 15평
  // - 점주 근무: 주 6일, 10시간
  // - 경쟁 카페 수: 28개 (과밀)
  // - 배후 세대: 4,200세대
  // - 월 매출: 52,000,000원 (5,200만원)
  // - 월 순이익: 5,200,000원 (520만원)
  // - 회수 개월: 9개월
  // - 예상 생존 개월: 31개월
  // - GAP: +17%
  
  // 월 매출 52,000,000원 기준 일 판매량 계산
  // 평균 단가 3,500원 가정: 52,000,000 / 3,500 / 30 = 약 495잔/일
  const targetDailySales = 495; // 목표 일 판매량
  
  // 상권 기대 일 판매량 계산 (GAP +17% 역산)
  // 목표 = 기대 * 1.17 → 기대 = 목표 / 1.17
  const expectedDailySales = Math.round(targetDailySales / 1.17); // 약 423잔/일
  const expectedMonthlyRevenue = expectedDailySales * 3500 * 30; // 약 44,415,000원

  const result = await generateConsulting({
    brand: {
      id: "brand_mega",
      name: "메가커피",
      defaults: {
        avgPrice: 3500,
        cogsRate: 0.38,  // PDF 기준 원가율 38%
        laborRate: 0.20,
        utilitiesRate: 0.03,
        etcFixed: 2000000,  // PDF 기준 기타 고정비 200만원
        royaltyRate: 0.05,
        marketingRate: 0.02
      }
    },
    location: {
      lat: 37.5665,
      lng: 126.9780,
      address: "서울 강남구 역삼동 (핀 기준)"
    },
    conditions: {
      initialInvestment: 180000000,  // 1.8억원 (PDF 기준)
      monthlyRent: 4500000,          // 450만원 (PDF 기준)
      area: 15,                       // 15평 (PDF 기준)
      ownerWorking: true              // 점주 근무 (PDF 기준: 주 6일, 10시간)
    },
    targetDailySales: targetDailySales,  // 495잔/일
    finance: {
      // PDF 리포트 기준 Finance 엔진 출력값
      monthlyRevenue: 52000000,      // 월 매출 5,200만원 (PDF 기준)
      monthlyProfit: 5200000,        // 월 순이익 520만원 (PDF 기준)
      paybackMonths: 9,              // 회수 개월 수 9개월 (PDF 기준)
      breakEvenDailySales: 350,     // 손익분기점 일 판매량 (추정)
      expected: {
        expectedDailySales: expectedDailySales,  // 상권 기대 일 판매량 (약 423잔)
        expectedMonthlyRevenue: expectedMonthlyRevenue,  // 약 4,441.5만원
        gapPctVsTarget: 0.17,        // GAP 17% (PDF 기준)
        gapWarning: false
      },
      monthlyCosts: {
        rent: 4500000,               // 월 임대료 450만원 (PDF 기준)
        labor: 9000000,             // 월 인건비 900만원 (PDF 기준)
        materials: 19760000,         // 원재료비 (매출 * 38% = 19,760,000원)
        utilities: 1560000,          // 공과금 (매출 * 3% = 1,560,000원)
        royalty: 2600000,            // 로열티 (매출 * 5% = 2,600,000원)
        marketing: 1040000,          // 마케팅비 (매출 * 2% = 1,040,000원)
        etc: 2000000                 // 기타 고정비 200만원 (PDF 기준)
      },
      sensitivity: {
        plus10: {
          monthlyProfit: 6760000,    // 매출 +10% 시 순이익 (추정)
          paybackMonths: 6.9         // 매출 +10% 시 회수 개월 (추정)
        },
        minus10: {
          monthlyProfit: 3640000,    // 매출 -10% 시 순이익 (추정)
          paybackMonths: 12.9        // 매출 -10% 시 회수 개월 (추정)
        }
      },
      scenarioTable: [
        { daily: 400, profit: 3200000, paybackMonths: 14.1 },  // 추정
        { daily: 450, profit: 4200000, paybackMonths: 10.7 },  // 추정
        { daily: 495, profit: 5200000, paybackMonths: 9.0 }   // PDF 기준
      ]
    },
    market: {
      expectedDailySales: expectedDailySales,  // 상권 기대 일 판매량 (약 423잔)
      radiusM: 500,                  // 반경 500m
      marketScore: 60,                // Decision 엔진 입력값 (경쟁 과밀로 낮게 설정)
      competitors: {
        total: 28,                    // 경쟁 카페 수 28개 (PDF 기준: 과밀)
        density: "high"               // 경쟁 밀도 high
      },
      footTraffic: {
        weekday: "high",              // 배후 세대 4,200세대로 추정
        weekend: "medium"
      }
    },
    roadview: {
      overallRisk: "medium",
      riskScore: 60                   // Decision 엔진 입력값 (경쟁 과밀로 낮게 설정)
    }
  });

  console.log('=== 컨설팅 결과 (메가커피 PDF 리포트 조건) ===');
  console.log(JSON.stringify(result, null, 2));
  
  console.log('\n=== PDF 리포트와 비교 ===');
  console.log('PDF 리포트 주요 지표:');
  console.log('  - 성공 확률 점수: 62/100');
  console.log('  - 예상 생존 개월: 31개월');
  console.log('  - 투자 회수 개월: 9개월');
  console.log('  - 월 순이익: 5,200,000원');
  console.log('  - GAP (TARGET VS All): +17%');
  console.log('\n생성된 AI 컨설팅 결과와 위 지표를 비교해보세요.');
}

test().catch(console.error);

