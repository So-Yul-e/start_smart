/**
 * StartSmart Mock Data - shared/interfaces.js 기준
 * 12개 브랜드 + 분석 결과 mock 데이터
 */
var MockData = (function () {

  // ── 12개 브랜드 목록 ──
  var brands = [
    { id: 'brand_1',  name: '메가커피',     position: '저가',     initialInvestment: 120000000, monthlyRoyalty: 2,  monthlyMarketing: 1, avgDailySales: 450, logo: 'megamgcoffee_BI.png' },
    { id: 'brand_2',  name: '컴포즈커피',   position: '저가',     initialInvestment: 115000000, monthlyRoyalty: 2,  monthlyMarketing: 1, avgDailySales: 420, logo: null },
    { id: 'brand_3',  name: '빽다방',       position: '저가',     initialInvestment: 130000000, monthlyRoyalty: 2,  monthlyMarketing: 1, avgDailySales: 400, logo: 'paik.png' },
    { id: 'brand_4',  name: '스타벅스',     position: '프리미엄', initialInvestment: 500000000, monthlyRoyalty: 5,  monthlyMarketing: 2, avgDailySales: 600, logo: 'Starbucks.png' },
    { id: 'brand_5',  name: '이디야',       position: '표준',     initialInvestment: 180000000, monthlyRoyalty: 3,  monthlyMarketing: 1, avgDailySales: 250, logo: 'EDIYA.png' },
    { id: 'brand_6',  name: '투썸플레이스', position: '프리미엄', initialInvestment: 320000000, monthlyRoyalty: 4,  monthlyMarketing: 2, avgDailySales: 350, logo: 'atwosomeplace.png' },
    { id: 'brand_7',  name: '더벤티',       position: '저가',     initialInvestment: 110000000, monthlyRoyalty: 2,  monthlyMarketing: 1, avgDailySales: 380, logo: null },
    { id: 'brand_8',  name: '할리스',       position: '프리미엄', initialInvestment: 280000000, monthlyRoyalty: 4,  monthlyMarketing: 2, avgDailySales: 300, logo: null },
    { id: 'brand_9',  name: '블루보틀',     position: '프리미엄', initialInvestment: 500000000, monthlyRoyalty: 5,  monthlyMarketing: 3, avgDailySales: 200, logo: 'bluebottle.png' },
    { id: 'brand_10', name: '커피빈',       position: '프리미엄', initialInvestment: 350000000, monthlyRoyalty: 4,  monthlyMarketing: 2, avgDailySales: 280, logo: null },
    { id: 'brand_11', name: '탐앤탐스',     position: '표준',     initialInvestment: 200000000, monthlyRoyalty: 3,  monthlyMarketing: 1, avgDailySales: 230, logo: null },
    { id: 'brand_12', name: '폴바셋',       position: '프리미엄', initialInvestment: 400000000, monthlyRoyalty: 5,  monthlyMarketing: 2, avgDailySales: 180, logo: null }
  ];

  // ── 분석 결과 생성 함수 (입력 기반) ──
  function generateResult(input) {
    var brand = getBrandById(input.brandId);
    if (!brand) return null;

    var dailySales = input.targetDailySales || brand.avgDailySales;
    var avgPrice = brand.position === '프리미엄' ? 5500 : brand.position === '표준' ? 4000 : 3000;
    var monthlyRevenue = dailySales * avgPrice * 30;

    var rent = input.conditions.monthlyRent || 3000000;
    var laborBase = input.conditions.ownerWorking ? 3500000 : 6000000;
    var materials = Math.round(monthlyRevenue * 0.30);
    var royalty = Math.round(monthlyRevenue * brand.monthlyRoyalty / 100);
    var marketing = Math.round(monthlyRevenue * brand.monthlyMarketing / 100);
    var utilities = 500000;
    var etc = 300000;
    var totalCosts = rent + laborBase + materials + royalty + marketing + utilities + etc;
    var monthlyProfit = monthlyRevenue - totalCosts;
    var investment = input.conditions.initialInvestment || brand.initialInvestment;
    var paybackMonths = monthlyProfit > 0 ? Math.ceil(investment / monthlyProfit) : 999;

    // 손익분기 판매량
    var fixedCosts = rent + laborBase + utilities + etc;
    var variableRatio = 0.30 + (brand.monthlyRoyalty + brand.monthlyMarketing) / 100;
    var breakEvenDaily = Math.ceil(fixedCosts / ((avgPrice * (1 - variableRatio)) * 30));

    // 민감도
    var rev110 = Math.round(monthlyRevenue * 1.1);
    var cost110 = rent + laborBase + Math.round(rev110 * 0.30) + Math.round(rev110 * brand.monthlyRoyalty / 100) + Math.round(rev110 * brand.monthlyMarketing / 100) + utilities + etc;
    var profit110 = rev110 - cost110;
    var rev90 = Math.round(monthlyRevenue * 0.9);
    var cost90 = rent + laborBase + Math.round(rev90 * 0.30) + Math.round(rev90 * brand.monthlyRoyalty / 100) + Math.round(rev90 * brand.monthlyMarketing / 100) + utilities + etc;
    var profit90 = rev90 - cost90;

    // 종합 점수 계산
    var score = 50;
    if (monthlyProfit > 0) score += 15;
    if (monthlyProfit > 5000000) score += 10;
    if (paybackMonths <= 24) score += 10;
    else if (paybackMonths <= 36) score += 5;
    if (paybackMonths > 36) score -= 10;
    if (dailySales >= brand.avgDailySales) score += 5;
    if (input.conditions.ownerWorking) score += 5;
    score = Math.max(0, Math.min(100, score));

    var signal = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';
    var survivalMonths = monthlyProfit > 0 ? Math.min(60, Math.round(36 + score * 0.24)) : Math.max(3, Math.round(12 - (50 - score) * 0.2));

    // AI 시나리오
    var conservative = Math.round(brand.avgDailySales * 0.7);
    var expected = brand.avgDailySales;
    var optimistic = Math.round(brand.avgDailySales * 1.3);

    return {
      id: 'analysis_' + Date.now(),
      status: 'completed',
      brand: { id: brand.id, name: brand.name },
      location: input.location,
      finance: {
        monthlyRevenue: monthlyRevenue,
        monthlyCosts: {
          rent: rent,
          labor: laborBase,
          materials: materials,
          utilities: utilities,
          royalty: royalty,
          marketing: marketing,
          etc: etc
        },
        monthlyProfit: monthlyProfit,
        paybackMonths: paybackMonths,
        breakEvenDailySales: breakEvenDaily,
        sensitivity: {
          plus10: { monthlyProfit: profit110, paybackMonths: profit110 > 0 ? Math.ceil(investment / profit110) : 999 },
          minus10: { monthlyProfit: profit90, paybackMonths: profit90 > 0 ? Math.ceil(investment / profit90) : 999 }
        }
      },
      decision: {
        score: score,
        signal: signal,
        survivalMonths: survivalMonths,
        riskLevel: score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high',
        riskFactors: buildRiskFactors(paybackMonths, monthlyProfit, dailySales, brand)
      },
      aiConsulting: {
        salesScenario: { conservative: conservative, expected: expected, optimistic: optimistic },
        salesScenarioReason: brand.name + ' 브랜드의 평균 판매량과 해당 상권의 유동인구, 경쟁 밀도를 종합 분석한 결과입니다. 보수적 시나리오는 경쟁 심화 시, 낙관적 시나리오는 프로모션 및 입지 우위 시를 가정합니다.',
        topRisks: buildTopRisks(paybackMonths, monthlyProfit, brand),
        improvements: buildImprovements(rent, monthlyProfit, paybackMonths, dailySales),
        competitiveAnalysis: {
          intensity: 'high',
          differentiation: brand.position === '프리미엄' ? 'possible' : 'difficult',
          priceStrategy: brand.position === '프리미엄' ? 'premium' : brand.position === '저가' ? 'budget' : 'standard'
        }
      },
      roadview: {
        location: input.location,
        risks: [
          { type: 'signage_obstruction', level: 'medium', description: '주변 건물에 의해 간판이 부분적으로 가려질 수 있음' },
          { type: 'steep_slope', level: 'low', description: '비교적 평탄한 지형으로 접근성 양호' },
          { type: 'floor_level', level: 'ground', description: '1층 매장으로 가시성 확보' },
          { type: 'visibility', level: 'high', description: '주요 보행 동선에 위치하여 시인성 우수' }
        ],
        overallRisk: 'medium',
        riskScore: 72
      },
      market: {
        location: { lat: input.location.lat, lng: input.location.lng, radius: input.radius || 500 },
        competitors: { total: 7, sameBrand: 1, otherBrands: 6, density: 'high' },
        footTraffic: { weekday: 'high', weekend: 'medium', peakHours: ['08:00-10:00', '12:00-14:00', '17:00-19:00'] },
        marketScore: 70
      },
      createdAt: new Date().toISOString()
    };
  }

  function buildRiskFactors(paybackMonths, profit, dailySales, brand) {
    var factors = [];
    if (paybackMonths > 36) factors.push('투자 회수 기간이 36개월을 초과하여 장기 리스크가 존재합니다.');
    if (profit <= 0) factors.push('월 순이익이 적자 상태로 즉각적인 조건 개선이 필요합니다.');
    if (dailySales < brand.avgDailySales * 0.8) factors.push('목표 판매량이 브랜드 평균 대비 낮아 매출 부족 위험이 있습니다.');
    if (factors.length === 0) factors.push('현재 조건에서 주요 리스크 요인이 낮습니다.');
    return factors;
  }

  function buildTopRisks(paybackMonths, profit, brand) {
    var risks = [];
    if (paybackMonths > 36) {
      risks.push({ title: '투자 회수 기간 초과', description: paybackMonths + '개월로 36개월 기준을 초과합니다. 초기 투자금 대비 수익성 개선이 필요합니다.', impact: 'high' });
    }
    if (profit <= 0) {
      risks.push({ title: '월 순이익 적자', description: '현재 조건에서 월 순이익이 마이너스입니다. 비용 구조 재검토가 필수적입니다.', impact: 'high' });
    }
    risks.push({ title: '경쟁 밀도', description: '반경 내 경쟁 카페가 다수 존재하여 차별화 전략이 필요합니다.', impact: 'medium' });
    if (risks.length < 3) {
      risks.push({ title: '임대료 상승 리스크', description: '향후 임대료 인상 가능성을 고려한 보수적 계획이 필요합니다.', impact: 'low' });
    }
    return risks.slice(0, 3);
  }

  function buildImprovements(rent, profit, paybackMonths, dailySales) {
    var rentDown = Math.round(rent * 0.9);
    var profitAfterRentDown = profit + Math.round(rent * 0.1);
    return [
      {
        title: '월세 10% 협상',
        description: '월세를 ' + formatWon(rentDown) + '으로 낮추면 월 순이익이 ' + formatWon(profitAfterRentDown) + '으로 개선됩니다.',
        expectedImpact: '월 순이익 +' + formatWon(Math.round(rent * 0.1))
      },
      {
        title: '판매량 10% 증대',
        description: '테이크아웃 특화 프로모션과 출근 시간대 할인으로 일 판매량을 ' + Math.round(dailySales * 1.1) + '잔으로 끌어올릴 수 있습니다.',
        expectedImpact: '매출 +10%, 회수기간 단축'
      },
      {
        title: '점주 직접 근무 확대',
        description: '점주 근무 시간을 늘려 인건비를 절감하면 월 순이익이 약 15% 증가합니다.',
        expectedImpact: '인건비 절감, 순이익 +15%'
      }
    ];
  }

  function formatWon(n) {
    if (n >= 100000000) return (n / 100000000).toFixed(1) + '억원';
    if (n >= 10000) return Math.round(n / 10000) + '만원';
    return n.toLocaleString() + '원';
  }

  function getBrandById(id) {
    for (var i = 0; i < brands.length; i++) {
      if (brands[i].id === id) return brands[i];
    }
    return null;
  }

  return {
    brands: brands,
    getBrandById: getBrandById,
    generateResult: generateResult
  };
})();
