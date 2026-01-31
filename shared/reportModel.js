/**
 * ReportModel: 화면/PDF 렌더링 전용 모델
 * - numbers come from engine only
 * - AI contributes narrative + suggestions
 */

/**
 * 리포트 전용 ViewModel 생성
 * @param {Object} finalResult - Orchestrator의 최종 결과
 * @returns {Object} reportModel
 */
function buildReportModel(finalResult) {
  const { finance, decision, aiConsulting, market, roadview } = finalResult;
  
  // conditions와 targetDailySales는 finalResult에서 직접 가져오거나 conditions 객체에서 가져옴
  const conditions = finalResult.conditions || null;
  const targetDailySales = finalResult.targetDailySales ?? conditions?.targetDailySales ?? null;

  // Helper functions
  const toMoney = (n) => (typeof n === "number" ? n : null);
  const toNum = (n) => (typeof n === "number" ? n : null);

  // Executive Summary
  const executive = {
    signal: decision?.finalJudgement?.signal ?? decision?.signal ?? null,
    label: decision?.finalJudgement?.label ?? null,
    summary: decision?.finalJudgement?.summary ?? null,
    nonNegotiable: !!decision?.finalJudgement?.nonNegotiable,
    score: toNum(decision?.score),
    survivalMonths: toNum(decision?.survivalMonths),
    paybackMonths: toNum(finance?.paybackMonths),
    monthlyProfit: toMoney(finance?.monthlyProfit),
    breakEvenDailySales: toNum(finance?.breakEvenDailySales),
    confidence: decision?.decisionConfidence ?? null,
  };

  // GAP Analysis
  const gap = {
    targetDailySales: toNum(targetDailySales),
    expectedDailySales: toNum(finance?.expected?.expectedDailySales) ?? null,
    gapPctVsTarget: toNum(finance?.expected?.gapPctVsTarget) ?? null,
    narrative: aiConsulting?.gapNarrative ?? null, // optional
  };

  // Scenario Comparison
  const scenario = {
    engineScenarioTable: Array.isArray(finance?.scenarioTable) ? finance.scenarioTable : [],
    aiSalesScenario: aiConsulting?.salesScenario ?? null,
  };

  // Risk Cards Merge
  const risk = mergeRiskCards({
    engineRiskCards: Array.isArray(decision?.riskCards) ? decision.riskCards : [],
    aiTopRisks: Array.isArray(aiConsulting?.topRisks) ? aiConsulting.topRisks : [],
  });

  // Improvement Cards Merge
  const improvement = mergeImprovementCards({
    engineSims: Array.isArray(decision?.improvementSimulations) ? decision.improvementSimulations : [],
    aiImprovements: Array.isArray(aiConsulting?.improvements) ? aiConsulting.improvements : [],
  });

  // Exit Plan
  const exitPlan = decision?.exitPlan ?? null;

  // Breakdown
  const breakdown = decision?.breakdown ?? null;

  // Failure Triggers
  const failureTriggers = Array.isArray(decision?.failureTriggers) ? decision.failureTriggers : [];

  // Competitive Analysis
  const competitive = aiConsulting?.competitiveAnalysis ?? null;

  // Market Analysis (상권 분석)
  const marketData = market ? {
    location: {
      lat: toNum(market.location?.lat),
      lng: toNum(market.location?.lng),
      radius: toNum(market.location?.radius),
    },
    competitors: {
      total: toNum(market.competitors?.total),
      sameBrand: toNum(market.competitors?.sameBrand),
      otherBrands: toNum(market.competitors?.otherBrands),
      density: market.competitors?.density || null, // "low" | "medium" | "high"
    },
    footTraffic: market.footTraffic ? {
      weekday: market.footTraffic.weekday || null, // "low" | "medium" | "high"
      weekend: market.footTraffic.weekend || null,
      peakHours: Array.isArray(market.footTraffic.peakHours) ? market.footTraffic.peakHours : [],
    } : null,
    marketScore: toNum(market.marketScore),
  } : null;

  // Roadview Analysis (입지 분석)
  const roadviewData = roadview ? {
    location: {
      lat: toNum(roadview.location?.lat),
      lng: toNum(roadview.location?.lng),
    },
    risks: Array.isArray(roadview.risks) ? roadview.risks.map(risk => ({
      type: risk.type || null, // "signage_obstruction" | "steep_slope" | "floor_level" | "visibility"
      level: risk.level || null, // "low" | "medium" | "high" | "ground" | "half_basement" | "second_floor"
      description: risk.description || null,
    })) : [],
    overallRisk: roadview.overallRisk || null, // "low" | "medium" | "high"
    riskScore: toNum(roadview.riskScore),
    // 메타데이터 (있는 경우)
    metadata: roadview._metadata ? {
      confidence: typeof roadview._metadata.confidence === 'number' ? roadview._metadata.confidence : null,
      strengths: Array.isArray(roadview._metadata.strengths) ? roadview._metadata.strengths : [],
      weaknesses: Array.isArray(roadview._metadata.weaknesses) ? roadview._metadata.weaknesses : [],
      locationScore: toNum(roadview._metadata.locationScore),
    } : null,
  } : null;

  return {
    version: "reportModel.v1",
    generatedAt: new Date().toISOString(),
    executive,
    finance: {
      monthlyRevenue: toMoney(finance?.monthlyRevenue),
      monthlyCosts: finance?.monthlyCosts ?? null,
      monthlyProfit: toMoney(finance?.monthlyProfit),
      paybackMonths: toNum(finance?.paybackMonths),
      sensitivity: finance?.sensitivity ?? null,
      breakEvenDailySales: toNum(finance?.breakEvenDailySales),
    },
    gap,
    scenario,
    breakdown,
    risk,
    improvement,
    exitPlan,
    failureTriggers,
    competitive,
    market: marketData,
    roadview: roadviewData,
    sources: {
      hasMarket: !!market,
      hasRoadview: !!roadview,
      hasAI: !!aiConsulting,
    },
  };
}

/**
 * 리스크 카드 병합
 */
function mergeRiskCards({ engineRiskCards, aiTopRisks }) {
  const ai = aiTopRisks.map((r, idx) => ({ ...r, _aiId: r.id ?? `ai_${idx}` }));

  const merged = engineRiskCards.map((c, idx) => {
    const engineTitle = (c.title ?? c.trigger ?? "").toString();
    const best = pickBestAI(engineTitle, ai);
    return {
      id: c.id ?? `risk_${idx}`,
      severity: c.severity ?? c.impact ?? null,
      engine: c,
      ai: best ?? null,
    };
  });

  const used = new Set(merged.map(m => m.ai?._aiId).filter(Boolean));
  const leftovers = ai.filter(x => !used.has(x._aiId)).map((x) => ({
    id: x.id ?? x._aiId,
    severity: x.severity ?? x.impact ?? null,
    engine: null,
    ai: x,
  }));

  return { cards: [...merged, ...leftovers] };
}

/**
 * 개선 카드 병합
 */
function mergeImprovementCards({ engineSims, aiImprovements }) {
  const ai = aiImprovements.map((x, idx) => ({ ...x, _aiId: x.id ?? `aiImp_${idx}` }));

  const merged = engineSims.map((s, idx) => {
    const key = (s.delta ?? s.id ?? "").toString();
    const best = pickBestAI(key, ai);
    return {
      id: s.id ?? `sim_${idx}`,
      delta: s.delta ?? null,
      engine: s,
      ai: best ?? null,
    };
  });

  const used = new Set(merged.map(m => m.ai?._aiId).filter(Boolean));
  const leftovers = ai.filter(x => !used.has(x._aiId)).map((x) => ({
    id: x.id ?? x._aiId,
    delta: x.title ?? null,
    engine: null,
    ai: x,
  }));

  return { cards: [...merged, ...leftovers] };
}

/**
 * AI 항목 매칭 (간단한 키워드 기반)
 */
function pickBestAI(key, aiList) {
  if (!key || aiList.length === 0) return null;
  const k = key.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const a of aiList) {
    const text = `${a.title ?? ""} ${a.narrative ?? ""} ${a.reason ?? ""} ${a.description ?? ""}`.toLowerCase();
    const score =
      (text.includes(k) ? 3 : 0) +
      (k.split(/\s+/).filter(Boolean).some(t => t.length > 2 && text.includes(t)) ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return bestScore > 0 ? best : null;
}

module.exports = {
  buildReportModel
};
