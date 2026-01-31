# 문서 수정 완료 요약

## ✅ 수정 완료 확인 (5가지 체크 항목)

### 1. ✅ riskFactors는 유지되고, riskCards가 추가된다
- **ROLE.md**: `riskFactors` (레거시 문자열 배열) + `riskCards` (신규 객체 배열) 명시
- **SCHEMA_CHANGES.md**: "riskFactors는 유지되고, riskCards가 추가됩니다" 명시
- **DEVELOPMENT_CHECKLIST.md**: High Priority에 "riskFactors(string[]) 유지 + riskCards(optional) 추가" 항목 추가

### 2. ✅ expectedDailySales fallback 순서가 문서에 적혀 있다
- **ROLE.md**: "⚠️ expectedDailySales Fallback 규칙" 섹션 추가
  - `market.expectedDailySales` → `brand.defaults.expectedDailySales` → `targetDailySales` (최후)
- **SCHEMA_CHANGES.md**: "Fallback 규칙" 섹션 추가
- **IMPLEMENTATION_PLAN.md**: validateInput 함수에 fallback 규칙 구현 코드 추가
- **IMPLEMENTATION_SUMMARY.md**: "expectedDailySales 원칙" 섹션에 fallback 규칙 명시

### 3. ✅ scenarioTable에서 expected가 변하지 않는다고 적혀 있다
- **IMPLEMENTATION_PLAN.md**: Step 1.3에 "⚠️ 중요: scenarioTable 계산 시 변경되는 것은 targetDailySales(=daily)만이며, market.expectedDailySales는 원래 값을 유지한다" 명시
- **IMPLEMENTATION_SUMMARY.md**: "시나리오 계산 시 주의" 항목에 명시
- **DEVELOPMENT_CHECKLIST.md**: "scenarioTable에서 expectedMonthlyRevenue가 변하지 않는지 확인" 체크리스트 추가

### 4. ✅ monthlyProfit<=0일 때 paybackMonths 처리 규칙이 있다
- **IMPLEMENTATION_PLAN.md**: Step 1.1에 "⚠️ 중요: monthlyProfit <= 0일 때 paybackMonths는 null 권장" 명시
- **DEVELOPMENT_CHECKLIST.md**: "monthlyProfit <= 0 → paybackMonths = null, signal = red" 체크리스트 추가
- **IMPLEMENTATION_PLAN.md**: breakEvenDailySales도 avgPrice=0 같은 엣지 방어 추가

### 5. ✅ successProbability 단위(0~1)가 확정돼 있다
- **SCHEMA_CHANGES.md**: Q&A에 "successProbability는 0~1 사이의 값입니다 (score/100)" 명시
- **IMPLEMENTATION_SUMMARY.md**: "successProbability 표기 방식" 섹션에 "0~1 사이의 값 (score/100)" 명시
- **ROLE.md**: 출력 예시에 "successProbability: 0.62, // 성공 확률 (0-1, score/100)" 명시

---

## 📝 수정된 파일 목록

1. **SCHEMA_CHANGES.md**
   - 호환성 정책 명시 (기존 필드 유지, 신규 필드 optional)
   - riskFactors 유지 + riskCards 추가 명시
   - expectedDailySales fallback 규칙 추가
   - successProbability 단위 (0~1) 확정

2. **ROLE.md**
   - 담당 영역 문장 수정 (리스크 카드 + 템플릿 문장, 긴 코멘트는 AI로)
   - Finance 입력에 market.expectedDailySales 명시 + fallback 규칙
   - Decision 출력에 riskFactors(레거시) + riskCards(신규) 병행 명시
   - successProbability 단위 명시

3. **IMPLEMENTATION_PLAN.md**
   - scenarioTable에서 expected 유지 명시
   - paybackMonths 예외 처리 강화 (null 권장)
   - survivalMonths 36 기준선 감점형 명시
   - expectedDailySales fallback 규칙 구현 코드 추가

4. **IMPLEMENTATION_SUMMARY.md**
   - 호환성 정책 문단 추가
   - expectedDailySales 원칙 명시
   - successProbability 표기 방식 명시
   - 시나리오 계산 시 주의사항 추가

5. **DEVELOPMENT_CHECKLIST.md**
   - High Priority에 2개 항목 추가 (Backward compatibility, expectedDailySales fallback)
   - 필수 테스트 케이스 구체화 (paybackMonths null, expectedDailySales fallback, scenarioTable expected 유지)

---

## 🎯 핵심 변경사항 요약

### Backward Compatibility 보장
- 기존 필드는 유지하고, 신규 필드는 optional로 추가
- `riskFactors` (string[]) 유지 + `riskCards` (object[]) 추가
- 프론트엔드는 신규 필드 우선 사용, 없으면 레거시 사용

### expectedDailySales Fallback 규칙
1. `market.expectedDailySales` 우선 사용
2. 없으면 `brand.defaults.expectedDailySales` 사용
3. 둘 다 없으면 `targetDailySales` 사용 (최후 fallback, GAP=0%)

### scenarioTable 계산 규칙
- 변경되는 것은 `targetDailySales`만
- `market.expectedDailySales`는 원래 값을 유지

### paybackMonths 예외 처리
- `monthlyProfit <= 0` → `paybackMonths = null` (Infinity 대신)
- `signal = "red"` 자동 설정

### successProbability 단위
- 0~1 사이의 값 (score/100)
- 리포트 표시 시 `(successProbability * 100)`으로 % 변환

---

## ✅ 최종 확인

모든 문서에 다음 5가지가 명시적으로 존재합니다:

1. ✅ riskFactors는 유지되고, riskCards가 추가된다
2. ✅ expectedDailySales fallback 순서가 문서에 적혀 있다
3. ✅ scenarioTable에서 expected가 변하지 않는다고 적혀 있다
4. ✅ monthlyProfit<=0일 때 paybackMonths 처리 규칙이 있다
5. ✅ successProbability 단위(0~1)가 확정돼 있다

**모든 수정 완료!** 🎉
