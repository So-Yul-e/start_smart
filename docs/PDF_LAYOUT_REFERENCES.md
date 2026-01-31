# PDF 레이아웃 참고 문서 리스트

**생성일**: 2025-01-15  
**목적**: PDF 다운로드 레이아웃 구현 시 참고해야 할 문서 목록

---

## 📚 필수 참고 문서 (Must Read)

### 1. jsPDF 공식 문서
- **URL**: https://github.com/parallax/jsPDF
- **버전**: 2.5.1 (현재 사용 중)
- **주요 내용**:
  - PDF 생성 기본 API
  - `doc.text()`, `doc.setFontSize()`, `doc.setFont()` 등 텍스트 관련 메서드
  - `doc.addPage()`, `doc.setPage()` 등 페이지 관리
  - `doc.setFillColor()`, `doc.circle()` 등 그래픽 메서드
  - 좌표 시스템 (mm 단위)
- **언어**: 영어
- **우선순위**: ⭐⭐⭐⭐⭐

### 2. jsPDF-AutoTable 공식 문서
- **URL**: https://github.com/simonbengtsson/jsPDF-AutoTable
- **버전**: 3.8.2 (현재 사용 중)
- **주요 내용**:
  - `doc.autoTable()` 메서드 사용법
  - 테이블 옵션 (`head`, `body`, `styles`, `headStyles` 등)
  - 테마 설정 (`theme: 'grid'`)
  - 마진 및 스타일 커스터마이징
  - `doc.lastAutoTable.finalY` 사용법
- **언어**: 영어
- **우선순위**: ⭐⭐⭐⭐⭐

---

## 📖 상세 API 레퍼런스

### 3. jsPDF API Reference (온라인)
- **URL**: https://rawgit.com/MrRio/jsPDF/master/docs/index.html
- **주요 내용**:
  - 모든 jsPDF 메서드 상세 설명
  - 파라미터 타입 및 옵션
  - 반환값 설명
- **언어**: 영어
- **우선순위**: ⭐⭐⭐⭐

### 4. jsPDF-AutoTable API Reference
- **URL**: https://github.com/simonbengtsson/jsPDF-AutoTable#api
- **주요 내용**:
  - `autoTable()` 메서드의 모든 옵션
  - 스타일 옵션 상세 설명
  - 테마 목록 및 커스터마이징
- **언어**: 영어
- **우선순위**: ⭐⭐⭐⭐

---

## 🎓 튜토리얼 및 가이드

### 5. jsPDF Tutorial (DigitalOcean)
- **URL**: https://www.digitalocean.com/community/tutorials/js-pdf-generation
- **주요 내용**:
  - PDF 생성 기본 튜토리얼
  - 실전 예제 코드
  - 페이지 관리 방법
- **언어**: 영어
- **우선순위**: ⭐⭐⭐

### 6. jsPDF-AutoTable Examples
- **URL**: https://github.com/simonbengtsson/jsPDF-AutoTable/tree/master/examples
- **주요 내용**:
  - 다양한 테이블 스타일 예제
  - 복잡한 테이블 레이아웃
  - 커스텀 스타일링 예제
- **언어**: JavaScript 코드
- **우선순위**: ⭐⭐⭐⭐

### 7. PDF 레이아웃 모범 사례 (PDF Association)
- **URL**: https://www.pdfa.org/resource/pdf-best-practices/
- **주요 내용**:
  - PDF 생성 시 고려사항
  - 접근성 및 호환성
  - 파일 크기 최적화
- **언어**: 영어
- **우선순위**: ⭐⭐⭐

---

## 🔍 문제 해결 (Stack Overflow)

### 8. jsPDF 페이지 넘김 관련
- **검색어**: "jspdf page break" 또는 "jspdf addPage"
- **주요 내용**:
  - 페이지 넘김 처리 방법
  - `checkPage()` 함수 구현 패턴
  - 페이지 높이 계산
- **언어**: 영어
- **우선순위**: ⭐⭐⭐

### 9. jsPDF 한글 폰트 처리
- **검색어**: "jspdf korean font" 또는 "jspdf 한글"
- **주요 내용**:
  - 한글 폰트 추가 방법
  - 폰트 파일 로드
  - `doc.addFont()` 사용법
- **참고**: 현재 프로젝트는 영문만 사용 중
- **언어**: 영어/한국어
- **우선순위**: ⭐⭐ (향후 한글 지원 시 필요)

### 10. jsPDF-AutoTable 스타일 커스터마이징
- **검색어**: "jspdf autotable custom style" 또는 "jspdf autotable theme"
- **주요 내용**:
  - 테이블 스타일 커스터마이징
  - 헤더/본문 스타일 분리
  - 색상 및 폰트 설정
- **언어**: 영어
- **우선순위**: ⭐⭐⭐

### 11. jsPDF 텍스트 줄바꿈 처리
- **검색어**: "jspdf splitTextToSize" 또는 "jspdf text wrap"
- **주요 내용**:
  - 긴 텍스트 자동 줄바꿈
  - `doc.splitTextToSize()` 사용법
  - 여러 줄 텍스트 추가
- **언어**: 영어
- **우선순위**: ⭐⭐⭐

---

## 📁 프로젝트 내 문서

### 12. PDF 레이아웃 가이드 (본 문서와 함께)
- **파일**: `docs/PDF_LAYOUT_GUIDE.md`
- **주요 내용**:
  - 현재 프로젝트의 PDF 레이아웃 로직 상세 설명
  - 헬퍼 함수 사용법
  - 섹션별 레이아웃 패턴
- **언어**: 한국어
- **우선순위**: ⭐⭐⭐⭐⭐

### 13. PDF 구현 완료 보고서
- **파일**: `docs/PDF_IMPLEMENTATION_COMPLETE.md`
- **주요 내용**:
  - PDF에 포함된 모든 섹션 목록
  - 각 섹션의 위치 및 구현 상태
  - 코드 위치 참조
- **언어**: 한국어
- **우선순위**: ⭐⭐⭐

### 14. 리포트 모델 구현 상태
- **파일**: `docs/REPORT_MODEL_IMPLEMENTATION_STATUS.md`
- **주요 내용**:
  - 리포트 데이터 구조
  - `reportModel` 스키마
  - 데이터 매핑 정보
- **언어**: 한국어
- **우선순위**: ⭐⭐⭐

### 15. 실제 구현 코드
- **파일**: `frontend/report/script.js` (라인 695-1094)
- **주요 내용**:
  - `generatePDF()` 함수 전체 구현
  - 모든 레이아웃 로직
  - 실제 사용 예제
- **언어**: JavaScript
- **우선순위**: ⭐⭐⭐⭐⭐

---

## 🎯 상황별 추천 문서

### PDF 레이아웃을 처음 구현할 때
1. jsPDF 공식 문서 (#1)
2. jsPDF-AutoTable 공식 문서 (#2)
3. PDF 레이아웃 가이드 (#12)
4. 실제 구현 코드 (#15)

### 테이블 스타일을 변경할 때
1. jsPDF-AutoTable 공식 문서 (#2)
2. jsPDF-AutoTable Examples (#6)
3. jsPDF-AutoTable 스타일 커스터마이징 (#10)
4. 실제 구현 코드 (#15)

### 페이지 넘김이 제대로 작동하지 않을 때
1. jsPDF 페이지 넘김 관련 (#8)
2. PDF 레이아웃 가이드 - 페이지 관리 섹션 (#12)
3. 실제 구현 코드 - `checkPage()` 함수 (#15)

### 긴 텍스트가 잘릴 때
1. jsPDF 텍스트 줄바꿈 처리 (#11)
2. PDF 레이아웃 가이드 - 텍스트 스타일링 섹션 (#12)
3. 실제 구현 코드 - `splitTextToSize()` 사용 예제 (#15)

### 새로운 섹션을 추가할 때
1. PDF 레이아웃 가이드 - 섹션별 레이아웃 섹션 (#12)
2. PDF 구현 완료 보고서 (#13)
3. 실제 구현 코드 - 기존 섹션 참고 (#15)

---

## 📝 문서 업데이트 가이드

이 문서는 다음 상황에서 업데이트가 필요합니다:

1. **jsPDF 버전 업그레이드 시**: 새로운 API 또는 변경사항 반영
2. **jsPDF-AutoTable 버전 업그레이드 시**: 새로운 옵션 또는 변경사항 반영
3. **새로운 참고 문서 발견 시**: 유용한 문서 추가
4. **프로젝트 내 문서 추가 시**: 새로운 문서 링크 추가

---

## 🔗 빠른 링크

### 공식 문서
- [jsPDF GitHub](https://github.com/parallax/jsPDF)
- [jsPDF-AutoTable GitHub](https://github.com/simonbengtsson/jsPDF-AutoTable)
- [jsPDF API Reference](https://rawgit.com/MrRio/jsPDF/master/docs/index.html)

### 튜토리얼
- [DigitalOcean jsPDF Tutorial](https://www.digitalocean.com/community/tutorials/js-pdf-generation)
- [jsPDF-AutoTable Examples](https://github.com/simonbengtsson/jsPDF-AutoTable/tree/master/examples)

### 프로젝트 내 문서
- [PDF 레이아웃 가이드](./PDF_LAYOUT_GUIDE.md)
- [PDF 구현 완료 보고서](./PDF_IMPLEMENTATION_COMPLETE.md)
- [리포트 모델 구현 상태](./REPORT_MODEL_IMPLEMENTATION_STATUS.md)

---

## 버전 정보

- **문서 버전**: 1.0
- **최종 업데이트**: 2025-01-15
- **작성자**: AI Assistant

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-01-15 | 1.0 | 초기 문서 작성 |
