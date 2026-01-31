# 결과 리포트 하드코딩된 값 정리

## 개요

이 문서는 결과 리포트(대시보드 및 리포트 페이지)에서 하드코딩된 값들을 정리합니다. 이러한 값들은 백엔드/엔진에서 계산되지 않고 프론트엔드에서 직접 사용되는 값입니다.

---

## 1. 회수 기간 관련 하드코딩 값

### 1.1 Fallback 값
| 값 | 용도 | 위치 | 설명 |
|---|------|------|------|
| `999` | 회수 불가 표시 | `frontend/dashboard/script.js:154, 178, 323, 335, 620, 624, 631, 636`<br>`frontend/report/script.js:82, 85, 179, 184, 199, 200, 201` | `paybackMonths`가 없을 때 fallback 값으로 사용. `>= 999`이면 "회수 불가"로 표시 |

**사용 예시:**
```javascript
var paybackMonths = executive?.paybackMonths ?? finance?.paybackMonths ?? 999;
mPaybackEl.textContent = paybackMonths >= 999 ? '회수 불가' : paybackMonths + '개월';
```

### 1.2 기준선 값
| 값 | 용도 | 위치 | 설명 |
|---|------|------|------|
| `36` | 회수 기간 기준선 | `frontend/dashboard/script.js:172, 181, 183, 218, 221`<br>`frontend/report/script.js:184` | 36개월을 초과하면 "장기 소요" 또는 경고 표시 |
| `24` | 빠른 회수 기준선 | `frontend/dashboard/script.js:181`<br>`frontend/report/script.js:184` | 24개월 이하면 "빠른 회수"로 표시 |

**사용 예시:**
```javascript
mPaybackSubEl.textContent = paybackMonths <= 24 ? '빠른 회수' : paybackMonths <= 36 ? '평균 수준' : '장기 소요';
if (paybackMonths > 36) {
  mPaybackEl.style.color = '#f87171';
}
```

---

## 2. 생존 기간 관련 하드코딩 값

| 값 | 용도 | 위치 | 설명 |
|---|------|------|------|
| `36` | 생존 기간 기준선 | `frontend/dashboard/script.js:172` | 36개월 이상이면 "안정적", 미만이면 "관리 필요" |
| `24` | 위험 기준선 | `frontend/report/script.js:184` | 24개월 미만이면 `danger: true`로 표시 |

**사용 예시:**
```javascript
mSurvivalSubEl.textContent = survivalMonths >= 36 ? '안정적' : '관리 필요';
{ label: '생존 개월', value: survivalMonths + '개월', danger: survivalMonths < 24 }
```

---

## 3. 민감도 분석 관련 하드코딩 값

### 3.1 변화율
| 값 | 용도 | 위치 | 설명 |
|---|------|------|------|
| `0.9` | 매출 10% 감소 | `frontend/dashboard/script.js:321, 618` | 민감도 분석 및 Before/After 비교에서 사용 |
| `1.1` | 매출 10% 증가 | `frontend/dashboard/script.js:333` | 민감도 분석에서 사용 |
| `0.1` | 월세 10% 절감 | `frontend/dashboard/script.js:619` | Before/After 비교에서 월세 절감 계산 |

**사용 예시:**
```javascript
// 민감도 분석
revenue: baseRevenue * 0.9,  // 매출 10% 감소
revenue: baseRevenue * 1.1,  // 매출 10% 증가

// Before/After 비교
var rentReduced = Math.round(costs.rent * 0.9);
var profitAfter = finance.monthlyProfit + Math.round(costs.rent * 0.1);
```

---

## 4. 브랜드 포지션별 평균 단가

| 값 | 용도 | 위치 | 설명 |
|---|------|------|------|
| `5500` | 프리미엄 브랜드 평균 단가 | `frontend/dashboard/script.js:669` | 판매량 시나리오 비교 차트에서 사용 |
| `4000` | 스탠다드 브랜드 평균 단가 | `frontend/dashboard/script.js:669` | 판매량 시나리오 비교 차트에서 사용 |
| `3000` | 저가 브랜드 평균 단가 | `frontend/dashboard/script.js:669` | 판매량 시나리오 비교 차트에서 사용 |

**사용 예시:**
```javascript
function updateScenarioChart(position) {
  var avgPrice = position === '프리미엄' ? 5500 : position === '스탠다드' ? 4000 : 3000;
  // 시나리오별 매출 계산: daily * avgPrice * 30
}
```

**⚠️ 문제점**: 실제 브랜드의 평균 단가는 `brand.defaults.avgPrice`에 있지만, 프론트엔드에서 하드코딩된 값을 사용하고 있습니다.

---

## 5. 판매량 시나리오 기본값

| 값 | 용도 | 위치 | 설명 |
|---|------|------|------|
| `200` | 보수적 시나리오 기본값 | `frontend/dashboard/script.js:640` | AI 시나리오가 없을 때 fallback 값 |
| `250` | 기대치 시나리오 기본값 | `frontend/dashboard/script.js:640` | AI 시나리오가 없을 때 fallback 값 |
| `300` | 낙관적 시나리오 기본값 | `frontend/dashboard/script.js:640` | AI 시나리오가 없을 때 fallback 값 |

**사용 예시:**
```javascript
var scenarios = reportModel?.scenario?.aiSalesScenario ?? 
                ai?.salesScenario ?? 
                { conservative: 200, expected: 250, optimistic: 300 };
```

---

## 6. 브랜드 포지션 기본값

| 값 | 용도 | 위치 | 설명 |
|---|------|------|------|
| `'스탠다드'` | 브랜드 포지션 기본값 | `frontend/dashboard/script.js:643, 662, 665` | 브랜드 포지션이 없을 때 fallback 값 |

**사용 예시:**
```javascript
var brandPosition = brand.position || (brand.id ? null : '스탠다드'); // 기본값
updateScenarioChart(brandPosition || '스탠다드');
```

---

## 7. 상권 분석 관련 하드코딩 값

| 값 | 용도 | 위치 | 설명 |
|---|------|------|------|
| `500` | 상권 반경 기본값 (m) | `frontend/dashboard/script.js:570` | 상권 반경이 없을 때 fallback 값 |

**사용 예시:**
```javascript
'<p>반경 ' + (market?.location?.radius || 500) + 'm 내 경쟁점...</p>'
```

---

## 8. 점수 기준선 (Breakdown)

| 값 | 용도 | 위치 | 설명 |
|---|------|------|------|
| `80` | 우수 기준 | `frontend/dashboard/script.js:260` | Breakdown 점수가 80 이상이면 "우수" |
| `60` | 양호 기준 | `frontend/dashboard/script.js:261` | Breakdown 점수가 60 이상이면 "양호" |
| `70` | 신호등 기준 | `engine/decision/scorer.js` | 점수 70 이상이면 green 신호등 |

**사용 예시:**
```javascript
var color = item.value >= 80 ? '#4ade80' : item.value >= 60 ? '#facc15' : '#f87171';
var label = item.value >= 80 ? '우수' : item.value >= 60 ? '양호' : '보통';
```

---

## 9. 고정비 비중 기준

| 값 | 용도 | 위치 | 설명 |
|---|------|------|------|
| `0.35` 또는 `35%` | 고정비 비중 기준 | `engine/decision/index.js:276` | 고정비가 월 매출의 35% 이상이면 실패 트리거 발생 |

**사용 예시:**
```javascript
const fixedCostShare = (finance.monthlyCosts.rent + finance.monthlyCosts.labor) / finance.monthlyRevenue;
if (fixedCostShare >= 0.35) {
  triggers.push({ /* 고정비 과다 트리거 */ });
}
```

---

## 10. 문자열 매핑 (하드코딩)

### 10.1 브랜드 포지션 매핑
| 키 | 값 | 위치 |
|---|-----|------|
| `'프리미엄'` | `5500` (평균 단가) | `frontend/dashboard/script.js:669` |
| `'스탠다드'` | `4000` (평균 단가) | `frontend/dashboard/script.js:669` |
| 기타 | `3000` (평균 단가) | `frontend/dashboard/script.js:669` |

### 10.2 가격 전략 매핑
| 키 | 값 | 위치 |
|---|-----|------|
| `'premium'` | `'프리미엄 전략'` | `frontend/dashboard/script.js:559`<br>`frontend/report/script.js:500` |
| `'standard'` | `'표준 가격'` | `frontend/dashboard/script.js:559`<br>`frontend/report/script.js:500` |
| `'budget'` | `'저가 전략'` | `frontend/dashboard/script.js:559`<br>`frontend/report/script.js:500` |

### 10.3 경쟁 강도 매핑
| 키 | 값 | 위치 |
|---|-----|------|
| `'high'` | `'높음'` | `frontend/dashboard/script.js:539` |
| `'medium'` | `'보통'` | `frontend/dashboard/script.js:539` |
| `'low'` | `'낮음'` | `frontend/dashboard/script.js:539` |

### 10.4 차별화 가능성 매핑
| 키 | 값 | 위치 |
|---|-----|------|
| `'possible'` | `'차별화 가능'` | `frontend/dashboard/script.js:540` |
| `'difficult'` | `'차별화 어려움'` | `frontend/dashboard/script.js:540` |
| `'impossible'` | `'차별화 불가'` | `frontend/dashboard/script.js:540` |

---

## 11. API URL 기본값

| 값 | 용도 | 위치 | 설명 |
|---|------|------|------|
| `':3000'` | API 포트 기본값 | `frontend/dashboard/script.js:648` | API URL이 없을 때 localhost:3000 사용 |

**사용 예시:**
```javascript
var apiBaseUrl = window.API_CONFIG ? window.API_CONFIG.API_BASE_URL : 
                 (window.location.protocol + '//' + window.location.hostname + ':3000');
```

---

## 12. 계산식에서 사용되는 하드코딩 값

### 12.1 월 일수
| 값 | 용도 | 위치 | 설명 |
|---|------|------|------|
| `30` | 월 일수 | `frontend/dashboard/script.js:689, 690, 691` | 일 판매량 × 평균 단가 × 30 = 월 매출 |

**사용 예시:**
```javascript
var rev = scenRevs[sc].daily * avgPrice * 30;  // 월 매출 계산
```

---

## 문제점 및 개선 방안

### 1. 브랜드 평균 단가 하드코딩
**문제**: 실제 브랜드의 `avgPrice`가 있음에도 프론트엔드에서 하드코딩된 값 사용

**개선 방안**:
```javascript
// 현재
var avgPrice = position === '프리미엄' ? 5500 : position === '스탠다드' ? 4000 : 3000;

// 개선
var avgPrice = brand.defaults?.avgPrice || 
               (position === '프리미엄' ? 5500 : position === '스탠다드' ? 4000 : 3000);
```

### 2. 판매량 시나리오 기본값
**문제**: AI 시나리오가 없을 때 하드코딩된 값 사용

**개선 방안**: 백엔드에서 기본 시나리오를 계산하여 제공하거나, 브랜드의 `avgDailySales`를 기반으로 계산

### 3. 회수 기간 기준선 (36개월)
**문제**: 기준선이 여러 곳에 하드코딩되어 있음

**개선 방안**: 상수로 정의하여 한 곳에서 관리
```javascript
const PAYBACK_THRESHOLD_MONTHS = 36;
const SURVIVAL_THRESHOLD_MONTHS = 36;
const FAST_PAYBACK_MONTHS = 24;
```

### 4. 민감도 분석 변화율 (10%)
**문제**: 10% 변화율이 하드코딩되어 있음

**개선 방안**: 백엔드에서 제공하는 `sensitivity` 객체를 그대로 사용 (이미 ±10% 계산됨)

---

## 권장 사항

1. **상수 파일 생성**: `frontend/js/constants.js`에 모든 하드코딩된 값들을 상수로 정의
2. **백엔드 데이터 우선 사용**: 브랜드 평균 단가 등은 백엔드에서 제공하는 값을 우선 사용
3. **설정 파일로 분리**: 환경별로 다른 값이 필요한 경우 설정 파일로 분리
4. **문서화**: 하드코딩된 값의 의미와 변경 시 영향 범위를 문서화
