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

  if (!result.finance || !result.decision || !result.aiConsulting || !result.market) {
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

  var finance = result.finance;
  var decision = result.decision;
  var ai = result.aiConsulting;
  var market = result.market;

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
  var score = decision.score || 0;
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

  var sig = Utils.getSignal(decision.signal);
  document.getElementById('signalBadge').innerHTML =
    '<span style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.4rem 1rem; border-radius:20px; background:' + sig.bg + '; color:' + sig.color + '; font-size:0.9rem;">' +
    '<i class="fa-solid ' + sig.icon + '"></i> 창업 \'' + sig.label + '\' 신호</span>';
  document.getElementById('signalDesc').textContent =
    decision.riskFactors && decision.riskFactors[0] ? decision.riskFactors[0] : '';

  // Metrics
  var survivalMonths = decision.survivalMonths || 0;
  var paybackMonths = finance.paybackMonths || 999;
  var monthlyProfit = finance.monthlyProfit || 0;
  var monthlyRevenue = finance.monthlyRevenue || 0;
  var breakEvenDailySales = finance.breakEvenDailySales || 0;

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

  // Risks
  var riskHtml = '';
  for (var r = 0; r < ai.topRisks.length; r++) {
    var risk = ai.topRisks[r];
    var ic = Utils.impactColor(risk.impact);
    riskHtml += '<div class="risk-card">' +
      '<div class="risk-icon" style="background:' + ic + '22; color:' + ic + ';"><i class="fa-solid fa-' + (risk.impact === 'high' ? 'fire' : risk.impact === 'medium' ? 'exclamation' : 'info') + '"></i></div>' +
      '<div class="risk-body"><h4>' + Utils.escapeHtml(risk.title) + '</h4><p>' + Utils.escapeHtml(risk.description) + '</p></div>' +
      '</div>';
  }
  document.getElementById('riskList').innerHTML = riskHtml;

  // Improvements
  var impHtml = '';
  for (var im = 0; im < ai.improvements.length; im++) {
    var imp = ai.improvements[im];
    impHtml += '<div class="risk-card">' +
      '<div class="risk-icon" style="background:rgba(74,222,128,0.15); color:#4ade80;"><i class="fa-solid fa-lightbulb"></i></div>' +
      '<div class="risk-body"><h4>' + Utils.escapeHtml(imp.title) + '</h4><p>' + Utils.escapeHtml(imp.description) + '</p>' +
      '<span style="font-size:0.8rem; color:var(--gold);">' + Utils.escapeHtml(imp.expectedImpact) + '</span></div>' +
      '</div>';
  }
  document.getElementById('improvementList').innerHTML = impHtml;

  // Competitive Analysis
  var comp = ai.competitiveAnalysis;
  var intensityMap = { high: { pct: 85, label: '높음' }, medium: { pct: 55, label: '보통' }, low: { pct: 25, label: '낮음' } };
  var diffMap = { possible: '차별화 가능', difficult: '차별화 어려움', impossible: '차별화 불가' };
  var priceMap = { premium: '프리미엄 전략', standard: '표준 가격', budget: '저가 전략' };

  var intens = intensityMap[comp.intensity] || intensityMap.medium;
  document.getElementById('competitiveInfo').innerHTML =
    '<div class="comp-grid">' +
    '<div class="comp-item"><div class="comp-label">경쟁 강도</div><div class="comp-value">' + intens.label + '</div>' +
    '<div class="intensity-bar"><div class="fill" style="width:' + intens.pct + '%; background:' + (intens.pct > 70 ? '#f87171' : intens.pct > 40 ? '#facc15' : '#4ade80') + ';"></div></div></div>' +
    '<div class="comp-item"><div class="comp-label">차별화 가능성</div><div class="comp-value">' + (diffMap[comp.differentiation] || comp.differentiation) + '</div></div>' +
    '<div class="comp-item"><div class="comp-label">가격 전략</div><div class="comp-value">' + (priceMap[comp.priceStrategy] || comp.priceStrategy) + '</div></div>' +
    '</div>' +
    '<div style="margin-top:1.5rem;">' +
    '<p style="color:var(--text-muted); font-size:0.9rem;">반경 ' + (market.location.radius || 500) + 'm 내 경쟁점 <strong style="color:var(--text-main);">' + market.competitors.total + '개</strong> (동일 브랜드 ' + market.competitors.sameBrand + '개 포함)</p>' +
    '</div>';

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

  // Scenario comparison chart
  var scenarios = ai.salesScenario;
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

  // ── Header scroll ──
  window.addEventListener('scroll', function () {
    var header = document.getElementById('header');
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  });
})();
