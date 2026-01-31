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

  var finance = result.finance;
  var decision = result.decision;
  var ai = result.aiConsulting;

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

  // Score
  var scoreCircle = document.getElementById('rScoreCircle');
  if (decision.signal === 'yellow') scoreCircle.classList.add('yellow');
  if (decision.signal === 'red') scoreCircle.classList.add('red');
  document.getElementById('rScoreNum').textContent = decision.score;

  var sigLabels = { green: '긍정 신호', yellow: '주의 신호', red: '부정 신호' };
  document.getElementById('rSignalText').textContent = '창업 ' + (sigLabels[decision.signal] || '주의 신호') + ' (Score: ' + decision.score + '점)';

  var summaryParts = [];
  summaryParts.push('투자 회수 기간은 ' + (finance.paybackMonths >= 999 ? '회수 불가' : finance.paybackMonths + '개월') + '로 예상됩니다.');
  summaryParts.push('월 순이익은 ' + Utils.formatKRW(finance.monthlyProfit) + '이며, 손익분기 판매량은 일 ' + finance.breakEvenDailySales + '잔입니다.');
  if (decision.riskFactors && decision.riskFactors.length > 0) {
    summaryParts.push(decision.riskFactors[0]);
  }
  document.getElementById('rDecisionSummary').textContent = summaryParts.join(' ');

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

  // KPIs
  var kpis = [
    { label: '생존 개월', value: decision.survivalMonths + '개월', danger: decision.survivalMonths < 24 },
    { label: '회수 기간', value: finance.paybackMonths >= 999 ? '회수 불가' : finance.paybackMonths + '개월', danger: finance.paybackMonths > 36 },
    { label: '월 순이익', value: Utils.formatKRW(finance.monthlyProfit), danger: finance.monthlyProfit <= 0 },
    { label: '손익분기', value: finance.breakEvenDailySales + '잔/일', danger: false }
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
  // PAGE 3: AI
  // ═══════════════════════════════════════════

  // Risks
  var riskHtml = '';
  for (var r = 0; r < ai.topRisks.length; r++) {
    var risk = ai.topRisks[r];
    riskHtml += '<div class="report-risk-item ' + risk.impact + '">' +
      '<h4>' + (r + 1) + '. ' + risk.title + ' <span style="font-size:0.8rem; color:#999;">(' + risk.impact.toUpperCase() + ')</span></h4>' +
      '<p>' + risk.description + '</p></div>';
  }
  document.getElementById('rRiskList').innerHTML = riskHtml;

  // Improvements
  var impHtml = '';
  for (var im = 0; im < ai.improvements.length; im++) {
    var imp = ai.improvements[im];
    impHtml += '<div class="report-risk-item low">' +
      '<h4>' + (im + 1) + '. ' + imp.title + '</h4>' +
      '<p>' + imp.description + '</p>' +
      '<p style="color:#2D5A27; font-weight:600; margin-top:0.3rem;">기대 효과: ' + imp.expectedImpact + '</p></div>';
  }
  document.getElementById('rImprovementList').innerHTML = impHtml;

  // Competitive
  var comp = ai.competitiveAnalysis;
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

    var overviewData = [
      ['Brand', result.brand.name],
      ['Location', result.location.address || 'N/A'],
      ['Area', (input ? input.conditions.area : '-') + ' pyeong'],
      ['Investment', Utils.formatKRW(input ? input.conditions.initialInvestment : 0)],
      ['Monthly Rent', Utils.formatKRW(finance.monthlyCosts.rent)],
      ['Target Sales', (input ? input.targetDailySales : '-') + ' cups/day']
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

    var scoreColor = decision.signal === 'green' ? [34, 197, 94] : decision.signal === 'yellow' ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.circle(margin + 15, y + 10, 12, 'F');
    addText(String(decision.score), margin + 10, y + 13, 16, true, [255, 255, 255]);

    addText((sigLabels[decision.signal] || 'Caution') + ' (Score: ' + decision.score + ')', margin + 35, y + 8, 11, true);
    addText(summaryParts.join(' ').substring(0, 90), margin + 35, y + 14, 8, false, [80, 80, 80]);
    y += 30;

    // ── Page 2 ──
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

    // ── Page 3 ──
    doc.addPage();
    y = margin;
    addText('StartSmart', margin, y, 10, true, [45, 90, 39]);
    y += 10;

    addText('6. AI Risk Analysis', margin, y, 13, true);
    y += 8;

    for (var r = 0; r < ai.topRisks.length; r++) {
      addText((r + 1) + '. ' + ai.topRisks[r].title + ' [' + ai.topRisks[r].impact.toUpperCase() + ']', margin, y, 10, true);
      y += 5;
      var lines = doc.splitTextToSize(ai.topRisks[r].description, contentW);
      addText(lines, margin, y, 8, false, [80, 80, 80]);
      y += lines.length * 4 + 5;
    }

    y += 5;
    addText('7. AI Improvement Suggestions', margin, y, 13, true);
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
