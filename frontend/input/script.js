/**
 * Input Page - Kakao Map + Roadview + Form Pre-fill + Loading Animation
 */
(function () {
  // ── State ──
  var brand = Utils.loadSession('selectedBrand');
  var prevInput = Utils.loadSession('analysisInput');
  var selectedLocation = null;
  var selectedRadius = 500;
  var map = null;
  var marker = null;
  var circle = null;
  var geocoder = null;
  var roadviewClient = null;
  var roadview = null;
  var mapLoaded = false;

  // ── DOM ──
  var brandDisplay = document.getElementById('brandNameDisplay');
  var btnAnalyze = document.getElementById('btnAnalyze');
  var inputInvestment = document.getElementById('inputInvestment');
  var inputRent = document.getElementById('inputRent');
  var inputArea = document.getElementById('inputArea');
  var inputOwnerWork = document.getElementById('inputOwnerWork');
  var inputDailySales = document.getElementById('inputDailySales');
  var investHint = document.getElementById('investHint');

  // ── Brand Check ──
  if (!brand) {
    brandDisplay.textContent = '브랜드를 먼저 선택해주세요';
    brandDisplay.style.color = '#f87171';
  } else {
    brandDisplay.textContent = brand.name;
    investHint.textContent = '브랜드 기준 초기투자: ' + Utils.formatKRW(brand.initialInvestment);
    inputInvestment.placeholder = Math.round(brand.initialInvestment / 10000);
  }

  // ── Pre-fill from previous analysis ──
  function prefillFromPrevious() {
    if (!prevInput) return;

    if (prevInput.conditions) {
      if (prevInput.conditions.initialInvestment) {
        inputInvestment.value = Math.round(prevInput.conditions.initialInvestment / 10000);
      }
      if (prevInput.conditions.monthlyRent) {
        inputRent.value = Math.round(prevInput.conditions.monthlyRent / 10000);
      }
      if (prevInput.conditions.area) {
        inputArea.value = prevInput.conditions.area;
      }
      if (prevInput.conditions.ownerWorking !== undefined) {
        inputOwnerWork.checked = prevInput.conditions.ownerWorking;
        updateOwnerLabel();
      }
    }
    if (prevInput.targetDailySales) {
      inputDailySales.value = prevInput.targetDailySales;
    }
    if (prevInput.radius) {
      selectedRadius = prevInput.radius;
      var radiusBtns = document.querySelectorAll('.radius-btn[data-radius]');
      for (var i = 0; i < radiusBtns.length; i++) {
        radiusBtns[i].classList.remove('active');
        if (parseInt(radiusBtns[i].getAttribute('data-radius')) === selectedRadius) {
          radiusBtns[i].classList.add('active');
        }
      }
    }
  }

  // ── Owner Work Toggle Label ──
  function updateOwnerLabel() {
    var label = document.getElementById('ownerWorkLabel');
    if (inputOwnerWork.checked) {
      label.textContent = '직접 근무 (인건비 절감)';
      label.style.color = 'var(--primary-glow)';
    } else {
      label.textContent = '미근무 (고용 인건비 발생)';
      label.style.color = 'var(--text-muted)';
    }
  }

  inputOwnerWork.addEventListener('change', function () {
    updateOwnerLabel();
    validateForm();
  });

  // ── Kakao Map Init ──
  function initMap() {
    try {
      if (typeof kakao === 'undefined' || !kakao.maps) throw new Error('SDK not loaded');

      kakao.maps.load(function () {
        var centerLat = 37.5665;
        var centerLng = 126.9780;

        // Restore previous location center
        if (prevInput && prevInput.location) {
          centerLat = prevInput.location.lat;
          centerLng = prevInput.location.lng;
        }

        var container = document.getElementById('map');
        var options = {
          center: new kakao.maps.LatLng(centerLat, centerLng),
          level: 5
        };
        map = new kakao.maps.Map(container, options);
        geocoder = new kakao.maps.services.Geocoder();
        mapLoaded = true;

        // Init roadview client
        try {
          roadviewClient = new kakao.maps.RoadviewClient();
          var rvContainer = document.getElementById('roadview');
          if (rvContainer) {
            roadview = new kakao.maps.Roadview(rvContainer);
          }
        } catch (e) {
          console.warn('Roadview init failed:', e);
        }

        // Restore previous pin
        if (prevInput && prevInput.location) {
          var prevLatlng = new kakao.maps.LatLng(prevInput.location.lat, prevInput.location.lng);
          placeMarker(prevLatlng);
          selectedLocation = prevInput.location;
          if (selectedLocation.address) {
            document.getElementById('addressText').textContent = selectedLocation.address;
            document.getElementById('addressBar').style.display = 'flex';
          }
          showMockCards();
          showRoadview(prevLatlng);
          validateForm();
        }

        // Click event
        kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
          var latlng = mouseEvent.latLng;
          placeMarker(latlng);
          reverseGeocode(latlng);
          showRoadview(latlng);
        });
      });
    } catch (e) {
      console.warn('Kakao Map init failed:', e);
      document.getElementById('map').style.display = 'none';
      document.getElementById('mapFallback').style.display = 'flex';
      // Still allow pre-fill to work without map
      if (prevInput && prevInput.location) {
        selectedLocation = prevInput.location;
        if (selectedLocation.address) {
          document.getElementById('addressText').textContent = selectedLocation.address;
          document.getElementById('addressBar').style.display = 'flex';
        }
        showMockCards();
        validateForm();
      }
    }
  }

  function placeMarker(latlng) {
    if (marker) marker.setMap(null);
    if (circle) circle.setMap(null);

    marker = new kakao.maps.Marker({ position: latlng });
    marker.setMap(map);

    circle = new kakao.maps.Circle({
      center: latlng,
      radius: selectedRadius,
      strokeWeight: 2,
      strokeColor: '#4ade80',
      strokeOpacity: 0.8,
      fillColor: '#4ade80',
      fillOpacity: 0.12
    });
    circle.setMap(map);

    selectedLocation = {
      lat: latlng.getLat(),
      lng: latlng.getLng(),
      address: ''
    };
    
    console.log('[위치 설정] selectedLocation:', selectedLocation);

    showMockCards();
    validateForm();
  }

  function reverseGeocode(latlng) {
    if (!geocoder) return;
    geocoder.coord2Address(latlng.getLng(), latlng.getLat(), function (result, status) {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        var addr = result[0].road_address
          ? result[0].road_address.address_name
          : result[0].address.address_name;
        selectedLocation.address = addr;
        document.getElementById('addressText').textContent = addr;
        document.getElementById('addressBar').style.display = 'flex';
      }
    });
  }

  // ── Roadview ──
  function showRoadview(latlng) {
    if (!roadviewClient || !roadview) {
      // Fallback: show placeholder
      document.getElementById('roadviewFallback').style.display = 'flex';
      return;
    }

    var position = new kakao.maps.LatLng(latlng.getLat ? latlng.getLat() : latlng.lat, latlng.getLng ? latlng.getLng() : latlng.lng);
    roadviewClient.getNearestPanoId(position, 50, function (panoId) {
      if (panoId) {
        document.getElementById('roadviewFallback').style.display = 'none';
        roadview.setPanoId(panoId, position);
      } else {
        document.getElementById('roadviewFallback').style.display = 'flex';
      }
    });
  }

  // ── Radius Buttons ──
  var radiusBtns = document.querySelectorAll('.radius-btn[data-radius]');
  for (var i = 0; i < radiusBtns.length; i++) {
    radiusBtns[i].addEventListener('click', function () {
      for (var j = 0; j < radiusBtns.length; j++) radiusBtns[j].classList.remove('active');
      this.classList.add('active');
      selectedRadius = parseInt(this.getAttribute('data-radius'));
      if (circle && selectedLocation) {
        circle.setRadius(selectedRadius);
      }
    });
  }

  // ── Mock Cards (상권 요약 + 로드뷰) ──
  function showMockCards() {
    document.getElementById('marketSummary').style.display = 'block';

    var roadviewCard = document.getElementById('roadviewCard');
    roadviewCard.style.display = 'block';

    var items = [
      { icon: 'fa-sign-hanging', title: '간판 가시성', desc: '주변 건물에 의해 부분적으로 가려짐', level: 'medium' },
      { icon: 'fa-mountain', title: '지형/경사', desc: '평탄한 지형으로 접근성 양호', level: 'low' },
      { icon: 'fa-building', title: '층 위치', desc: '1층 매장 — 가시성 확보', level: 'ground' },
      { icon: 'fa-eye', title: '보행 가시성', desc: '주요 동선에 위치하여 우수', level: 'high' }
    ];

    var levelColors = {
      high: { bg: 'rgba(74,222,128,0.15)', color: '#4ade80', text: '양호' },
      medium: { bg: 'rgba(250,204,21,0.15)', color: '#facc15', text: '보통' },
      low: { bg: 'rgba(74,222,128,0.15)', color: '#4ade80', text: '양호' },
      ground: { bg: 'rgba(74,222,128,0.15)', color: '#4ade80', text: '1층' }
    };

    document.getElementById('roadviewItems').innerHTML = items.map(function (it) {
      var lc = levelColors[it.level] || levelColors.medium;
      return '<div class="roadview-item">' +
        '<div class="rv-icon" style="background:' + lc.bg + '; color:' + lc.color + ';"><i class="fa-solid ' + it.icon + '"></i></div>' +
        '<div class="rv-text"><div class="rv-title">' + it.title + '</div><div class="rv-desc">' + it.desc + '</div></div>' +
        '<span class="rv-badge" style="background:' + lc.bg + '; color:' + lc.color + ';">' + lc.text + '</span>' +
        '</div>';
    }).join('');

    showScenario();
  }

  function showScenario() {
    if (!brand) return;
    var section = document.getElementById('scenarioSection');
    section.style.display = 'block';

    var conservative = Math.round(brand.avgDailySales * 0.7);
    var expected = brand.avgDailySales;
    var optimistic = Math.round(brand.avgDailySales * 1.3);

    document.getElementById('scenarioReason').textContent =
      brand.name + ' 브랜드의 평균 판매량과 상권 유동인구, 경쟁 밀도를 종합 분석한 AI 추정치입니다.';

    document.getElementById('scenarioCards').innerHTML =
      '<div class="scenario-card">' +
      '<div class="label">보수적</div>' +
      '<div class="value">' + conservative + '</div>' +
      '<div class="unit">잔/일</div>' +
      '</div>' +
      '<div class="scenario-card highlight">' +
      '<div class="label" style="color:var(--gold);">기대치</div>' +
      '<div class="value" style="color:var(--gold);">' + expected + '</div>' +
      '<div class="unit">잔/일</div>' +
      '</div>' +
      '<div class="scenario-card">' +
      '<div class="label">낙관적</div>' +
      '<div class="value">' + optimistic + '</div>' +
      '<div class="unit">잔/일</div>' +
      '</div>';

    // Only set daily sales if not already pre-filled
    if (!inputDailySales.value || parseInt(inputDailySales.value) === 0) {
      inputDailySales.value = expected;
    }
    // 값이 설정된 후 검증 실행 (약간의 지연을 두어 DOM 업데이트 반영)
    setTimeout(validateForm, 100);
  }

  // ── Form Validation ──
  function validateForm() {
    var hasLocation = !!selectedLocation;
    var investmentVal = inputInvestment.value ? parseInt(inputInvestment.value) : 0;
    var rentVal = inputRent.value ? parseInt(inputRent.value) : 0;
    var areaVal = inputArea.value ? parseInt(inputArea.value) : 0;
    var salesVal = inputDailySales.value ? parseInt(inputDailySales.value) : 0;
    
    var hasInvestment = investmentVal > 0;
    var hasRent = rentVal > 0;
    var hasArea = areaVal > 0;
    var hasSales = salesVal > 0;

    var isValid = hasLocation && hasInvestment && hasRent && hasArea && hasSales;
    btnAnalyze.disabled = !isValid;
    
    // 디버깅용 로그
    if (!isValid) {
      console.log('[폼 검증] 버튼 비활성화:', {
        hasLocation: hasLocation,
        selectedLocation: selectedLocation,
        hasInvestment: hasInvestment,
        investmentValue: inputInvestment.value,
        hasRent: hasRent,
        rentValue: inputRent.value,
        hasArea: hasArea,
        areaValue: inputArea.value,
        hasSales: hasSales,
        salesValue: inputDailySales.value,
        salesParsed: salesVal
      });
    } else {
      console.log('[폼 검증] 버튼 활성화됨');
    }
  }

  [inputInvestment, inputRent, inputArea, inputDailySales].forEach(function (el) {
    el.addEventListener('input', validateForm);
  });

  // ── Analysis Execution ──
  btnAnalyze.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[분석 실행] 버튼 클릭됨');
    console.log('[분석 실행] 버튼 disabled 상태:', btnAnalyze.disabled);
    
    if (btnAnalyze.disabled) {
      console.warn('[분석 실행] 버튼이 비활성화되어 있습니다.');
      alert('모든 필수 항목을 입력해주세요:\n- 위치 선택\n- 초기 투자금\n- 월세\n- 매장 평수\n- 목표 일 판매량');
      return;
    }

    if (!brand || !brand.id) {
      console.error('[분석 실행] 브랜드가 선택되지 않았습니다.');
      alert('브랜드를 먼저 선택해주세요.');
      window.location.href = '../brand/';
      return;
    }

    if (!selectedLocation) {
      console.error('[분석 실행] 위치가 선택되지 않았습니다.');
      alert('지도를 클릭하여 위치를 선택해주세요.');
      return;
    }

    var analysisInput = {
      brandId: brand.id,
      location: selectedLocation,
      radius: selectedRadius,
      conditions: {
        initialInvestment: parseInt(inputInvestment.value) * 10000,
        monthlyRent: parseInt(inputRent.value) * 10000,
        area: parseInt(inputArea.value),
        ownerWorking: inputOwnerWork.checked
      },
      targetDailySales: parseInt(inputDailySales.value)
    };

    console.log('[분석 실행] 분석 입력 데이터:', analysisInput);
    Utils.saveSession('analysisInput', analysisInput);
    startLoading(analysisInput);
  });

  // ── Loading Animation & API Call ──
  function startLoading(input) {
    var overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');

    var steps = document.querySelectorAll('.loading-step');
    var current = 0;
    var delays = [800, 1200, 1000, 1500];

    // API Base URL 가져오기
    var apiBaseUrl = window.API_CONFIG ? window.API_CONFIG.API_BASE_URL : 
                     (window.location.protocol + '//' + window.location.hostname + ':3000');

    function nextStep() {
      if (current > 0) {
        steps[current - 1].classList.remove('active');
        steps[current - 1].classList.add('done');
        steps[current - 1].querySelector('i').className = 'fa-solid fa-circle-check';
      }
      if (current < steps.length) {
        steps[current].classList.add('active');
        current++;
        setTimeout(nextStep, delays[current - 1]);
      } else {
        // 실제 백엔드 API 호출
        callAnalyzeAPI(input, apiBaseUrl);
      }
    }
    nextStep();
  }

  // ── 실제 백엔드 API 호출 ──
  function callAnalyzeAPI(input, apiBaseUrl) {
    console.log('[분석 실행] API 호출 시작:', apiBaseUrl);
    
    fetch(apiBaseUrl + '/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('분석 요청 실패: ' + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      console.log('[분석 실행] 분석 ID 받음:', data.analysisId);
      
      // 분석 결과를 폴링하여 가져오기
      pollAnalysisResult(data.analysisId, apiBaseUrl);
    })
    .catch(function(error) {
      console.error('[분석 실행] 오류:', error);
      
      // 오류 메시지 표시
      var overlay = document.getElementById('loadingOverlay');
      var errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.style.cssText = 'text-align:center; color:#f87171; margin-top:2rem; padding:1rem; background:rgba(248,113,113,0.1); border-radius:8px;';
      errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> 분석 실행 중 오류가 발생했습니다.<br>' + 
                           '<span style="font-size:0.85rem; margin-top:0.5rem; display:block;">' + error.message + '</span>';
      
      var stepsContainer = document.getElementById('loadingSteps');
      stepsContainer.appendChild(errorMsg);
      
      // 3초 후 오버레이 닫기
      setTimeout(function() {
        overlay.classList.remove('active');
        errorMsg.remove();
      }, 3000);
    });
  }

  // ── 분석 결과 폴링 ──
  function pollAnalysisResult(analysisId, apiBaseUrl) {
    var maxAttempts = 30; // 최대 30번 시도 (약 30초)
    var attempt = 0;
    var pollInterval = 1000; // 1초마다 확인

    function poll() {
      attempt++;
      console.log('[분석 실행] 결과 확인 시도', attempt + '/' + maxAttempts);

      fetch(apiBaseUrl + '/api/result/' + analysisId)
        .then(function(response) {
          if (!response.ok) {
            throw new Error('결과 조회 실패: ' + response.status);
          }
          return response.json();
        })
        .then(function(data) {
          if (data.status === 'completed' && data.result) {
            console.log('[분석 실행] 분석 완료!');
            
            // 결과 저장
            Utils.saveSession('analysisResult', data.result);
            Utils.saveSession('analysisId', analysisId);
            
            // 대시보드로 이동
            setTimeout(function() {
              window.location.href = '../dashboard/';
            }, 500);
          } else if (data.status === 'failed') {
            throw new Error('분석 실패: ' + (data.error || '알 수 없는 오류'));
          } else {
            // 아직 진행 중
            if (attempt < maxAttempts) {
              setTimeout(poll, pollInterval);
            } else {
              throw new Error('분석 시간 초과 (30초)');
            }
          }
        })
        .catch(function(error) {
          console.error('[분석 실행] 폴링 오류:', error);
          
          if (attempt < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            // 최종 오류 처리
            var overlay = document.getElementById('loadingOverlay');
            var errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.style.cssText = 'text-align:center; color:#f87171; margin-top:2rem; padding:1rem; background:rgba(248,113,113,0.1); border-radius:8px;';
            errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> 분석 결과를 가져오는 중 오류가 발생했습니다.<br>' + 
                                 '<span style="font-size:0.85rem; margin-top:0.5rem; display:block;">' + error.message + '</span>';
            
            var stepsContainer = document.getElementById('loadingSteps');
            stepsContainer.appendChild(errorMsg);
            
            setTimeout(function() {
              overlay.classList.remove('active');
              errorMsg.remove();
            }, 3000);
          }
        });
    }

    poll();
  }

  // ── Header Scroll ──
  window.addEventListener('scroll', function () {
    var header = document.getElementById('header');
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  });

  // ── Manual Address Input (fallback) ──
  var btnManual = document.getElementById('btnManualAddress');
  var inputManual = document.getElementById('manualAddress');
  if (btnManual) {
    function applyManualAddress() {
      var addr = inputManual.value.trim();
      if (!addr) return;
      selectedLocation = { lat: 37.5665, lng: 126.9780, address: addr };
      document.getElementById('addressText').textContent = addr;
      document.getElementById('addressBar').style.display = 'flex';
      showMockCards();
      validateForm();
    }
    btnManual.addEventListener('click', applyManualAddress);
    inputManual.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') applyManualAddress();
    });
  }

  // ── Init ──
  prefillFromPrevious();
  initMap();
})();
