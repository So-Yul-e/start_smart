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
  // finance.debt가 없으면 result.finance.debt로 fallback
  if (reportModel && (!finance.debt || finance.debt === null) && result.finance?.debt) {
    finance.debt = result.finance.debt;
  }
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

  // Cost Stack Chart
  var costs = finance.monthlyCosts;
  var totalRev = finance.monthlyRevenue;
  
  // 대출 정보 가져오기
  var debt = finance.debt || null;
  var debtInterest = debt?.monthlyInterest || 0;
  var debtPrincipal = debt?.monthlyPrincipal || 0;
  
  var costItems = [
    { label: '재료비', value: costs.materials, color: '#6366f1' },
    { label: '인건비', value: costs.labor, color: '#8b5cf6' },
    { label: '임대료', value: costs.rent, color: '#f87171' },
    { label: '로열티', value: costs.royalty, color: '#fb923c' },
    { label: '마케팅', value: costs.marketing, color: '#38bdf8' },
    { label: '기타', value: costs.utilities + costs.etc, color: '#94a3b8' }
  ];
  
  // 대출 이자와 원금 상환을 지출 항목에 추가
  if (debtInterest > 0) {
    costItems.push({ label: '대출 이자', value: debtInterest, color: '#ef4444' });
  }
  if (debtPrincipal > 0) {
    costItems.push({ label: '대출 원금 상환', value: debtPrincipal, color: '#dc2626' });
  }
  
  // 순이익은 이미 대출 상환액이 차감된 값 (finance.monthlyProfit)
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

  // Sensitivity Chart (총 매출과 순이익 모두 표시)
  var baseRevenue = finance.monthlyRevenue || 0;
  var sensData = [
    { 
      label: '-10%', 
      revenue: baseRevenue * 0.9,  // 매출 10% 감소
      profit: finance.sensitivity.minus10.monthlyProfit, 
      months: finance.sensitivity.minus10.paybackMonths === null ? 999 : finance.sensitivity.minus10.paybackMonths 
    },
    { 
      label: '기준', 
      revenue: baseRevenue,
      profit: finance.monthlyProfit, 
      months: paybackMonths 
    },
    { 
      label: '+10%', 
      revenue: baseRevenue * 1.1,  // 매출 10% 증가
      profit: finance.sensitivity.plus10.monthlyProfit, 
      months: finance.sensitivity.plus10.paybackMonths === null ? 999 : finance.sensitivity.plus10.paybackMonths 
    }
  ];

  // 최대값 계산 (매출과 순이익을 각각 계산)
  var maxRevenue = 0;
  var maxProfit = 0;
  var minProfit = Infinity;
  for (var s = 0; s < sensData.length; s++) {
    if (sensData[s].revenue > maxRevenue) maxRevenue = sensData[s].revenue;
    if (sensData[s].profit > maxProfit) maxProfit = sensData[s].profit;
    if (sensData[s].profit < minProfit) minProfit = sensData[s].profit;
  }
  
  // minProfit이 Infinity인 경우 0으로 설정
  if (minProfit === Infinity) minProfit = 0;
  
  // 그래프 높이 (픽셀 단위로 계산)
  var chartHeight = 180; // 그래프 영역 높이
  var minBarHeight = 8; // 최소 바 높이 (시각적 표시를 위해)

  var sensHtml = '';
  for (var s = 0; s < sensData.length; s++) {
    // 매출 바 높이 계산 (매출 최대값 기준)
    var revenueHeight = maxRevenue > 0 
      ? Math.max(minBarHeight, (sensData[s].revenue / maxRevenue) * chartHeight)
      : minBarHeight;
    
    // 순이익 바 높이 계산 (순이익 최대값 기준, 0부터 시작)
    var profitHeight = minBarHeight;
    if (maxProfit > 0 && sensData[s].profit > 0) {
      // 양수 순이익: 0부터 maxProfit까지 정규화
      profitHeight = Math.max(minBarHeight, (sensData[s].profit / maxProfit) * chartHeight);
    } else if (sensData[s].profit < 0 && minProfit < 0) {
      // 음수 순이익: minProfit부터 0까지 정규화 (하단에 표시)
      var absMinProfit = Math.abs(minProfit);
      var absProfit = Math.abs(sensData[s].profit);
      if (absMinProfit > 0) {
        profitHeight = Math.max(minBarHeight, (absProfit / absMinProfit) * chartHeight * 0.3);
      }
    } else if (sensData[s].profit === 0) {
      profitHeight = minBarHeight;
    } else if (maxProfit === 0 && sensData[s].profit === 0) {
      // 모든 값이 0인 경우
      profitHeight = minBarHeight;
    }
    
    // 기준 컬럼(s === 1)은 최소한 중간 높이 보장
    if (s === 1 && profitHeight < chartHeight * 0.3) {
      profitHeight = Math.max(profitHeight, chartHeight * 0.3);
    }
    
    var revenueColor = 'var(--gold)';
    var profitColor = sensData[s].profit > 0 ? '#4ade80' : '#f87171';
    if (s === 1) {
      revenueColor = 'var(--gold)';
    } else {
      revenueColor = '#94a3b8';
    }
    
    // 배경색 설정 (투명도 포함)
    var revenueBgColor = s === 1 ? 'rgba(212, 175, 55, 0.5)' : 'rgba(148, 163, 184, 0.5)'; // gold 또는 gray
    var profitBgColor = sensData[s].profit > 0 ? 'rgba(74, 222, 128, 0.7)' : 'rgba(248, 113, 113, 0.7)'; // green 또는 red
    
    sensHtml += '<div class="bar-col" style="position:relative; min-width:120px;">' +
      '<div class="bar-value" style="margin-bottom:0.5rem;">' +
        '<div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.2rem;">총 매출</div>' +
        '<div style="font-size:0.85rem; font-weight:600; color:' + revenueColor + ';">' + Utils.formatKRW(sensData[s].revenue) + '</div>' +
        '<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem; margin-bottom:0.2rem;">순이익</div>' +
        '<div style="font-size:0.85rem; font-weight:600; color:' + profitColor + ';">' + Utils.formatKRW(sensData[s].profit) + '</div>' +
      '</div>' +
      '<div style="position:relative; height:' + chartHeight + 'px; display:flex; align-items:flex-end; justify-content:center; gap:6px; margin-bottom:0.5rem;">' +
        '<div class="bar" style="height:' + revenueHeight + 'px; width:48%; min-width:40px; background:' + revenueBgColor + '; border-radius:4px 4px 0 0;" title="총 매출"></div>' +
        '<div class="bar" style="height:' + profitHeight + 'px; width:48%; min-width:40px; background:' + profitBgColor + '; border-radius:4px 4px 0 0;" title="순이익"></div>' +
      '</div>' +
      '<div class="bar-label">' + sensData[s].label + '</div>' +
      '<div class="bar-label" style="font-size:0.7rem; color:var(--text-muted);">(' + (sensData[s].months >= 999 ? '회수불가' : sensData[s].months + '개월') + ')</div>' +
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
  
  if (riskHtml === '') {
    riskHtml = '<p style="color:var(--text-muted); text-align:center; padding:2rem;">AI 리스크 분석 데이터가 없습니다.</p>';
  }
  document.getElementById('riskList').innerHTML = riskHtml;

  // Improvements (reportModel의 병합된 improvement cards 사용)
  var impHtml = '';
  var improvementsToShow = [];
  
  console.log('[대시보드] improvement 데이터:', improvement);
  console.log('[대시보드] ai.improvements:', ai?.improvements);
  
  if (improvement && improvement.cards && improvement.cards.length > 0) {
    // reportModel의 병합된 improvement cards 사용
    improvementsToShow = improvement.cards.map(function(card) {
      console.log('[대시보드] improvement card:', card);
      // ai가 있으면 ai만 사용 (engine 버림)
      if (card.ai) {
        var title = card.ai.title || '개선 제안';
        var description = card.ai.description || '';
        var expectedImpact = card.ai.expectedImpact || '';
        
        // title이나 description이 있으면 표시
        if (title || description) {
          return {
            title: title,
            description: description,
            expectedImpact: expectedImpact
          };
        }
      } else if (card.engine) {
        // engine만 있는 경우: improvementSimulations 데이터 구조 처리
        var title = card.engine.title || card.engine.delta || '개선 제안';
        var description = card.engine.description || card.engine.narrative || '';
        
        // improvementSimulations 구조인 경우 (delta, survivalMonths, signal만 있음)
        if (!description && card.engine.delta && card.engine.survivalMonths !== undefined) {
          var deltaText = card.engine.delta;
          var signalText = card.engine.signal === 'green' ? '양호' : card.engine.signal === 'yellow' ? '주의' : '위험';
          var signalColor = card.engine.signal === 'green' ? '#4ade80' : card.engine.signal === 'yellow' ? '#facc15' : '#f87171';
          description = deltaText + ' 시나리오: 예상 생존 개월 ' + card.engine.survivalMonths + '개월, 신호등 ' + signalText;
          
          // title이 delta와 같으면 더 읽기 쉽게 변환
          if (title === deltaText) {
            if (deltaText.includes('rent') || deltaText.includes('월세')) {
              title = '월세 조정';
            } else if (deltaText.includes('sales') || deltaText.includes('target') || deltaText.includes('판매량')) {
              title = '목표 판매량 조정';
            } else if (deltaText.includes('investment') || deltaText.includes('투자')) {
              title = '초기 투자금 조정';
            } else {
              title = '조건 변경 시나리오';
            }
          }
        }
        
        // title이나 description이 있으면 표시
        if (title || description) {
          return {
            title: title,
            description: description,
            expectedImpact: ''
          };
        }
      }
      return null;
    }).filter(function(imp) { return imp !== null && (imp.title || imp.description); });
  } else if (ai && ai.improvements && ai.improvements.length > 0) {
    // fallback: 기존 ai.improvements 사용
    improvementsToShow = ai.improvements.filter(function(imp) {
      return imp && (imp.title || imp.description);
    });
  }
  
  console.log('[대시보드] improvementsToShow:', improvementsToShow);
  
  // 중복 제거: 같은 주제의 개선 제안을 하나로 통일
  var deduplicated = [];
  var seenCategories = new Set();
  
  for (var im = 0; im < improvementsToShow.length; im++) {
    var imp = improvementsToShow[im];
    var title = imp.title || '개선 제안';
    var description = imp.description || '';
    
    // 카테고리 키워드 추출 (중복 판단용)
    var category = '';
    var titleLower = title.toLowerCase();
    if (titleLower.includes('월세') || titleLower.includes('rent') || titleLower.includes('임대료')) {
      category = 'rent';
    } else if (titleLower.includes('판매량') || titleLower.includes('sales') || titleLower.includes('target') || titleLower.includes('목표')) {
      category = 'sales';
    } else if (titleLower.includes('원재료') || titleLower.includes('material') || titleLower.includes('재료')) {
      category = 'material';
    } else if (titleLower.includes('상권') || titleLower.includes('location') || titleLower.includes('입지')) {
      category = 'location';
    } else if (titleLower.includes('투자') || titleLower.includes('investment')) {
      category = 'investment';
    } else {
      // 카테고리 없으면 제목의 첫 10자로 구분
      category = title.substring(0, 10).toLowerCase();
    }
    
    // 같은 카테고리가 이미 있으면 스킵 (첫 번째 것만 유지)
    if (seenCategories.has(category)) {
      continue;
    }
    
    seenCategories.add(category);
    deduplicated.push(imp);
  }
  
  for (var im = 0; im < deduplicated.length; im++) {
    var imp = deduplicated[im];
    var title = imp.title || '개선 제안';
    var description = imp.description || '';
    
    // 제목 통일 (월세 관련)
    if (title.includes('월세') || title.includes('임대료')) {
      if (title.includes('조정') || title.includes('절감') || title.includes('감소')) {
        title = '월세 절감';
      }
    }
    
    impHtml += '<div class="risk-card">' +
      '<div class="risk-icon" style="background:rgba(74,222,128,0.15); color:#4ade80;"><i class="fa-solid fa-lightbulb"></i></div>' +
      '<div class="risk-body"><h4>' + Utils.escapeHtml(title) + '</h4>' +
      (description ? '<p>' + Utils.escapeHtml(description) + '</p>' : '') +
      (imp.expectedImpact ? '<span style="font-size:0.8rem; color:var(--gold); margin-top:0.5rem; display:block;">기대 효과: ' + Utils.escapeHtml(imp.expectedImpact) + '</span>' : '') + '</div>' +
      '</div>';
  }
  
  if (impHtml === '') {
    impHtml = '<p style="color:var(--text-muted); text-align:center; padding:2rem;">AI 개선 제안 데이터가 없습니다.</p>';
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
    '<div class="comp-item"><div class="comp-label">경쟁 강도</div><div class="comp-value">' + intens.label + '</div></div>' +
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
      
      var triggerDisplayName = trigger.triggerName || trigger.trigger || '';
      var outcomeDisplay = trigger.outcome || trigger.result || '';
      
      failureTriggersHtml += '<div class="risk-card" style="margin-bottom:1rem;">' +
        '<div class="risk-icon" style="background:' + impactColor + '22; color:' + impactColor + ';">' +
        '<i class="fa-solid fa-exclamation-triangle"></i></div>' +
        '<div class="risk-body">' +
        '<h4>' + (ft + 1) + '. ' + Utils.escapeHtml(triggerDisplayName) + ' <span style="font-size:0.8rem; color:' + impactColor + '; font-weight:600;">(' + impactLabel + ')</span></h4>' +
        '<p style="margin-bottom:0.5rem;"><strong>결과:</strong> ' + Utils.escapeHtml(outcomeDisplay) + '</p>' +
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
  var brandPosition = brand.position || '스탠다드';

  // 항상 차트 먼저 렌더링 (기본값으로)
  updateScenarioChart(brandPosition);

  // 브랜드 position이 없으면 API에서 가져와서 업데이트
  if (!brand.position && brand.id) {
    var apiBaseUrl = window.API_CONFIG ? window.API_CONFIG.API_BASE_URL : 'http://localhost:3000';
    fetch(apiBaseUrl + '/api/brands')
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data.success && data.brands) {
          var foundBrand = data.brands.find(function(b) { return b.id === brand.id; });
          if (foundBrand && foundBrand.position) {
            updateScenarioChart(foundBrand.position);
          }
        }
      })
      .catch(function(error) {
        console.warn('[대시보드] 브랜드 API 호출 실패, 기본값 유지:', error.message);
      });
  }
  
  function updateScenarioChart(position) {
    var avgPrice = position === '프리미엄' ? 5500 : position === '스탠다드' ? 4000 : 3000;

    // 현재 비용 구조 가져오기
    var costs = finance.monthlyCosts || {};
    var baseRevenue = finance.monthlyRevenue || 0;
    
    // 비율 계산 (현재 매출 기준)
    var laborRate = baseRevenue > 0 ? (costs.labor || 0) / baseRevenue : 0;
    var materialsRate = baseRevenue > 0 ? (costs.materials || 0) / baseRevenue : 0;
    var utilitiesRate = baseRevenue > 0 ? (costs.utilities || 0) / baseRevenue : 0;
    var royaltyRate = baseRevenue > 0 ? (costs.royalty || 0) / baseRevenue : 0;
    var marketingRate = baseRevenue > 0 ? (costs.marketing || 0) / baseRevenue : 0;
    
    // 고정비
    var fixedCosts = (costs.rent || 0) + (costs.etc || 0);
    
    // 대출 상환액 (있는 경우)
    var debtPayment = finance.debt?.totalMonthlyPayment || 0;

    var scenRevs = [
      { label: '보수적', daily: scenarios.conservative },
      { label: '기대치', daily: scenarios.expected },
      { label: '낙관적', daily: scenarios.optimistic }
    ];

    var maxValue = 0;
    for (var sc = 0; sc < scenRevs.length; sc++) {
      // 시나리오별 매출 계산
      var rev = scenRevs[sc].daily * avgPrice * 30;
      scenRevs[sc].revenue = rev;
      
      // 시나리오별 비용 계산
      var variableCosts = rev * (laborRate + materialsRate + utilitiesRate + royaltyRate + marketingRate);
      var totalCosts = fixedCosts + variableCosts + debtPayment;
      
      // 시나리오별 순이익 계산
      var profit = rev - totalCosts;
      scenRevs[sc].profit = profit;
      scenRevs[sc].totalCosts = totalCosts;
      
      // 차트 높이 계산을 위한 최대값 (매출과 순이익 중 큰 값)
      var maxForChart = Math.max(rev, profit > 0 ? profit : 0);
      if (maxForChart > maxValue) maxValue = maxForChart;
    }

  var scenHtml = '';
  var scenColors = ['#94a3b8', 'var(--gold)', '#4ade80'];
  for (var sc = 0; sc < scenRevs.length; sc++) {
    // 매출 기준으로 차트 높이 계산
    var maxBarH = 100; // px
    var hPx = maxValue > 0 ? Math.round(scenRevs[sc].revenue / maxValue * maxBarH) : 8;
    var profitPx = maxValue > 0 && scenRevs[sc].profit > 0 ? Math.round(scenRevs[sc].profit / maxValue * maxBarH) : 4;

    scenHtml += '<div style="flex:1; display:flex; flex-direction:column; align-items:center;">' +
      '<div style="text-align:center; margin-bottom:0.5rem;">' +
        '<div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.2rem;">총 매출</div>' +
        '<div style="font-weight:600; color:' + scenColors[sc] + ';">' + Utils.formatKRW(scenRevs[sc].revenue) + '</div>' +
        '<div style="font-size:0.75rem; color:' + (scenRevs[sc].profit > 0 ? '#4ade80' : '#f87171') + '; margin-top:0.3rem;">순이익 ' + Utils.formatKRW(scenRevs[sc].profit) + '</div>' +
      '</div>' +
      '<div style="display:flex; align-items:flex-end; justify-content:center; gap:4px; height:' + maxBarH + 'px;">' +
        '<div style="height:' + hPx + 'px; width:30px; background:' + scenColors[sc] + '; opacity:0.6; border-radius:4px 4px 0 0;"></div>' +
        '<div style="height:' + profitPx + 'px; width:30px; background:' + (scenRevs[sc].profit > 0 ? '#4ade80' : '#f87171') + '; opacity:0.6; border-radius:4px 4px 0 0;"></div>' +
      '</div>' +
      '<div style="margin-top:0.5rem; font-size:0.75rem; color:var(--text-muted);">' + scenRevs[sc].label + '</div>' +
      '<div style="font-size:0.7rem; color:var(--text-muted);">' + scenRevs[sc].daily + '잔/일</div>' +
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
    });
  }

  // Exit Plan 렌더링
  function renderExitPlan(exitPlan) {
    var exitPlanSection = document.getElementById('exitPlanSection');
    if (!exitPlanSection) {
      console.warn('[대시보드] exitPlanSection 요소를 찾을 수 없습니다.');
      return;
    }
    
    if (!exitPlan) {
      exitPlanSection.innerHTML =
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

    exitPlanSection.innerHTML = html || '<p style="color:var(--text-muted); text-align:center; padding:2rem;">Exit Plan 데이터가 없습니다.</p>';
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

    // 로드뷰 이미지 표시 (있는 경우)
    var roadviewImageUrl = roadview.roadviewUrl || roadview.imageUrl || null;
    var imageHtml = '';
    if (roadviewImageUrl) {
      imageHtml = '<div style="margin-bottom:2rem;">' +
        '<h4 style="margin-bottom:1rem; font-size:1rem; color:var(--text-main);">주소지 로드뷰</h4>' +
        '<div style="border-radius:var(--radius-sm); overflow:hidden; border:1px solid rgba(255,255,255,0.1);">' +
        '<img src="' + Utils.escapeHtml(roadviewImageUrl) + '" alt="로드뷰 이미지" style="width:100%; max-width:100%; height:auto; display:block;" />' +
        '</div></div>';
    }

    var risks = roadview.risks || [];
    var riskHtml = imageHtml; // 이미지를 먼저 표시

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
