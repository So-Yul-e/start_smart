# 빠른 테스트 가이드

**생성일**: 2025-01-15  
**목적**: 5분 안에 테스트 완료

---

## 🚀 빠른 테스트 (5분)

### 1단계: 서버 시작 (30초)

```bash
cd backend
npm start
```

**확인**: 서버가 `http://localhost:3000`에서 실행 중

---

### 2단계: 분석 실행 (2분)

1. 브라우저에서 `http://localhost:3000` 접속
2. 브랜드 선택 (예: 메가커피)
3. 조건 입력:
   - 초기 투자금: 500,000,000원
   - 월세: 3,000,000원
   - 평수: 33평
   - 점주 근무: 예
   - 목표 판매량: 300잔/일
4. "분석 시작" 버튼 클릭
5. 분석 완료 대기 (약 1-2분)

---

### 3단계: Dashboard 확인 (1분)

1. Dashboard 페이지로 이동
2. **"입지-상권분석" 탭 클릭** ⭐ 신규
3. 확인 사항:
   - ✅ 입지 분석 섹션 표시
   - ✅ Roadview 리스크 카드 4개 표시
   - ✅ 종합 리스크 평가 표시
   - ✅ 상권 분석 섹션 표시
   - ✅ 경쟁 카페 현황 표시
   - ✅ 유동인구 정보 표시
   - ✅ 상권 종합 점수 표시

---

### 4단계: Report 확인 (1분)

1. "PDF 리포트" 버튼 클릭
2. **PAGE 3 (입지-상권분석) 확인** ⭐ 신규
3. 확인 사항:
   - ✅ 입지 분석 섹션 표시
   - ✅ 상권 분석 섹션 표시
4. "PDF 다운로드" 버튼 클릭
5. PDF 파일 확인:
   - ✅ PAGE 3에 입지-상권분석 포함

---

## 🔍 빠른 검증 (브라우저 콘솔)

Dashboard 페이지에서 개발자 도구 콘솔 열기 (F12)

```javascript
// 1. 분석 결과 확인
const result = JSON.parse(sessionStorage.getItem('analysisResult'));
console.log('reportModel 존재:', !!result.reportModel);

// 2. 필수 필드 확인
if (result.reportModel) {
  console.log('✅ market:', !!result.reportModel.market);
  console.log('✅ roadview:', !!result.reportModel.roadview);
  console.log('✅ risk cards:', result.reportModel.risk?.cards?.length || 0, '개');
  console.log('✅ improvement cards:', result.reportModel.improvement?.cards?.length || 0, '개');
}

// 3. 데이터 일관성 확인
if (result.reportModel && result.finance && result.decision) {
  const rm = result.reportModel;
  console.log('paybackMonths 일치:', rm.executive.paybackMonths === result.finance.paybackMonths);
  console.log('monthlyProfit 일치:', rm.executive.monthlyProfit === result.finance.monthlyProfit);
  console.log('score 일치:', rm.executive.score === result.decision.score);
}
```

---

## ✅ 체크리스트

- [ ] 서버 시작 성공
- [ ] 분석 실행 성공
- [ ] Dashboard "입지-상권분석" 탭 표시
- [ ] 입지 분석 데이터 표시
- [ ] 상권 분석 데이터 표시
- [ ] Report PAGE 3 표시
- [ ] PDF 생성 성공
- [ ] 브라우저 콘솔 에러 없음

---

## 🐛 문제 발생 시

### reportModel이 없는 경우

**확인**:
1. 서버 로그에서 `✅ reportModel 생성 완료` 메시지 확인
2. 브라우저 콘솔에서 `result.reportModel` 확인

**해결**:
- 서버 재시작
- 분석 다시 실행

### 입지-상권분석 데이터가 없는 경우

**확인**:
1. `result.reportModel.market` 확인
2. `result.reportModel.roadview` 확인

**해결**:
- market/roadview 분석이 실패했을 수 있음
- 서버 로그 확인
- 다른 위치로 재시도

### 에러 발생 시

**확인**:
1. 브라우저 콘솔 에러 메시지
2. 서버 로그 에러 메시지

**해결**:
- 에러 메시지 확인
- `docs/TEST_GUIDE_REPORTMODEL.md` 참고

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-15
