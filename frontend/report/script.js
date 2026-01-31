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

  // Score (executive 우선 사용)
  var signal = executive?.signal ?? decision?.signal ?? 'yellow';
  var score = executive?.score ?? decision?.score ?? 0;
  var scoreCircle = document.getElementById('rScoreCircle');
  if (signal === 'yellow') scoreCircle.classList.add('yellow');
  if (signal === 'red') scoreCircle.classList.add('red');
  document.getElementById('rScoreNum').textContent = score;

  var sigLabels = { green: '긍정 신호', yellow: '주의 신호', red: '부정 신호' };
  var signalLabel = executive?.label || sigLabels[signal] || '주의 신호';
  document.getElementById('rSignalText').textContent = '창업 ' + signalLabel + ' (Score: ' + score + '점)';

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
  document.getElementById('rDecisionSummary').textContent = summaryText;

  // ═══════════════════════════════════════════
  // PAGE 2: Financial
  // ═══════════════════════════════════════════
  var costs = finance.monthlyCosts;
  var rev = finance.monthlyRevenue;

  var finRows = [
    ['월 매출', rev, '100%'],
    ['재료비', costs.materials, pct(costs.materials, rev)],
    ['인건비', costs.labor, pct(costs.labor, rev)],
    ['임대료', costs.rent, pct(costs.rent, rev)],
    ['로열티', costs.royalty, pct(costs.royalty, rev)],
    ['마케팅비', costs.marketing, pct(costs.marketing, rev)],
    ['공과금/기타', costs.utilities + costs.etc, pct(costs.utilities + costs.etc, rev)],
    ['월 순이익', finance.monthlyProfit, pct(finance.monthlyProfit, rev)]
  ];

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
  
  var kpis = [
    { label: '생존 개월', value: survivalMonths + '개월', danger: survivalMonths < 24 },
    { label: '회수 기간', value: paybackMonths >= 999 ? '회수 불가' : paybackMonths + '개월', danger: paybackMonths > 36 },
    { label: '월 순이익', value: Utils.formatKRW(monthlyProfit), danger: monthlyProfit <= 0 },
    { label: '손익분기', value: breakEvenDailySales + '잔/일', danger: false }
  ];

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

  // ═══════════════════════════════════════════
  // PAGE 3: 입지-상권분석
  // ═══════════════════════════════════════════

  // reportModel에서 market과 roadview 데이터 가져오기 (이미 위에서 변수로 가져옴)
  var marketData = market;  // reportModel 우선 사용 (위에서 이미 설정됨)
  var roadviewData = roadview;  // reportModel 우선 사용 (위에서 이미 설정됨)

  // 입지 분석 (Roadview) 렌더링
  function renderRoadviewAnalysis(roadview) {
    if (!roadview) {
      document.getElementById('rRoadviewRisks').innerHTML =
        '<p style="color:var(--text-muted); text-align:center; padding:2rem;">입지 분석 데이터가 없습니다.</p>';
      document.getElementById('rRoadviewSummary').innerHTML = '';
      return;
    }

    var risks = roadview.risks || [];
    var riskHtml = '';

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
    document.getElementById('rRoadviewSummary').innerHTML = summaryHtml;
  }

  // 상권 분석 (Market) 렌더링
  function renderMarketAnalysis(market) {
    if (!market) {
      document.getElementById('rMarketCompetitors').innerHTML =
        '<p style="color:var(--text-muted); text-align:center; padding:2rem;">상권 분석 데이터가 없습니다.</p>';
      document.getElementById('rMarketFootTraffic').innerHTML = '';
      document.getElementById('rMarketScore').innerHTML = '';
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
    document.getElementById('rMarketFootTraffic').innerHTML = footTrafficHtml;

    // 상권 점수
    var marketScore = market.marketScore !== null && market.marketScore !== undefined ? market.marketScore : 50;
    var scoreLabel = marketScore >= 70 ? '양호' : marketScore >= 50 ? '보통' : '주의';

    var scoreHtml = '<div style="padding:1.5rem; background:#f5f7ff; border-radius:var(--radius-sm); text-align:center;">' +
      '<h4 style="margin:0; margin-bottom:1rem;">상권 종합 점수</h4>' +
      '<div style="font-size:2.5rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">' + marketScore + '점</div>' +
      '<div style="font-size:1rem; color:var(--text-muted);">' + scoreLabel + '</div>' +
      '</div>';

    document.getElementById('rMarketScore').innerHTML = scoreHtml;
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

  document.getElementById('rCompetitive').innerHTML =
    '<table class="report-table">' +
    '<tr><th>경쟁 강도</th><td>' + (intensityKR[comp.intensity] || comp.intensity) + '</td></tr>' +
    '<tr><th>차별화 가능성</th><td>' + (diffKR[comp.differentiation] || comp.differentiation) + '</td></tr>' +
    '<tr><th>권장 가격 전략</th><td>' + (priceKR[comp.priceStrategy] || comp.priceStrategy) + '</td></tr>' +
    '</table>';

  // ═══════════════════════════════════════════
  // jsPDF Generation
  // ═══════════════════════════════════════════
  var btnPDF = document.getElementById('btnPDF');
  if (btnPDF) {
    btnPDF.addEventListener('click', generatePDF);
  }

  function generatePDF() {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF('p', 'mm', 'a4');
    var pageW = 210;
    var margin = 20;
    var contentW = pageW - margin * 2;
    var y = margin;

    // Helper
    function addText(text, x, yPos, size, bold, color) {
      doc.setFontSize(size || 10);
      if (bold) doc.setFont(undefined, 'bold');
      else doc.setFont(undefined, 'normal');
      if (color) doc.setTextColor(color[0], color[1], color[2]);
      else doc.setTextColor(0, 0, 0);
      doc.text(text, x, yPos);
    }

    function addLine(yPos) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageW - margin, yPos);
    }

    // ── Page 1 ──
    addText('StartSmart', margin, y, 18, true, [45, 90, 39]);
    addText('Creation Feasibility Report', margin, y + 7, 12, false, [100, 100, 100]);
    addText(Utils.formatDate(result.createdAt), pageW - margin, y, 9, false, [150, 150, 150]);
    doc.setFont(undefined, 'normal');
    y += 15;
    addLine(y);
    y += 8;

    addText('1. Analysis Overview', margin, y, 13, true);
    y += 8;

    // Target Sales는 gap에서 가져오거나 input에서 가져옴
    var targetSales = gap?.targetDailySales ?? (input ? input.targetDailySales : null);
    
    var overviewData = [
      ['Brand', result.brand.name],
      ['Location', result.location.address || 'N/A'],
      ['Area', (input ? input.conditions.area : '-') + ' pyeong'],
      ['Investment', Utils.formatKRW(input ? input.conditions.initialInvestment : 0)],
      ['Monthly Rent', Utils.formatKRW(finance.monthlyCosts.rent)],
      ['Target Sales', (targetSales !== null ? targetSales : '-') + ' cups/day']
    ];

    doc.autoTable({
      startY: y,
      head: [['Item', 'Value']],
      body: overviewData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [45, 90, 39] },
      theme: 'grid'
    });

    y = doc.lastAutoTable.finalY + 10;

    addText('2. Overall Evaluation', margin, y, 13, true);
    y += 8;

    // PDF에서도 executive 우선 사용
    var pdfSignal = executive?.signal ?? decision?.signal ?? 'yellow';
    var pdfScore = executive?.score ?? decision?.score ?? 0;
    var pdfSummary = executive?.summary || summaryParts.join(' ');
    
    var scoreColor = pdfSignal === 'green' ? [34, 197, 94] : pdfSignal === 'yellow' ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.circle(margin + 15, y + 10, 12, 'F');
    addText(String(pdfScore), margin + 10, y + 13, 16, true, [255, 255, 255]);

    var pdfSignalLabel = executive?.label || sigLabels[pdfSignal] || 'Caution';
    addText(pdfSignalLabel + ' (Score: ' + pdfScore + ')', margin + 35, y + 8, 11, true);
    addText(pdfSummary.substring(0, 90), margin + 35, y + 14, 8, false, [80, 80, 80]);
    y += 30;

    // ── Page 2: Financial ──
    doc.addPage();
    y = margin;
    addText('StartSmart', margin, y, 10, true, [45, 90, 39]);
    y += 10;

    addText('3. Financial Analysis', margin, y, 13, true);
    y += 8;

    var finBody = finRows.map(function (row) {
      return [row[0], Utils.formatKRW(row[1]), row[2]];
    });

    doc.autoTable({
      startY: y,
      head: [['Item', 'Amount (Monthly)', 'Ratio']],
      body: finBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [45, 90, 39] },
      theme: 'grid'
    });

    y = doc.lastAutoTable.finalY + 10;

    addText('4. Key Metrics', margin, y, 13, true);
    y += 8;

    var kpiBody = kpis.map(function (k) { return [k.label, k.value]; });
    doc.autoTable({
      startY: y,
      head: [['Metric', 'Value']],
      body: kpiBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [45, 90, 39] },
      theme: 'grid'
    });

    y = doc.lastAutoTable.finalY + 10;

    addText('5. Sensitivity Analysis', margin, y, 13, true);
    y += 8;

    doc.autoTable({
      startY: y,
      head: [['Scenario', 'Monthly Profit', 'Payback']],
      body: sensRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [45, 90, 39] },
      theme: 'grid'
    });

    // ── Page 3: 입지-상권분석 ──
    doc.addPage();
    y = margin;
    addText('StartSmart', margin, y, 10, true, [45, 90, 39]);
    y += 10;

    addText('6. Location Analysis (Roadview)', margin, y, 13, true);
    y += 8;

    // 입지 분석 데이터
    if (roadviewData && roadviewData.risks && roadviewData.risks.length > 0) {
      var riskTypeMap = {
        signage_obstruction: '간판 가시성',
        steep_slope: '경사도',
        floor_level: '층위',
        visibility: '보행 가시성'
      };
      var levelLabelMap = {
        low: '낮음', medium: '보통', high: '높음',
        ground: '1층', half_basement: '반지하', second_floor: '2층 이상'
      };

      for (var rv = 0; rv < roadviewData.risks.length; rv++) {
        var rvRisk = roadviewData.risks[rv];
        var rvTypeLabel = riskTypeMap[rvRisk.type] || rvRisk.type;
        var rvLevelLabel = levelLabelMap[rvRisk.level] || rvRisk.level;
        
        addText((rv + 1) + '. ' + rvTypeLabel + ' [' + rvLevelLabel + ']', margin, y, 10, true);
        y += 5;
        var rvLines = doc.splitTextToSize(rvRisk.description || '', contentW);
        addText(rvLines, margin, y, 8, false, [80, 80, 80]);
        y += rvLines.length * 4 + 5;
      }

      // 종합 평가
      if (roadviewData.overallRisk) {
        y += 3;
        addText('Overall Risk: ' + (roadviewData.overallRisk === 'low' ? '낮음' : roadviewData.overallRisk === 'high' ? '높음' : '보통'), margin, y, 10, true);
        y += 5;
        if (roadviewData.riskScore !== null) {
          addText('Risk Score: ' + roadviewData.riskScore + ' / 100', margin, y, 9, false, [80, 80, 80]);
          y += 5;
        }
      }
    } else {
      addText('입지 분석 데이터가 없습니다.', margin, y, 9, false, [150, 150, 150]);
      y += 5;
    }

    y += 5;
    addText('7. Market Analysis', margin, y, 13, true);
    y += 8;

    // 상권 분석 데이터
    if (marketData) {
      var marketBody = [];
      if (marketData.location && marketData.location.radius) {
        marketBody.push(['반경', marketData.location.radius + 'm']);
      }
      if (marketData.competitors) {
        marketBody.push(['총 경쟁 카페', (marketData.competitors.total || 0) + '개']);
        marketBody.push(['동일 브랜드', (marketData.competitors.sameBrand || 0) + '개']);
        marketBody.push(['타 브랜드', (marketData.competitors.otherBrands || 0) + '개']);
        if (marketData.competitors.density) {
          var densityLabel = marketData.competitors.density === 'high' ? '높음' : 
                            marketData.competitors.density === 'low' ? '낮음' : '보통';
          marketBody.push(['경쟁 밀도', densityLabel]);
        }
      }
      if (marketData.footTraffic) {
        var trafficLabelMap = { low: '낮음', medium: '보통', high: '높음' };
        marketBody.push(['평일 유동인구', trafficLabelMap[marketData.footTraffic.weekday] || '보통']);
        marketBody.push(['주말 유동인구', trafficLabelMap[marketData.footTraffic.weekend] || '보통']);
      }
      if (marketData.marketScore !== null && marketData.marketScore !== undefined) {
        marketBody.push(['상권 종합 점수', marketData.marketScore + '점']);
      }

      if (marketBody.length > 0) {
        doc.autoTable({
          startY: y,
          head: [['항목', '값']],
          body: marketBody,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [45, 90, 39] },
          theme: 'grid'
        });
        y = doc.lastAutoTable.finalY + 10;
      }
    } else {
      addText('상권 분석 데이터가 없습니다.', margin, y, 9, false, [150, 150, 150]);
      y += 5;
    }

    // ── Page 4: AI ──
    doc.addPage();
    y = margin;
    addText('StartSmart', margin, y, 10, true, [45, 90, 39]);
    y += 10;

    addText('8. AI Risk Analysis', margin, y, 13, true);
    y += 8;

    for (var r = 0; r < ai.topRisks.length; r++) {
      addText((r + 1) + '. ' + ai.topRisks[r].title + ' [' + ai.topRisks[r].impact.toUpperCase() + ']', margin, y, 10, true);
      y += 5;
      var lines = doc.splitTextToSize(ai.topRisks[r].description, contentW);
      addText(lines, margin, y, 8, false, [80, 80, 80]);
      y += lines.length * 4 + 5;
    }

    y += 5;
    addText('9. AI Improvement Suggestions', margin, y, 13, true);
    y += 8;

    for (var im = 0; im < ai.improvements.length; im++) {
      addText((im + 1) + '. ' + ai.improvements[im].title, margin, y, 10, true);
      y += 5;
      var impLines = doc.splitTextToSize(ai.improvements[im].description, contentW);
      addText(impLines, margin, y, 8, false, [80, 80, 80]);
      y += impLines.length * 4 + 3;
      addText('Expected: ' + ai.improvements[im].expectedImpact, margin, y, 8, false, [45, 90, 39]);
      y += 7;
    }

    // Disclaimer
    y += 10;
    addLine(y);
    y += 5;
    addText('* This report is based on AI simulation models and may differ from actual results.', margin, y, 7, false, [150, 150, 150]);

    // Save
    var filename = 'StartSmart_' + result.brand.name + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
    doc.save(filename);
  }

  function pct(val, total) {
    if (!total) return '0%';
    return Math.round(val / total * 100) + '%';
  }

  // Header scroll
  window.addEventListener('scroll', function () {
    var header = document.getElementById('header');
    if (header && window.scrollY > 50) header.classList.add('scrolled');
    else if (header) header.classList.remove('scrolled');
  });
})();
