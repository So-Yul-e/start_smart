# iOS 숫자 입력 버그 수정 가이드

## 문제 설명

iOS Safari/Chrome에서 `input type="number"` 필드에 숫자 키패드로 연속된 숫자를 입력할 때, 입력이 완료되기 전에 값이 지워지는 버그가 발생합니다.

### 증상
- 숫자를 빠르게 연속 입력하면 일부 숫자가 사라짐
- 입력 중에 커서가 이상한 위치로 이동
- 입력한 값이 완전히 지워지는 경우 발생

### 발생 환경
- iOS Safari
- iOS Chrome
- iPad Safari/Chrome

## 원인 분석

iOS에서 `input` 이벤트 핸들러가 즉시 실행되면서 다음 문제가 발생합니다:

1. **입력 중 값 읽기**: `input` 이벤트에서 `value`를 읽거나 `parseInt()` 등을 호출하면 iOS의 입력 처리가 방해받음
2. **동기적 DOM 조작**: 입력 중에 DOM을 조작하면 iOS가 입력을 취소함
3. **이벤트 타이밍**: iOS의 입력 처리와 JavaScript 이벤트 핸들러의 타이밍 충돌

## 해결 방법

### 1. HTML 속성 추가

모든 숫자 입력 필드에 다음 속성을 추가합니다:

```html
<!-- 정수 입력 필드 -->
<input 
  type="number" 
  inputmode="numeric" 
  pattern="[0-9]*"
  id="inputInvestment"
  class="field-input"
  placeholder="예: 12000"
>

<!-- 소수점 입력 필드 (이자율 등) -->
<input 
  type="number" 
  inputmode="decimal"
  step="0.1"
  id="inputApr"
  class="field-input"
  placeholder="예: 5.5"
>
```

**속성 설명:**
- `inputmode="numeric"`: iOS에서 숫자 키패드 표시
- `inputmode="decimal"`: 소수점이 필요한 경우 사용
- `pattern="[0-9]*"`: 숫자만 입력 가능하도록 제한

### 2. JavaScript Debounce 적용

`input` 이벤트 핸들러에서 값을 읽거나 검증하는 작업을 debounce로 지연시킵니다.

#### 기본 패턴

```javascript
// Debounce 타이머 저장 객체
var validationTimeouts = {};

function handleNumberInput(e) {
  var input = e.target;
  var inputId = input.id || input.className;
  
  // 이전 타이머 취소
  if (validationTimeouts[inputId]) {
    clearTimeout(validationTimeouts[inputId]);
  }
  
  // 입력이 완료된 후 일정 시간(300ms) 후에 검증 실행
  validationTimeouts[inputId] = setTimeout(function() {
    // 여기서 값 읽기 및 검증 수행
    validateForm();
    delete validationTimeouts[inputId];
  }, 300);
}

// 모든 숫자 입력 필드에 적용
[inputInvestment, inputRent, inputArea, inputDailySales].forEach(function (el) {
  el.addEventListener('input', handleNumberInput);
});
```

#### 동적 생성된 필드에 적용

```javascript
// 동적으로 생성되는 대출 입력 필드 예시
loansContainer.querySelectorAll('.loan-principal, .loan-apr, .loan-term').forEach(function(input) {
  input.addEventListener('input', function() {
    var self = this;
    var inputKey = this.getAttribute('data-loan-id') + '_' + this.className;
    
    // 이전 타이머 취소
    if (validationTimeouts[inputKey]) {
      clearTimeout(validationTimeouts[inputKey]);
    }
    
    // 입력 완료 후 일정 시간(300ms) 후에 데이터 업데이트
    validationTimeouts[inputKey] = setTimeout(function() {
      // 여기서 값 읽기 및 데이터 업데이트
      var loanId = self.getAttribute('data-loan-id');
      var loan = loans.find(function(l) { return l.id === loanId; });
      if (loan) {
        loan.principal = self.value;
      }
      delete validationTimeouts[inputKey];
    }, 300);
  });
});
```

## 완전한 예시 코드

### HTML

```html
<div class="field-group">
  <label class="field-label">초기 투자금 (만원)</label>
  <input 
    type="number" 
    id="inputInvestment" 
    class="field-input" 
    placeholder="예: 12000"
    inputmode="numeric" 
    pattern="[0-9]*"
  >
</div>

<div class="field-group">
  <label class="field-label">연 이자율 (%)</label>
  <input 
    type="number" 
    id="inputApr" 
    class="field-input" 
    placeholder="예: 5.5"
    step="0.1"
    inputmode="decimal"
  >
</div>
```

### JavaScript

```javascript
// Debounce 타이머 저장 객체
var validationTimeouts = {};

// 숫자 입력 핸들러
function handleNumberInput(e) {
  var input = e.target;
  var inputId = input.id || input.className;
  
  // 이전 타이머 취소
  if (validationTimeouts[inputId]) {
    clearTimeout(validationTimeouts[inputId]);
  }
  
  // 입력이 완료된 후 일정 시간(300ms) 후에 검증 실행
  validationTimeouts[inputId] = setTimeout(function() {
    // 여기서 값 읽기 및 검증 수행
    // ⚠️ 주의: 입력 중에는 값을 읽지 않음
    validateForm();
    delete validationTimeouts[inputId];
  }, 300);
}

// 폼 검증 함수
function validateForm() {
  // 이제 안전하게 값을 읽을 수 있음
  var investmentVal = inputInvestment.value ? parseInt(inputInvestment.value) : 0;
  var aprVal = inputApr.value ? parseFloat(inputApr.value) : 0;
  
  // 검증 로직...
  var isValid = investmentVal > 0 && aprVal > 0;
  btnSubmit.disabled = !isValid;
}

// DOM 요소 참조
var inputInvestment = document.getElementById('inputInvestment');
var inputApr = document.getElementById('inputApr');
var btnSubmit = document.getElementById('btnSubmit');

// 이벤트 리스너 등록
[inputInvestment, inputApr].forEach(function (el) {
  el.addEventListener('input', handleNumberInput);
});
```

## 적용 체크리스트

### 1단계: HTML 수정
- [ ] 모든 `type="number"` 입력 필드에 `inputmode="numeric"` 추가
- [ ] 소수점이 필요한 필드는 `inputmode="decimal"` 사용
- [ ] 정수 입력 필드에 `pattern="[0-9]*"` 추가

### 2단계: JavaScript 수정
- [ ] `input` 이벤트 핸들러에서 즉시 값을 읽지 않도록 수정
- [ ] Debounce 로직 추가 (300ms 지연)
- [ ] 타이머 관리 객체 생성
- [ ] 동적 생성 필드에도 동일하게 적용

### 3단계: 테스트
- [ ] iOS Safari에서 숫자 연속 입력 테스트
- [ ] iOS Chrome에서 숫자 연속 입력 테스트
- [ ] 입력 중 값이 지워지지 않는지 확인
- [ ] 검증이 정상적으로 작동하는지 확인

## 주의사항

### ❌ 하지 말아야 할 것

```javascript
// ❌ 나쁜 예: input 이벤트에서 즉시 값 읽기
input.addEventListener('input', function() {
  var value = parseInt(this.value); // iOS 입력 방해!
  validateForm();
});

// ❌ 나쁜 예: requestAnimationFrame만 사용
input.addEventListener('input', function() {
  requestAnimationFrame(function() {
    validateForm(); // 여전히 문제 발생 가능
  });
});
```

### ✅ 올바른 방법

```javascript
// ✅ 좋은 예: Debounce 사용
var timeout;
input.addEventListener('input', function() {
  clearTimeout(timeout);
  timeout = setTimeout(function() {
    validateForm(); // 입력 완료 후 실행
  }, 300);
});
```

## Debounce 시간 조정

기본값은 300ms이지만, 필요에 따라 조정할 수 있습니다:

- **100-200ms**: 빠른 반응이 필요한 경우 (사용자 경험 저하 가능)
- **300ms** (권장): 균형잡힌 반응 속도
- **500ms**: 느린 입력을 허용하는 경우

## 추가 최적화

### 커서 위치 보존 (선택사항)

입력 중 커서 위치를 보존하려면:

```javascript
function handleNumberInput(e) {
  var input = e.target;
  var cursorPos = input.selectionStart; // 커서 위치 저장
  
  // Debounce 로직...
  
  setTimeout(function() {
    // 검증 후 커서 위치 복원
    input.setSelectionRange(cursorPos, cursorPos);
  }, 300);
}
```

## 참고 자료

- [MDN: inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode)
- [MDN: pattern](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern)
- [iOS Safari Input Issues](https://bugs.webkit.org/show_bug.cgi?id=149054)

## 요약

1. **HTML**: `inputmode="numeric"` 및 `pattern="[0-9]*"` 추가
2. **JavaScript**: `input` 이벤트에서 debounce(300ms) 적용
3. **핵심**: 입력 중에는 값을 읽지 않고, 입력 완료 후에만 처리

이 방법으로 iOS에서 숫자 입력 버그를 완전히 해결할 수 있습니다.
