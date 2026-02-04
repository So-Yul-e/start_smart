# PDF 다운로드 레이아웃 가이드

**생성일**: 2025-01-15  
**목적**: PDF 다운로드 시 레이아웃을 잡아주는 로직 정리 및 참고 문서

---

## 📋 목차

1. [개요](#개요)
2. [기본 설정](#기본-설정)
3. [레이아웃 헬퍼 함수](#레이아웃-헬퍼-함수)
4. [페이지 관리](#페이지-관리)
5. [테이블 생성](#테이블-생성)
6. [텍스트 스타일링](#텍스트-스타일링)
7. [섹션별 레이아웃](#섹션별-레이아웃)
8. [참고 문서](#참고-문서)

---

## 개요

PDF 다운로드 기능은 **jsPDF**와 **jsPDF-AutoTable** 플러그인을 사용하여 구현되었습니다.

**주요 파일**:
- `frontend/report/script.js` - PDF 생성 로직 (라인 695-1094)
- `frontend/report/index.html` - PDF 생성 버튼 및 라이브러리 로드
- `frontend/report/style.css` - 웹 리포트 스타일 (PDF와는 별개)

**사용 라이브러리**:
- `jspdf@2.5.1` - PDF 생성 라이브러리
- `jspdf-autotable@3.8.2` - 테이블 자동 생성 플러그인

---

## 기본 설정

### 페이지 크기 및 마진

```695:702:frontend/report/script.js
  function generatePDF() {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF('p', 'mm', 'a4');
    var pageW = 210;
    var pageH = 297;
    var margin = 20;
    var contentW = pageW - margin * 2;
    var y = margin;
```

**설정값**:
- **페이지 방향**: `'p'` (Portrait, 세로)
- **단위**: `'mm'` (밀리미터)
- **용지 크기**: `'a4'` (210mm × 297mm)
- **페이지 너비**: `210mm`
- **페이지 높이**: `297mm`
- **마진**: `20mm` (상하좌우 동일)
- **콘텐츠 너비**: `170mm` (210 - 20×2)
- **현재 Y 좌표**: `y` 변수로 추적 (초기값: 20mm)

### 초기화

```736:743:frontend/report/script.js
    // ── Page 1: Overview + Evaluation ──
    addText('StartSmart', margin, y, 18, true, [45, 90, 39]);
    addText('Creation Feasibility Report', margin, y + 7, 12, false, [100, 100, 100]);
    addText(Utils.formatDate(result.createdAt), pageW - margin, y, 9, false, [150, 150, 150]);
    doc.setFont(undefined, 'normal');
    y += 15;
    addLine(y);
    y += 8;
```

첫 페이지에는 헤더 정보를 추가하고, 구분선을 그어 레이아웃을 시작합니다.

---

## 레이아웃 헬퍼 함수

### 1. `addText()` - 텍스트 추가

```706:713:frontend/report/script.js
    function addText(text, x, yPos, size, bold, color) {
      doc.setFontSize(size || 10);
      if (bold) doc.setFont(undefined, 'bold');
      else doc.setFont(undefined, 'normal');
      if (color) doc.setTextColor(color[0], color[1], color[2]);
      else doc.setTextColor(0, 0, 0);
      doc.text(text, x, yPos);
    }
```

**파라미터**:
- `text`: 표시할 텍스트
- `x`: X 좌표 (mm)
- `yPos`: Y 좌표 (mm)
- `size`: 폰트 크기 (기본값: 10)
- `bold`: 볼드 여부 (boolean)
- `color`: RGB 배열 `[r, g, b]` (기본값: 검정색)

**사용 예시**:
```javascript
addText('제목', margin, y, 13, true);  // 볼드, 13pt
addText('본문', margin, y, 9, false, [80, 80, 80]);  // 회색 본문
```

### 2. `addLine()` - 구분선 추가

```715:718:frontend/report/script.js
    function addLine(yPos) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageW - margin, yPos);
    }
```

**파라미터**:
- `yPos`: 선을 그을 Y 좌표 (mm)

**설정**:
- 색상: 회색 `[200, 200, 200]`
- 시작점: `(margin, yPos)`
- 끝점: `(pageW - margin, yPos)`

### 3. `checkPage()` - 페이지 넘김 확인

```720:727:frontend/report/script.js
    function checkPage(needed) {
      if (y + (needed || 20) > pageH - 20) {
        doc.addPage();
        y = margin;
        addText('StartSmart', margin, y, 10, true, [45, 90, 39]);
        y += 10;
      }
    }
```

**파라미터**:
- `needed`: 필요한 공간 (mm, 기본값: 20mm)

**동작**:
1. 현재 Y 좌표 + 필요한 공간이 페이지 하단 마진(20mm)을 넘으면
2. 새 페이지 추가
3. Y 좌표를 상단 마진으로 리셋
4. 새 페이지에 "StartSmart" 헤더 추가

**중요**: 각 섹션 추가 전에 반드시 호출하여 페이지 넘김을 처리합니다.

### 4. `nextSection()` - 섹션 제목 추가

```729:734:frontend/report/script.js
    function nextSection(title) {
      sectionNum++;
      checkPage(25);
      addText(sectionNum + '. ' + title, margin, y, 13, true);
      y += 8;
    }
```

**파라미터**:
- `title`: 섹션 제목

**동작**:
1. 섹션 번호 자동 증가
2. 페이지 넘김 확인 (25mm 공간 필요)
3. 섹션 번호와 제목 추가 (볼드, 13pt)
4. Y 좌표 8mm 증가

---

## 페이지 관리

### 페이지 넘김 전략

PDF 생성 시 페이지 넘김은 **사전 예방 방식**으로 처리됩니다:

1. **섹션 추가 전**: `checkPage(needed)` 호출
2. **테이블 추가 전**: `checkPage(40)` 또는 적절한 값 호출
3. **긴 텍스트 추가 전**: `checkPage(15)` 호출

**예시**:
```828:829:frontend/report/script.js
    // ── Financial Analysis ──
    checkPage(60);
```

### 페이지 헤더

새 페이지가 추가될 때마다 자동으로 헤더를 추가합니다:

```722:726:frontend/report/script.js
        doc.addPage();
        y = margin;
        addText('StartSmart', margin, y, 10, true, [45, 90, 39]);
        y += 10;
```

---

## 테이블 생성

### jsPDF-AutoTable 사용

테이블은 `doc.autoTable()` 메서드를 사용하여 생성합니다.

**기본 구조**:
```759:765:frontend/report/script.js
    doc.autoTable({
      startY: y, head: [['Item', 'Value']], body: overviewData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [45, 90, 39] }, theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 10;
```

**주요 옵션**:
- `startY`: 테이블 시작 Y 좌표
- `head`: 헤더 행 배열
- `body`: 본문 데이터 배열
- `margin`: 좌우 마진
- `styles`: 전체 셀 스타일
  - `fontSize`: 폰트 크기
  - `cellPadding`: 셀 내부 여백
- `headStyles`: 헤더 스타일
  - `fillColor`: 헤더 배경색 `[r, g, b]`
- `theme`: 테이블 테마 (`'grid'` 사용)

**Y 좌표 업데이트**:
테이블 추가 후에는 `doc.lastAutoTable.finalY`를 사용하여 Y 좌표를 업데이트합니다.

### 테이블 예시

#### 1. Overview 테이블
```759:765:frontend/report/script.js
    doc.autoTable({
      startY: y, head: [['Item', 'Value']], body: overviewData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [45, 90, 39] }, theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 10;
```

#### 2. Financial Analysis 테이블
```834:840:frontend/report/script.js
    doc.autoTable({
      startY: y, head: [['Item', 'Amount (Monthly)', 'Ratio']], body: finBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [45, 90, 39] }, theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 10;
```

#### 3. Key Metrics 테이블
```846:852:frontend/report/script.js
    doc.autoTable({
      startY: y, head: [['Metric', 'Value']], body: kpiBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [45, 90, 39] }, theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 10;
```

---

## 텍스트 스타일링

### 폰트 크기 가이드

| 용도 | 크기 | 예시 |
|------|------|------|
| 메인 타이틀 | 18pt | "StartSmart" |
| 서브 타이틀 | 13pt | 섹션 제목 |
| 본문 제목 | 11pt | 소제목 |
| 본문 | 9-10pt | 일반 텍스트 |
| 작은 텍스트 | 7-8pt | 주석, 설명 |

### 색상 가이드

| 용도 | RGB | 예시 |
|------|-----|------|
| 브랜드 색상 | `[45, 90, 39]` | StartSmart 로고, 헤더 |
| 제목 | `[0, 0, 0]` | 검정색 |
| 본문 | `[80, 80, 80]` | 회색 |
| 메타 정보 | `[150, 150, 150]` | 날짜, ID |
| 경고/위험 | `[239, 68, 68]` | 빨간색 (실패 트리거) |
| 긍정 | `[34, 197, 94]` | 초록색 (점수 원) |

### 긴 텍스트 처리

긴 텍스트는 `doc.splitTextToSize()`를 사용하여 여러 줄로 분할합니다:

```780:784:frontend/report/script.js
    // 긴 summary를 여러 줄로 분할
    var summLines = doc.splitTextToSize(pdfSummary, contentW - 35);
    for (var sl = 0; sl < Math.min(summLines.length, 3); sl++) {
      addText(summLines[sl], margin + 35, y + 14 + sl * 4, 8, false, [80, 80, 80]);
    }
    y += 28 + Math.min(summLines.length, 3) * 4;
```

**파라미터**:
- 첫 번째: 텍스트
- 두 번째: 최대 너비 (mm)

---

## 섹션별 레이아웃

### Page 1: Overview + Evaluation

```736:811:frontend/report/script.js
    // ── Page 1: Overview + Evaluation ──
    addText('StartSmart', margin, y, 18, true, [45, 90, 39]);
    addText('Creation Feasibility Report', margin, y + 7, 12, false, [100, 100, 100]);
    addText(Utils.formatDate(result.createdAt), pageW - margin, y, 9, false, [150, 150, 150]);
    doc.setFont(undefined, 'normal');
    y += 15;
    addLine(y);
    y += 8;

    // Target Sales
    var targetSales = gap?.targetDailySales ?? (input ? input.targetDailySales : null);

    nextSection('Analysis Overview');

    var overviewData = [
      ['Brand', result.brand.name],
      ['Location', result.location.address || 'N/A'],
      ['Area', (input ? input.conditions.area : '-') + ' pyeong'],
      ['Investment', Utils.formatKRW(input ? input.conditions.initialInvestment : 0)],
      ['Monthly Rent', Utils.formatKRW(finance.monthlyCosts.rent)],
      ['Target Sales', (targetSales !== null ? targetSales : '-') + ' cups/day']
    ];

    doc.autoTable({
      startY: y, head: [['Item', 'Value']], body: overviewData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [45, 90, 39] }, theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 10;

    nextSection('Overall Evaluation');

    var pdfSignal = executive?.signal ?? decision?.signal ?? 'yellow';
    var pdfScore = executive?.score ?? decision?.score ?? 0;
    var pdfSummary = executive?.summary || summaryText || '';

    var scoreColor = pdfSignal === 'green' ? [34, 197, 94] : pdfSignal === 'yellow' ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.circle(margin + 15, y + 10, 12, 'F');
    addText(String(pdfScore), margin + 10, y + 13, 16, true, [255, 255, 255]);

    var pdfSignalLabel = executive?.label || sigLabels[pdfSignal] || 'Caution';
    addText(pdfSignalLabel + ' (Score: ' + pdfScore + ')', margin + 35, y + 8, 11, true);
    // 긴 summary를 여러 줄로 분할
    var summLines = doc.splitTextToSize(pdfSummary, contentW - 35);
    for (var sl = 0; sl < Math.min(summLines.length, 3); sl++) {
      addText(summLines[sl], margin + 35, y + 14 + sl * 4, 8, false, [80, 80, 80]);
    }
    y += 28 + Math.min(summLines.length, 3) * 4;

    // Decision Confidence
    if (executive?.confidence) {
      var pdfConfidence = executive.confidence;
      checkPage(30);
      addText('Decision Confidence', margin, y, 11, true);
      y += 6;
      if (typeof pdfConfidence === 'object') {
        var confData = [];
        if (pdfConfidence.dataCoverage) confData.push(['Data Coverage', pdfConfidence.dataCoverage.toUpperCase()]);
        if (pdfConfidence.assumptionRisk) confData.push(['Assumption Risk', pdfConfidence.assumptionRisk.toUpperCase()]);
        if (pdfConfidence.stability) confData.push(['Stability', pdfConfidence.stability.toUpperCase()]);
        if (confData.length > 0) {
          doc.autoTable({
            startY: y, head: [['Item', 'Level']], body: confData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2.5 },
            headStyles: { fillColor: [45, 90, 39] }, theme: 'grid'
          });
          y = doc.lastAutoTable.finalY + 5;
        }
      } else {
        addText('Confidence: ' + pdfConfidence.toString().toUpperCase(), margin, y, 9, false, [80, 80, 80]);
        y += 5;
      }
    }
```

**구성 요소**:
1. 헤더 (로고, 제목, 날짜)
2. Analysis Overview 테이블
3. Overall Evaluation (점수 원, 신호, 요약)
4. Decision Confidence 테이블

### Page 2: Financial Analysis

```827:890:frontend/report/script.js
    // ── Financial Analysis ──
    checkPage(60);
    nextSection('Financial Analysis');

    var finBody = finRows.map(function (row) {
      return [row[0], Utils.formatKRW(row[1]), row[2]];
    });
    doc.autoTable({
      startY: y, head: [['Item', 'Amount (Monthly)', 'Ratio']], body: finBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [45, 90, 39] }, theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 10;

    // Key Metrics
    checkPage(40);
    nextSection('Key Metrics');
    var kpiBody = kpis.map(function (k) { return [k.label, k.value]; });
    doc.autoTable({
      startY: y, head: [['Metric', 'Value']], body: kpiBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [45, 90, 39] }, theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 10;

    // Sensitivity
    checkPage(40);
    nextSection('Sensitivity Analysis');
    doc.autoTable({
      startY: y, head: [['Scenario', 'Monthly Profit', 'Payback']], body: sensRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [45, 90, 39] }, theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 10;

    // Breakdown
    if (breakdown) {
      checkPage(50);
      nextSection('Score Breakdown');
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
        var evaluation = item.value >= 80 ? 'Good' : item.value >= 60 ? 'Fair' : 'Caution';
        return [item.label, item.value + '점', evaluation];
      });
      doc.autoTable({
        startY: y, head: [['Item', 'Score', 'Evaluation']], body: breakdownBody,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [45, 90, 39] }, theme: 'grid'
      });
      y = doc.lastAutoTable.finalY + 10;
    }
```

**구성 요소**:
1. Financial Analysis 테이블
2. Key Metrics 테이블
3. Sensitivity Analysis 테이블
4. Score Breakdown 테이블

### 텍스트 섹션 (AI Risks, Improvements)

```958:992:frontend/report/script.js
    // ── AI Risk Analysis ──
    var pdfRisks = risksToShow || [];
    if (pdfRisks.length > 0) {
      checkPage(30);
      nextSection('AI Risk Analysis');
      for (var r = 0; r < pdfRisks.length; r++) {
        checkPage(15);
        var pdfRisk = pdfRisks[r];
        addText((r + 1) + '. ' + (pdfRisk.title || '') + ' [' + ((pdfRisk.impact || 'medium').toUpperCase()) + ']', margin, y, 10, true);
        y += 5;
        var rLines = doc.splitTextToSize(pdfRisk.description || '', contentW);
        addText(rLines, margin, y, 8, false, [80, 80, 80]);
        y += rLines.length * 4 + 5;
      }
    }

    // ── AI Improvements ──
    var pdfImps = improvementsToShow || [];
    if (pdfImps.length > 0) {
      checkPage(30);
      nextSection('AI Improvement Suggestions');
      for (var im = 0; im < pdfImps.length; im++) {
        checkPage(15);
        var pdfImp = pdfImps[im];
        addText((im + 1) + '. ' + (pdfImp.title || ''), margin, y, 10, true);
        y += 5;
        var impLines = doc.splitTextToSize(pdfImp.description || '', contentW);
        addText(impLines, margin, y, 8, false, [80, 80, 80]);
        y += impLines.length * 4 + 3;
        if (pdfImp.expectedImpact) {
          addText('Expected: ' + pdfImp.expectedImpact, margin, y, 8, false, [45, 90, 39]);
          y += 7;
        }
      }
    }
```

**패턴**:
1. 섹션 제목 추가 (`nextSection()`)
2. 각 항목마다:
   - 페이지 넘김 확인 (`checkPage(15)`)
   - 제목 추가 (볼드)
   - 설명 텍스트 분할 및 추가
   - Y 좌표 업데이트

---

## 파일 저장

```1091:1093:frontend/report/script.js
    // Save
    var filename = 'StartSmart_' + result.brand.name + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
    doc.save(filename);
```

**파일명 형식**: `StartSmart_{브랜드명}_{날짜}.pdf`

예시: `StartSmart_스타벅스_2025-01-15.pdf`

---

## 레이아웃 체크리스트

새 섹션을 추가할 때 다음을 확인하세요:

- [ ] `checkPage(needed)` 호출 (필요한 공간 계산)
- [ ] `nextSection(title)` 사용 (섹션 제목)
- [ ] 테이블 사용 시 `doc.autoTable()` 옵션 확인
- [ ] 테이블 후 `y = doc.lastAutoTable.finalY + 10` 업데이트
- [ ] 긴 텍스트는 `doc.splitTextToSize()` 사용
- [ ] 색상은 RGB 배열 `[r, g, b]` 형식 사용
- [ ] 폰트 크기는 용도에 맞게 설정 (8-18pt)

---

## 주의사항

1. **Y 좌표 관리**: 모든 콘텐츠 추가 후 Y 좌표를 업데이트해야 합니다.
2. **페이지 넘김**: 충분한 공간이 없으면 콘텐츠가 잘릴 수 있으므로 `checkPage()`를 적절히 호출하세요.
3. **테이블 높이**: 테이블 높이는 자동 계산되므로 `doc.lastAutoTable.finalY`를 사용하세요.
4. **텍스트 분할**: 긴 텍스트는 자동으로 분할되지만, 최대 줄 수를 제한할 수 있습니다.
5. **색상 값**: RGB 값은 0-255 범위입니다.

---

## 참고 문서

### 공식 문서

1. **jsPDF 공식 문서**
   - URL: https://github.com/parallax/jsPDF
   - 버전: 2.5.1
   - 주요 내용: PDF 생성 기본 API, 텍스트 추가, 페이지 관리

2. **jsPDF-AutoTable 공식 문서**
   - URL: https://github.com/simonbengtsson/jsPDF-AutoTable
   - 버전: 3.8.2
   - 주요 내용: 테이블 생성 옵션, 스타일링, 테마

3. **jsPDF API Reference**
   - URL: https://rawgit.com/MrRio/jsPDF/master/docs/index.html
   - 주요 내용: 모든 메서드 및 옵션 상세 설명

### 튜토리얼 및 가이드

4. **jsPDF Tutorial (DigitalOcean)**
   - URL: https://www.digitalocean.com/community/tutorials/js-pdf-generation
   - 주요 내용: PDF 생성 기본 튜토리얼

5. **jsPDF-AutoTable Examples**
   - URL: https://github.com/simonbengtsson/jsPDF-AutoTable/tree/master/examples
   - 주요 내용: 다양한 테이블 스타일 예제

6. **PDF 레이아웃 모범 사례**
   - URL: https://www.pdfa.org/resource/pdf-best-practices/
   - 주요 내용: PDF 생성 시 고려사항

### 스택오버플로우 Q&A

7. **jsPDF 페이지 넘김 관련**
   - 검색어: "jspdf page break"
   - 주요 내용: 페이지 넘김 처리 방법

8. **jsPDF 한글 폰트 처리**
   - 검색어: "jspdf korean font"
   - 주요 내용: 한글 폰트 추가 방법 (현재는 영문만 사용)

9. **jsPDF-AutoTable 스타일 커스터마이징**
   - 검색어: "jspdf autotable custom style"
   - 주요 내용: 테이블 스타일 커스터마이징

### 프로젝트 내 문서

10. **PDF 구현 완료 보고서**
    - 파일: `docs/PDF_IMPLEMENTATION_COMPLETE.md`
    - 주요 내용: PDF에 포함된 모든 섹션 목록

11. **리포트 모델 구현 상태**
    - 파일: `docs/REPORT_MODEL_IMPLEMENTATION_STATUS.md`
    - 주요 내용: 리포트 데이터 구조

---

## 버전 정보

- **문서 버전**: 1.0
- **최종 업데이트**: 2025-01-15
- **작성자**: AI Assistant
- **검토 필요**: PDF 레이아웃 변경 시 이 문서도 업데이트 필요

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-01-15 | 1.0 | 초기 문서 작성 |
