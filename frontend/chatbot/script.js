/**
 * AI 창업 컨설팅 챗봇
 * 분석 결과를 기반으로 상담을 제공합니다.
 */

(function () {
  'use strict';

  // 분석 결과 데이터 로드
  var result = Utils.loadSession('analysisResult');
  if (!result) {
    document.querySelector('.container').innerHTML =
      '<div style="text-align:center; padding:6rem 2rem;">' +
      '<i class="fa-solid fa-exclamation-triangle" style="font-size:4rem; color:#f87171; margin-bottom:1.5rem;"></i>' +
      '<h2 style="margin-bottom:1rem;">분석 결과가 없습니다</h2>' +
      '<p style="color:var(--text-muted); margin-bottom:2rem;">먼저 분석을 실행해주세요.</p>' +
      '<a href="../dashboard/" class="btn-cta">대시보드로 이동</a>' +
      '</div>';
    return;
  }

  // 질문 횟수 관리
  var questionCount = 0;
  var MAX_QUESTIONS = 10;
  var sessionKey = 'chatbot_question_count_' + (result.id || 'default');

  // 세션에서 질문 횟수 복원
  var savedCount = Utils.loadSession(sessionKey);
  if (savedCount !== null) {
    questionCount = savedCount;
  }

  // DOM 요소
  var decisionGrid = document.getElementById('decisionGrid');
  var chatMessages = document.getElementById('chatMessages');
  var ctaButtons = document.getElementById('ctaButtons');
  var textInputWrapper = document.getElementById('textInputWrapper');
  var chatInput = document.getElementById('chatInput');
  var sendButton = document.getElementById('sendButton');
  var typingIndicator = document.getElementById('typingIndicator');
  var questionCountEl = document.getElementById('questionCount');
  var questionWarning = document.getElementById('questionWarning');
  var remainingCountEl = document.getElementById('remainingCount');

  // CTA 버튼 정의
  var CTA_LIST = [
    { label: '수익성', icon: 'fa-chart-pie', category: 'profit' },
    { label: '리스크', icon: 'fa-triangle-exclamation', category: 'risk' },
    { label: '경쟁환경', icon: 'fa-users', category: 'competition' },
    { label: '개선방안', icon: 'fa-lightbulb', category: 'improve' },
    { label: 'GO·STOP', icon: 'fa-traffic-light', category: 'gostop' },
    { label: '입지평가', icon: 'fa-street-view', category: 'location' }
  ];

  // 키워드 매핑 (자유 입력용)
  var KEYWORD_MAP = [
    { keywords: ['수익', '매출', '이익', '마진', '돈', '돈벌', '회수', '투자'], category: 'profit' },
    { keywords: ['리스크', '위험', '걱정', '불안', '문제'], category: 'risk' },
    { keywords: ['경쟁', '주변', '상권', '카페', '밀집'], category: 'competition' },
    { keywords: ['개선', '방안', '전략', '어떻게', '좋아', '높이', '올리'], category: 'improve' },
    { keywords: ['추천', '판정', 'go', 'stop', '해도', '할까', '괜찮'], category: 'gostop' },
    { keywords: ['입지', '위치', '로드뷰', '간판', '층', '경사', '가시성'], category: 'location' },
    { keywords: ['비용', '구조', '지출', '임대', '월세', '인건비', '재료비'], category: 'profit_detail' },
    { keywords: ['감소', '떨어', '줄어', '하락', '민감도'], category: 'profit_sensitivity' }
  ];

  // 후속 CTA 맵
  var FOLLOWUP_MAP = {
    profit: [
      { label: '비용 구조 자세히', category: 'profit_detail' },
      { label: '매출 10% 감소하면?', category: 'profit_sensitivity' },
      { label: '회수 기간 단축 방법', category: 'improve' }
    ],
    risk: [
      { label: '개선 방안 보기', category: 'improve' },
      { label: '경쟁 환경 분석', category: 'competition' },
      { label: 'GO/STOP 판정 확인', category: 'gostop' }
    ],
    competition: [
      { label: '차별화 전략', category: 'improve' },
      { label: '리스크 분석', category: 'risk' },
      { label: 'GO/STOP 판정 확인', category: 'gostop' }
    ],
    improve: [
      { label: '수익성 분석', category: 'profit' },
      { label: '리스크 분석', category: 'risk' },
      { label: 'GO/STOP 판정 확인', category: 'gostop' }
    ],
    gostop: [
      { label: '수익성 분석', category: 'profit' },
      { label: '리스크 분석', category: 'risk' },
      { label: '개선 방안 보기', category: 'improve' }
    ],
    location: [
      { label: '리스크 분석', category: 'risk' },
      { label: '경쟁 환경 분석', category: 'competition' },
      { label: 'GO/STOP 판정 확인', category: 'gostop' }
    ],
    profit_detail: [
      { label: '수익성 분석', category: 'profit' },
      { label: '개선 방안 보기', category: 'improve' },
      { label: 'GO/STOP 판정 확인', category: 'gostop' }
    ],
    profit_sensitivity: [
      { label: '수익성 분석', category: 'profit' },
      { label: '개선 방안 보기', category: 'improve' },
      { label: 'GO/STOP 판정 확인', category: 'gostop' }
    ]
  };

  // 초기화
  function init() {
    renderDecisionPanel();
    renderInitialMessage();
    // 초기 인사 메시지 후 CTA 버튼 표시 (약간의 지연으로 메시지 렌더링 후 표시)
    setTimeout(function() {
      renderCTAButtons(CTA_LIST);
    }, 100);
    updateQuestionCounter();
    attachEventListeners();
  }

  // 핵심 의사결정 정보 렌더링
  function renderDecisionPanel() {
    var finance = result.finance || {};
    var decision = result.decision || {};
    var signal = Utils.getSignal(decision.signal || 'yellow');

    decisionGrid.innerHTML = [
      {
        label: '종합 점수',
        value: (decision.score || 0) + '점',
        class: Utils.scoreColor(decision.score || 0)
      },
      {
        label: '판정 신호',
        value: signal.label,
        class: signal.color
      },
      {
        label: '월 순이익',
        value: Utils.formatKRW(finance.monthlyProfit || 0),
        class: (finance.monthlyProfit || 0) >= 0 ? 'positive' : 'negative'
      },
      {
        label: '회수 기간',
        value: (finance.paybackMonths || 0) < 999
          ? (finance.paybackMonths || 0) + '개월'
          : '회수 불가',
        class: (finance.paybackMonths || 0) <= 36 ? 'positive' : 'negative'
      },
      {
        label: '예상 생존 개월',
        value: (decision.survivalMonths || 0) + '개월',
        class: (decision.survivalMonths || 0) >= 24 ? 'positive' : 'negative'
      },
      {
        label: '리스크 레벨',
        value: Utils.levelKR(decision.riskLevel || 'medium'),
        class: decision.riskLevel === 'high' ? 'negative' : decision.riskLevel === 'low' ? 'positive' : ''
      }
    ].map(function (item) {
      return '<div class="decision-item">' +
        '<div class="decision-item-label">' + item.label + '</div>' +
        '<div class="decision-item-value" style="color:' + item.class + '">' + item.value + '</div>' +
        '</div>';
    }).join('');
  }

  // 초기 인사 메시지
  function renderInitialMessage() {
    var brandName = result.brand?.name || '브랜드';
    var address = result.location?.address || '위치 미확인';
    var score = result.decision?.score || 0;
    var signal = Utils.getSignal(result.decision?.signal || 'yellow');

    var message = '안녕하세요! <strong>' + brandName + '</strong> ' + address + ' 분석 결과를 기반으로 ' +
      '창업 상담을 도와드릴게요.<br><br>' +
      '종합 점수는 <strong style="color:' + Utils.scoreColor(score) + '">' + score + '점</strong> ' +
      '(<strong style="color:' + signal.color + '">' + signal.label + '</strong>) 입니다.<br>' +
      '궁금한 항목을 선택해주세요!';

    addMessage('ai', message, null);
    
    // 초기 인사 메시지 후 CTA 버튼 표시
    setTimeout(function() {
      renderCTAButtons(CTA_LIST);
    }, 100);
  }

  // CTA 버튼 렌더링
  function renderCTAButtons(ctaList) {
    if (!ctaList || ctaList.length === 0) {
      ctaButtons.style.display = 'none';
      textInputWrapper.style.display = 'flex';
      return;
    }

    ctaButtons.style.display = 'grid';
    // 텍스트 입력도 함께 표시 (추가 질문 가능)
    textInputWrapper.style.display = 'flex';

    ctaButtons.innerHTML = ctaList.map(function (cta) {
      var disabled = questionCount >= MAX_QUESTIONS;
      return '<button class="cta-button" data-category="' + cta.category + '" ' +
        (disabled ? 'disabled' : '') + '>' +
        '<i class="fa-solid ' + cta.icon + '"></i>' +
        '<span>' + cta.label + '</span>' +
        '</button>';
    }).join('');

    // CTA 버튼 이벤트 리스너
    var buttons = ctaButtons.querySelectorAll('.cta-button');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (questionCount >= MAX_QUESTIONS) {
          showMaxQuestionsReached();
          return;
        }
        var category = btn.getAttribute('data-category');
        handleCTAClick(category);
      });
    });
  }

  // CTA 클릭 처리
  function handleCTAClick(category) {
    questionCount++;
    Utils.saveSession(sessionKey, questionCount);
    updateQuestionCounter();

    var cta = CTA_LIST.find(function (c) { return c.category === category; });
    var userMessage = cta ? cta.label : category;

    addMessage('user', userMessage, null);
    showTyping();

    // API 호출 (분석 데이터 포함)
    var apiBaseUrl = Utils.getApiBaseUrl();
    
    fetch(apiBaseUrl + '/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisId: result.id,
        category: category,
        questionCount: questionCount,
        analysisData: result  // 분석 데이터 전달
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        hideTyping();
        if (data.success) {
          addMessage('ai', data.response, data.followups || null);
        } else {
          addMessage('ai', '<div class="chat-error-message">' +
            '<i class="fa-solid fa-exclamation-circle"></i> ' +
            '죄송합니다. 오류가 발생했습니다: ' + (data.error || '알 수 없는 오류') +
            '</div>', null);
        }
      })
      .catch(function (err) {
        hideTyping();
        console.error('챗봇 API 오류:', err);
        addMessage('ai', '<div class="chat-error-message">' +
          '<i class="fa-solid fa-exclamation-triangle"></i> ' +
          '죄송합니다. 서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' +
          '</div>', null);
      });
  }

  // 자유 입력 처리
  function handleTextInput() {
    var text = chatInput.value.trim();
    if (!text) return;

    if (questionCount >= MAX_QUESTIONS) {
      showMaxQuestionsReached();
      return;
    }

    questionCount++;
    Utils.saveSession(sessionKey, questionCount);
    updateQuestionCounter();

    addMessage('user', text, null);
    chatInput.value = '';
    showTyping();

    // 키워드 매칭 (항상 카테고리 반환, 실패 시 'general')
    var category = matchKeyword(text);

    // API 호출 (분석 데이터 포함)
    var apiBaseUrl = Utils.getApiBaseUrl();
    
    fetch(apiBaseUrl + '/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisId: result.id,
        question: text,
        category: category,
        questionCount: questionCount,
        analysisData: result  // 분석 데이터 전달
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        hideTyping();
        if (data.success) {
          addMessage('ai', data.response, data.followups || null);
        } else {
          addMessage('ai', '<div class="chat-error-message">' +
            '<i class="fa-solid fa-exclamation-circle"></i> ' +
            '죄송합니다. 오류가 발생했습니다: ' + (data.error || '알 수 없는 오류') +
            '</div>', null);
        }
      })
      .catch(function (err) {
        hideTyping();
        console.error('챗봇 API 오류:', err);
        addMessage('ai', '<div class="chat-error-message">' +
          '<i class="fa-solid fa-exclamation-triangle"></i> ' +
          '죄송합니다. 서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' +
          '</div>', null);
      });
  }

  // 키워드 매칭 (개선: 더 유연한 매칭)
  function matchKeyword(text) {
    var lowerText = text.toLowerCase();
    
    // 브랜드 비교 질문 감지
    var brandKeywords = ['스타벅스', 'starbucks', '탐앤탐스', 'tomntoms', '이디야', 'ediya', '메가커피', 'megacoffee', '투썸', 'twosome', '할리스', 'hollys', '컴포즈', 'compose', '빽다방', 'paikdabang', '브랜드', '비교', '어떤게', '어떤게 좋', '어느게', '어느게 좋'];
    var hasBrandComparison = brandKeywords.some(function(keyword) {
      return lowerText.indexOf(keyword) !== -1;
    });
    if (hasBrandComparison) {
      return 'gostop'; // 브랜드 비교는 GO/STOP 판정으로 처리
    }
    
    // 기존 키워드 매칭
    for (var i = 0; i < KEYWORD_MAP.length; i++) {
      var map = KEYWORD_MAP[i];
      for (var j = 0; j < map.keywords.length; j++) {
        if (lowerText.indexOf(map.keywords[j]) !== -1) {
          return map.category;
        }
      }
    }
    
    // 매칭 실패 시에도 일반적인 질문으로 처리
    return 'general';
  }

  // 메시지 추가
  function addMessage(type, content, followups) {
    var messageEl = document.createElement('div');
    messageEl.className = 'chat-message ' + type;

    var avatar = type === 'user'
      ? '<i class="fa-solid fa-user"></i>'
      : '<i class="fa-solid fa-robot"></i>';

    // 시간 표시
    var now = new Date();
    var timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    // AI 메시지에 복사 버튼 추가
    var copyButton = type === 'ai' 
      ? '<button class="chat-message-copy" title="복사하기" onclick="copyMessage(this)"><i class="fa-solid fa-copy"></i></button>'
      : '';

    messageEl.innerHTML =
      '<div class="chat-message-avatar">' + avatar + '</div>' +
      '<div class="chat-message-content-wrapper">' +
        '<div class="chat-message-content">' + content + '</div>' +
        '<div class="chat-message-footer">' +
          '<span class="chat-message-time">' + timeStr + '</span>' +
          copyButton +
        '</div>' +
      '</div>';

    chatMessages.appendChild(messageEl);
    
    // 부드러운 스크롤
    setTimeout(function() {
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);

    // 후속 CTA 버튼 및 텍스트 입력 표시
    if (type === 'ai') {
      setTimeout(function () {
        // AI 응답 후 항상 텍스트 입력 활성화 (추가 질문 가능)
        textInputWrapper.style.display = 'flex';
        
        // followups가 있으면 CTA 버튼도 함께 표시
        if (followups && followups.length > 0) {
          renderCTAButtons(followups);
          ctaButtons.style.display = 'grid';
        } else if (followups === null) {
          // 초기 메시지인 경우 메인 CTA 버튼 표시
          renderCTAButtons(CTA_LIST);
          ctaButtons.style.display = 'grid';
        } else {
          // followups가 빈 배열이면 CTA 버튼 숨김
          ctaButtons.style.display = 'none';
        }
      }, 300);
    }
  }

  // 메시지 복사 함수 (전역으로 노출)
  window.copyMessage = function(button) {
    var messageContent = button.closest('.chat-message-content-wrapper')
      .querySelector('.chat-message-content');
    var text = messageContent.innerText || messageContent.textContent;
    
    // 클립보드에 복사
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        // 복사 성공 피드백
        var icon = button.querySelector('i');
        var originalClass = icon.className;
        icon.className = 'fa-solid fa-check';
        button.style.color = '#4ade80';
        
        setTimeout(function() {
          icon.className = originalClass;
          button.style.color = '';
        }, 2000);
      }).catch(function(err) {
        console.error('복사 실패:', err);
      });
    } else {
      // 폴백: 텍스트 영역 사용
      var textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        var icon = button.querySelector('i');
        var originalClass = icon.className;
        icon.className = 'fa-solid fa-check';
        button.style.color = '#4ade80';
        
        setTimeout(function() {
          icon.className = originalClass;
          button.style.color = '';
        }, 2000);
      } catch (err) {
        console.error('복사 실패:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  // 타이핑 인디케이터
  function showTyping() {
    typingIndicator.style.display = 'flex';
    setTimeout(function() {
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }

  function hideTyping() {
    typingIndicator.style.display = 'none';
  }

  // 질문 횟수 업데이트
  function updateQuestionCounter() {
    questionCountEl.textContent = questionCount;

    var remaining = MAX_QUESTIONS - questionCount;
    if (remaining <= 3 && remaining > 0) {
      questionCountEl.parentElement.className = 'question-counter warning';
      questionWarning.style.display = 'flex';
      remainingCountEl.textContent = remaining;
    } else if (remaining === 0) {
      questionCountEl.parentElement.className = 'question-counter danger';
      questionWarning.style.display = 'flex';
      remainingCountEl.textContent = '0';
    } else {
      questionCountEl.parentElement.className = 'question-counter';
      questionWarning.style.display = 'none';
    }

    // 최대 횟수 도달 시 입력 비활성화
    if (questionCount >= MAX_QUESTIONS) {
      chatInput.disabled = true;
      sendButton.disabled = true;
      var buttons = ctaButtons.querySelectorAll('.cta-button');
      buttons.forEach(function (btn) { btn.disabled = true; });
    }
  }

  // 최대 질문 횟수 도달 메시지
  function showMaxQuestionsReached() {
    addMessage('ai', '죄송합니다. 질문 횟수 제한(10회)에 도달했습니다.<br>' +
      '더 자세한 상담이 필요하시면 시뮬레이터에서 조건을 변경하여 재분석하시거나, ' +
      '전문가 상담을 받아보시기 바랍니다.', null);
  }

  // 이벤트 리스너
  function attachEventListeners() {
    sendButton.addEventListener('click', handleTextInput);
    chatInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleTextInput();
      }
    });

    // 입력 필드 자동 포커스 (텍스트 입력 영역이 표시될 때)
    var observer = new MutationObserver(function(mutations) {
      if (textInputWrapper.style.display === 'flex') {
        setTimeout(function() {
          chatInput.focus();
        }, 100);
      }
    });
    observer.observe(textInputWrapper, { attributes: true, attributeFilter: ['style'] });
  }

  // 초기화 실행
  init();
})();
