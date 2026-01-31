/**
 * Dashboard Page - Data Rendering + CSS Charts
 */
(function () {
  var result = Utils.loadSession('analysisResult');

  if (!result) {
    document.querySelector('.container').innerHTML =
      '<div style="text-align:center; padding:6rem 2rem;">' +
      '<i class="fa-solid fa-chart-line" style="font-size:4rem; color:var(--text-muted); margin-bottom:1.5rem;"></i>' +
      '<h2 style="margin-bottom:1rem;">분석 결과가 없습니다</h2>' +
      '<p style="color:var(--text-muted); margin-bottom:2rem;">브랜드를 선택하고 분석을 실행해주세요.</p>' +
      '<a href="../brand/" class="btn-cta">브랜드 선택하기</a>' +
      '</div>';
    return;
  }

  // 데이터 검증 및 로깅
  console.log('[대시보드] 분석 결과 데이터:', result);
  console.log('[대시보드] 결과 데이터 타입:', typeof result);
  console.log('[대시보드] 결과 데이터 키:', result ? Object.keys(result) : 'null');
  console.log('[대시보드] finance:', result.finance, '타입:', typeof result.finance);
  console.log('[대시보드] decision:', result.decision, '타입:', typeof result.decision);
  console.log('[대시보드] aiConsulting:', result.aiConsulting, '타입:', typeof result.aiConsulting);
  console.log('[대시보드] market:', result.market, '타입:', typeof result.market);
  
  // finance 구조 확인
  if (result.finance) {
    console.log('[대시보드] finance 키:', Object.keys(result.finance));
    console.log('[대시보드] finance.monthlyProfit:', result.finance.monthlyProfit);
    console.log('[대시보드] finance.paybackMonths:', result.finance.paybackMonths);
  }
  
  // decision 구조 확인
  if (result.decision) {
    console.log('[대시보드] decision 키:', Object.keys(result.decision));
    console.log('[대시보드] decision.score:', result.decision.score);
    console.log('[대시보드] decision.survivalMonths:', result.decision.survivalMonths);
  }

  // reportModel 우선 사용, 없으면 fallback
  var reportModel = result.reportModel;
  if (!reportModel) {
    console.warn('[대시보드] reportModel이 없습니다. finalResult를 직접 사용합니다.');
    // 하위 호환성을 위한 fallback: reportModel이 없으면 기존 방식 사용
    // reportModel이 없을 때만 기존 방식으로 검증
  if (!reportModel && (!result.finance || !result.decision || !result.aiConsulting || !result.market)) {
      console.error('[대시보드] 필수 데이터가 없습니다:', {
        hasFinance: !!result.finance,
        hasDecision: !!result.decision,
        hasAiConsulting: !!result.aiConsulting,
        hasMarket: !!result.market
      });
      document.querySelector('.container').innerHTML =
        '<div style="text-align:center; padding:6rem 2rem;">' +
        '<i class="fa-solid fa-exclamation-triangle" style="font-size:4rem; color:#f87171; margin-bottom:1.5rem;"></i>' +
        '<h2 style="margin-bottom:1rem;">분석 데이터가 불완전합니다</h2>' +
        '<p style="color:var(--text-muted); margin-bottom:2rem;">브라우저 콘솔을 확인하세요.</p>' +
        '<a href="../brand/" class="btn-cta">다시 분석하기</a>' +
        '</div>';
      return;
    }
  }

  // reportModel 사용 (있으면 reportModel, 없으면 기존 방식)
  var finance = reportModel ? reportModel.finance : result.finance;
  var decision = reportModel ? { 
    score: reportModel.executive.score,
    signal: reportModel.executive.signal,
    survivalMonths: reportModel.executive.survivalMonths,
    riskFactors: result.decision?.riskFactors || [],
    riskCards: reportModel?.risk?.cards || result.decision?.riskCards || []
  } : result.decision;
  var ai = reportModel ? {
    topRisks: reportModel.risk?.cards?.filter(c => c.ai).map(c => c.ai) || result.aiConsulting?.topRisks || [],
    improvements: reportModel.improvement?.cards?.filter(c => c.ai).map(c => c.ai) || result.aiConsulting?.improvements || [],
    salesScenario: reportModel.scenario?.aiSalesScenario || result.aiConsulting?.salesScenario,
    competitiveAnalysis: reportModel.competitive || result.aiConsulting?.competitiveAnalysis
  } : result.aiConsulting;
  
  // reportModel에서 추가 데이터 가져오기
  var executive = reportModel?.executive || null;
  var gap = reportModel?.gap || null;
  var breakdown = reportModel?.breakdown || null;
  var risk = reportModel?.risk || null;
  var improvement = reportModel?.improvement || null;
  var exitPlan = reportModel?.exitPlan || null;
  var failureTriggers = reportModel?.failureTriggers || [];
  var competitive = reportModel?.competitive || result.aiConsulting?.competitiveAnalysis || null;
  var market = reportModel?.market || result.market || null;  // reportModel 우선 사용

  // ── Subtitle ──
  var subtitle = document.getElementById('subtitle');
  subtitle.textContent = (result.location.address || '위치 미확인') + ' · ' + result.brand.name;

  // ── Tabs ──
  var tabBtns = document.querySelectorAll('.tab-btn');
  var tabContents = document.querySelectorAll('.tab-content');

  function switchTab(tabName) {
    for (var j = 0; j < tabBtns.length; j++) tabBtns[j].classList.remove('active');
    for (var j = 0; j < tabContents.length; j++) tabContents[j].classList.remove('active');
    var targetBtn = document.querySelector('.tab-btn[data-tab="' + tabName + '"]');
    if (targetBtn) targetBtn.classList.add('active');
    var targetContent = document.getElementById('tab-' + tabName);
    if (targetContent) targetContent.classList.add('active');
  }

  for (var i = 0; i < tabBtns.length; i++) {
    tabBtns[i].addEventListener('click', function () {
      switchTab(this.getAttribute('data-tab'));
    });
  }

  // URL 파라미터로 탭 자동 선택 (?tab=compare)
  var urlParams = new URLSearchParams(window.location.search);
  var tabParam = urlParams.get('tab');
  if (tabParam) switchTab(tabParam);

  // ═══════════════════════════════════════════
  // TAB 1: Summary
  // ═══════════════════════════════════════════

  // Score Circle
  var score = executive?.score ?? decision?.score ?? 0;
  console.log('[대시보드] 점수:', score);
  var scoreColor = Utils.scoreColor(score);
  var scoreCircle = document.getElementById('scoreCircle');
  if (scoreCircle) {
    scoreCircle.style.setProperty('--score-color', scoreColor);
    setTimeout(function () {
      scoreCircle.style.setProperty('--score-pct', score);
    }, 100);
    var scoreNumEl = document.getElementById('scoreNum');
    if (scoreNumEl) {
      scoreNumEl.textContent = score;
      scoreNumEl.style.color = scoreColor;
    }
  }

  // Signal (executive에서 가져오거나 decision에서 가져옴)
  var signal = executive?.signal ?? decision?.signal ?? 'yellow';
  var sig = Utils.getSignal(signal);
  var signalLabel = executive?.label || sig.label;
  var signalDesc = executive?.summary || (decision.riskFactors && decision.riskFactors[0]) || '';
  
  document.getElementById('signalBadge').innerHTML =
    '<span style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.4rem 1rem; border-radius:20px; background:' + sig.bg + '; color:' + sig.color + '; font-size:0.9rem;">' +
    '<i class="fa-solid ' + sig.icon + '"></i> 창업 \'' + signalLabel + '\' 신호</span>';
  document.getElementById('signalDesc').textContent = signalDesc;

  // Metrics (reportModel 우선 사용)
  var survivalMonths = executive?.survivalMonths ?? decision?.survivalMonths ?? 0;
  var paybackMonths = executive?.paybackMonths ?? finance?.paybackMonths ?? 999;
  var monthlyProfit = executive?.monthlyProfit ?? finance?.monthlyProfit ?? 0;
  var monthlyRevenue = finance?.monthlyRevenue ?? 0;
  var breakEvenDailySales = executive?.breakEvenDailySales ?? finance?.breakEvenDailySales ?? 0;

  console.log('[대시보드] 메트릭:', {
    survivalMonths: survivalMonths,
    paybackMonths: paybackMonths,
    monthlyProfit: monthlyProfit,
    monthlyRevenue: monthlyRevenue,
    breakEvenDailySales: breakEvenDailySales
  });

  var mSurvivalEl = document.getElementById('mSurvival');
  if (mSurvivalEl) {
    mSurvivalEl.textContent = survivalMonths + '개월';
    var mSurvivalSubEl = document.getElementById('mSurvivalSub');
    if (mSurvivalSubEl) {
      mSurvivalSubEl.textContent = survivalMonths >= 36 ? '안정적' : '관리 필요';
    }
  }

  var mPaybackEl = document.getElementById('mPayback');
  if (mPaybackEl) {
    mPaybackEl.textContent = paybackMonths >= 999 ? '회수 불가' : paybackMonths + '개월';
    var mPaybackSubEl = document.getElementById('mPaybackSub');
    if (mPaybackSubEl) {
      mPaybackSubEl.textContent = paybackMonths <= 24 ? '빠른 회수' : paybackMonths <= 36 ? '평균 수준' : '장기 소요';
    }
    if (paybackMonths > 36) {
      mPaybackEl.style.color = '#f87171';
    }
  }

  var mProfitEl = document.getElementById('mProfit');
  if (mProfitEl) {
    mProfitEl.textContent = Utils.formatKRW(monthlyProfit);
    if (monthlyProfit <= 0) {
      mProfitEl.style.color = '#f87171';
      var mProfitSubEl = document.getElementById('mProfitSub');
      if (mProfitSubEl) {
        mProfitSubEl.textContent = '적자';
        mProfitSubEl.style.color = '#f87171';
      }
    } else {
      var margin = monthlyRevenue > 0 ? Math.round(monthlyProfit / monthlyRevenue * 100) : 0;
      var mProfitSubEl = document.getElementById('mProfitSub');
      if (mProfitSubEl) {
        mProfitSubEl.textContent = '마진율 ' + margin + '%';
      }
    }
  }

  var mBreakevenEl = document.getElementById('mBreakeven');
  if (mBreakevenEl) {
    mBreakevenEl.textContent = breakEvenDailySales + '잔/일';
    var mBreakevenSubEl = document.getElementById('mBreakevenSub');
    if (mBreakevenSubEl) {
      mBreakevenSubEl.textContent = '이상 판매 시 흑자 전환';
    }
  }

  // Hardcut Warnings
  var warnings = [];
  if (finance.paybackMonths === null || finance.paybackMonths >= 36) {
    var paybackText = finance.paybackMonths === null
      ? '투자 회수가 불가능한 구조입니다. 구조적 재검토가 필요합니다.'
      : '투자 회수 기간이 ' + finance.paybackMonths + '개월로 36개월을 초과합니다. 구조적 재검토가 필요합니다.';
    warnings.push({ type: 'danger', text: paybackText });
  }
  if (finance.monthlyProfit <= 0) {
    warnings.push({ type: 'danger', text: '월 순이익이 적자(' + Utils.formatKRW(finance.monthlyProfit) + ')입니다. 비용 절감 또는 매출 증대가 시급합니다.' });
  }

  var warnHtml = '';
  for (var w = 0; w < warnings.length; w++) {
    warnHtml += '<div class="alert alert-' + warnings[w].type + '">' +
      '<i class="fa-solid fa-circle-exclamation"></i>' +
      '<span>' + warnings[w].text + '</span></div>';
  }
  document.getElementById('hardcutWarnings').innerHTML = warnHtml;

  // Breakdown Chart 렌더링
  function renderBreakdown(breakdown) {
    if (!breakdown) {
      document.getElementById('breakdownCard').style.display = 'none';
      return;
    }

    document.getElementById('breakdownCard').style.display = 'block';
    
    var items = [
      { label: '회수 기간', value: breakdown.payback || breakdown.paybackMonths || 0, key: 'payback' },
      { label: '수익성', value: breakdown.profitability || 0, key: 'profitability' },
      { label: 'GAP', value: breakdown.gap || 0, key: 'gap' },
      { label: '민감도', value: breakdown.sensitivity || 0, key: 'sensitivity' },
      { label: '고정비', value: breakdown.fixedCost || breakdown.fixedCosts || 0, key: 'fixedCost' },
      { label: 'DSCR', value: breakdown.dscr || 0, key: 'dscr' },
      { label: '상권', value: breakdown.market || 0, key: 'market' },
      { label: '로드뷰', value: breakdown.roadview || 0, key: 'roadview' }
    ];

    var html = '<div class="breakdown-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">';
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var color = item.value >= 80 ? '#4ade80' : item.value >= 60 ? '#facc15' : '#f87171';
      var label = item.value >= 80 ? '우수' : item.value >= 60 ? '양호' : '보통';
      
      html += '<div style="padding:1rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">' +
        '<div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">' + item.label + '</div>' +
        '<div style="font-size:1.8rem; font-weight:700; color:' + color + '; margin-bottom:0.5rem;">' + item.value + '</div>' +
        '<div style="width:100%; height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">' +
        '<div style="width:' + item.value + '%; height:100%; background:' + color + '; transition:width 0.5s;"></div>' +
        '</div>' +
        '<div style="font-size:0.8rem; color:' + color + '; margin-top:0.3rem;">' + label + '</div>' +
        '</div>';
    }
    
    html += '</div>';
    document.getElementById('breakdownChart').innerHTML = html;
  }

  // Breakdown 렌더링 실행
  renderBreakdown(breakdown);

  // Decision Confidence 렌더링
  function renderConfidence(confidence) {
    if (!confidence) {
      document.getElementById('confidenceCard').style.display = 'none';
      return;
    }

    document.getElementById('confidenceCard').style.display = 'block';
    
    var html = '';
    
    // confidence가 객체인 경우
    if (typeof confidence === 'object') {
      var coverageMap = { high: '높음', medium: '보통', low: '낮음' };
      var coverageColor = { high: '#4ade80', medium: '#facc15', low: '#f87171' };
      
      if (confidence.dataCoverage) {
        var coverage = confidence.dataCoverage.toLowerCase();
        html += '<div style="margin-bottom:1rem;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
          '<span style="font-size:0.9rem; color:var(--text-muted);">데이터 커버리지</span>' +
          '<span style="padding:0.3rem 0.8rem; border-radius:20px; background:' + coverageColor[coverage] + '22; color:' + coverageColor[coverage] + '; font-size:0.9rem; font-weight:600;">' + (coverageMap[coverage] || coverage) + '</span>' +
          '</div></div>';
      }
      
      if (confidence.assumptionRisk) {
        var risk = confidence.assumptionRisk.toLowerCase();
        html += '<div style="margin-bottom:1rem;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
          '<span style="font-size:0.9rem; color:var(--text-muted);">가정 리스크</span>' +
          '<span style="padding:0.3rem 0.8rem; border-radius:20px; background:' + coverageColor[risk] + '22; color:' + coverageColor[risk] + '; font-size:0.9rem; font-weight:600;">' + (coverageMap[risk] || risk) + '</span>' +
          '</div></div>';
      }
      
      if (confidence.stability) {
        var stability = confidence.stability.toLowerCase();
        html += '<div style="margin-bottom:1rem;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
          '<span style="font-size:0.9rem; color:var(--text-muted);">판정 안정성</span>' +
          '<span style="padding:0.3rem 0.8rem; border-radius:20px; background:' + coverageColor[stability] + '22; color:' + coverageColor[stability] + '; font-size:0.9rem; font-weight:600;">' + (coverageMap[stability] || stability) + '</span>' +
          '</div></div>';
      }
    } else {
      // confidence가 단순 값인 경우
      var confValue = confidence.toString().toLowerCase();
      var confMap = { high: '높음', medium: '보통', low: '낮음' };
      var confColor = { high: '#4ade80', medium: '#facc15', low: '#f87171' };
      
      html += '<div style="padding:1rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm); text-align:center;">' +
        '<div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">판정 신뢰도</div>' +
        '<div style="font-size:1.5rem; font-weight:700; color:' + (confColor[confValue] || '#94a3b8') + ';">' + (confMap[confValue] || confValue) + '</div>' +
        '</div>';
    }
    
    document.getElementById('confidenceInfo').innerHTML = html || '<p style="color:var(--text-muted); text-align:center; padding:2rem;">신뢰도 정보가 없습니다.</p>';
  }

  // Confidence 렌더링 실행
  renderConfidence(executive?.confidence);

  // Cost Stack Chart
  var costs = finance.monthlyCosts;
  var totalRev = finance.monthlyRevenue;
  var costItems = [
    { label: '재료비', value: costs.materials, color: '#6366f1' },
    { label: '인건비', value: costs.labor, color: '#8b5cf6' },
    { label: '임대료', value: costs.rent, color: '#f87171' },
    { label: '로열티', value: costs.royalty, color: '#fb923c' },
    { label: '마케팅', value: costs.marketing, color: '#38bdf8' },
    { label: '기타', value: costs.utilities + costs.etc, color: '#94a3b8' }
  ];
  var profitItem = { label: '순이익', value: Math.max(0, finance.monthlyProfit), color: '#4ade80' };

  var stackHtml = '<div class="stacked-bar">';
  for (var c = 0; c < costItems.length; c++) {
    var pct = (costItems[c].value / totalRev * 100).toFixed(1);
    stackHtml += '<div class="segment" style="width:' + pct + '%; background:' + costItems[c].color + ';" title="' + costItems[c].label + ' ' + pct + '%"></div>';
  }
  if (finance.monthlyProfit > 0) {
    var profitPct = (profitItem.value / totalRev * 100).toFixed(1);
    stackHtml += '<div class="segment" style="width:' + profitPct + '%; background:' + profitItem.color + ';" title="순이익 ' + profitPct + '%"></div>';
  }
  stackHtml += '</div>';

  stackHtml += '<div class="stacked-legend">';
  for (var c = 0; c < costItems.length; c++) {
    stackHtml += '<div class="item"><span class="dot" style="background:' + costItems[c].color + ';"></span>' + costItems[c].label + ' ' + Utils.formatKRW(costItems[c].value) + '</div>';
  }
  if (finance.monthlyProfit > 0) {
    stackHtml += '<div class="item"><span class="dot" style="background:' + profitItem.color + ';"></span>순이익 ' + Utils.formatKRW(profitItem.value) + '</div>';
  }
  stackHtml += '</div>';
  stackHtml += '<p style="color:var(--text-muted); font-size:0.8rem; margin-top:0.75rem;">월 매출 ' + Utils.formatKRW(totalRev) + ' 기준</p>';

  document.getElementById('costStack').innerHTML = stackHtml;

  // Sensitivity Chart
  var sensData = [
    { label: '-10%', value: finance.sensitivity.minus10.monthlyProfit, months: finance.sensitivity.minus10.paybackMonths === null ? 999 : finance.sensitivity.minus10.paybackMonths },
    { label: '기준', value: finance.monthlyProfit, months: paybackMonths },
    { label: '+10%', value: finance.sensitivity.plus10.monthlyProfit, months: finance.sensitivity.plus10.paybackMonths === null ? 999 : finance.sensitivity.plus10.paybackMonths }
  ];

  var maxVal = 0;
  for (var s = 0; s < sensData.length; s++) {
    if (Math.abs(sensData[s].value) > maxVal) maxVal = Math.abs(sensData[s].value);
  }

  var sensHtml = '';
  for (var s = 0; s < sensData.length; s++) {
    var heightPct = maxVal > 0 ? Math.abs(sensData[s].value) / maxVal * 80 : 10;
    var barColor = sensData[s].value > 0 ? '#4ade80' : '#f87171';
    if (s === 1) barColor = 'var(--gold)';
    sensHtml += '<div class="bar-col">' +
      '<div class="bar-value">' + Utils.formatKRW(sensData[s].value) + '</div>' +
      '<div class="bar" style="height:' + heightPct + '%; background:' + barColor + ';"></div>' +
      '<div class="bar-label">' + sensData[s].label + '</div>' +
      '<div class="bar-label" style="font-size:0.7rem;">(' + (sensData[s].months >= 999 ? '회수불가' : sensData[s].months + '개월') + ')</div>' +
      '</div>';
  }
  document.getElementById('sensitivityChart').innerHTML = sensHtml;

  // ═══════════════════════════════════════════
  // TAB 2: AI Detail
  // ═══════════════════════════════════════════

  // Risks (reportModel의 병합된 risk cards 사용)
  var riskHtml = '';
  var risksToShow = [];
  
  if (risk && risk.cards && risk.cards.length > 0) {
    // reportModel의 병합된 risk cards 사용
    risksToShow = risk.cards.map(function(card) {
      // engine과 ai가 모두 있으면 ai의 narrative를 우선 사용
      if (card.ai) {
        return {
          title: card.ai.title || card.engine?.title || '',
          description: card.ai.description || card.engine?.narrative || '',
          impact: card.severity || card.ai.impact || 'medium'
        };
      } else if (card.engine) {
        return {
          title: card.engine.title || '',
          description: card.engine.narrative || '',
          impact: card.severity || 'medium'
        };
      }
      return null;
    }).filter(function(r) { return r !== null; });
  } else if (ai && ai.topRisks && ai.topRisks.length > 0) {
    // fallback: 기존 ai.topRisks 사용
    risksToShow = ai.topRisks;
  }
  
  for (var r = 0; r < risksToShow.length; r++) {
    var riskItem = risksToShow[r];
    var ic = Utils.impactColor(riskItem.impact);
    riskHtml += '<div class="risk-card">' +
      '<div class="risk-icon" style="background:' + ic + '22; color:' + ic + ';"><i class="fa-solid fa-' + (riskItem.impact === 'high' ? 'fire' : riskItem.impact === 'medium' ? 'exclamation' : 'info') + '"></i></div>' +
      '<div class="risk-body"><h4>' + Utils.escapeHtml(riskItem.title) + '</h4><p>' + Utils.escapeHtml(riskItem.description) + '</p></div>' +
      '</div>';
  }
  document.getElementById('riskList').innerHTML = riskHtml;

  // Improvements (reportModel의 병합된 improvement cards 사용)
  var impHtml = '';
  var improvementsToShow = [];
  
  if (improvement && improvement.cards && improvement.cards.length > 0) {
    // reportModel의 병합된 improvement cards 사용
    improvementsToShow = improvement.cards.map(function(card) {
      // engine과 ai가 모두 있으면 ai의 description을 우선 사용
      if (card.ai) {
        return {
          title: card.ai.title || card.engine?.title || '',
          description: card.ai.description || card.engine?.description || '',
          expectedImpact: card.ai.expectedImpact || ''
        };
      } else if (card.engine) {
        return {
          title: card.engine.title || '',
          description: card.engine.description || '',
          expectedImpact: ''
        };
      }
      return null;
    }).filter(function(imp) { return imp !== null; });
  } else if (ai && ai.improvements && ai.improvements.length > 0) {
    // fallback: 기존 ai.improvements 사용
    improvementsToShow = ai.improvements;
  }
  
  for (var im = 0; im < improvementsToShow.length; im++) {
    var imp = improvementsToShow[im];
    impHtml += '<div class="risk-card">' +
      '<div class="risk-icon" style="background:rgba(74,222,128,0.15); color:#4ade80;"><i class="fa-solid fa-lightbulb"></i></div>' +
      '<div class="risk-body"><h4>' + Utils.escapeHtml(imp.title) + '</h4><p>' + Utils.escapeHtml(imp.description) + '</p>' +
      (imp.expectedImpact ? '<span style="font-size:0.8rem; color:var(--gold);">' + Utils.escapeHtml(imp.expectedImpact) + '</span>' : '') + '</div>' +
      '</div>';
  }
  document.getElementById('improvementList').innerHTML = impHtml;

  // Competitive Analysis
  var comp = ai?.competitiveAnalysis || competitive || { intensity: 'medium', differentiation: 'possible', priceStrategy: 'standard' };
  var intensityMap = { high: { pct: 85, label: '높음' }, medium: { pct: 55, label: '보통' }, low: { pct: 25, label: '낮음' } };
  var diffMap = { possible: '차별화 가능', difficult: '차별화 어려움', impossible: '차별화 불가' };
  var priceMap = { premium: '프리미엄 전략', standard: '표준 가격', budget: '저가 전략' };

  var intens = intensityMap[comp?.intensity] || intensityMap.medium;
  document.getElementById('competitiveInfo').innerHTML =
    '<div class="comp-grid">' +
    '<div class="comp-item"><div class="comp-label">경쟁 강도</div><div class="comp-value">' + intens.label + '</div>' +
    '<div class="intensity-bar"><div class="fill" style="width:' + intens.pct + '%; background:' + (intens.pct > 70 ? '#f87171' : intens.pct > 40 ? '#facc15' : '#4ade80') + ';"></div></div></div>' +
    '<div class="comp-item"><div class="comp-label">차별화 가능성</div><div class="comp-value">' + (diffMap[comp.differentiation] || comp.differentiation) + '</div></div>' +
    '<div class="comp-item"><div class="comp-label">가격 전략</div><div class="comp-value">' + (priceMap[comp.priceStrategy] || comp.priceStrategy) + '</div></div>' +
    '</div>' +
    '<div style="margin-top:1.5rem;">' +
    '<p style="color:var(--text-muted); font-size:0.9rem;">반경 ' + (market?.location?.radius || 500) + 'm 내 경쟁점 <strong style="color:var(--text-main);">' + (market?.competitors?.total || 0) + '개</strong> (동일 브랜드 ' + (market?.competitors?.sameBrand || 0) + '개 포함)</p>' +
    '</div>';

  // Failure Triggers 렌더링
  var failureTriggersHtml = '';
  if (failureTriggers && failureTriggers.length > 0) {
    var impactColorMap = {
      critical: '#f87171',
      high: '#fb923c',
      medium: '#facc15',
      low: '#94a3b8'
    };
    var impactLabelMap = {
      critical: '치명적',
      high: '높음',
      medium: '보통',
      low: '낮음'
    };
    
    for (var ft = 0; ft < failureTriggers.length; ft++) {
      var trigger = failureTriggers[ft];
      var impactColor = impactColorMap[trigger.impact] || '#94a3b8';
      var impactLabel = impactLabelMap[trigger.impact] || trigger.impact;
      
      failureTriggersHtml += '<div class="risk-card" style="margin-bottom:1rem;">' +
        '<div class="risk-icon" style="background:' + impactColor + '22; color:' + impactColor + ';">' +
        '<i class="fa-solid fa-exclamation-triangle"></i></div>' +
        '<div class="risk-body">' +
        '<h4>' + (ft + 1) + '. ' + Utils.escapeHtml(trigger.trigger || '') + ' <span style="font-size:0.8rem; color:' + impactColor + '; font-weight:600;">(' + impactLabel + ')</span></h4>' +
        '<p style="margin-bottom:0.5rem;"><strong>결과:</strong> ' + Utils.escapeHtml(trigger.outcome || trigger.result || '') + '</p>' +
        (trigger.estimatedFailureWindow ? '<p style="margin-bottom:0.5rem; color:var(--text-muted); font-size:0.9rem;"><strong>예상 실패 시점:</strong> ' + Utils.escapeHtml(trigger.estimatedFailureWindow) + '</p>' : '') +
        (trigger.totalLossAtFailure !== undefined ? '<p style="margin-bottom:0.5rem; color:var(--text-muted); font-size:0.9rem;"><strong>그때 총손실:</strong> ' + Utils.formatKRW(trigger.totalLossAtFailure) + '</p>' : '') +
        (trigger.exitCostAtFailure !== undefined ? '<p style="color:var(--text-muted); font-size:0.9rem;"><strong>그때 Exit 비용:</strong> ' + Utils.formatKRW(trigger.exitCostAtFailure) + '</p>' : '') +
        '</div></div>';
    }
  } else {
    failureTriggersHtml = '<p style="color:var(--text-muted); text-align:center; padding:2rem;">실패 트리거가 없습니다.</p>';
  }
  document.getElementById('failureTriggersList').innerHTML = failureTriggersHtml;

  // ═══════════════════════════════════════════
  // TAB 3: Compare
  // ═══════════════════════════════════════════

  // Before/After (rent -10%)
  var rentReduced = Math.round(costs.rent * 0.9);
  var profitAfter = finance.monthlyProfit + Math.round(costs.rent * 0.1);
  var paybackAfter = profitAfter > 0 ? Math.ceil((result.finance.monthlyCosts.rent > 0 ? (finance.paybackMonths * finance.monthlyProfit) : 0) / profitAfter) : 999;
  // Simpler payback recalc
  var input = Utils.loadSession('analysisInput');
  var investment = input ? input.conditions.initialInvestment : 0;
  paybackAfter = profitAfter > 0 ? Math.ceil(investment / profitAfter) : 999;

  document.getElementById('compareSection').innerHTML =
    '<div class="compare-grid">' +
    '<div class="compare-box"><div class="compare-label">Before (현재)</div>' +
    '<div class="compare-val" style="color:var(--text-muted);">월세 ' + Utils.formatKRW(costs.rent) + '</div>' +
    '<div style="margin-top:1rem; font-size:0.9rem; color:var(--text-muted);">순이익 ' + Utils.formatKRW(finance.monthlyProfit) + '</div>' +
    '<div style="font-size:0.9rem; color:var(--text-muted);">회수 ' + (finance.paybackMonths >= 999 ? '불가' : finance.paybackMonths + '개월') + '</div></div>' +
    '<div class="compare-arrow"><i class="fa-solid fa-arrow-right"></i></div>' +
    '<div class="compare-box" style="border-color:rgba(74,222,128,0.3);"><div class="compare-label" style="color:var(--primary-glow);">After (월세 10% 절감)</div>' +
    '<div class="compare-val" style="color:var(--primary-glow);">월세 ' + Utils.formatKRW(rentReduced) + '</div>' +
    '<div style="margin-top:1rem; font-size:0.9rem; color:var(--primary-glow);">순이익 ' + Utils.formatKRW(profitAfter) + '</div>' +
    '<div style="font-size:0.9rem; color:var(--primary-glow);">회수 ' + (paybackAfter >= 999 ? '불가' : paybackAfter + '개월') + '</div></div>' +
    '</div>';

  // Scenario comparison chart (reportModel의 scenario 사용)
  var scenarios = reportModel?.scenario?.aiSalesScenario ?? ai?.salesScenario ?? { conservative: 200, expected: 250, optimistic: 300 };
  // result.brand에 이미 정보가 있거나, API에서 가져오기
  var brand = result.brand;
  var brandPosition = brand.position || (brand.id ? null : '스탠다드'); // 기본값
  
  // 브랜드 정보가 부족하면 API에서 가져오기
  if (!brandPosition && brand.id) {
    var apiBaseUrl = window.API_CONFIG ? window.API_CONFIG.API_BASE_URL : 
                     (window.location.protocol + '//' + window.location.hostname + ':3000');
    fetch(apiBaseUrl + '/api/brands')
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data.success && data.brands) {
          var foundBrand = data.brands.find(function(b) { return b.id === brand.id; });
          if (foundBrand) {
            brandPosition = foundBrand.position;
            updateScenarioChart(foundBrand.position);
          }
        }
      })
      .catch(function(error) {
        console.warn('브랜드 정보를 가져올 수 없어 기본값 사용:', error);
        updateScenarioChart('스탠다드');
      });
  } else {
    updateScenarioChart(brandPosition || '스탠다드');
  }
  
  function updateScenarioChart(position) {
    var avgPrice = position === '프리미엄' ? 5500 : position === '스탠다드' ? 4000 : 3000;

    var scenRevs = [
      { label: '보수적', daily: scenarios.conservative },
      { label: '기대치', daily: scenarios.expected },
      { label: '낙관적', daily: scenarios.optimistic }
    ];

    var maxRev = 0;
    for (var sc = 0; sc < scenRevs.length; sc++) {
      var rev = scenRevs[sc].daily * avgPrice * 30;
      scenRevs[sc].revenue = rev;
      if (rev > maxRev) maxRev = rev;
    }

  var scenHtml = '';
  var scenColors = ['#94a3b8', 'var(--gold)', '#4ade80'];
  for (var sc = 0; sc < scenRevs.length; sc++) {
    var hPct = maxRev > 0 ? scenRevs[sc].revenue / maxRev * 80 : 10;
    scenHtml += '<div class="bar-col">' +
      '<div class="bar-value">' + Utils.formatKRW(scenRevs[sc].revenue) + '</div>' +
      '<div class="bar" style="height:' + hPct + '%; background:' + scenColors[sc] + ';"></div>' +
      '<div class="bar-label">' + scenRevs[sc].label + '</div>' +
      '<div class="bar-label" style="font-size:0.7rem;">' + scenRevs[sc].daily + '잔/일</div>' +
      '</div>';
  }
  document.getElementById('scenarioChart').innerHTML = scenHtml;
  } // end updateScenarioChart

  // ═══════════════════════════════════════════
  // Simulation Save / Load / Compare
  // ═══════════════════════════════════════════

  // Save button
  var btnSave = document.getElementById('btnSave');
  if (btnSave) {
    btnSave.addEventListener('click', function () {
      Utils.saveSimulation(result, input);
      btnSave.innerHTML = '<i class="fa-solid fa-check" style="margin-right:0.5rem;"></i> 저장됨';
      btnSave.style.borderColor = 'var(--primary-glow)';
      // Show toast
      var toast = document.getElementById('saveToast');
      toast.classList.add('show');
      setTimeout(function () { toast.classList.remove('show'); }, 2000);
      // Refresh saved list
      renderSavedSimulations();
    });
  }

  function renderSavedSimulations() {
    var sims = Utils.loadSimulations();
    var container = document.getElementById('savedSimList');
    if (!container) return;

    if (sims.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem; text-align:center; padding:2rem;">' +
        '<i class="fa-solid fa-bookmark" style="font-size:1.5rem; display:block; margin-bottom:0.5rem; opacity:0.3;"></i>' +
        '저장된 시뮬레이션이 없습니다. 위 "저장" 버튼으로 현재 결과를 저장하세요.</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < sims.length; i++) {
      var sim = sims[i];
      var isCurrent = sim.id === result.id;
      var sigInfo = Utils.getSignal(sim.signal);
      var profitColor = sim.monthlyProfit > 0 ? '#4ade80' : '#f87171';

      html += '<div class="sim-row' + (isCurrent ? ' current' : '') + '" data-sim-id="' + sim.id + '">' +
        '<div class="sim-info">' +
        '<span class="sim-brand">' + Utils.escapeHtml(sim.brandName) + '</span>' +
        '<span class="sim-metric">점수 <strong style="color:' + sigInfo.color + ';">' + sim.score + '</strong></span>' +
        '<span class="sim-metric">순이익 <strong style="color:' + profitColor + ';">' + Utils.formatKRW(sim.monthlyProfit) + '</strong></span>' +
        '<span class="sim-metric">회수 <strong>' + (sim.paybackMonths >= 999 ? '불가' : sim.paybackMonths + '개월') + '</strong></span>' +
        '<span class="sim-metric" style="font-size:0.75rem;">' + Utils.escapeHtml(sim.address || '') + '</span>' +
        (isCurrent ? '<span style="color:var(--gold); font-size:0.75rem; font-weight:600;">현재</span>' : '') +
        '</div>' +
        '<div class="sim-actions">' +
        (isCurrent ? '' : '<button class="sim-btn-sm btn-compare" data-idx="' + i + '">비교</button>') +
        '<button class="sim-btn-sm danger btn-delete" data-sim-id="' + sim.id + '"><i class="fa-solid fa-trash"></i></button>' +
        '</div>' +
        '</div>';
    }

    container.innerHTML = html;

    // Attach compare handlers
    var compareBtns = container.querySelectorAll('.btn-compare');
    for (var c = 0; c < compareBtns.length; c++) {
      compareBtns[c].addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'));
        showSimComparison(sims[idx]);
      });
    }

    // Attach delete handlers
    var deleteBtns = container.querySelectorAll('.btn-delete');
    for (var d = 0; d < deleteBtns.length; d++) {
      deleteBtns[d].addEventListener('click', function () {
        var simId = this.getAttribute('data-sim-id');
        Utils.deleteSimulation(simId);
        renderSavedSimulations();
      });
    }
  }

  function showSimComparison(savedSim) {
    if (!savedSim || !savedSim.result) return;
    var other = savedSim.result;

    // Update the Before/After section to show saved vs current
    var compareHtml =
      '<div class="compare-grid">' +
      '<div class="compare-box"><div class="compare-label">저장된 분석</div>' +
      '<div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;">' + Utils.escapeHtml(other.brand.name) + ' · ' + Utils.escapeHtml(other.location.address || '') + '</div>' +
      '<div class="compare-val" style="color:var(--text-muted);">점수 ' + other.decision.score + '</div>' +
      '<div style="margin-top:0.75rem; font-size:0.9rem; color:var(--text-muted);">순이익 ' + Utils.formatKRW(other.finance.monthlyProfit) + '</div>' +
      '<div style="font-size:0.9rem; color:var(--text-muted);">회수 ' + (other.finance.paybackMonths >= 999 ? '불가' : other.finance.paybackMonths + '개월') + '</div></div>' +
      '<div class="compare-arrow"><i class="fa-solid fa-arrow-right"></i></div>' +
      '<div class="compare-box" style="border-color:rgba(74,222,128,0.3);"><div class="compare-label" style="color:var(--primary-glow);">현재 분석</div>' +
      '<div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;">' + Utils.escapeHtml(result.brand.name) + ' · ' + Utils.escapeHtml(result.location.address || '') + '</div>' +
      '<div class="compare-val" style="color:var(--primary-glow);">점수 ' + decision.score + '</div>' +
      '<div style="margin-top:0.75rem; font-size:0.9rem; color:var(--primary-glow);">순이익 ' + Utils.formatKRW(finance.monthlyProfit) + '</div>' +
      '<div style="font-size:0.9rem; color:var(--primary-glow);">회수 ' + (finance.paybackMonths >= 999 ? '불가' : finance.paybackMonths + '개월') + '</div></div>' +
      '</div>';

    // Score diff
    var scoreDiff = decision.score - other.decision.score;
    var profitDiff = finance.monthlyProfit - other.finance.monthlyProfit;
    compareHtml += '<div style="text-align:center; margin-top:1.5rem; padding:1rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">' +
      '<span style="margin-right:2rem;">점수 변화: <strong style="color:' + (scoreDiff >= 0 ? '#4ade80' : '#f87171') + ';">' + (scoreDiff >= 0 ? '+' : '') + scoreDiff + '점</strong></span>' +
      '<span>순이익 변화: <strong style="color:' + (profitDiff >= 0 ? '#4ade80' : '#f87171') + ';">' + (profitDiff >= 0 ? '+' : '') + Utils.formatKRW(profitDiff) + '</strong></span>' +
      '</div>';

    document.getElementById('compareSection').innerHTML = compareHtml;

    // Scroll to compare section
    document.getElementById('compareSection').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Initial render of saved simulations
  renderSavedSimulations();

  // Exit Plan 렌더링
  function renderExitPlan(exitPlan) {
    if (!exitPlan) {
      document.getElementById('exitPlanSection').innerHTML =
        '<p style="color:var(--text-muted); text-align:center; padding:2rem;">Exit Plan 데이터가 없습니다.</p>';
      return;
    }

    var html = '';
    
    // 손절 타이밍 테이블
    if (exitPlan.optimalExitMonth || exitPlan.warningMonth) {
      html += '<div style="margin-bottom:2rem;">' +
        '<h4 style="margin-bottom:1rem;">손절 타이밍</h4>' +
        '<table style="width:100%; border-collapse:collapse;">' +
        '<thead><tr style="background:rgba(255,255,255,0.05);">' +
        '<th style="padding:0.75rem; text-align:left; border-bottom:1px solid rgba(255,255,255,0.1);">구분</th>' +
        '<th style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.1);">시점</th>' +
        '<th style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.1);">총손실</th>' +
        '</tr></thead><tbody>';

      if (exitPlan.warningMonth) {
        html += '<tr>' +
          '<td style="padding:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">경고 구간</td>' +
          '<td style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.05);">' + exitPlan.warningMonth + '개월</td>' +
          '<td style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.05);">' + Utils.formatKRW(exitPlan.totalLossAtWarning || 0) + '</td>' +
          '</tr>';
      }

      if (exitPlan.optimalExitMonth) {
        html += '<tr style="background:rgba(74,222,128,0.1);">' +
          '<td style="padding:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);"><strong>최적 손절</strong></td>' +
          '<td style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.05);"><strong>' + exitPlan.optimalExitMonth + '개월</strong></td>' +
          '<td style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.05);"><strong>' + Utils.formatKRW(exitPlan.totalLossAtOptimal || 0) + '</strong></td>' +
          '</tr>';
      }

      if (exitPlan.lossExplosionMonth) {
        html += '<tr>' +
          '<td style="padding:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">손실 폭증</td>' +
          '<td style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.05);">' + exitPlan.lossExplosionMonth + '개월</td>' +
          '<td style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.05);">' + Utils.formatKRW(exitPlan.totalLossAtExplosion || 0) + '</td>' +
          '</tr>';
      }

      html += '</tbody></table></div>';
    }

    // 폐업 비용 상세
    if (exitPlan.exitCostBreakdown) {
      var breakdown = exitPlan.exitCostBreakdown;
      html += '<div>' +
        '<h4 style="margin-bottom:1rem;">폐업 비용 상세 (' + (exitPlan.optimalExitMonth || 0) + '개월 기준)</h4>' +
        '<table style="width:100%; border-collapse:collapse;">' +
        '<thead><tr style="background:rgba(255,255,255,0.05);">' +
        '<th style="padding:0.75rem; text-align:left; border-bottom:1px solid rgba(255,255,255,0.1);">항목</th>' +
        '<th style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.1);">금액</th>' +
        '</tr></thead><tbody>';

      if (breakdown.penaltyCost !== undefined) {
        html += '<tr><td style="padding:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">가맹 위약금</td>' +
          '<td style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.05);">' + Utils.formatKRW(breakdown.penaltyCost || 0) + '</td></tr>';
      }
      if (breakdown.demolitionCost !== undefined) {
        html += '<tr><td style="padding:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">철거/원상복구</td>' +
          '<td style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.05);">' + Utils.formatKRW(breakdown.demolitionCost || 0) + '</td></tr>';
      }
      if (breakdown.interiorLoss !== undefined) {
        html += '<tr><td style="padding:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">인테리어/설비 손실(비회수)</td>' +
          '<td style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.05);">' + Utils.formatKRW(breakdown.interiorLoss || 0) + '</td></tr>';
      }
      if (breakdown.goodwillRecovered !== undefined && breakdown.goodwillRecovered !== 0) {
        html += '<tr><td style="padding:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">권리금 회수(감액)</td>' +
          '<td style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.05); color:#4ade80;">-' + Utils.formatKRW(Math.abs(breakdown.goodwillRecovered || 0)) + '</td></tr>';
      }
      if (breakdown.exitCostTotal !== undefined) {
        html += '<tr style="background:rgba(255,255,255,0.05);">' +
          '<td style="padding:0.75rem; border-bottom:1px solid rgba(255,255,255,0.1);"><strong>Exit Cost 합계</strong></td>' +
          '<td style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.1);"><strong>' + Utils.formatKRW(breakdown.exitCostTotal || 0) + '</strong></td>' +
          '</tr>';
      }
      if (breakdown.cumOperatingLoss !== undefined) {
        html += '<tr><td style="padding:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">운영손실 누적(폐업 시점까지)</td>' +
          '<td style="padding:0.75rem; text-align:right; border-bottom:1px solid rgba(255,255,255,0.05);">' + Utils.formatKRW(breakdown.cumOperatingLoss || 0) + '</td></tr>';
      }
      if (exitPlan.totalLossAtOptimal !== undefined) {
        html += '<tr style="background:rgba(239,68,68,0.1);">' +
          '<td style="padding:0.75rem;"><strong>최종 총손실</strong></td>' +
          '<td style="padding:0.75rem; text-align:right;"><strong style="color:#f87171;">' + Utils.formatKRW(exitPlan.totalLossAtOptimal) + '</strong></td>' +
          '</tr>';
      }

      html += '</tbody></table></div>';
    }

    document.getElementById('exitPlanSection').innerHTML = html || '<p style="color:var(--text-muted); text-align:center; padding:2rem;">Exit Plan 데이터가 없습니다.</p>';
  }

  // Exit Plan 렌더링 실행
  renderExitPlan(exitPlan);

  // ═══════════════════════════════════════════
  // TAB 3: 입지-상권분석
  // ═══════════════════════════════════════════

  // reportModel에서 market과 roadview 데이터 가져오기 (이미 위에서 market 변수로 가져옴)
  var marketData = market;  // reportModel 우선 사용 (위에서 이미 설정됨)
  var roadviewData = reportModel?.roadview || result.roadview || null;

  // 입지 분석 (Roadview) 렌더링
  function renderRoadviewAnalysis(roadview) {
    if (!roadview) {
      document.getElementById('roadviewRisks').innerHTML =
        '<p style="color:var(--text-muted); text-align:center; padding:2rem;">입지 분석 데이터가 없습니다.</p>';
      document.getElementById('roadviewSummary').innerHTML = '';
      return;
    }

    var risks = roadview.risks || [];
    var riskHtml = '';

    // 리스크 타입별 아이콘 및 라벨 매핑
    var riskTypeMap = {
      signage_obstruction: { icon: 'fa-sign', label: '간판 가시성', color: '#f87171' },
      steep_slope: { icon: 'fa-mountain', label: '경사도', color: '#fb923c' },
      floor_level: { icon: 'fa-building', label: '층위', color: '#38bdf8' },
      visibility: { icon: 'fa-eye', label: '보행 가시성', color: '#4ade80' }
    };

    // 레벨별 색상
    var levelColorMap = {
      low: '#4ade80',
      medium: '#facc15',
      high: '#f87171',
      ground: '#4ade80',
      half_basement: '#facc15',
      second_floor: '#f87171'
    };

    // 레벨별 한글 라벨
    var levelLabelMap = {
      low: '낮음',
      medium: '보통',
      high: '높음',
      ground: '1층',
      half_basement: '반지하',
      second_floor: '2층 이상'
    };

    for (var r = 0; r < risks.length; r++) {
      var risk = risks[r];
      var typeInfo = riskTypeMap[risk.type] || { icon: 'fa-circle-info', label: risk.type, color: '#94a3b8' };
      var levelColor = levelColorMap[risk.level] || '#94a3b8';
      var levelLabel = levelLabelMap[risk.level] || risk.level;

      riskHtml += '<div class="risk-card" style="margin-bottom:1rem;">' +
        '<div class="risk-icon" style="background:' + typeInfo.color + '22; color:' + typeInfo.color + ';">' +
        '<i class="fa-solid ' + typeInfo.icon + '"></i></div>' +
        '<div class="risk-body">' +
        '<h4>' + typeInfo.label + ' <span style="font-size:0.8rem; color:' + levelColor + '; font-weight:600;">(' + levelLabel + ')</span></h4>' +
        '<p>' + Utils.escapeHtml(risk.description || '') + '</p>' +
        '</div></div>';
    }

    document.getElementById('roadviewRisks').innerHTML = riskHtml;

    // 종합 평가
    var overallRisk = roadview.overallRisk || 'medium';
    var riskScore = roadview.riskScore !== null && roadview.riskScore !== undefined ? roadview.riskScore : 50;
    var overallColor = overallRisk === 'low' ? '#4ade80' : overallRisk === 'high' ? '#f87171' : '#facc15';
    var overallLabel = overallRisk === 'low' ? '낮음' : overallRisk === 'high' ? '높음' : '보통';

    var summaryHtml = '<div style="padding:1.5rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm); border:1px solid rgba(255,255,255,0.1);">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">' +
      '<div><h4 style="margin:0; margin-bottom:0.5rem;">종합 리스크 평가</h4>' +
      '<div style="display:flex; align-items:center; gap:0.5rem;">' +
      '<span style="padding:0.3rem 0.8rem; border-radius:20px; background:' + overallColor + '22; color:' + overallColor + '; font-size:0.9rem; font-weight:600;">' + overallLabel + '</span>' +
      '<span style="color:var(--text-muted); font-size:0.9rem;">리스크 점수: <strong style="color:' + overallColor + ';">' + riskScore + '</strong> / 100</span>' +
      '</div></div></div>';

    // 메타데이터가 있으면 강점/약점 표시
    if (roadview.metadata) {
      if (roadview.metadata.strengths && roadview.metadata.strengths.length > 0) {
        summaryHtml += '<div style="margin-top:1rem;"><strong style="color:#4ade80;">강점:</strong><ul style="margin:0.5rem 0; padding-left:1.5rem; color:var(--text-muted);">';
        for (var s = 0; s < roadview.metadata.strengths.length; s++) {
          summaryHtml += '<li>' + Utils.escapeHtml(roadview.metadata.strengths[s]) + '</li>';
        }
        summaryHtml += '</ul></div>';
      }
      if (roadview.metadata.weaknesses && roadview.metadata.weaknesses.length > 0) {
        summaryHtml += '<div style="margin-top:1rem;"><strong style="color:#f87171;">약점:</strong><ul style="margin:0.5rem 0; padding-left:1.5rem; color:var(--text-muted);">';
        for (var w = 0; w < roadview.metadata.weaknesses.length; w++) {
          summaryHtml += '<li>' + Utils.escapeHtml(roadview.metadata.weaknesses[w]) + '</li>';
        }
        summaryHtml += '</ul></div>';
      }
    }

    summaryHtml += '</div>';
    document.getElementById('roadviewSummary').innerHTML = summaryHtml;
  }

  // 상권 분석 (Market) 렌더링
  function renderMarketAnalysis(market) {
    if (!market) {
      document.getElementById('marketCompetitors').innerHTML =
        '<p style="color:var(--text-muted); text-align:center; padding:2rem;">상권 분석 데이터가 없습니다.</p>';
      document.getElementById('marketFootTraffic').innerHTML = '';
      document.getElementById('marketScore').innerHTML = '';
      return;
    }

    // 경쟁 현황
    var competitors = market.competitors || {};
    var total = competitors.total || 0;
    var sameBrand = competitors.sameBrand || 0;
    var otherBrands = competitors.otherBrands || 0;
    var density = competitors.density || 'medium';
    var densityLabel = density === 'high' ? '높음' : density === 'low' ? '낮음' : '보통';
    var densityColor = density === 'high' ? '#f87171' : density === 'low' ? '#4ade80' : '#facc15';
    var radius = market.location?.radius || 500;

    var competitorsHtml = '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem;">' +
      '<div style="padding:1rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">' +
      '<div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">총 경쟁 카페</div>' +
      '<div style="font-size:2rem; font-weight:700; color:var(--text-main);">' + total + '개</div>' +
      '<div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.3rem;">반경 ' + radius + 'm 내</div>' +
      '</div>' +
      '<div style="padding:1rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">' +
      '<div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">동일 브랜드</div>' +
      '<div style="font-size:2rem; font-weight:700; color:var(--gold);">' + sameBrand + '개</div>' +
      '</div>' +
      '<div style="padding:1rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">' +
      '<div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">타 브랜드</div>' +
      '<div style="font-size:2rem; font-weight:700; color:var(--text-main);">' + otherBrands + '개</div>' +
      '</div>' +
      '<div style="padding:1rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">' +
      '<div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">경쟁 밀도</div>' +
      '<div style="font-size:1.5rem; font-weight:700; color:' + densityColor + ';">' + densityLabel + '</div>' +
      '</div>' +
      '</div>';

    document.getElementById('marketCompetitors').innerHTML = competitorsHtml;

    // 유동인구 정보
    var footTraffic = market.footTraffic || {};
    var weekday = footTraffic.weekday || 'medium';
    var weekend = footTraffic.weekend || 'medium';
    var peakHours = footTraffic.peakHours || [];

    var trafficLabelMap = { low: '낮음', medium: '보통', high: '높음' };
    var trafficColorMap = { low: '#94a3b8', medium: '#facc15', high: '#4ade80' };

    var footTrafficHtml = '<div style="padding:1.5rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">' +
      '<h4 style="margin:0; margin-bottom:1rem;">유동인구 추정</h4>' +
      '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:1rem;">' +
      '<div><div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.3rem;">평일</div>' +
      '<div style="font-size:1.2rem; font-weight:600; color:' + trafficColorMap[weekday] + ';">' + trafficLabelMap[weekday] + '</div></div>' +
      '<div><div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.3rem;">주말</div>' +
      '<div style="font-size:1.2rem; font-weight:600; color:' + trafficColorMap[weekend] + ';">' + trafficLabelMap[weekend] + '</div></div>' +
      '</div>';

    if (peakHours.length > 0) {
      footTrafficHtml += '<div style="margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.1);">' +
        '<div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">피크 시간대</div>' +
        '<div style="display:flex; gap:0.5rem; flex-wrap:wrap;">';
      for (var p = 0; p < peakHours.length; p++) {
        footTrafficHtml += '<span style="padding:0.3rem 0.8rem; background:rgba(74,222,128,0.15); color:#4ade80; border-radius:20px; font-size:0.85rem;">' + peakHours[p] + '</span>';
      }
      footTrafficHtml += '</div></div>';
    }

    footTrafficHtml += '</div>';
    document.getElementById('marketFootTraffic').innerHTML = footTrafficHtml;

    // 상권 점수
    var marketScore = market.marketScore !== null && market.marketScore !== undefined ? market.marketScore : 50;
    var scoreColor = marketScore >= 70 ? '#4ade80' : marketScore >= 50 ? '#facc15' : '#f87171';
    var scoreLabel = marketScore >= 70 ? '양호' : marketScore >= 50 ? '보통' : '주의';

    var scoreHtml = '<div style="padding:1.5rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm); border:1px solid rgba(255,255,255,0.1); text-align:center;">' +
      '<h4 style="margin:0; margin-bottom:1rem;">상권 종합 점수</h4>' +
      '<div style="font-size:3rem; font-weight:700; color:' + scoreColor + '; margin-bottom:0.5rem;">' + marketScore + '</div>' +
      '<div style="font-size:1rem; color:' + scoreColor + '; font-weight:600;">' + scoreLabel + '</div>' +
      '<div style="margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.1);">' +
      '<div style="width:100%; height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">' +
      '<div style="width:' + marketScore + '%; height:100%; background:' + scoreColor + '; transition:width 0.5s;"></div>' +
      '</div></div></div>';

    document.getElementById('marketScore').innerHTML = scoreHtml;
  }

  // 입지-상권분석 렌더링 실행
  renderRoadviewAnalysis(roadviewData);
  renderMarketAnalysis(marketData);

  // ── Header scroll ──
  window.addEventListener('scroll', function () {
    var header = document.getElementById('header');
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  });
})();
