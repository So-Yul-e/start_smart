# 프론트엔드 누락 항목 및 개선 사항

**생성일**: 2025-01-15  
**목적**: 리포트에 있지만 프론트엔드에 표시되지 않는 항목 정리

---

## 🔍 발견된 문제점

### 1. 데이터는 있지만 표시되지 않는 항목

다음 데이터는 `reportModel`에 포함되어 있지만, 프론트엔드에서 렌더링되지 않습니다:

1. **`failureTriggers`** - 실패 트리거 배열
2. **`exitPlan`** - Exit Plan 객체
3. **`breakdown`** - 점수 Breakdown 객체
4. **`executive.confidence`** - 판정 신뢰도 (단순 값만, 상세 정보 없음)

---

## 📊 상세 분석

### 1. Failure Triggers (실패 트리거)

#### 리포트에 포함된 정보
- 트리거 1: 매출 -10% 시 적자 전환
  - 영향도: CRITICAL
  - 예상 실패 시점: 18~24개월
  - 그때 총손실: 6,500만원
  - 그때 Exit 비용: 5,200만원
- 트리거 2: 월세 상승 시 수익성 악화
  - 영향도: HIGH
  - 예상 실패 시점: 24~30개월
  - 그때 총손실: 5,800만원

#### reportModel 구조
```javascript
failureTriggers: [
  {
    trigger: "sales -10%",
    result: "monthlyProfit < 0",
    impact: "CRITICAL",
    expectedFailureMonth: "18~24",
    totalLossAtFailure: 65000000,
    exitCostAtFailure: 52000000
  },
  // ...
]
```

#### 프론트엔드 상태
- ❌ Dashboard: 표시 안 됨
- ❌ Report: 표시 안 됨
- ⚠️ 데이터는 `reportModel.failureTriggers`에 있음

#### 권장 구현 위치
- **Dashboard**: "AI 상세분석" 탭에 "실패 트리거" 섹션 추가
- **Report**: PAGE 4에 "실패 트리거" 섹션 추가

---

### 2. Exit Plan (손절 타이밍 및 폐업 비용)

#### 리포트에 포함된 정보
- 손절 타이밍 설계:
  - 경고 구간: 24개월 (총손실 5,800만원)
  - 최적 손절: 32개월 (총손실 5,200만원)
  - 손실 폭증: 36개월 (총손실 6,200만원)
- 폐업 비용 상세:
  - 가맹 위약금: 0만원
  - 철거/원상복구: 2,500만원
  - 인테리어/설비 손실: 5,300만원
  - 권리금 회수: -2,600만원
  - Exit Cost 합계: 5,200만원

#### reportModel 구조
```javascript
exitPlan: {
  optimalExitMonth: 32,
  warningMonth: 24,
  lossExplosionMonth: 36,
  exitCostBreakdown: {
    penalty: 0,
    demolition: 25000000,
    interiorLoss: 53000000,
    keyMoneyRecovery: -26000000,
    total: 52000000
  },
  totalLossAtOptimal: 52000000,
  // ...
}
```

#### 프론트엔드 상태
- ❌ Dashboard: 표시 안 됨
- ❌ Report: 표시 안 됨
- ⚠️ 데이터는 `reportModel.exitPlan`에 있음

#### 권장 구현 위치
- **Dashboard**: "시뮬레이션 비교" 탭에 "손절 타이밍" 섹션 추가
- **Report**: PAGE 4에 "Exit Plan" 섹션 추가

---

### 3. Breakdown (점수 Breakdown)

#### 리포트에 포함된 정보
- 회수 기간: 80점
- 수익성: 85점
- GAP: 65점
- 민감도: 75점
- 고정비: 90점
- DSCR: 85점
- 상권: 68점
- 로드뷰: 65점

#### reportModel 구조
```javascript
breakdown: {
  paybackMonths: 80,
  profitability: 85,
  gap: 65,
  sensitivity: 75,
  fixedCosts: 90,
  dscr: 85,
  market: 68,
  roadview: 65
}
```

#### 프론트엔드 상태
- ❌ Dashboard: 표시 안 됨
- ❌ Report: 표시 안 됨
- ⚠️ 데이터는 `reportModel.breakdown`에 있음

#### 권장 구현 위치
- **Dashboard**: "요약" 탭에 "점수 Breakdown" 차트 추가
- **Report**: PAGE 2에 "점수 Breakdown" 테이블 추가

---

### 4. Decision Confidence (판정 신뢰도)

#### 리포트에 포함된 정보
- 데이터 커버리지: HIGH
- 가정 리스크: MEDIUM
- 판정 안정성: MEDIUM

#### reportModel 구조
```javascript
executive: {
  confidence: {
    dataCoverage: "HIGH",
    assumptionRisk: "MEDIUM",
    stability: "MEDIUM"
  }
  // 또는 단순 값
  confidence: "HIGH" | "MEDIUM" | "LOW"
}
```

#### 프론트엔드 상태
- ❌ Dashboard: 표시 안 됨
- ❌ Report: 표시 안 됨
- ⚠️ `executive.confidence`는 있지만 상세 정보 없을 수 있음

#### 권장 구현 위치
- **Dashboard**: "요약" 탭에 신뢰도 배지 추가
- **Report**: PAGE 1에 신뢰도 정보 추가

---

## 🔧 구현 작업 리스트

### 우선순위 1: 필수 표시 항목

#### 작업 1: Failure Triggers 섹션 추가

**Dashboard** (`frontend/dashboard/script.js`):
```javascript
// TAB 2: AI Detail에 추가
function renderFailureTriggers(triggers) {
  if (!triggers || triggers.length === 0) return '';
  
  var html = '<div class="glass-card"><h3>실패 트리거</h3>';
  for (var i = 0; i < triggers.length; i++) {
    var t = triggers[i];
    html += '<div class="risk-card">' +
      '<h4>' + (i + 1) + '. ' + t.trigger + '</h4>' +
      '<p>결과: ' + t.result + '</p>' +
      '<p>영향도: ' + t.impact + '</p>' +
      '<p>예상 실패 시점: ' + t.expectedFailureMonth + '개월</p>' +
      '<p>그때 총손실: ' + Utils.formatKRW(t.totalLossAtFailure) + '</p>' +
      '</div>';
  }
  html += '</div>';
  return html;
}
```

**Report** (`frontend/report/script.js`):
- PAGE 4에 "실패 트리거" 섹션 추가

#### 작업 2: Exit Plan 섹션 추가

**Dashboard** (`frontend/dashboard/script.js`):
```javascript
// TAB 3: 시뮬레이션 비교에 추가
function renderExitPlan(exitPlan) {
  if (!exitPlan) return '';
  
  var html = '<div class="glass-card"><h3>손절 타이밍 설계</h3>';
  html += '<table class="report-table">';
  html += '<tr><th>구분</th><th>시점</th><th>총손실</th></tr>';
  html += '<tr><td>경고 구간</td><td>' + exitPlan.warningMonth + '개월</td><td>' + Utils.formatKRW(exitPlan.totalLossAtWarning) + '</td></tr>';
  html += '<tr><td><strong>최적 손절</strong></td><td><strong>' + exitPlan.optimalExitMonth + '개월</strong></td><td><strong>' + Utils.formatKRW(exitPlan.totalLossAtOptimal) + '</strong></td></tr>';
  html += '<tr><td>손실 폭증</td><td>' + exitPlan.lossExplosionMonth + '개월</td><td>' + Utils.formatKRW(exitPlan.totalLossAtExplosion) + '</td></tr>';
  html += '</table>';
  html += '</div>';
  return html;
}
```

**Report** (`frontend/report/script.js`):
- PAGE 4에 "Exit Plan" 섹션 추가

#### 작업 3: Breakdown 차트 추가

**Dashboard** (`frontend/dashboard/script.js`):
```javascript
// TAB 1: 요약에 추가
function renderBreakdown(breakdown) {
  if (!breakdown) return '';
  
  var items = [
    { label: '회수 기간', value: breakdown.paybackMonths },
    { label: '수익성', value: breakdown.profitability },
    { label: 'GAP', value: breakdown.gap },
    { label: '민감도', value: breakdown.sensitivity },
    { label: '고정비', value: breakdown.fixedCosts },
    { label: 'DSCR', value: breakdown.dscr },
    { label: '상권', value: breakdown.market },
    { label: '로드뷰', value: breakdown.roadview }
  ];
  
  var html = '<div class="glass-card"><h3>점수 Breakdown</h3>';
  html += '<div class="breakdown-chart">';
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var color = item.value >= 80 ? '#4ade80' : item.value >= 60 ? '#facc15' : '#f87171';
    html += '<div class="breakdown-item">' +
      '<div class="breakdown-label">' + item.label + '</div>' +
      '<div class="breakdown-bar">' +
      '<div class="breakdown-fill" style="width:' + item.value + '%; background:' + color + ';"></div>' +
      '</div>' +
      '<div class="breakdown-value">' + item.value + '점</div>' +
      '</div>';
  }
  html += '</div></div>';
  return html;
}
```

**Report** (`frontend/report/script.js`):
- PAGE 2에 "점수 Breakdown" 테이블 추가

---

## 📋 구현 우선순위

### 🔴 P0 (필수)
1. Failure Triggers 섹션 추가
2. Exit Plan 섹션 추가

### 🟡 P1 (권장)
3. Breakdown 차트 추가
4. Decision Confidence 표시

---

## ✅ 체크리스트

### 데이터 확인
- [x] `reportModel.failureTriggers` 존재
- [x] `reportModel.exitPlan` 존재
- [x] `reportModel.breakdown` 존재
- [x] `reportModel.executive.confidence` 존재

### 프론트엔드 구현
- [ ] Dashboard에 Failure Triggers 표시
- [ ] Dashboard에 Exit Plan 표시
- [ ] Dashboard에 Breakdown 표시
- [ ] Report에 Failure Triggers 표시
- [ ] Report에 Exit Plan 표시
- [ ] Report에 Breakdown 표시
- [ ] PDF에 Failure Triggers 포함
- [ ] PDF에 Exit Plan 포함
- [ ] PDF에 Breakdown 포함

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-15
