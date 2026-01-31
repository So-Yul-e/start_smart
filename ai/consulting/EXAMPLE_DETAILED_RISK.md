# 세부 물리적 리스크 항목 포함 예시

## 📋 현재 구조 (prompts.js 180-182 라인)

```javascript
물리적 리스크:
- 전체 리스크: ${roadview.overallRisk}
- 리스크 점수: ${roadview.riskScore}/100
```

## 🔄 개선된 구조 (세부 항목 포함)

```javascript
물리적 리스크:
- 전체 리스크: ${roadview.overallRisk}
- 리스크 점수: ${roadview.riskScore}/100
- 세부 항목:
  ${roadview.risks && roadview.risks.length > 0 ? roadview.risks.map(risk => {
    const riskNameMap = {
      'signage_obstruction': '간판 가림',
      'steep_slope': '급경사',
      'floor_level': '층위',
      'visibility': '보행 가시성'
    };
    const levelMap = {
      'low': '낮음',
      'medium': '중간',
      'high': '높음',
      'ground': '1층',
      'half_basement': '반지하',
      'second_floor': '2층 이상'
    };
    const name = riskNameMap[risk.type] || risk.type;
    const level = levelMap[risk.level] || risk.level;
    return `  - ${name}: ${level} - ${risk.description}`;
  }).join('\n') : '  - 세부 정보 없음'}
```

## 📊 예시 입력 데이터 (이미지 기반)

```javascript
roadview: {
  overallRisk: "medium",
  riskScore: 28,
  risks: [
    {
      type: "signage_obstruction",
      level: "high",
      description: "도로변의 울창한 가로수와 전면의 검은색 부스 구조물로 인해 건물 저층부 외관과 간판이 심각하게 가려져 있습니다. 차량 운전자나 도로 건너편 보행자에게 상호 노출이 매우 어려운 상태입니다."
    },
    {
      type: "steep_slope",
      level: "low",
      description: "도로와 인도가 평행하게 이어지는 완전한 평지 지형입니다. 보행자의 이동에 물리적 장벽이 없으며 접근성이 매우 우수합니다."
    },
    {
      type: "floor_level",
      level: "ground",
      description: "인도와 동일한 레벨에 위치한 1층 상권입니다. 별도의 계단이나 경사로 없이 보행자가 즉시 진입 가능한 구조입니다."
    },
    {
      type: "visibility",
      level: "medium",
      description: "넓은 인도를 확보하고 있어 해당 인도를 걷는 보행자에게는 노출되나, 가로수와 구조물로 인해 원거리나 도로에서의 시인성은 떨어집니다. 입지 자체는 대로변이나 시각적 차단 요소가 많습니다."
    }
  ]
}
```

## 💡 예상 컨설팅 결과

### 1. 리스크 분석 (topRisks) 예시

```json
{
  "topRisks": [
    {
      "title": "간판 가림으로 인한 노출성 저하",
      "description": "간판 가림이 높음 수준으로 평가되어 차량 운전자나 도로 건너편 보행자에게 카페 노출이 매우 어렵습니다. 가로수와 전면 부스 구조물로 인해 건물 저층부 외관과 간판이 심각하게 가려져 있어, 자연 유입 고객 확보에 큰 어려움이 예상됩니다. 이는 목표 판매량 달성에 직접적인 영향을 미치는 high 리스크입니다.",
      "impact": "high"
    },
    {
      "title": "보행 가시성 제한",
      "description": "보행 가시성이 중간 수준으로, 넓은 인도를 걷는 보행자에게는 노출되나 원거리나 도로에서의 시인성이 떨어집니다. 대로변 입지임에도 시각적 차단 요소가 많아 자연 유입 고객 확보에 제약이 있습니다. medium 리스크로 평가됩니다.",
      "impact": "medium"
    },
    {
      "title": "급경사 및 층위는 양호",
      "description": "급경사는 낮음, 층위는 1층으로 접근성은 매우 우수합니다. 평지 지형에 인도와 동일한 레벨에 위치하여 보행자가 즉시 진입 가능한 구조입니다. 이는 low 리스크로 평가되며, 물리적 접근성 측면에서는 유리한 조건입니다.",
      "impact": "low"
    }
  ]
}
```

### 2. 개선 제안 (improvements) 예시

```json
{
  "improvements": [
    {
      "title": "간판 및 외관 개선을 통한 노출성 향상",
      "description": "간판 가림이 높음 수준이므로, 간판 크기 확대, 높이 조정, 조명 설치 등을 통해 가로수와 구조물에 가려지지 않도록 개선이 필요합니다. 특히 전면 부스 구조물과의 협의를 통해 시야 확보 방안을 모색해야 합니다.",
      "expectedImpact": "간판 가림 문제 해결 시 자연 유입 고객이 10-15% 증가할 것으로 예상되며, 이는 일 판매량 약 20-30잔 증가로 이어질 수 있습니다. 월 순이익이 약 50-70만원 증가하고 회수 기간이 1-2개월 단축될 것으로 예상됩니다.",
      "scenarios": [
        {
          "type": "location_change",
          "description": "간판 가림이 없는 대안 입지 검토",
          "before": {
            "monthlyProfit": 500,
            "paybackMonths": 40
          },
          "after": {
            "monthlyProfit": 570,
            "paybackMonths": 35
          },
          "improvement": {
            "profitIncrease": 70,
            "paybackReduction": 5
          }
        }
      ]
    },
    {
      "title": "보행 가시성 개선을 위한 마케팅 전략",
      "description": "보행 가시성이 중간 수준이므로, 원거리 고객 유치를 위한 디지털 마케팅 강화가 필요합니다. 특히 가로수와 구조물로 인해 시인성이 떨어지는 점을 고려하여, SNS 마케팅, 지역 커뮤니티 홍보, 길 안내 표지판 설치 등을 통해 보완해야 합니다.",
      "expectedImpact": "디지털 마케팅 강화 시 인지도가 향상되어 자연 유입 고객이 5-8% 증가할 것으로 예상됩니다. 월 순이익이 약 25-40만원 증가하고 회수 기간이 0.5-1개월 단축될 것으로 예상됩니다.",
      "scenarios": [
        {
          "type": "sales_adjustment",
          "description": "보행 가시성 개선으로 판매량 5% 증가 시나리오",
          "before": {
            "monthlyProfit": 500,
            "paybackMonths": 40
          },
          "after": {
            "monthlyProfit": 525,
            "paybackMonths": 38
          },
          "improvement": {
            "profitIncrease": 25,
            "paybackReduction": 2
          }
        }
      ]
    },
    {
      "title": "접근성 우위를 활용한 마케팅 포인트 강조",
      "description": "급경사가 낮고 1층에 위치하여 접근성이 매우 우수한 점을 마케팅 포인트로 활용해야 합니다. 특히 휠체어 이용 고객, 유모차 이용 고객 등 접근성이 중요한 고객층을 타겟팅하는 전략이 효과적일 수 있습니다.",
      "expectedImpact": "접근성 우위를 마케팅 포인트로 활용 시 특정 고객층 유치가 가능하며, 월 순이익이 약 10-20만원 증가할 것으로 예상됩니다.",
      "scenarios": []
    }
  ]
}
```

## 📝 프롬프트에 추가할 리스크 판단 기준

```javascript
4. 물리적 리스크:
   - 로드뷰 리스크 점수가 낮을수록(60점 미만) 리스크 증가
   - 세부 항목별 리스크 평가:
     * 간판 가림 (signage_obstruction):
       - high → "high" 리스크 (자연 유입 고객 확보 어려움, 매출 직접 영향)
       - medium → "medium" 리스크
       - low → "low" 리스크
     * 급경사 (steep_slope):
       - high → "medium" 리스크 (접근성 저하, 일부 고객층 유치 제한)
       - medium → "low" 리스크
       - low → "low" 리스크 (접근성 양호)
     * 층위 (floor_level):
       - second_floor 이상 → "medium" 리스크 (접근성 저하)
       - half_basement → "low" 리스크 (부분적 접근성 제한)
       - ground → "low" 리스크 (접근성 우수)
     * 보행 가시성 (visibility):
       - low → "medium" 리스크 (자연 유입 고객 확보 어려움)
       - medium → "low" 리스크
       - high → "low" 리스크 (가시성 우수)
   
   💡 물리적 리스크는 매출에 직접적인 영향을 미치므로, 특히 간판 가림과 보행 가시성이 높을 경우 목표 판매량 달성에 어려움이 있을 수 있습니다.
```

## 🎯 종합 예시 컨설팅 응답

이미지 데이터를 기반으로 한 실제 컨설팅 응답 예시:

**리스크 분석:**
1. **간판 가림 (높음)** → high 리스크
   - 차량 운전자와 도로 건너편 보행자 노출 어려움
   - 자연 유입 고객 확보에 큰 제약
   - 목표 판매량 달성에 직접적 영향

2. **보행 가시성 (중간)** → medium 리스크
   - 인도 보행자에게는 노출되나 원거리 시인성 부족
   - 디지털 마케팅으로 보완 필요

3. **급경사 (낮음), 층위 (1층)** → low 리스크
   - 접근성 우수, 물리적 장벽 없음
   - 마케팅 포인트로 활용 가능

**개선 제안:**
1. 간판 크기 확대 및 높이 조정으로 가로수/구조물 가림 최소화
2. 디지털 마케팅 강화로 원거리 고객 유치
3. 접근성 우위를 마케팅 포인트로 활용

