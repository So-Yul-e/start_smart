/**
 * StartSmart - 공유 인터페이스
 *
 * ⚠️ 이 파일은 절대 수정하지 마세요!
 * 모든 팀원이 이 형식을 따라야 합니다.
 * 변경이 필요하면 팀 전체 동의 후 5번(백엔드) 담당자가 수정합니다.
 */

// ============================================
// 0. 브랜드 목록 조회 (프론트엔드 → 백엔드)
// GET /api/brands
// ============================================
const brandsResponseExample = {
  success: true,
  brands: [
    {
      id: "brand_1",
      name: "스타벅스",
      position: "프리미엄",
      initialInvestment: 500000000,  // 초기 투자금 (원)
      monthlyRoyalty: 5,             // 로열티 (%)
      monthlyMarketing: 2,           // 마케팅비 (%)
      avgDailySales: 250              // 평균 일 판매량 (잔)
    }
    // ... 총 12개
  ]
};

// ============================================
// 1. 분석 요청 (프론트엔드 → 백엔드)
// POST /api/analyze
// ============================================
const analyzeRequestExample = {
  brandId: "brand_1",
  location: {
    lat: 37.5665,
    lng: 126.9780,
    address: "서울특별시 강남구 테헤란로 123"
  },
  radius: 500,  // 300 | 500 | 1000 (m)
  conditions: {
    initialInvestment: 500000000,  // 초기 투자금 (원)
    monthlyRent: 3000000,           // 월세 (원)
    area: 33,                      // 평수 (평)
    ownerWorking: true,             // 점주 근무 여부
    loans: [                       // 대출 정보 배열 (선택적)
      {
        principal: 200000000,      // 대출 원금 (원)
        apr: 0.05,                 // 연 이자율 (0-1, 예: 0.05 = 5%)
        termMonths: 60,            // 대출 기간 (개월)
        repaymentType: "equal_payment"  // 상환 방식: "equal_payment" | "equal_principal" | "interest_only"
      }
    ]
  },
  targetDailySales: 300  // 목표 일 판매량 (잔)
};

// 분석 요청 응답
const analyzeResponseExample = {
  success: true,
  analysisId: "analysis_abc123",
  message: "분석을 시작합니다."
};

// ============================================
// 2. 로드뷰 분석 결과 (AI-로드뷰 → 백엔드)
// ============================================
const roadviewAnalysisExample = {
  location: {
    lat: 37.5665,
    lng: 126.9780
  },
  risks: [
    {
      type: "signage_obstruction",  // 간판 가림
      level: "medium",                // low | medium | high
      description: "주변 건물에 의해 간판이 부분적으로 가려짐"
    },
    {
      type: "steep_slope",           // 급경사
      level: "low",
      description: "평지에 위치하여 접근성 양호"
    },
    {
      type: "floor_level",            // 층위
      level: "ground",                // ground | half_basement | second_floor
      description: "1층에 위치"
    },
    {
      type: "visibility",             // 보행 가시성
      level: "high",
      description: "보행자 시선에 잘 보이는 위치"
    }
  ],
  overallRisk: "medium",  // low | medium | high
  riskScore: 65           // 0-100 (낮을수록 위험)
};

// ============================================
// 3. 손익 계산 결과 (계산 엔진 → 백엔드)
// ============================================
const financeResultExample = {
  monthlyRevenue: 27000000,      // 월 매출 (원)
  monthlyCosts: {
    rent: 3000000,                 // 월세
    labor: 5000000,               // 인건비 (점주 근무 시 감소)
    materials: 8100000,            // 원재료비 (매출의 30%)
    utilities: 500000,            // 공과금
    royalty: 1350000,              // 로열티
    marketing: 540000,            // 마케팅비
    etc: 500000                   // 기타
  },
  monthlyProfit: 10000000,        // 월 순이익 (원, 대출 상환 후)
  operatingProfit: 12000000,      // 영업 이익 (원, 대출 상환 전)
  paybackMonths: 50,              // 회수 개월 수
  breakEvenDailySales: 200,       // 손익분기점 일 판매량 (잔)
  expected: {                      // 기대값 관련 정보
    expectedDailySales: 250,       // 최종 사용된 기대 일 판매량 (잔)
    expectedMonthlyRevenue: 22500000,  // 기대 월 매출 (원)
    gapPctVsTarget: 0.20,         // 목표 대비 GAP 비율
    gapWarning: false,             // 최후 fallback 시 true
    // 브랜드 데이터 기반 파생 지표
    rawExpectedDailySales: 280,   // 원시 기대 판매량 (브랜드 평균 매출 기반)
    adjustedExpectedDailySales: 250,  // 보정된 기대 판매량 (점포 감소율 반영)
    revenueAdjustmentFactor: 0.89,    // 매출 보정 계수
    brandDeclineRate: 0.208           // 브랜드 점포 감소율 (3년간)
  },
  debt: {                          // 대출 관련 정보
    monthlyPayment: 3775000,       // 월 대출 상환액 (원)
    monthlyInterest: 833333,       // 월 이자 (원)
    monthlyPrincipal: 2941667,    // 월 원금 상환액 (원)
    balanceAfterMonth: 197058333,  // 1개월 후 잔액 (원)
    dscr: 3.18,                    // DSCR (Debt Service Coverage Ratio) = operatingProfit / monthlyPayment
    debtSchedulePreview: [         // 12개월 상환 스케줄 미리보기
      {
        month: 1,
        payment: 3775000,
        interest: 833333,
        principal: 2941667,
        balance: 197058333
      }
      // ... 12개월치
    ]
  },
  sensitivity: {
    plus10: {
      monthlyProfit: 12000000,
      paybackMonths: 42
    },
    minus10: {
      monthlyProfit: 8000000,
      paybackMonths: 63
    }
  }
};

// ============================================
// 4. 판단 결과 (계산 엔진 → 백엔드)
// ============================================
const decisionResultExample = {
  score: 65,                      // 0-100 점수
  signal: "yellow",                // green | yellow | red
  survivalMonths: 24,              // 예상 생존 개월 수
  riskLevel: "medium",              // low | medium | high
  riskFactors: [
    "회수 기간이 36개월을 초과함",
    "목표 판매량 달성 난이도 높음"
  ]
};

// ============================================
// 5. AI 판단 결과 (AI-판단 → 백엔드)
// ============================================
const aiConsultingExample = {
  salesScenario: {
    conservative: 200,             // 보수적 판매량 (잔/일)
    expected: 250,                 // 기대 판매량 (잔/일)
    optimistic: 300                // 낙관적 판매량 (잔/일)
  },
  salesScenarioReason: "주변 경쟁 카페 밀도가 높고, 유동인구가 많아 기대 판매량은 250잔/일로 추정됩니다.",
  topRisks: [
    {
      title: "회수 기간 초과",
      description: "36개월 회수 기준을 초과하여 구조적 위험이 있습니다.",
      impact: "high"
    },
    {
      title: "경쟁 밀도 높음",
      description: "반경 500m 내 경쟁 카페가 5개 이상으로 차별화 전략이 필요합니다.",
      impact: "medium"
    },
    {
      title: "간판 가시성 제한",
      description: "로드뷰 분석 결과 간판이 부분적으로 가려져 신규 고객 유입에 제약이 있습니다.",
      impact: "medium"
    }
  ],
  improvements: [
    {
      title: "월세 협상",
      description: "월세를 10% 낮추면 회수 기간이 45개월로 단축됩니다.",
      expectedImpact: "paybackMonths: 50 → 45"
    },
    {
      title: "목표 판매량 조정",
      description: "목표 판매량을 250잔/일로 낮추면 현실적인 목표 설정이 가능합니다.",
      expectedImpact: "realistic: true"
    },
    {
      title: "점주 근무 시간 확대",
      description: "점주 근무 시간을 늘려 인건비를 절감하면 월 순이익이 15% 증가합니다.",
      expectedImpact: "monthlyProfit: +15%"
    }
  ],
  competitiveAnalysis: {
    intensity: "high",             // low | medium | high
    differentiation: "possible",   // possible | difficult | impossible
    priceStrategy: "premium"       // premium | standard | budget
  }
};

// ============================================
// 6. 상권 분석 결과 (백엔드 → 백엔드)
// ============================================
const marketAnalysisExample = {
  location: {
    lat: 37.5665,
    lng: 126.9780,
    radius: 500
  },
  competitors: {
    total: 5,
    sameBrand: 1,
    otherBrands: 4,
    density: "high"                // low | medium | high
  },
  footTraffic: {
    weekday: "high",               // low | medium | high
    weekend: "medium",
    peakHours: ["08:00-10:00", "12:00-14:00", "18:00-20:00"]
  },
  marketScore: 70                  // 0-100
};

// ============================================
// 7. 최종 분석 결과 (백엔드 → 프론트엔드)
// GET /api/result/:analysisId
// ============================================
const finalResultExample = {
  id: "analysis_abc123",
  status: "completed",             // pending | processing | completed | failed
  brand: {
    id: "brand_1",
    name: "스타벅스"
  },
  location: {
    lat: 37.5665,
    lng: 126.9780,
    address: "서울특별시 강남구 테헤란로 123"
  },
  finance: financeResultExample,
  decision: decisionResultExample,
  aiConsulting: aiConsultingExample,
  roadview: roadviewAnalysisExample,
  market: marketAnalysisExample,
  createdAt: "2026-02-01T14:30:00Z"
};

// 분석 결과 조회 응답
const resultResponseExample = {
  success: true,
  result: finalResultExample
};

// ============================================
// 8. PDF 리포트 생성 요청 (프론트엔드 → 백엔드)
// POST /api/report/:analysisId
// ============================================
const reportResponseExample = {
  success: true,
  reportUrl: "https://storage.googleapis.com/bucket/report_abc123.pdf",
  reportId: "report_abc123"
};

// ============================================
// Export
// ============================================
module.exports = {
  examples: {
    brandsResponse: brandsResponseExample,
    analyzeRequest: analyzeRequestExample,
    analyzeResponse: analyzeResponseExample,
    roadviewAnalysis: roadviewAnalysisExample,
    financeResult: financeResultExample,
    decisionResult: decisionResultExample,
    aiConsulting: aiConsultingExample,
    marketAnalysis: marketAnalysisExample,
    finalResult: finalResultExample,
    resultResponse: resultResponseExample,
    reportResponse: reportResponseExample
  }
};
