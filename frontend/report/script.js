/**
 * Report Page - Data Rendering + jsPDF Generation
 */
(function () {
  var result = Utils.loadSession('analysisResult');
  var input = Utils.loadSession('analysisInput');

  if (!result) {
    document.querySelector('.report-main').innerHTML =
      '<div style="text-align:center; padding:6rem 2rem; color:var(--text-main);">' +
      '<h2 style="margin-bottom:1rem;">분석 결과가 없습니다</h2>' +
      '<a href="../brand/" class="btn-cta">브랜드 선택하기</a></div>';
    return;
  }

  // reportModel 우선 사용, 없으면 fallback
  var reportModel = result.reportModel;
  if (!reportModel) {
    console.warn('[리포트] reportModel이 없습니다. finalResult를 직접 사용합니다.');
  }

  // reportModel 사용 (있으면 reportModel, 없으면 기존 방식)
  var finance = reportModel ? reportModel.finance : result.finance;
  var decision = reportModel ? {
    score: reportModel.executive.score,
    signal: reportModel.executive.signal,
    survivalMonths: reportModel.executive.survivalMonths,
    riskFactors: result.decision?.riskFactors || []
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
  var scenario = reportModel?.scenario || null;
  var breakdown = reportModel?.breakdown || null;
  var risk = reportModel?.risk || null;
  var improvement = reportModel?.improvement || null;
  var exitPlan = reportModel?.exitPlan || null;
  var failureTriggers = reportModel?.failureTriggers || [];
  var competitive = reportModel?.competitive || null;
  var market = reportModel?.market || result.market || null;  // reportModel 우선 사용
  var roadview = reportModel?.roadview || result.roadview || null;  // reportModel 우선 사용

  // ═══════════════════════════════════════════
  // PAGE 1: Overview
  // ═══════════════════════════════════════════
  document.getElementById('reportDate').textContent = '발행일: ' + Utils.formatDate(result.createdAt);
  document.getElementById('reportId').textContent = '분석 ID: ' + result.id;

  document.getElementById('rBrand').textContent = result.brand.name;
  document.getElementById('rLocation').textContent = result.location.address || '좌표: ' + result.location.lat.toFixed(4) + ', ' + result.location.lng.toFixed(4);
  document.getElementById('rArea').textContent = (input ? input.conditions.area : '-') + '평';
  document.getElementById('rInvestment').textContent = Utils.formatKRWFull(input ? input.conditions.initialInvestment : 0);
  document.getElementById('rRent').textContent = Utils.formatKRWFull(finance.monthlyCosts.rent) + ' / 월';
  document.getElementById('rOwner').textContent = input && input.conditions.ownerWorking ? '직접 근무' : '고용 운영';
  document.getElementById('rTarget').textContent = (input ? input.targetDailySales : '-') + '잔/일';
  
  // 대출 정보 표시 (있는 경우)
  var loansRow = document.getElementById('rLoansRow');
  var loansCell = document.getElementById('rLoans');
  var inputConditions = reportModel?.inputConditions || input?.conditions || result?.conditions || null;
  if (inputConditions && inputConditions.loans && Array.isArray(inputConditions.loans) && inputConditions.loans.length > 0) {
    var loansHtml = '';
    for (var i = 0; i < inputConditions.loans.length; i++) {
      var loan = inputConditions.loans[i];
      var aprPercent = (loan.apr * 100).toFixed(2);
      loansHtml += '<div style="margin-bottom:0.5rem; padding:0.5rem; background:rgba(255,255,255,0.03); border-radius:4px;">';
      loansHtml += '<strong>대출 ' + (i + 1) + ':</strong> ';
      loansHtml += Utils.formatKRW(loan.principal) + ' / ';
      loansHtml += aprPercent + '% / ';
      loansHtml += loan.termMonths + '개월 / ';
      var repaymentTypeMap = {
        'equal_payment': '원리금 균등',
        'equal_principal': '원금 균등',
        'interest_only': '이자만 상환'
      };
      loansHtml += repaymentTypeMap[loan.repaymentType] || loan.repaymentType;
      loansHtml += '</div>';
    }
    loansCell.innerHTML = loansHtml;
    loansRow.style.display = '';
  } else {
    loansRow.style.display = 'none';
  }

  // Exit Plan 입력값 표시 (있는 경우)
  var exitInputsRow = document.getElementById('rExitInputsRow');
  var exitInputsCell = document.getElementById('rExitInputs');
  if (inputConditions && inputConditions.exitInputs) {
    var exit = inputConditions.exitInputs;
    var exitHtml = '';
    if (exit.keyMoney) exitHtml += '권리금: ' + Utils.formatKRW(exit.keyMoney) + ' / ';
    if (exit.demolitionBase) exitHtml += '철거 기본비: ' + Utils.formatKRW(exit.demolitionBase) + ' / ';
    if (exit.demolitionPerPyeong) exitHtml += '평당 철거비: ' + Utils.formatKRW(exit.demolitionPerPyeong) + ' / ';
    if (exit.workingCapital) exitHtml += '운영자금: ' + Utils.formatKRW(exit.workingCapital);
    exitInputsCell.textContent = exitHtml || '없음';
    exitInputsRow.style.display = '';
  } else {
    exitInputsRow.style.display = 'none';
  }
  
  // 1일 방문객 수와 1인당 평균 구매비용 제거됨

  // Score (executive 우선 사용)
  var signal = executive?.signal ?? decision?.signal ?? 'yellow';
  var score = executive?.score ?? decision?.score ?? 0;
  var scoreCircle = document.getElementById('rScoreCircle');
  if (scoreCircle) {
    if (signal === 'green') scoreCircle.style.background = '#4ade80';
    if (signal === 'yellow') { scoreCircle.classList.add('yellow'); scoreCircle.style.background = '#f59e0b'; }
    if (signal === 'red') { scoreCircle.classList.add('red'); scoreCircle.style.background = '#ef4444'; }
  }
  var scoreNum = document.getElementById('rScoreNum');
  if (scoreNum) scoreNum.textContent = score;

  var sigLabels = { green: '긍정 신호', yellow: '주의 신호', red: '부정 신호' };
  var signalLabel = executive?.label || sigLabels[signal] || '주의 신호';
  var signalTextEl = document.getElementById('rSignalText');
  if (signalTextEl) signalTextEl.textContent = '창업 ' + signalLabel + ' (Score: ' + score + '점)';

  // Summary (executive.summary 우선 사용)
  var summaryText = '';
  if (executive?.summary) {
    summaryText = executive.summary;
  } else {
    var summaryParts = [];
    var paybackMonths = executive?.paybackMonths ?? finance?.paybackMonths ?? 999;
    var monthlyProfit = executive?.monthlyProfit ?? finance?.monthlyProfit ?? 0;
    var breakEvenDailySales = executive?.breakEvenDailySales ?? finance?.breakEvenDailySales ?? 0;
    summaryParts.push('투자 회수 기간은 ' + (paybackMonths >= 999 ? '회수 불가' : paybackMonths + '개월') + '로 예상됩니다.');
    summaryParts.push('월 순이익은 ' + Utils.formatKRW(monthlyProfit) + '이며, 손익분기 판매량은 일 ' + breakEvenDailySales + '잔입니다.');
    if (decision.riskFactors && decision.riskFactors.length > 0) {
      summaryParts.push(decision.riskFactors[0]);
    }
    summaryText = summaryParts.join(' ');
  }
  var decSummaryEl = document.getElementById('rDecisionSummary');
  if (decSummaryEl) decSummaryEl.textContent = summaryText;

  // Decision Confidence 렌더링
  function renderConfidence(confidence) {
    var confEl = document.getElementById('rConfidence');
    if (!confEl) return;
    if (!confidence) {
      confEl.innerHTML = '';
      return;
    }

    var html = '<div style="padding:1rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">' +
      '<h3 style="font-size:1rem; margin-bottom:0.75rem; color:var(--text-muted);">판정 신뢰도</h3>';
    
    // confidence가 객체인 경우
    if (typeof confidence === 'object') {
      var coverageMap = { high: '높음', medium: '보통', low: '낮음' };
      var coverageColor = { high: '#4ade80', medium: '#facc15', low: '#f87171' };
      
      if (confidence.dataCoverage) {
        var coverage = confidence.dataCoverage.toLowerCase();
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
          '<span style="font-size:0.9rem; color:var(--text-muted);">데이터 커버리지</span>' +
          '<span style="padding:0.3rem 0.8rem; border-radius:20px; background:' + coverageColor[coverage] + '22; color:' + coverageColor[coverage] + '; font-size:0.9rem; font-weight:600;">' + (coverageMap[coverage] || coverage) + '</span>' +
          '</div>';
      }
      
      if (confidence.assumptionRisk) {
        var risk = confidence.assumptionRisk.toLowerCase();
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
          '<span style="font-size:0.9rem; color:var(--text-muted);">가정 리스크</span>' +
          '<span style="padding:0.3rem 0.8rem; border-radius:20px; background:' + coverageColor[risk] + '22; color:' + coverageColor[risk] + '; font-size:0.9rem; font-weight:600;">' + (coverageMap[risk] || risk) + '</span>' +
          '</div>';
      }
      
      if (confidence.stability) {
        var stability = confidence.stability.toLowerCase();
        html += '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<span style="font-size:0.9rem; color:var(--text-muted);">판정 안정성</span>' +
          '<span style="padding:0.3rem 0.8rem; border-radius:20px; background:' + coverageColor[stability] + '22; color:' + coverageColor[stability] + '; font-size:0.9rem; font-weight:600;">' + (coverageMap[stability] || stability) + '</span>' +
          '</div>';
      }
    } else {
      // confidence가 단순 값인 경우
      var confValue = confidence.toString().toLowerCase();
      var confMap = { high: '높음', medium: '보통', low: '낮음' };
      var confColor = { high: '#4ade80', medium: '#facc15', low: '#f87171' };
      
      html += '<div style="text-align:center;">' +
        '<span style="padding:0.5rem 1.5rem; border-radius:20px; background:' + (confColor[confValue] || '#94a3b8') + '22; color:' + (confColor[confValue] || '#94a3b8') + '; font-size:1rem; font-weight:600;">' + (confMap[confValue] || confValue) + '</span>' +
        '</div>';
    }
    
    html += '</div>';
    confEl.innerHTML = html;
  }

  // Confidence 렌더링 실행
  renderConfidence(executive?.confidence);

  // ═══════════════════════════════════════════
  // PAGE 2: Financial
  // ═══════════════════════════════════════════
  var costs = finance.monthlyCosts;
  var rev = finance.monthlyRevenue;

  // 대출 상환액 가져오기 (있는 경우)
  var debtPayment = finance.debt?.monthlyPayment || 0;
  var operatingProfit = finance.operatingProfit || (rev - Object.values(costs).reduce(function(a, b) { return a + b; }, 0));

  var finRows = [
    ['월 매출', rev, '100%'],
    ['재료비', costs.materials, pct(costs.materials, rev)],
    ['인건비', costs.labor, pct(costs.labor, rev)],
    ['임대료', costs.rent, pct(costs.rent, rev)],
    ['로열티', costs.royalty, pct(costs.royalty, rev)],
    ['마케팅비', costs.marketing, pct(costs.marketing, rev)],
    ['공과금/기타', costs.utilities + costs.etc, pct(costs.utilities + costs.etc, rev)],
    ['영업 이익', operatingProfit, pct(operatingProfit, rev)]
  ];

  // 대출 상환액이 있으면 추가
  if (debtPayment > 0) {
    finRows.push(['대출 상환액', -debtPayment, pct(debtPayment, rev)]);
  }

  finRows.push(['월 순이익', finance.monthlyProfit, pct(finance.monthlyProfit, rev)]);

  var finHtml = '';
  for (var i = 0; i < finRows.length; i++) {
    var isProfit = i === finRows.length - 1;
    var isRevenue = i === 0;
    var style = isProfit ? ' style="font-weight:700; background:#f0fdf4;"' : isRevenue ? ' style="font-weight:600; background:#f5f7ff;"' : '';
    var valColor = isProfit && finRows[i][1] < 0 ? ' style="color:#dc2626; font-weight:700;"' : isProfit ? ' style="color:#166534; font-weight:700;"' : '';
    finHtml += '<tr' + style + '><td>' + finRows[i][0] + '</td><td' + valColor + '>' + Utils.formatKRWFull(finRows[i][1]) + '</td><td>' + finRows[i][2] + '</td></tr>';
  }
  document.getElementById('rFinanceBody').innerHTML = finHtml;

  // KPIs (executive 우선 사용)
  var survivalMonths = executive?.survivalMonths ?? decision?.survivalMonths ?? 0;
  var paybackMonths = executive?.paybackMonths ?? finance?.paybackMonths ?? 999;
  var monthlyProfit = executive?.monthlyProfit ?? finance?.monthlyProfit ?? 0;
  var breakEvenDailySales = executive?.breakEvenDailySales ?? finance?.breakEvenDailySales ?? 0;
  
  // 대출 정보 가져오기
  var debt = finance.debt || null;
  var dscr = debt?.dscr || null;

  var kpis = [
    { label: '생존 개월', value: survivalMonths + '개월', danger: survivalMonths < 24 },
    { label: '회수 기간', value: paybackMonths >= 999 ? '회수 불가' : paybackMonths + '개월', danger: paybackMonths > 36 },
    { label: '월 순이익', value: Utils.formatKRW(monthlyProfit), danger: monthlyProfit <= 0 },
    { label: '손익분기', value: breakEvenDailySales + '잔/일', danger: false }
  ];

  // DSCR이 있으면 KPI에 추가
  if (dscr !== null) {
    kpis.push({ 
      label: 'DSCR', 
      value: dscr.toFixed(2), 
      danger: dscr < 1.0  // DSCR < 1.0이면 위험
    });
  }

  var kpiHtml = '';
  for (var k = 0; k < kpis.length; k++) {
    kpiHtml += '<div class="report-kpi"><div class="kpi-label">' + kpis[k].label + '</div>' +
      '<div class="kpi-value' + (kpis[k].danger ? ' danger' : '') + '">' + kpis[k].value + '</div></div>';
  }
  document.getElementById('rKpiGrid').innerHTML = kpiHtml;

  // Sensitivity
  var sensRows = [
    ['매출 -10%', Utils.formatKRWFull(finance.sensitivity.minus10.monthlyProfit), finance.sensitivity.minus10.paybackMonths >= 999 ? '회수 불가' : finance.sensitivity.minus10.paybackMonths + '개월'],
    ['기준 (현재)', Utils.formatKRWFull(finance.monthlyProfit), finance.paybackMonths >= 999 ? '회수 불가' : finance.paybackMonths + '개월'],
    ['매출 +10%', Utils.formatKRWFull(finance.sensitivity.plus10.monthlyProfit), finance.sensitivity.plus10.paybackMonths >= 999 ? '회수 불가' : finance.sensitivity.plus10.paybackMonths + '개월']
  ];

  var sensHtml = '';
  for (var s = 0; s < sensRows.length; s++) {
    var rowStyle = s === 1 ? ' style="background:#f5f7ff; font-weight:600;"' : '';
    sensHtml += '<tr' + rowStyle + '><td>' + sensRows[s][0] + '</td><td>' + sensRows[s][1] + '</td><td>' + sensRows[s][2] + '</td></tr>';
  }
  document.getElementById('rSensBody').innerHTML = sensHtml;

  // Breakdown 렌더링
  function renderBreakdown(breakdown) {
    var breakdownEl = document.getElementById('rBreakdown');
    if (!breakdownEl) return;
    if (!breakdown) {
      breakdownEl.innerHTML =
        '<p style="color:var(--text-muted); text-align:center; padding:1rem;">Breakdown 데이터가 없습니다.</p>';
      return;
    }

    var items = [
      { label: '회수 기간', value: breakdown.payback || breakdown.paybackMonths || 0 },
      { label: '수익성', value: breakdown.profitability || 0 },
      { label: 'GAP', value: breakdown.gap || 0 },
      { label: '민감도', value: breakdown.sensitivity || 0 },
      { label: '고정비', value: breakdown.fixedCost || breakdown.fixedCosts || 0 },
      { label: 'DSCR', value: breakdown.dscr || 0 },
      { label: '상권', value: breakdown.market || 0 },
      { label: '로드뷰', value: breakdown.roadview || 0 }
    ];

    var html = '<table class="report-table">';
    html += '<thead><tr><th>항목</th><th>점수</th><th>평가</th></tr></thead><tbody>';
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var evaluation = item.value >= 80 ? '양호' : item.value >= 60 ? '보통' : '주의';
      var color = item.value >= 80 ? '#4ade80' : item.value >= 60 ? '#facc15' : '#f87171';
      
      html += '<tr>' +
        '<td>' + item.label + '</td>' +
        '<td style="text-align:right; font-weight:600; color:' + color + ';">' + item.value + '점</td>' +
        '<td style="color:' + color + ';">' + evaluation + '</td>' +
        '</tr>';
    }
    
    html += '</tbody></table>';
    breakdownEl.innerHTML = html;
  }

  // Breakdown 렌더링 실행
  renderBreakdown(breakdown);

  // ═══════════════════════════════════════════
  // PAGE 3: 입지-상권분석
  // ═══════════════════════════════════════════

  // reportModel에서 market과 roadview 데이터 가져오기 (이미 위에서 변수로 가져옴)
  var marketData = market;  // reportModel 우선 사용 (위에서 이미 설정됨)
  var roadviewData = roadview;  // reportModel 우선 사용 (위에서 이미 설정됨)

  // 입지 분석 (Roadview) 렌더링
  function renderRoadviewAnalysis(roadview) {
    if (!roadview) {
      // roadview 데이터 없어도 캡처 이미지가 있으면 표시
      if (input && input.roadviewImage) {
        document.getElementById('rRoadviewRisks').innerHTML =
          '<div style="margin-bottom:2rem;">' +
          '<h4 style="margin-bottom:1rem; font-size:1rem; color:var(--text-main);">주소지 로드뷰</h4>' +
          '<div style="border-radius:var(--radius-sm); overflow:hidden; border:1px solid rgba(0,0,0,0.1);">' +
          '<img src="' + input.roadviewImage + '" alt="로드뷰 이미지" style="width:100%; max-width:100%; height:auto; display:block;" />' +
          '</div></div>' +
          '<p style="color:var(--text-muted); text-align:center; padding:1rem;">입지 분석 상세 데이터가 없습니다.</p>';
      } else {
        document.getElementById('rRoadviewRisks').innerHTML =
          '<p style="color:var(--text-muted); text-align:center; padding:2rem;">입지 분석 데이터가 없습니다.</p>';
      }
      var summaryEl = document.getElementById('rRoadviewSummary');
      if (summaryEl) summaryEl.innerHTML = '';
      return;
    }

    // 로드뷰 이미지 표시 (있는 경우: API 결과 또는 input에서 캡처한 이미지)
    var roadviewImageUrl = roadview.roadviewUrl || roadview.imageUrl || (input && input.roadviewImage) || null;
    var imageHtml = '';
    if (roadviewImageUrl) {
      imageHtml = '<div style="margin-bottom:2rem;">' +
        '<h4 style="margin-bottom:1rem; font-size:1rem; color:var(--text-main);">주소지 로드뷰</h4>' +
        '<div style="border-radius:var(--radius-sm); overflow:hidden; border:1px solid rgba(0,0,0,0.1);">' +
        '<img src="' + Utils.escapeHtml(roadviewImageUrl) + '" alt="로드뷰 이미지" style="width:100%; max-width:100%; height:auto; display:block;" />' +
        '</div></div>';
    }

    var risks = roadview.risks || [];
    var riskHtml = imageHtml; // 이미지를 먼저 표시

    // 리스크 타입별 라벨 매핑
    var riskTypeMap = {
      signage_obstruction: '간판 가시성',
      steep_slope: '경사도',
      floor_level: '층위',
      visibility: '보행 가시성'
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
      var typeLabel = riskTypeMap[risk.type] || risk.type;
      var levelLabel = levelLabelMap[risk.level] || risk.level;
      var levelClass = risk.level === 'low' || risk.level === 'ground' ? 'low' : 
                       risk.level === 'high' || risk.level === 'second_floor' ? 'high' : 'medium';

      riskHtml += '<div class="report-risk-item ' + levelClass + '">' +
        '<h4>' + (r + 1) + '. ' + typeLabel + ' <span style="font-size:0.8rem; color:#999;">(' + levelLabel + ')</span></h4>' +
        '<p>' + Utils.escapeHtml(risk.description || '') + '</p></div>';
    }

    document.getElementById('rRoadviewRisks').innerHTML = riskHtml;

    // 종합 평가
    var overallRisk = roadview.overallRisk || 'medium';
    var riskScore = roadview.riskScore !== null && roadview.riskScore !== undefined ? roadview.riskScore : 50;
    var overallLabel = overallRisk === 'low' ? '낮음' : overallRisk === 'high' ? '높음' : '보통';

    var summaryHtml = '<div style="padding:1.5rem; background:#f5f7ff; border-radius:var(--radius-sm);">' +
      '<h4 style="margin:0; margin-bottom:1rem;">종합 리스크 평가</h4>' +
      '<div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">' +
      '<span style="font-size:1.2rem; font-weight:600;">리스크 레벨: ' + overallLabel + '</span>' +
      '<span style="color:var(--text-muted);">리스크 점수: ' + riskScore + ' / 100</span>' +
      '</div>';

    // 메타데이터가 있으면 강점/약점 표시
    if (roadview.metadata) {
      if (roadview.metadata.strengths && roadview.metadata.strengths.length > 0) {
        summaryHtml += '<div style="margin-top:1rem;"><strong style="color:#166534;">강점:</strong><ul style="margin:0.5rem 0; padding-left:1.5rem; color:var(--text-muted);">';
        for (var s = 0; s < roadview.metadata.strengths.length; s++) {
          summaryHtml += '<li>' + Utils.escapeHtml(roadview.metadata.strengths[s]) + '</li>';
        }
        summaryHtml += '</ul></div>';
      }
      if (roadview.metadata.weaknesses && roadview.metadata.weaknesses.length > 0) {
        summaryHtml += '<div style="margin-top:1rem;"><strong style="color:#dc2626;">약점:</strong><ul style="margin:0.5rem 0; padding-left:1.5rem; color:var(--text-muted);">';
        for (var w = 0; w < roadview.metadata.weaknesses.length; w++) {
          summaryHtml += '<li>' + Utils.escapeHtml(roadview.metadata.weaknesses[w]) + '</li>';
        }
        summaryHtml += '</ul></div>';
      }
    }

    summaryHtml += '</div>';
    var rvSummaryEl = document.getElementById('rRoadviewSummary');
    if (rvSummaryEl) rvSummaryEl.innerHTML = summaryHtml;
  }

  // 상권 분석 (Market) 렌더링
  function renderMarketAnalysis(market) {
    // 지도 이미지 렌더링 (URL 방식)
    var mapImageEl = document.getElementById('rMapImage');
    if (mapImageEl && input && input.mapImage) {
      var mapImg = document.createElement('img');
      mapImg.alt = '선택 위치 지도';
      mapImg.style.cssText = 'width:100%; max-width:100%; height:auto; display:block;';
      mapImg.src = input.mapImage;
      mapImg.onerror = function() {
        mapImageEl.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:1rem;">지도 이미지를 불러올 수 없습니다.</p>';
      };

      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'margin-bottom:2rem;';
      var title = document.createElement('h4');
      title.style.cssText = 'margin-bottom:1rem; font-size:1rem;';
      title.textContent = '선택 위치 지도';
      var imgBox = document.createElement('div');
      imgBox.style.cssText = 'border-radius:var(--radius-sm); overflow:hidden; border:1px solid rgba(0,0,0,0.1);';
      imgBox.appendChild(mapImg);
      wrapper.appendChild(title);
      wrapper.appendChild(imgBox);
      mapImageEl.appendChild(wrapper);
    }

    if (!market) {
      document.getElementById('rMarketCompetitors').innerHTML =
        '<p style="color:var(--text-muted); text-align:center; padding:2rem;">상권 분석 데이터가 없습니다.</p>';
      var ftEl = document.getElementById('rMarketFootTraffic');
      if (ftEl) ftEl.innerHTML = '';
      var msEl = document.getElementById('rMarketScore');
      if (msEl) msEl.innerHTML = '';
      return;
    }

    // 경쟁 현황
    var competitors = market.competitors || {};
    var total = competitors.total || 0;
    var sameBrand = competitors.sameBrand || 0;
    var otherBrands = competitors.otherBrands || 0;
    var density = competitors.density || 'medium';
    var densityLabel = density === 'high' ? '높음' : density === 'low' ? '낮음' : '보통';
    var radius = market.location?.radius || 500;

    var competitorsHtml = '<table class="report-table">' +
      '<thead><tr><th>항목</th><th>값</th></tr></thead>' +
      '<tbody>' +
      '<tr><td>반경</td><td>' + radius + 'm</td></tr>' +
      '<tr><td>총 경쟁 카페</td><td><strong>' + total + '개</strong></td></tr>' +
      '<tr><td>동일 브랜드</td><td>' + sameBrand + '개</td></tr>' +
      '<tr><td>타 브랜드</td><td>' + otherBrands + '개</td></tr>' +
      '<tr><td>경쟁 밀도</td><td><strong>' + densityLabel + '</strong></td></tr>' +
      '</tbody></table>';

    document.getElementById('rMarketCompetitors').innerHTML = competitorsHtml;

    // 유동인구 정보
    var footTraffic = market.footTraffic || {};
    var weekday = footTraffic.weekday || 'medium';
    var weekend = footTraffic.weekend || 'medium';
    var peakHours = footTraffic.peakHours || [];

    var trafficLabelMap = { low: '낮음', medium: '보통', high: '높음' };

    var footTrafficHtml = '<table class="report-table">' +
      '<thead><tr><th>항목</th><th>평가</th></tr></thead>' +
      '<tbody>' +
      '<tr><td>평일 유동인구</td><td>' + trafficLabelMap[weekday] + '</td></tr>' +
      '<tr><td>주말 유동인구</td><td>' + trafficLabelMap[weekend] + '</td></tr>';

    if (peakHours.length > 0) {
      footTrafficHtml += '<tr><td>피크 시간대</td><td>' + peakHours.join(', ') + '</td></tr>';
    }

    footTrafficHtml += '</tbody></table>';
    var ftEl2 = document.getElementById('rMarketFootTraffic');
    if (ftEl2) ftEl2.innerHTML = footTrafficHtml;

    // 상권 점수
    var marketScore = market.marketScore !== null && market.marketScore !== undefined ? market.marketScore : 50;
    var scoreLabel = marketScore >= 70 ? '양호' : marketScore >= 50 ? '보통' : '주의';

    var scoreHtml = '<div style="padding:1.5rem; background:#f5f7ff; border-radius:var(--radius-sm); text-align:center;">' +
      '<h4 style="margin:0; margin-bottom:1rem;">상권 종합 점수</h4>' +
      '<div style="font-size:2.5rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">' + marketScore + '점</div>' +
      '<div style="font-size:1rem; color:var(--text-muted);">' + scoreLabel + '</div>' +
      '</div>';

    var msEl2 = document.getElementById('rMarketScore');
    if (msEl2) msEl2.innerHTML = scoreHtml;
  }

  // 입지-상권분석 렌더링 실행
  renderRoadviewAnalysis(roadviewData);
  renderMarketAnalysis(marketData);

  // ═══════════════════════════════════════════
  // PAGE 4: AI
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
    riskHtml += '<div class="report-risk-item ' + riskItem.impact + '">' +
      '<h4>' + (r + 1) + '. ' + riskItem.title + ' <span style="font-size:0.8rem; color:#999;">(' + riskItem.impact.toUpperCase() + ')</span></h4>' +
      '<p>' + riskItem.description + '</p></div>';
  }
  document.getElementById('rRiskList').innerHTML = riskHtml;

  // Improvements (AI consulting 결과만 표시)
  var impHtml = '';
  var improvementsToShow = [];
  
  if (improvement && improvement.cards && improvement.cards.length > 0) {
    // AI consulting 결과가 있는 카드만 필터링
    improvementsToShow = improvement.cards
      .filter(function(card) { return card.ai !== null && card.ai !== undefined; })
      .map(function(card) {
        // ai가 있으면 ai의 description을 우선 사용
        return {
          title: card.ai.title || card.engine?.title || '',
          description: card.ai.description || card.engine?.description || '',
          expectedImpact: card.ai.expectedImpact || ''
        };
      })
      .filter(function(imp) { return imp !== null && (imp.title || imp.description); });
  } else if (ai && ai.improvements && ai.improvements.length > 0) {
    // fallback: 기존 ai.improvements 사용
    improvementsToShow = ai.improvements;
  }
  
  for (var im = 0; im < improvementsToShow.length; im++) {
    var imp = improvementsToShow[im];
    impHtml += '<div class="report-risk-item low">' +
      '<h4>' + (im + 1) + '. ' + imp.title + '</h4>' +
      '<p>' + imp.description + '</p>' +
      (imp.expectedImpact ? '<p style="color:#2D5A27; font-weight:600; margin-top:0.3rem;">기대 효과: ' + imp.expectedImpact + '</p>' : '') +
      '</div>';
  }
  document.getElementById('rImprovementList').innerHTML = impHtml;

  // Competitive (reportModel의 competitive 사용)
  var comp = competitive || ai?.competitiveAnalysis || { intensity: 'medium', differentiation: 'possible', priceStrategy: 'standard' };
  var intensityKR = { high: '높음', medium: '보통', low: '낮음' };
  var diffKR = { possible: '차별화 가능', difficult: '차별화 어려움', impossible: '차별화 불가' };
  var priceKR = { premium: '프리미엄 전략', standard: '표준 가격', budget: '저가 전략' };

  var compEl = document.getElementById('rCompetitive');
  if (compEl) compEl.innerHTML =
    '<table class="report-table">' +
    '<tr><th>경쟁 강도</th><td>' + (intensityKR[comp.intensity] || comp.intensity) + '</td></tr>' +
    '<tr><th>차별화 가능성</th><td>' + (diffKR[comp.differentiation] || comp.differentiation) + '</td></tr>' +
    '<tr><th>권장 가격 전략</th><td>' + (priceKR[comp.priceStrategy] || comp.priceStrategy) + '</td></tr>' +
    '</table>';

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
      
      failureTriggersHtml += '<div class="report-risk-item ' + (trigger.impact === 'critical' ? 'high' : trigger.impact === 'high' ? 'medium' : 'low') + '">' +
        '<h4>' + (ft + 1) + '. ' + triggerDisplayName + ' <span style="font-size:0.8rem; color:' + impactColor + ';">(' + impactLabel + ')</span></h4>' +
        '<p><strong>결과:</strong> ' + outcomeDisplay + '</p>' +
        (trigger.estimatedFailureWindow ? '<p style="color:var(--text-muted); font-size:0.9rem;"><strong>예상 실패 시점:</strong> ' + trigger.estimatedFailureWindow + '</p>' : '') +
        (trigger.totalLossAtFailure !== undefined ? '<p style="color:var(--text-muted); font-size:0.9rem;"><strong>그때 총손실:</strong> ' + Utils.formatKRW(trigger.totalLossAtFailure) + '</p>' : '') +
        (trigger.exitCostAtFailure !== undefined ? '<p style="color:var(--text-muted); font-size:0.9rem;"><strong>그때 Exit 비용:</strong> ' + Utils.formatKRW(trigger.exitCostAtFailure) + '</p>' : '') +
        '</div>';
    }
  } else {
    failureTriggersHtml = '<p style="color:var(--text-muted); text-align:center; padding:2rem;">실패 트리거가 없습니다.</p>';
  }
  document.getElementById('rFailureTriggers').innerHTML = failureTriggersHtml;

  // Exit Plan 렌더링
  function renderExitPlan(exitPlan) {
    if (!exitPlan) {
      document.getElementById('rExitPlan').innerHTML =
        '<p style="color:var(--text-muted); text-align:center; padding:2rem;">Exit Plan 데이터가 없습니다.</p>';
      return;
    }

    var html = '';
    
    // 손절 타이밍 테이블
    if (exitPlan.optimalExitMonth || exitPlan.warningMonth) {
      html += '<div style="margin-bottom:2rem;">' +
        '<h3 style="margin-bottom:1rem; font-size:1.1rem;">손절 타이밍 설계</h3>' +
        '<table class="report-table">' +
        '<thead><tr><th>구분</th><th>시점</th><th>총손실</th></tr></thead><tbody>';

      if (exitPlan.warningMonth) {
        html += '<tr>' +
          '<td>경고 구간</td>' +
          '<td>' + exitPlan.warningMonth + '개월</td>' +
          '<td>' + Utils.formatKRW(exitPlan.totalLossAtWarning || 0) + '</td>' +
          '</tr>';
      }

      if (exitPlan.optimalExitMonth) {
        html += '<tr style="background:rgba(74,222,128,0.1);">' +
          '<td><strong>최적 손절</strong></td>' +
          '<td><strong>' + exitPlan.optimalExitMonth + '개월</strong></td>' +
          '<td><strong>' + Utils.formatKRW(exitPlan.totalLossAtOptimal || 0) + '</strong></td>' +
          '</tr>';
      }

      if (exitPlan.lossExplosionMonth) {
        html += '<tr>' +
          '<td>손실 폭증</td>' +
          '<td>' + exitPlan.lossExplosionMonth + '개월</td>' +
          '<td>' + Utils.formatKRW(exitPlan.totalLossAtExplosion || 0) + '</td>' +
          '</tr>';
      }

      html += '</tbody></table></div>';
    }

    // 폐업 비용 상세
    if (exitPlan.exitCostBreakdown) {
      var breakdown = exitPlan.exitCostBreakdown;
      html += '<div>' +
        '<h3 style="margin-bottom:1rem; font-size:1.1rem;">폐업 비용 상세 (' + (exitPlan.optimalExitMonth || 0) + '개월 기준)</h3>' +
        '<table class="report-table">' +
        '<thead><tr><th>항목</th><th>금액</th></tr></thead><tbody>';

      if (breakdown.penaltyCost !== undefined) {
        html += '<tr><td>가맹 위약금</td><td>' + Utils.formatKRW(breakdown.penaltyCost || 0) + '</td></tr>';
      }
      if (breakdown.demolitionCost !== undefined) {
        html += '<tr><td>철거/원상복구</td><td>' + Utils.formatKRW(breakdown.demolitionCost || 0) + '</td></tr>';
      }
      if (breakdown.interiorLoss !== undefined) {
        html += '<tr><td>인테리어/설비 손실(비회수)</td><td>' + Utils.formatKRW(breakdown.interiorLoss || 0) + '</td></tr>';
      }
      if (breakdown.goodwillRecovered !== undefined && breakdown.goodwillRecovered !== 0) {
        html += '<tr><td>권리금 회수(감액)</td><td style="color:#4ade80;">-' + Utils.formatKRW(Math.abs(breakdown.goodwillRecovered || 0)) + '</td></tr>';
      }
      if (breakdown.exitCostTotal !== undefined) {
        html += '<tr style="background:rgba(255,255,255,0.05);">' +
          '<td><strong>Exit Cost 합계</strong></td>' +
          '<td><strong>' + Utils.formatKRW(breakdown.exitCostTotal || 0) + '</strong></td>' +
          '</tr>';
      }
      if (breakdown.cumOperatingLoss !== undefined) {
        html += '<tr><td>운영손실 누적(폐업 시점까지)</td><td>' + Utils.formatKRW(breakdown.cumOperatingLoss || 0) + '</td></tr>';
      }
      if (exitPlan.totalLossAtOptimal !== undefined) {
        html += '<tr style="background:rgba(239,68,68,0.1);">' +
          '<td><strong>최종 총손실</strong></td>' +
          '<td><strong style="color:#f87171;">' + Utils.formatKRW(exitPlan.totalLossAtOptimal) + '</strong></td>' +
          '</tr>';
      }

      html += '</tbody></table></div>';
    }

    document.getElementById('rExitPlan').innerHTML = html || '<p style="color:var(--text-muted); text-align:center; padding:2rem;">Exit Plan 데이터가 없습니다.</p>';
  }

  // Exit Plan 렌더링 실행
  renderExitPlan(exitPlan);

  // ═══════════════════════════════════════════
  // PAGE 5: 손절 & 폐업 판단 리포트
  // ═══════════════════════════════════════════
  
  // 손절 기준선 (Break-Down Line)
  var breakdownVisitors = finance?.breakdownVisitors || null;
  var breakdownHtml = '';
  if (breakdownVisitors !== null && breakdownVisitors !== undefined) {
    breakdownHtml = '<div style="padding:1.5rem; background:rgba(239,68,68,0.1); border-radius:var(--radius-sm); border-left:4px solid #f87171;">' +
      '<div style="font-weight:600; margin-bottom:0.5rem;">손절 방문객 수</div>' +
      '<div style="font-size:1.5rem; font-weight:700; color:#f87171; margin-bottom:1rem;">' + Math.round(breakdownVisitors) + '명/일</div>' +
      '<div style="color:var(--text-muted); font-size:0.9rem; margin-bottom:0.5rem;">계산식:</div>' +
      '<div style="font-family:monospace; font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">' +
      '손절 방문객 수 = (고정비 + 최소 변동비) ÷ 1인당 평균 구매비용' +
      '</div>' +
      '<div style="color:var(--text-muted); font-size:0.9rem;">' +
      '이 방문객 수 이하가 3개월 이상 지속되면 손절 검토가 필요합니다.' +
      '</div>' +
      '</div>';
  } else {
    breakdownHtml = '<div style="padding:1.5rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm); color:var(--text-muted);">손절 기준선 계산 데이터가 없습니다.</div>';
  }
  var breakdownLineEl = document.getElementById('rBreakdownLine');
  if (breakdownLineEl) breakdownLineEl.innerHTML = breakdownHtml;

  // 적자 지속 시 생존 개월 수
  var monthlyProfit = executive?.monthlyProfit ?? finance?.monthlyProfit ?? 0;
  var monthlyLoss = monthlyProfit < 0 ? Math.abs(monthlyProfit) : 0;
  var availableCash = input ? input.conditions.initialInvestment : 0;
  if (exitPlan && exitPlan.exitCostBreakdown) {
    availableCash -= (exitPlan.exitCostBreakdown.exitCostTotal || exitPlan.exitCostBreakdown.totalLoss || 0);
  }
  var survivalMonthsOnLoss = monthlyLoss > 0 && availableCash > 0 ? Math.floor(availableCash / monthlyLoss) : null;
  
  var survivalHtml = '';
  if (monthlyLoss > 0) {
    survivalHtml = '<div style="padding:1.5rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">' +
      '<div style="margin-bottom:1rem;">' +
      '<div style="font-weight:600; margin-bottom:0.5rem;">월 적자</div>' +
      '<div style="font-size:1.2rem; font-weight:700; color:#f87171;">' + Utils.formatKRW(monthlyLoss) + '</div>' +
      '</div>' +
      '<div style="margin-bottom:1rem;">' +
      '<div style="font-weight:600; margin-bottom:0.5rem;">생존 개월</div>' +
      '<div style="font-size:1.2rem; font-weight:700;">' + 
      (survivalMonthsOnLoss !== null ? survivalMonthsOnLoss + '개월' : '계산 불가') +
      '</div>' +
      '</div>' +
      '<div style="color:var(--text-muted); font-size:0.9rem;">' +
      '생존 개월 = (초기 투자금 중 회수 불가 비용 제외 후 잔여 현금) ÷ 월 적자' +
      '</div>' +
      '</div>';
  } else {
    survivalHtml = '<div style="padding:1.5rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm); color:var(--text-muted);">현재 적자 상태가 아니므로 생존 개월 계산이 필요하지 않습니다.</div>';
  }
  var survivalOnLossEl = document.getElementById('rSurvivalOnLoss');
  if (survivalOnLossEl) survivalOnLossEl.innerHTML = survivalHtml;

  // ═══════════════════════════════════════════
  // jsPDF Generation
  // ═══════════════════════════════════════════
  // PDF 다운로드 버튼 제거됨 - 더 이상 필요 없음

  async function generatePDF() {
    var jsPDF = window.jspdf.jsPDF;
    // A4 용지 사이즈: 210mm x 297mm (세로 방향)
    var doc = new jsPDF('p', 'mm', 'a4');
    var pageW = 210; // A4 가로: 210mm
    var pageH = 297; // A4 세로: 297mm
    var margin = 20; // 좌우 여백: 20mm
    var contentW = pageW - margin * 2; // 콘텐츠 너비: 170mm
    var y = margin;
    var sectionNum = 0;
    var currentPageNum = 1; // 페이지 번호 추적

    // Noto Sans KR 한글 폰트 설정
    // 폰트 파일을 로드하여 jsPDF에 등록
    var koreanFontLoaded = false;
    
    // 폰트 파일을 base64로 변환하여 로드하는 함수
    async function loadFontFile(filePath) {
      try {
        var response = await fetch(filePath);
        if (!response.ok) {
          throw new Error('폰트 파일 로드 실패: ' + filePath);
        }
        var blob = await response.blob();
        return new Promise(function(resolve, reject) {
          var reader = new FileReader();
          reader.onloadend = function() {
            // base64에서 data:application/octet-stream;base64, 부분 제거
            var base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('[폰트 로드] 오류:', error);
        return null;
      }
    }
    
    // 폰트 등록 함수 (현재 doc에 폰트 등록)
    async function setupKoreanFont() {
      if (koreanFontLoaded) {
        console.log('[폰트 설정] 이미 로드됨');
        return; // 이미 로드된 경우 스킵
      }
      
      try {
        // Regular 폰트 등록
        // 리포트 페이지(frontend/report/index.html) 기준으로 폰트 경로 설정
        var regularBase64 = await loadFontFile('font/Noto_Sans_KR/static/NotoSansKR-Regular.ttf');
        if (regularBase64) {
          doc.addFileToVFS('NotoSansKR-Regular.ttf', regularBase64);
          doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
          console.log('[폰트 설정] Regular 폰트 등록 완료');
        } else {
          console.warn('[폰트 설정] Regular 폰트 로드 실패 - 경로: font/Noto_Sans_KR/static/NotoSansKR-Regular.ttf');
        }
        
        // Bold 폰트 등록
        var boldBase64 = await loadFontFile('font/Noto_Sans_KR/static/NotoSansKR-Bold.ttf');
        if (boldBase64) {
          doc.addFileToVFS('NotoSansKR-Bold.ttf', boldBase64);
          doc.addFont('NotoSansKR-Bold.ttf', 'NotoSansKR', 'bold');
          console.log('[폰트 설정] Bold 폰트 등록 완료');
        } else {
          console.warn('[폰트 설정] Bold 폰트 로드 실패 - 경로: font/Noto_Sans_KR/static/NotoSansKR-Bold.ttf');
        }
        
        koreanFontLoaded = true;
        console.log('[폰트 설정] Noto Sans KR 폰트 등록 완료');
      } catch (error) {
        console.warn('[폰트 설정] 폰트 등록 실패, 기본 폰트 사용:', error);
        koreanFontLoaded = false;
      }
    }
    
    // 폰트 설정 초기화 (PDF 생성 전에 폰트 로드 완료 대기)
    await setupKoreanFont();

    // Helper
    // 상수 정의
    var LINE_HEIGHT = 4.2; // 줄간격 (mm)

    // addText: 옵션 기반 텍스트 추가 함수
    function addText(text, x, yPos, opts) {
      // 기존 호환성: size, bold, color를 직접 전달한 경우
      if (typeof opts === 'number' || typeof opts === 'undefined') {
        var size = arguments[3] || 10;
        var bold = arguments[4] || false;
        var color = arguments[5] || [0, 0, 0];
        opts = { size: size, bold: bold, color: color };
      }

      var size = opts.size || 10;
      var bold = opts.bold || false;
      var color = opts.color || [0, 0, 0];
      var align = opts.align || 'left';
      var maxWidth = opts.maxWidth;

      doc.setFontSize(size);
      // 폰트 설정: Noto Sans KR이 등록되어 있으면 사용, 없으면 기본 폰트
      if (koreanFontLoaded) {
        try {
          var fontStyle = bold ? 'bold' : 'normal';
          doc.setFont('NotoSansKR', fontStyle);
        } catch (e) {
          // 폰트가 없으면 기본 폰트 사용
          doc.setFont(undefined, bold ? 'bold' : 'normal');
        }
      } else {
        // 폰트가 아직 로드되지 않았으면 기본 폰트 사용
        doc.setFont(undefined, bold ? 'bold' : 'normal');
      }
      doc.setTextColor(color[0], color[1], color[2]);

      var textOpts = { align: align };
      if (maxWidth !== undefined) {
        textOpts.maxWidth = maxWidth;
      }

      doc.text(String(text ?? ''), x, yPos, textOpts);
    }

    // addParagraph: 긴 텍스트를 여러 줄로 처리하는 함수
    function addParagraph(text, x, yPos, opts) {
      opts = opts || {};
      var size = opts.size || 9;
      var color = opts.color || [80, 80, 80];
      var bold = opts.bold || false;
      var width = opts.width !== undefined ? opts.width : contentW;
      var lineH = opts.lineHeight || LINE_HEIGHT;
      var maxLines = opts.maxLines || null;
      var align = opts.align || 'left';

      doc.setFontSize(size);
      // 폰트 설정: Noto Sans KR이 등록되어 있으면 사용, 없으면 기본 폰트
      if (koreanFontLoaded) {
        try {
          var fontStyle = bold ? 'bold' : 'normal';
          doc.setFont('NotoSansKR', fontStyle);
        } catch (e) {
          doc.setFont(undefined, bold ? 'bold' : 'normal');
        }
      } else {
        // 폰트가 아직 로드되지 않았으면 기본 폰트 사용
        doc.setFont(undefined, bold ? 'bold' : 'normal');
      }
      doc.setTextColor(color[0], color[1], color[2]);

      var lines = doc.splitTextToSize(String(text ?? ''), width);
      var useLines = maxLines ? lines.slice(0, maxLines) : lines;

      // 예상 높이 계산 후 페이지 넘김 확인
      var needed = useLines.length * lineH + 2; // padding 포함
      checkPage(needed);

      // 텍스트 출력
      doc.text(useLines, x, y, { align: align });
      y += useLines.length * lineH;

      return useLines.length;
    }

    function addLine(yPos) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageW - margin, yPos);
    }

    // 페이지 헤더 추가 함수
    function addPageHeader() {
      addLine(margin);
      y += 3;
      addText('StartSmart', margin, y, { size: 10, bold: true, color: [45, 90, 39] });
      // 페이지 번호 추가
      addText('Page ' + currentPageNum, pageW - margin, y, { size: 9, color: [150, 150, 150], align: 'right' });
      y += 8;
    }

    function checkPage(needed) {
      // 하단 기준을 margin으로 통일
      if (y + (needed || 20) > pageH - margin) {
        doc.addPage();
        currentPageNum++; // 페이지 번호 증가
        y = margin;
        addPageHeader();
      }
    }

    // ensureSpace: 공간 확보 헬퍼 (블록 단위 렌더링용)
    function ensureSpace(mm) {
      checkPage(mm);
    }

    function nextSection(title) {
      sectionNum++;
      ensureSpace(25);
      addText(sectionNum + '. ' + title, margin, y, { size: 13, bold: true });
      y += 8;
    }

    // ── Page 1: Executive Summary + 창업 조건 요약 통합 ──
    addText('StartSmart', margin, y, { size: 18, bold: true, color: [45, 90, 39] });
    addText('창업 타당성 검증 리포트', margin, y + 7, { size: 12, color: [100, 100, 100] });
    // 날짜와 분석 ID 우측 정렬
    var reportDate = '발행일: ' + Utils.formatDate(result.createdAt);
    var reportId = '분석 ID: ' + (result.id || '');
    addText(reportDate, pageW - margin, y, { size: 9, color: [150, 150, 150], align: 'right' });
    addText(reportId, pageW - margin, y + 4, { size: 8, color: [150, 150, 150], align: 'right' });
    addText('대외비', pageW - margin, y + 9, { size: 8, color: [150, 150, 150], align: 'right' });
    doc.setFont(undefined, 'normal');
    y += 18;
    addLine(y);
    y += 8;

    // Executive Summary 섹션
    nextSection('Executive Summary');
    
    var pdfSignal = executive?.signal ?? decision?.signal ?? 'yellow';
    var pdfScore = executive?.score ?? decision?.score ?? 0;
    var pdfSummary = executive?.summary || summaryText || '';

    var scoreColor = pdfSignal === 'green' ? [34, 197, 94] : pdfSignal === 'yellow' ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.circle(margin + 15, y + 10, 12, 'F');
    addText(String(pdfScore), margin + 10, y + 13, { size: 16, bold: true, color: [255, 255, 255] });

    var pdfSignalLabel = executive?.label || sigLabels[pdfSignal] || '주의 신호';
    addText(pdfSignalLabel + ' (점수: ' + pdfScore + '점)', margin + 35, y + 8, { size: 11, bold: true });
    // summary를 addParagraph로 처리
    y += 6;
    var summaryLines = addParagraph(pdfSummary, margin + 35, y, {
      size: 8,
      width: contentW - 35,
      maxLines: 2,
      color: [80, 80, 80]
    });
    y += 3;

    // Decision Confidence
    if (executive?.confidence) {
      var pdfConfidence = executive.confidence;
      ensureSpace(20);
      addText('판정 신뢰도', margin, y, { size: 10, bold: true });
      y += 5;
      if (typeof pdfConfidence === 'object') {
        var confData = [];
        if (pdfConfidence.dataCoverage) confData.push(['데이터 커버리지', pdfConfidence.dataCoverage === 'high' ? '높음' : pdfConfidence.dataCoverage === 'medium' ? '보통' : '낮음']);
        if (pdfConfidence.assumptionRisk) confData.push(['가정 리스크', pdfConfidence.assumptionRisk === 'high' ? '높음' : pdfConfidence.assumptionRisk === 'medium' ? '보통' : '낮음']);
        if (pdfConfidence.stability) confData.push(['판정 안정성', pdfConfidence.stability === 'high' ? '높음' : pdfConfidence.stability === 'medium' ? '보통' : '낮음']);
        if (confData.length > 0) {
          doc.autoTable({
            startY: y, head: [['항목', '레벨']], body: confData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2, font: koreanFontLoaded ? 'NotoSansKR' : undefined },
            headStyles: { fillColor: [45, 90, 39], font: koreanFontLoaded ? 'NotoSansKR' : undefined, fontStyle: 'bold' }, 
            theme: 'grid'
          });
          y = doc.lastAutoTable.finalY + 5;
        }
      } else {
        var confValue = pdfConfidence.toString().toLowerCase();
        var confLabel = confValue === 'high' ? '높음' : confValue === 'medium' ? '보통' : '낮음';
        addText('신뢰도: ' + confLabel, margin, y, { size: 9, color: [80, 80, 80] });
        y += 5;
      }
    }

    // 창업 조건 요약 섹션
    var targetSales = gap?.targetDailySales ?? (input ? input.targetDailySales : null);
    ensureSpace(25);
    nextSection('창업 조건 요약 (입력값 스냅샷)');

    var overviewData = [
      ['브랜드', result.brand.name],
      ['입지 (지역/반경)', result.location.address || 'N/A'],
      ['평수', (input ? input.conditions.area : '-') + '평'],
      ['월세', Utils.formatKRWFull(finance.monthlyCosts.rent) + ' / 월'],
      ['초기 투자금', Utils.formatKRWFull(input ? input.conditions.initialInvestment : 0)],
      ['목표 일 판매량', (targetSales !== null ? targetSales : '-') + '잔/일'],
      ['점주 근무', input && input.conditions.ownerWorking ? '직접 근무' : '고용 운영']
    ];

    doc.autoTable({
      startY: y, head: [['항목', '값']], body: overviewData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3, font: koreanFontLoaded ? 'NotoSansKR' : undefined },
      headStyles: { fillColor: [45, 90, 39], font: koreanFontLoaded ? 'NotoSansKR' : undefined, fontStyle: 'bold' }, 
      theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 10;

    nextSection('종합 평가');

    var pdfSignal = executive?.signal ?? decision?.signal ?? 'yellow';
    var pdfScore = executive?.score ?? decision?.score ?? 0;
    var pdfSummary = executive?.summary || summaryText || '';

    var scoreColor = pdfSignal === 'green' ? [34, 197, 94] : pdfSignal === 'yellow' ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.circle(margin + 15, y + 10, 12, 'F');
    addText(String(pdfScore), margin + 10, y + 13, { size: 16, bold: true, color: [255, 255, 255] });

    var pdfSignalLabel = executive?.label || sigLabels[pdfSignal] || '주의 신호';
    addText(pdfSignalLabel + ' (점수: ' + pdfScore + ')', margin + 35, y + 8, { size: 11, bold: true });
    // 긴 summary를 addParagraph로 처리 (1페이지와 2페이지 통합을 위해 줄 수 감소)
    y += 6;
    var summaryLines = addParagraph(pdfSummary, margin + 35, y, {
      size: 8,
      width: contentW - 35,
      maxLines: 2, // 1페이지와 2페이지 통합을 위해 줄 수 감소
      color: [80, 80, 80]
    });
    y += 3; // 추가 여백 감소

    // Decision Confidence
    if (executive?.confidence) {
      var pdfConfidence = executive.confidence;
      ensureSpace(25); // 공간 조정
      addText('판정 신뢰도', margin, y, { size: 11, bold: true });
      y += 6;
      if (typeof pdfConfidence === 'object') {
        var confData = [];
        if (pdfConfidence.dataCoverage) confData.push(['데이터 커버리지', pdfConfidence.dataCoverage === 'high' ? '높음' : pdfConfidence.dataCoverage === 'medium' ? '보통' : '낮음']);
        if (pdfConfidence.assumptionRisk) confData.push(['가정 리스크', pdfConfidence.assumptionRisk === 'high' ? '높음' : pdfConfidence.assumptionRisk === 'medium' ? '보통' : '낮음']);
        if (pdfConfidence.stability) confData.push(['판정 안정성', pdfConfidence.stability === 'high' ? '높음' : pdfConfidence.stability === 'medium' ? '보통' : '낮음']);
        if (confData.length > 0) {
          doc.autoTable({
            startY: y, head: [['항목', '레벨']], body: confData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2.5, font: koreanFontLoaded ? 'NotoSansKR' : undefined },
            headStyles: { fillColor: [45, 90, 39], font: koreanFontLoaded ? 'NotoSansKR' : undefined, fontStyle: 'bold' }, 
            theme: 'grid'
          });
          y = doc.lastAutoTable.finalY + 5;
        }
      } else {
        var confValue = pdfConfidence.toString().toLowerCase();
        var confLabel = confValue === 'high' ? '높음' : confValue === 'medium' ? '보통' : '낮음';
        addText('신뢰도: ' + confLabel, margin, y, { size: 9, color: [80, 80, 80] });
        y += 5;
      }
    }

    // Hardcut Reasons
    if (executive?.nonNegotiable || (result.decision?.hardCutReasons && result.decision.hardCutReasons.length > 0)) {
      ensureSpace(15); // 공간 조정
      addText('하드컷 판정 근거', margin, y, { size: 11, bold: true });
      y += 6;
      var hardCutReasons = result.decision?.hardCutReasons || [];
      for (var hc = 0; hc < hardCutReasons.length; hc++) {
        ensureSpace(6);
        addText((hc + 1) + '. ' + hardCutReasons[hc], margin, y, { size: 9, color: [239, 68, 68] });
        y += 5;
      }
      y += 5;
    }

    // ── Financial Analysis (1페이지에 계속 표시 - 1페이지와 2페이지 통합) ──
    // 페이지 넘김 없이 1페이지에 계속 표시하도록 공간 조정
    ensureSpace(60);
    nextSection('재무 분석');

    var finBody = finRows.map(function (row) {
      return [row[0], Utils.formatKRW(row[1]), row[2]];
    });
    doc.autoTable({
      startY: y, head: [['항목', '금액 (월)', '비율']], body: finBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5, font: koreanFontLoaded ? 'NotoSansKR' : undefined },
      headStyles: { fillColor: [45, 90, 39], font: koreanFontLoaded ? 'NotoSansKR' : undefined, fontStyle: 'bold' }, 
      theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 10;

    // Key Metrics
    ensureSpace(35); // 공간 조정
    nextSection('핵심 지표');
    var kpiBody = kpis.map(function (k) { return [k.label, k.value]; });
    doc.autoTable({
      startY: y, head: [['지표', '값']], body: kpiBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3, font: koreanFontLoaded ? 'NotoSansKR' : undefined },
      headStyles: { fillColor: [45, 90, 39], font: koreanFontLoaded ? 'NotoSansKR' : undefined, fontStyle: 'bold' }, 
      theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 10;

    // Sensitivity
    ensureSpace(35); // 공간 조정
    nextSection('민감도 분석');
    doc.autoTable({
      startY: y, head: [['시나리오', '월 순이익', '회수 기간']], body: sensRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3, font: koreanFontLoaded ? 'NotoSansKR' : undefined },
      headStyles: { fillColor: [45, 90, 39], font: koreanFontLoaded ? 'NotoSansKR' : undefined, fontStyle: 'bold' }, 
      theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 10;

    // Breakdown
    if (breakdown) {
      ensureSpace(40); // 공간 조정
      nextSection('점수 Breakdown');
      var breakdownItems = [
        { label: '회수 기간', value: breakdown.payback || breakdown.paybackMonths || 0 },
        { label: '수익성', value: breakdown.profitability || 0 },
        { label: 'GAP', value: breakdown.gap || 0 },
        { label: '민감도', value: breakdown.sensitivity || 0 },
        { label: '고정비', value: breakdown.fixedCost || breakdown.fixedCosts || 0 },
        { label: 'DSCR', value: breakdown.dscr || 0 },
        { label: '상권', value: breakdown.market || 0 },
        { label: '로드뷰', value: breakdown.roadview || 0 }
      ];
      var breakdownBody = breakdownItems.map(function(item) {
        var evaluation = item.value >= 80 ? '양호' : item.value >= 60 ? '보통' : '주의';
        return [item.label, item.value + '점', evaluation];
      });
      doc.autoTable({
        startY: y, head: [['항목', '점수', '평가']], body: breakdownBody,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2.5, font: koreanFontLoaded ? 'NotoSansKR' : undefined },
        headStyles: { fillColor: [45, 90, 39], font: koreanFontLoaded ? 'NotoSansKR' : undefined, fontStyle: 'bold' }, 
        theme: 'grid'
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ── Location Analysis ──
    var hasRoadview = roadviewData && roadviewData.risks && roadviewData.risks.length > 0;
    if (hasRoadview) {
      ensureSpace(40);
      nextSection('Location Analysis (Roadview)');
      var rvRiskTypeMap = {
        signage_obstruction: '간판 가시성', steep_slope: '경사도',
        floor_level: '층위', visibility: '보행 가시성'
      };
      var rvLevelLabelMap = {
        low: '낮음', medium: '보통', high: '높음',
        ground: '1층', half_basement: '반지하', second_floor: '2층 이상'
      };
      for (var rv = 0; rv < roadviewData.risks.length; rv++) {
        ensureSpace(20);
        var rvRisk = roadviewData.risks[rv];
        addText((rv + 1) + '. ' + (rvRiskTypeMap[rvRisk.type] || rvRisk.type) + ' [' + (rvLevelLabelMap[rvRisk.level] || rvRisk.level) + ']', margin, y, { size: 10, bold: true });
        y += 5;
        addParagraph(rvRisk.description || '', margin, y, {
          size: 8,
          width: contentW,
          color: [80, 80, 80]
        });
        y += 3; // 항목 간 여백
      }
      if (roadviewData.overallRisk) {
        ensureSpace(12);
        addText('Overall Risk: ' + (roadviewData.overallRisk === 'low' ? '낮음' : roadviewData.overallRisk === 'high' ? '높음' : '보통'), margin, y, { size: 10, bold: true });
        y += 5;
        if (roadviewData.riskScore !== null && roadviewData.riskScore !== undefined) {
          addText('Risk Score: ' + roadviewData.riskScore + ' / 100', margin, y, { size: 9, color: [80, 80, 80] });
          y += 8;
        }
      }
    }

    // ── Market Analysis ──
    if (marketData) {
      ensureSpace(40);
      nextSection('Market Analysis');
      var marketBody = [];
      if (marketData.location && marketData.location.radius) marketBody.push(['반경', marketData.location.radius + 'm']);
      if (marketData.competitors) {
        marketBody.push(['총 경쟁 카페', (marketData.competitors.total || 0) + '개']);
        marketBody.push(['동일 브랜드', (marketData.competitors.sameBrand || 0) + '개']);
        marketBody.push(['타 브랜드', (marketData.competitors.otherBrands || 0) + '개']);
        if (marketData.competitors.density) {
          marketBody.push(['경쟁 밀도', marketData.competitors.density === 'high' ? '높음' : marketData.competitors.density === 'low' ? '낮음' : '보통']);
        }
      }
      if (marketData.footTraffic) {
        var tfMap = { low: '낮음', medium: '보통', high: '높음' };
        marketBody.push(['평일 유동인구', tfMap[marketData.footTraffic.weekday] || '보통']);
        marketBody.push(['주말 유동인구', tfMap[marketData.footTraffic.weekend] || '보통']);
      }
      if (marketData.marketScore !== null && marketData.marketScore !== undefined) {
        marketBody.push(['상권 종합 점수', marketData.marketScore + '점']);
      }
      if (marketBody.length > 0) {
        doc.autoTable({
          startY: y, head: [['항목', '값']], body: marketBody,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, cellPadding: 3, font: koreanFontLoaded ? 'NotoSansKR' : undefined },
          headStyles: { fillColor: [45, 90, 39], font: koreanFontLoaded ? 'NotoSansKR' : undefined, fontStyle: 'bold' }, 
          theme: 'grid'
        });
        y = doc.lastAutoTable.finalY + 10;
      }
    }

    // ── AI Risk Analysis ──
    var pdfRisks = risksToShow || [];
    if (pdfRisks.length > 0) {
      ensureSpace(30);
      nextSection('AI Risk Analysis');
      for (var r = 0; r < pdfRisks.length; r++) {
        ensureSpace(20);
        var pdfRisk = pdfRisks[r];
        addText((r + 1) + '. ' + (pdfRisk.title || '') + ' [' + ((pdfRisk.impact || 'medium').toUpperCase()) + ']', margin, y, { size: 10, bold: true });
        y += 5;
        addParagraph(pdfRisk.description || '', margin, y, {
          size: 8,
          width: contentW,
          color: [80, 80, 80]
        });
        y += 3; // 항목 간 여백
      }
    }

    // ── AI Improvements (AI consulting 결과만 표시) ──
    // improvement.cards에서 ai가 있는 것만 필터링
    var pdfImps = [];
    if (improvement && improvement.cards && improvement.cards.length > 0) {
      // AI consulting 결과가 있는 카드만 필터링
      pdfImps = improvement.cards
        .filter(function(card) { return card.ai !== null && card.ai !== undefined; })
        .map(function(card) {
          return {
            title: card.ai.title || card.engine?.title || '',
            description: card.ai.description || card.engine?.description || '',
            expectedImpact: card.ai.expectedImpact || ''
          };
        });
    } else if (ai && ai.improvements && ai.improvements.length > 0) {
      // fallback: 기존 ai.improvements 사용
      pdfImps = ai.improvements;
    }
    
    if (pdfImps.length > 0) {
      ensureSpace(30);
      nextSection('AI Improvement Suggestions');
      for (var im = 0; im < pdfImps.length; im++) {
        ensureSpace(20);
        var pdfImp = pdfImps[im];
        if (!pdfImp.title && !pdfImp.description) continue; // 제목과 설명이 모두 없으면 스킵
        addText((im + 1) + '. ' + (pdfImp.title || '개선 제안'), margin, y, { size: 10, bold: true });
        y += 5;
        if (pdfImp.description) {
          addParagraph(pdfImp.description, margin, y, {
            size: 8,
            width: contentW,
            color: [80, 80, 80]
          });
        }
        if (pdfImp.expectedImpact) {
          y += 2;
          addText('Expected: ' + pdfImp.expectedImpact, margin, y, { size: 8, color: [45, 90, 39] });
          y += 5;
        } else {
          y += 3; // 항목 간 여백
        }
      }
    }

    // ── Competitive ──
    if (competitive || ai?.competitiveAnalysis) {
      ensureSpace(30);
      nextSection('Competitive Analysis');
      var pdfComp = competitive || ai.competitiveAnalysis;
      var compBody = [];
      if (pdfComp.intensity) compBody.push(['경쟁 강도', { high: '높음', medium: '보통', low: '낮음' }[pdfComp.intensity] || pdfComp.intensity]);
      if (pdfComp.differentiation) compBody.push(['차별화', { possible: '가능', difficult: '어려움' }[pdfComp.differentiation] || pdfComp.differentiation]);
      if (pdfComp.priceStrategy) compBody.push(['가격 전략', { premium: '프리미엄', standard: '표준', budget: '저가' }[pdfComp.priceStrategy] || pdfComp.priceStrategy]);
      if (compBody.length > 0) {
        doc.autoTable({
          startY: y, head: [['항목', '평가']], body: compBody,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, cellPadding: 3, font: koreanFontLoaded ? 'NotoSansKR' : undefined },
          headStyles: { fillColor: [45, 90, 39], font: koreanFontLoaded ? 'NotoSansKR' : undefined, fontStyle: 'bold' }, 
          theme: 'grid'
        });
        y = doc.lastAutoTable.finalY + 10;
      }
    }

    // ── Failure Triggers ──
    if (failureTriggers && failureTriggers.length > 0) {
      ensureSpace(30);
      nextSection('Failure Triggers');
      for (var ft = 0; ft < failureTriggers.length; ft++) {
        ensureSpace(25);
        var trigger = failureTriggers[ft];
        addText((ft + 1) + '. ' + (trigger.triggerName || trigger.trigger || '') + ' [' + (trigger.impact || 'medium').toUpperCase() + ']', margin, y, { size: 10, bold: true });
        y += 5;
        if (trigger.outcome || trigger.result) {
          addParagraph((trigger.outcome || trigger.result), margin, y, {
            size: 8,
            width: contentW,
            color: [80, 80, 80]
          });
        }
        if (trigger.estimatedFailureWindow) {
          y += 2;
          addText('Failure Window: ' + trigger.estimatedFailureWindow, margin, y, { size: 8, color: [239, 68, 68] });
          y += 4;
        }
        if (trigger.totalLossAtFailure !== undefined) {
          addText('Total Loss: ' + Utils.formatKRW(trigger.totalLossAtFailure), margin, y, { size: 8, color: [239, 68, 68] });
          y += 4;
        }
        y += 3; // 항목 간 여백
      }
    }

    // ── Exit Plan & 손절 판단 ──
    ensureSpace(30);
    nextSection('Exit Plan & 손절 판단');

    // 손절 기준선 (Break-Down Line)
    var pdfBreakdownVisitors = finance?.breakdownVisitors || null;
    if (pdfBreakdownVisitors !== null && pdfBreakdownVisitors !== undefined) {
      ensureSpace(25);
      addText('손절 기준선 (Break-Down Line)', margin, y, { size: 11, bold: true });
      y += 6;
      addText('손절 방문객 수: ' + Math.round(pdfBreakdownVisitors) + '명/일', margin, y, { size: 10, bold: true, color: [239, 68, 68] });
      y += 5;
      addParagraph('손절 방문객 수 = (고정비 + 최소 변동비) ÷ 1인당 평균 구매비용', margin, y, {
        size: 8,
        width: contentW,
        color: [80, 80, 80]
      });
      y += 2;
      addText('이 방문객 수 이하가 3개월 이상 지속되면 손절 검토가 필요합니다.', margin, y, { size: 8, color: [80, 80, 80] });
      y += 8;
    }

    // 적자 지속 시 생존 개월 수
    var pdfMonthlyProfit = executive?.monthlyProfit ?? finance?.monthlyProfit ?? 0;
    var pdfMonthlyLoss = pdfMonthlyProfit < 0 ? Math.abs(pdfMonthlyProfit) : 0;
    var pdfAvailableCash = input ? input.conditions.initialInvestment : 0;
    if (exitPlan && exitPlan.exitCostBreakdown) {
      pdfAvailableCash -= (exitPlan.exitCostBreakdown.exitCostTotal || exitPlan.exitCostBreakdown.totalLoss || 0);
    }
    var pdfSurvivalMonthsOnLoss = pdfMonthlyLoss > 0 && pdfAvailableCash > 0 ? Math.floor(pdfAvailableCash / pdfMonthlyLoss) : null;
    
    if (pdfMonthlyLoss > 0) {
      ensureSpace(25);
      addText('적자 지속 시 생존 개월 수', margin, y, { size: 11, bold: true });
      y += 6;
      addText('월 적자: ' + Utils.formatKRW(pdfMonthlyLoss), margin, y, { size: 10, bold: true, color: [239, 68, 68] });
      y += 5;
      addText('생존 개월: ' + (pdfSurvivalMonthsOnLoss !== null ? pdfSurvivalMonthsOnLoss + '개월' : '계산 불가'), margin, y, { size: 10, bold: true });
      y += 5;
      addText('생존 개월 = (초기 투자금 중 회수 불가 비용 제외 후 잔여 현금) ÷ 월 적자', margin, y, { size: 8, color: [80, 80, 80] });
      y += 8;
    }

    // 폐업 시 회수 구조 (Exit Plan)
    if (exitPlan && (exitPlan.optimalExitMonth || exitPlan.warningMonth || exitPlan.exitCostBreakdown)) {
      ensureSpace(30);
      addText('폐업 시 회수 구조', margin, y, { size: 11, bold: true });
      y += 6;

      if (exitPlan.optimalExitMonth || exitPlan.warningMonth) {
        var exitTimingData = [];
        if (exitPlan.warningMonth) exitTimingData.push(['Warning', exitPlan.warningMonth + ' months', Utils.formatKRW(exitPlan.totalLossAtWarning || 0)]);
        if (exitPlan.optimalExitMonth) exitTimingData.push(['Optimal Exit', exitPlan.optimalExitMonth + ' months', Utils.formatKRW(exitPlan.totalLossAtOptimal || 0)]);
        if (exitPlan.lossExplosionMonth) exitTimingData.push(['Loss Explosion', exitPlan.lossExplosionMonth + ' months', Utils.formatKRW(exitPlan.totalLossAtExplosion || 0)]);
        if (exitTimingData.length > 0) {
          doc.autoTable({
            startY: y, head: [['구분', '시점', '총손실']], body: exitTimingData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2.5, font: koreanFontLoaded ? 'NotoSansKR' : undefined },
            headStyles: { fillColor: [45, 90, 39], font: koreanFontLoaded ? 'NotoSansKR' : undefined, fontStyle: 'bold' }, 
            theme: 'grid'
          });
          y = doc.lastAutoTable.finalY + 8;
        }
      }

      if (exitPlan.exitCostBreakdown) {
        ensureSpace(30);
        var eb = exitPlan.exitCostBreakdown;
        addText('Exit Cost Breakdown', margin, y, { size: 11, bold: true });
        y += 6;
        var exitCostData = [];
        if (eb.penaltyCost !== undefined) exitCostData.push(['Penalty', Utils.formatKRW(eb.penaltyCost || 0)]);
        if (eb.demolitionCost !== undefined) exitCostData.push(['Demolition', Utils.formatKRW(eb.demolitionCost || 0)]);
        if (eb.interiorLoss !== undefined) exitCostData.push(['Interior Loss', Utils.formatKRW(eb.interiorLoss || 0)]);
        if (eb.goodwillRecovered && eb.goodwillRecovered !== 0) exitCostData.push(['Goodwill Recovery', '-' + Utils.formatKRW(Math.abs(eb.goodwillRecovered))]);
        if (eb.exitCostTotal !== undefined) exitCostData.push(['Exit Cost Total', Utils.formatKRW(eb.exitCostTotal || 0)]);
        if (exitPlan.totalLossAtOptimal !== undefined) exitCostData.push(['Final Total Loss', Utils.formatKRW(exitPlan.totalLossAtOptimal)]);
        if (exitCostData.length > 0) {
          doc.autoTable({
            startY: y, head: [['항목', '금액']], body: exitCostData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2.5, font: koreanFontLoaded ? 'NotoSansKR' : undefined },
            headStyles: { fillColor: [45, 90, 39], font: koreanFontLoaded ? 'NotoSansKR' : undefined, fontStyle: 'bold' }, 
            theme: 'grid'
          });
          y = doc.lastAutoTable.finalY + 10;
        }
      }
    }

    // Disclaimer
    ensureSpace(15);
    y += 5;
    addLine(y);
    y += 5;
    addText('* This report is based on AI simulation models and may differ from actual results.', margin, y, { size: 7, color: [150, 150, 150] });

    // Save
    var filename = 'StartSmart_' + result.brand.name + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
    doc.save(filename);
  }

  function pct(val, total) {
    if (!total) return '0%';
    return Math.round(val / total * 100) + '%';
  }

  // ═══════════════════════════════════════════
  // 빈 페이지 숨기기
  // ═══════════════════════════════════════════
  function hideEmptyPages() {
    var pages = document.querySelectorAll('.report-page');
    var pageNum = 0;
    for (var i = 0; i < pages.length; i++) {
      var page = pages[i];
      // 항상 표시하는 페이지
      if (page.id === 'page0-executive' || page.id === 'page1-conditions' || page.id === 'page-disclaimer') {
        pageNum++;
        var footer = page.querySelector('.report-page-footer');
        if (footer) footer.textContent = 'StartSmart Inc. | AI 기반 창업 검증 플랫폼 | Page ' + pageNum;
        continue;
      }
      // 실제 콘텐츠 확인: table rows, risk items, kpis, images 등
      var contentEls = page.querySelectorAll('table tbody tr, .report-risk-item, .report-kpi, img');
      if (contentEls.length === 0) {
        page.style.display = 'none';
      } else {
        pageNum++;
        var footer = page.querySelector('.report-page-footer');
        if (footer) footer.textContent = 'StartSmart Inc. | AI 기반 창업 검증 플랫폼 | Page ' + pageNum;
      }
    }
  }
  setTimeout(hideEmptyPages, 100);

  // Header scroll
  window.addEventListener('scroll', function () {
    var header = document.getElementById('header');
    if (header && window.scrollY > 50) header.classList.add('scrolled');
    else if (header) header.classList.remove('scrolled');
  });
})();
