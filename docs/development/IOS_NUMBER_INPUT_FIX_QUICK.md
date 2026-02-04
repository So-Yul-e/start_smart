# iOS 숫자 입력 버그 수정 - 빠른 가이드

## 문제
iOS에서 숫자 키패드로 연속 입력 시 값이 지워지는 버그

## 해결 방법 (2단계)

### 1. HTML 수정 (모든 숫자 입력 필드)

```html
<!-- 정수 입력 -->
<input type="number" inputmode="numeric" pattern="[0-9]*" id="inputNumber">

<!-- 소수점 입력 -->
<input type="number" inputmode="decimal" step="0.1" id="inputDecimal">
```

### 2. JavaScript 수정

```javascript
// Debounce 타이머 저장
var validationTimeouts = {};

// 숫자 입력 핸들러
function handleNumberInput(e) {
  var input = e.target;
  var inputId = input.id || input.className;
  
  // 이전 타이머 취소
  if (validationTimeouts[inputId]) {
    clearTimeout(validationTimeouts[inputId]);
  }
  
  // 입력 완료 후 300ms 후에 검증 실행
  validationTimeouts[inputId] = setTimeout(function() {
    validateForm(); // 여기서 값 읽기 및 검증
    delete validationTimeouts[inputId];
  }, 300);
}

// 모든 숫자 입력 필드에 적용
document.querySelectorAll('input[type="number"]').forEach(function(el) {
  el.addEventListener('input', handleNumberInput);
});
```

## 핵심 원칙

1. **입력 중에는 값을 읽지 않음** - iOS 입력 방해 방지
2. **Debounce 300ms** - 입력 완료 후 처리
3. **HTML 속성 추가** - `inputmode="numeric"` 필수

## 체크리스트

- [ ] 모든 `type="number"`에 `inputmode="numeric"` 추가
- [ ] `input` 이벤트에서 debounce 적용
- [ ] 입력 중 값 읽기 제거
- [ ] iOS에서 테스트

---
자세한 내용은 `IOS_NUMBER_INPUT_FIX_GUIDE.md` 참고
