# 프론트엔드 데이터 매핑 가이드

## 개요

이 문서는 대시보드(`frontend/dashboard/script.js`)와 리포트 페이지(`frontend/report/script.js`)에서 사용하는 데이터 필드와 실제 백엔드/엔진에서 계산되는 데이터 간의 매핑 관계를 정리합니다.

## 데이터 소스 우선순위

### 1. reportModel 우선 사용
- `reportModel`이 있으면 `reportModel`의 데이터를 우선 사용
- 없으면 `result` 객체에서 직접 가져옴 (하위 호환성)

### 2. Fallback 순서
```javascript
// 대시보드 예시
var finance = reportModel ? reportModel.finance : result.finance;
var executive = reportModel?.executive || null;
var decision = reportModel ? {
  score: reportModel.executive.score,
  signal: reportModel.executive.signal,
  survivalMonths: reportModel.executive.survivalMonths
} : result.decision;
```

---

## 대시보드 (Dashboard) 데이터 매핑

### 1. 기본 정보
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 부제목 (주소 · 브랜드) | `result.location.address` + `result.brand.name` | 직접 접근 |
| 분석 ID | `result.id` | 직접 접근 |
| 생성일 | `result.createdAt` | 직접 접근 |

### 2. 종합 평가 (TAB 1: Summary)

#### 2.1 점수 및 신호등
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 점수 (Score) | `executive?.score ?? decision?.score ?? 0` | reportModel.executive.score → result.decision.score |
| 신호등 (Signal) | `executive?.signal ?? decision?.signal ?? 'yellow'` | reportModel.executive.signal → result.decision.signal |
| 신호등 라벨 | `executive?.label` | reportModel.executive.label |
| 신호등 설명 | `executive?.summary ?? decision.riskFactors[0]` | reportModel.executive.summary → result.decision.riskFactors |

#### 2.2 핵심 지표 (4개)
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 예상 생존 개월 | `executive?.survivalMonths ?? decision?.survivalMonths ?? 0` | reportModel.executive.survivalMonths → result.decision.survivalMonths |
| 투자 회수 기간 | `executive?.paybackMonths ?? finance?.paybackMonths ?? 999` | reportModel.executive.paybackMonths → reportModel.finance.paybackMonths → result.finance.paybackMonths |
| 월 순이익 | `executive?.monthlyProfit ?? finance?.monthlyProfit ?? 0` | reportModel.executive.monthlyProfit → reportModel.finance.monthlyProfit → result.finance.monthlyProfit |
| 손익분기 판매량 | `executive?.breakEvenDailySales ?? finance?.breakEvenDailySales ?? 0` | reportModel.executive.breakEvenDailySales → reportModel.finance.breakEvenDailySales → result.finance.breakEvenDailySales |

#### 2.3 하드컷 경고
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 하드컷 경고 | `executive?.nonNegotiable ?? result.decision?.hardCutReasons` | reportModel.executive.nonNegotiable → result.decision.hardCutReasons |

#### 2.4 점수 Breakdown
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| Breakdown 항목 | `breakdown` 객체 | reportModel.breakdown → result.decision.breakdown |
| - 회수 기간 | `breakdown.payback` | |
| - 순이익률 | `breakdown.profitMargin` | |
| - 고정비 | `breakdown.fixedCost` | |
| - DSCR | `breakdown.dscr` | |
| - 상권 | `breakdown.market` | |
| - 로드뷰 | `breakdown.roadview` | |

#### 2.5 월 손익 구조 (Cost Stack Chart)
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 월 매출 | `finance.monthlyRevenue` | reportModel.finance.monthlyRevenue → result.finance.monthlyRevenue |
| 재료비 | `finance.monthlyCosts.materials` | reportModel.finance.monthlyCosts.materials → result.finance.monthlyCosts.materials |
| 인건비 | `finance.monthlyCosts.labor` | reportModel.finance.monthlyCosts.labor → result.finance.monthlyCosts.labor |
| 임대료 | `finance.monthlyCosts.rent` | reportModel.finance.monthlyCosts.rent → result.finance.monthlyCosts.rent |
| 로열티 | `finance.monthlyCosts.royalty` | reportModel.finance.monthlyCosts.royalty → result.finance.monthlyCosts.royalty |
| 마케팅비 | `finance.monthlyCosts.marketing` | reportModel.finance.monthlyCosts.marketing → result.finance.monthlyCosts.marketing |
| 공과금/기타 | `finance.monthlyCosts.utilities + finance.monthlyCosts.etc` | |
| 월 순이익 | `finance.monthlyProfit` | reportModel.finance.monthlyProfit → result.finance.monthlyProfit |

#### 2.6 민감도 분석 (Sensitivity Chart)
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| -10% 총 매출 | `baseRevenue * 0.9` | 계산값 (finance.monthlyRevenue * 0.9) |
| -10% 순이익 | `finance.sensitivity.minus10.monthlyProfit` | reportModel.finance.sensitivity.minus10.monthlyProfit → result.finance.sensitivity.minus10.monthlyProfit |
| 기준 총 매출 | `finance.monthlyRevenue` | reportModel.finance.monthlyRevenue → result.finance.monthlyRevenue |
| 기준 순이익 | `finance.monthlyProfit` | reportModel.finance.monthlyProfit → result.finance.monthlyProfit |
| +10% 총 매출 | `baseRevenue * 1.1` | 계산값 (finance.monthlyRevenue * 1.1) |
| +10% 순이익 | `finance.sensitivity.plus10.monthlyProfit` | reportModel.finance.sensitivity.plus10.monthlyProfit → result.finance.sensitivity.plus10.monthlyProfit |
| 회수 기간 | `finance.sensitivity.minus10.paybackMonths`, `finance.paybackMonths`, `finance.sensitivity.plus10.paybackMonths` | |

### 3. AI 상세분석 (TAB 2: Detail)

#### 3.1 AI 리스크 분석
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 리스크 카드 목록 | `risk.cards` | reportModel.risk.cards |
| - 제목 | `card.ai.title ?? card.engine?.title` | AI 우선, 없으면 Engine |
| - 설명 | `card.ai.description ?? card.engine?.narrative` | AI 우선, 없으면 Engine |
| - 영향도 | `card.severity ?? card.ai.impact ?? 'medium'` | |

#### 3.2 AI 개선 제안
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 개선 제안 카드 목록 | `improvement.cards` (중복 제거 후) | reportModel.improvement.cards |
| - 제목 | `card.ai.title` (AI 우선) | AI가 있으면 AI만 사용, 없으면 Engine |
| - 설명 | `card.ai.description` | |
| - 기대 효과 | `card.ai.expectedImpact` | |

#### 3.3 경쟁 환경 해석
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 경쟁 강도 | `competitive?.intensity` | |
| 차별화 가능성 | `competitive?.differentiation` | 
| 가격 전략 | `competitive?.priceStrategy` | |
| 경쟁점 수 | `market?.competitors?.total` | reportModel.market.competitors.total → result.market.competitors.total |

#### 3.4 실패 트리거
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 실패 트리거 목록 | `failureTriggers` | reportModel.failureTriggers → result.decision.failureTriggers |
| - 트리거명 | `trigger.triggerName ?? trigger.trigger` | |
| - 결과 | `trigger.outcome` | |
| - 영향도 | `trigger.impact` | |
| - 예상 실패 시점 | `trigger.estimatedFailureWindow` | |

### 4. 입지-상권분석 (TAB 3: Location)

#### 4.1 입지 분석 (Roadview)
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 로드뷰 이미지 | `roadview.roadviewUrl ?? roadview.imageUrl` | reportModel.roadview (없음) → result.roadview.roadviewUrl |
| 리스크 카드 | `roadview.risks` | reportModel.roadview.risks → result.roadview.risks |
| - 타입 | `risk.type` | signage_obstruction, steep_slope, floor_level, visibility |
| - 레벨 | `risk.level` | low, medium, high, ground, half_basement, second_floor |
| - 설명 | `risk.description` | |
| 종합 리스크 평가 | `roadview.overallRisk` | reportModel.roadview.overallRisk → result.roadview.overallRisk |
| 리스크 점수 | `roadview.riskScore` | reportModel.roadview.riskScore → result.roadview.riskScore |
| 강점/약점 | `roadview.metadata.strengths/weaknesses` | reportModel.roadview.metadata → result.roadview._metadata |

#### 4.2 상권 분석 (Market)
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 경쟁 현황 | `market.competitors` | reportModel.market.competitors → result.market.competitors |
| - 총 경쟁 카페 | `market.competitors.total` | |
| - 동일 브랜드 | `market.competitors.sameBrand` | |
| - 타 브랜드 | `market.competitors.otherBrands` | |
| - 경쟁 밀도 | `market.competitors.density` | low, medium, high |
| 유동인구 정보 | `market.footTraffic` | reportModel.market.footTraffic → result.market.footTraffic |
| - 평일 유동인구 | `market.footTraffic.weekday` | |
| - 주말 유동인구 | `market.footTraffic.weekend` | |
| - 피크 시간대 | `market.footTraffic.peakHours` | |
| 상권 점수 | `market.marketScore` | reportModel.market.marketScore → result.market.marketScore |

### 5. 시뮬레이션 비교 (TAB 4: Compare)

#### 5.1 Before/After 비교
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| Before 월세 | `costs.rent` | finance.monthlyCosts.rent |
| Before 순이익 | `finance.monthlyProfit` | |
| Before 회수 기간 | `finance.paybackMonths` | |
| After 월세 | `costs.rent * 0.9` | 계산값 |
| After 순이익 | `finance.monthlyProfit + (costs.rent * 0.1)` | 계산값 |
| After 회수 기간 | 재계산 | `investment / profitAfter` |

#### 5.2 판매량 시나리오 비교
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 시나리오 데이터 | `scenarios` | reportModel.scenario.aiSalesScenario → result.aiConsulting.salesScenario |
| - 보수적 | `scenarios.conservative` | |
| - 기대치 | `scenarios.expected` | |
| - 낙관적 | `scenarios.optimistic` | |
| 각 시나리오별 총 매출 | 계산값 | `daily * avgPrice * 30` |
| 각 시나리오별 순이익 | 계산값 | `revenue - totalCosts - debtPayment` |

---

## 리포트 페이지 (Report) 데이터 매핑

### 1. PAGE 1: Overview

#### 1.1 분석 개요
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 브랜드 | `result.brand.name` | 직접 접근 |
| 분석 위치 | `result.location.address` | 직접 접근 |
| 매장 규모 | `input.conditions.area` | 직접 접근 |
| 초기 투자금 | `input.conditions.initialInvestment` | 직접 접근 |
| 월세 | `finance.monthlyCosts.rent` | reportModel.finance.monthlyCosts.rent → result.finance.monthlyCosts.rent |
| 점주 근무 | `input.conditions.ownerWorking` | 직접 접근 |
| 목표 판매량 | `input.targetDailySales` | 직접 접근 |

#### 1.2 종합 평가
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 점수 | `executive?.score ?? decision?.score ?? 0` | reportModel.executive.score → result.decision.score |
| 신호등 | `executive?.signal ?? decision?.signal ?? 'yellow'` | reportModel.executive.signal → result.decision.signal |
| 신호등 라벨 | `executive?.label` | reportModel.executive.label |
| 판정 요약 | `executive?.summary` | reportModel.executive.summary |
| 판정 신뢰도 | `executive?.confidence` | reportModel.executive.confidence → result.decision.decisionConfidence |

### 2. PAGE 2: Financial

#### 2.1 예상 수익성 분석
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 월 매출 | `finance.monthlyRevenue` | reportModel.finance.monthlyRevenue → result.finance.monthlyRevenue |
| 재료비 | `finance.monthlyCosts.materials` | |
| 인건비 | `finance.monthlyCosts.labor` | |
| 임대료 | `finance.monthlyCosts.rent` | |
| 로열티 | `finance.monthlyCosts.royalty` | |
| 마케팅비 | `finance.monthlyCosts.marketing` | |
| 공과금/기타 | `finance.monthlyCosts.utilities + finance.monthlyCosts.etc` | |
| 월 순이익 | `finance.monthlyProfit` | |

#### 2.2 핵심 지표
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 생존 개월 | `executive?.survivalMonths ?? decision?.survivalMonths ?? 0` | |
| 회수 기간 | `executive?.paybackMonths ?? finance?.paybackMonths ?? 999` | |
| 월 순이익 | `executive?.monthlyProfit ?? finance?.monthlyProfit ?? 0` | |
| 손익분기 | `executive?.breakEvenDailySales ?? finance?.breakEvenDailySales ?? 0` | |

#### 2.3 민감도 분석
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 매출 -10% 순이익 | `finance.sensitivity.minus10.monthlyProfit` | |
| 매출 -10% 회수 기간 | `finance.sensitivity.minus10.paybackMonths` | |
| 기준 순이익 | `finance.monthlyProfit` | |
| 기준 회수 기간 | `finance.paybackMonths` | |
| 매출 +10% 순이익 | `finance.sensitivity.plus10.monthlyProfit` | |
| 매출 +10% 회수 기간 | `finance.sensitivity.plus10.paybackMonths` | |

#### 2.4 점수 Breakdown
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| Breakdown 항목 | `breakdown` 객체 | reportModel.breakdown → result.decision.breakdown |

### 3. PAGE 3: 입지-상권분석

#### 3.1 입지 분석
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 로드뷰 이미지 | `roadview.roadviewUrl ?? roadview.imageUrl` | result.roadview.roadviewUrl |
| 리스크 카드 | `roadview.risks` | reportModel.roadview.risks → result.roadview.risks |
| 종합 리스크 평가 | `roadview.overallRisk`, `roadview.riskScore` | |

#### 3.2 상권 분석
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 경쟁 현황 | `market.competitors` | reportModel.market.competitors → result.market.competitors |
| 유동인구 정보 | `market.footTraffic` | reportModel.market.footTraffic → result.market.footTraffic |
| 상권 점수 | `market.marketScore` | reportModel.market.marketScore → result.market.marketScore |

### 4. PAGE 4: AI Consulting

#### 4.1 AI 리스크 분석
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 리스크 카드 목록 | `risk.cards` | reportModel.risk.cards |

#### 4.2 AI 개선 제안
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 개선 제안 카드 목록 | `improvement.cards` | reportModel.improvement.cards |

#### 4.3 경쟁 환경 요약
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 경쟁 강도 | `competitive?.intensity` | reportModel.competitive → result.aiConsulting.competitiveAnalysis |
| 차별화 가능성 | `competitive?.differentiation` | |
| 권장 가격 전략 | `competitive?.priceStrategy` | |

#### 4.4 실패 트리거
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| 실패 트리거 목록 | `failureTriggers` | reportModel.failureTriggers → result.decision.failureTriggers |

#### 4.5 Exit Plan
| 화면 표시 | 데이터 소스 | 경로 |
|---------|-----------|------|
| Exit Plan 데이터 | `exitPlan` | reportModel.exitPlan → result.decision.exitPlan |
| - 경고 구간 | `exitPlan.warningMonth` | |
| - 최적 손절 | `exitPlan.optimalExitMonth` | |
| - 손실 폭증 | `exitPlan.lossExplosionMonth` | |
| - 폐업 비용 상세 | `exitPlan.exitCostBreakdown` | |

---

## 데이터 변환 및 가공

### 1. reportModel 변환 과정
- `shared/reportModel.js`의 `buildReportModel()` 함수가 `finalResult`를 받아 `reportModel` 생성
- 숫자 값은 `toMoney()`, `toNum()` 헬퍼 함수로 변환
- AI와 Engine 데이터를 병합 (`mergeRiskCards`, `mergeImprovementCards`)

### 2. 프론트엔드에서의 추가 계산
- **민감도 분석 매출**: `baseRevenue * 0.9`, `baseRevenue * 1.1` (백엔드에서 제공하지 않음)
- **시나리오 비교 순이익**: 각 시나리오별로 비용 재계산 후 순이익 계산
- **Before/After 비교**: 월세 10% 절감 시나리오 계산

### 3. Fallback 처리
- `reportModel`이 없으면 `result` 객체에서 직접 접근
- 각 필드마다 `??` 연산자로 기본값 제공
- 배열/객체는 `Array.isArray()`, `?.` 옵셔널 체이닝으로 안전하게 접근

---

## 주의사항

1. **reportModel 우선 사용**: `reportModel`이 있으면 반드시 `reportModel`의 데이터를 사용해야 함
2. **null 처리**: `paybackMonths === null`인 경우 "회수 불가"로 표시
3. **999 처리**: `paybackMonths >= 999`인 경우 "회수 불가"로 표시
4. **AI 데이터 우선**: 리스크/개선 제안에서 AI 데이터가 있으면 AI 우선 사용
5. **중복 제거**: 개선 제안은 카테고리별로 중복 제거 필요
