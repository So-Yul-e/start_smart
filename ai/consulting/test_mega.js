// ai/consulting/test_mega.js
// EXAMPLE_INPUT_OUTPUT.md의 메가커피 예시 데이터를 기준으로 작성된 테스트 파일

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
  // EXAMPLE_INPUT_OUTPUT.md의 메가커피 예시 데이터 기준
  const result = await generateConsulting({
    brand: {
      id: "brand_mega",
      name: "메가커피",
      defaults: {
        avgPrice: 3500,
        cogsRate: 0.35,
        laborRate: 0.20,
        utilitiesRate: 0.03,
        etcFixed: 1100000,
        royaltyRate: 0.05,
        marketingRate: 0.02
      }
    },
    location: {
      lat: 37.5665,
      lng: 126.9780,
      address: "서울특별시 강남구 테헤란로 123"
    },
    conditions: {
      initialInvestment: 200000000,  // 2억원
      monthlyRent: 4000000,          // 400만원
      area: 10,                      // 10평
      ownerWorking: true              // 점주 근무
    },
    targetDailySales: 300,           // 목표 일 판매량 300잔
    finance: {
      // Finance 엔진 출력값 기준
      monthlyRevenue: 31500000,      // 월 매출 3,150만원
      monthlyProfit: 8445000,        // 월 순이익 844.5만원
      paybackMonths: 23.7,            // 회수 개월 수 23.7개월
      breakEvenDailySales: 219.6,     // 손익분기점 일 판매량
      expected: {
        expectedDailySales: 256,     // 상권 기대 일 판매량
        expectedMonthlyRevenue: 26880000,
        gapPctVsTarget: 0.172,        // GAP 17.2%
        gapWarning: false
      },
      monthlyCosts: {
        rent: 4000000,
        labor: 3780000,
        materials: 11025000,
        utilities: 945000,
        royalty: 1575000,
        marketing: 630000,
        etc: 1100000
      },
      sensitivity: {
        plus10: {
          monthlyProfit: 9799500,
          paybackMonths: 20.4
        },
        minus10: {
          monthlyProfit: 7090500,
          paybackMonths: 28.2
        }
      },
      scenarioTable: [
        { daily: 200, profit: 3930000, paybackMonths: 50.9 },
        { daily: 250, profit: 6187500, paybackMonths: 32.3 },
        { daily: 300, profit: 8445000, paybackMonths: 23.7 }
      ]
    },
    market: {
      expectedDailySales: 256,       // 상권 기대 일 판매량
      radiusM: 500,                  // 반경 500m
      marketScore: 70,                // Decision 엔진 입력값 기준
      competitors: {
        total: 5
        // density는 자동 계산됨 (제거하여 테스트)
      },
      footTraffic: {
        weekday: "high",
        weekend: "medium"
      }
    },
    roadview: {
      overallRisk: "medium",
      riskScore: 65                   // Decision 엔진 입력값 기준
    }
  });

  console.log('=== 컨설팅 결과 (메가커피 예시) ===');
  console.log(JSON.stringify(result, null, 2));
}

test().catch(console.error);

