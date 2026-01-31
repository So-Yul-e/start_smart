/**
 * Input Page - Kakao Map (입지 선택) + Form Pre-fill + Loading Animation
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
  var kakaoRoadview = null; // 카카오 로드뷰 객체
  var kakaoRoadviewClient = null; // 카카오 로드뷰 클라이언트
  var capturedRoadviewImage = null; // 캡처한 로드뷰 이미지 (base64)
  var capturedMapImage = null; // 캡처한 지도 이미지 (base64)
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
  
  // 선택 입력 필드
  var btnAddLoan = document.getElementById('btnAddLoan');
  var loansContainer = document.getElementById('loansContainer');
  var loansEmpty = document.getElementById('loansEmpty');
  var btnToggleExitPlan = document.getElementById('btnToggleExitPlan');
  var exitPlanContainer = document.getElementById('exitPlanContainer');
  var inputKeyMoney = document.getElementById('inputKeyMoney');
  var inputDemolitionBase = document.getElementById('inputDemolitionBase');
  var inputDemolitionPerPyeong = document.getElementById('inputDemolitionPerPyeong');
  var inputWorkingCapital = document.getElementById('inputWorkingCapital');
  
  var loans = []; // 대출 정보 배열
  var exitPlanExpanded = false; // Exit Plan 섹션 펼침 상태

  // ── Brand Check ──
  if (!brand) {
    brandDisplay.textContent = '브랜드를 먼저 선택해주세요';
    brandDisplay.style.color = '#f87171';
  } else {
    brandDisplay.textContent = brand.name;
    investHint.textContent = '브랜드 기준 초기투자: ' + Utils.formatKRW(brand.initialInvestment);
    inputInvestment.placeholder = Math.round(brand.initialInvestment / 10000);
    // 브랜드가 있으면 AI 판매량 제안 표시
    showScenario();
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
      
      // 대출 정보 복원
      if (prevInput.conditions.loans && Array.isArray(prevInput.conditions.loans)) {
        loans = prevInput.conditions.loans.map(function(loan, index) {
          return {
            id: 'loan_' + Date.now() + '_' + index,
            principal: Math.round(loan.principal / 10000).toString(),
            apr: (loan.apr * 100).toString(),
            termMonths: loan.termMonths.toString(),
            repaymentType: loan.repaymentType || 'equal_payment'
          };
        });
        renderLoans();
      }
      
      // Exit Plan 정보 복원
      if (prevInput.conditions.exitInputs) {
        var exit = prevInput.conditions.exitInputs;
        if (exit.keyMoney) inputKeyMoney.value = Math.round(exit.keyMoney / 10000);
        if (exit.demolitionBase) inputDemolitionBase.value = Math.round(exit.demolitionBase / 10000);
        if (exit.demolitionPerPyeong) inputDemolitionPerPyeong.value = Math.round(exit.demolitionPerPyeong / 10000);
        if (exit.workingCapital) inputWorkingCapital.value = Math.round(exit.workingCapital / 10000);
        if (exit.pyeong) inputArea.value = exit.pyeong;
        // Exit Plan이 있으면 자동으로 펼치기
        exitPlanExpanded = true;
        exitPlanContainer.style.display = 'block';
        btnToggleExitPlan.innerHTML = '<i class="fa-solid fa-chevron-up" style="margin-right:0.3rem;"></i> 접기';
      }
    }
    // 이전 분석의 목표 판매량은 showScenario에서 처리 (기본값은 기대치)
    // prevInput.targetDailySales는 showScenario에서 확인하여 일치하는 카드 선택
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
    console.log('[initMap] 함수 호출됨, kakao 객체:', typeof kakao, 'kakaoMapLoaded:', window.kakaoMapLoaded);
    
    try {
      // 카카오맵 SDK가 로드되었는지 확인
      if (window.kakaoMapLoaded && typeof kakao !== 'undefined' && kakao.maps && kakao.maps.Map) {
        console.log('[initMap] 카카오맵 SDK 로드 완료, 지도 초기화 시작');
        // SDK가 이미 로드된 경우 바로 지도 생성
        createKakaoMap();
      } else {
        console.warn('[initMap] 카카오맵 SDK가 아직 로드되지 않았습니다. 콜백으로 등록합니다.');
        // SDK가 아직 로드되지 않았으면 콜백으로 등록
        window.initMapCallback = function() {
          console.log('[initMap] 콜백 실행됨');
          createKakaoMap();
        };
        // 최대 10초 대기
        if (!window.kakaoMapRetryTimeout) {
          window.kakaoMapRetryTimeout = setTimeout(function() {
            if (!window.kakaoMapLoaded) {
              console.error('[initMap] 카카오맵 SDK 로드 실패 (타임아웃)');
              var mapEl = document.getElementById('map');
              var fallbackEl = document.getElementById('mapFallback');
              if (mapEl) mapEl.style.display = 'none';
              if (fallbackEl) fallbackEl.style.display = 'flex';
            }
          }, 10000);
        }
        return;
      }
    } catch (e) {
      console.error('[initMap] 오류 발생:', e);
      var mapEl = document.getElementById('map');
      var fallbackEl = document.getElementById('mapFallback');
      if (mapEl) mapEl.style.display = 'none';
      if (fallbackEl) fallbackEl.style.display = 'flex';
    }
  }

  // 실제 지도 생성 함수
  function createKakaoMap() {
    try {
      console.log('[createKakaoMap] 지도 생성 시작');
      
      // kakao 객체 최종 확인
      if (typeof kakao === 'undefined' || !kakao.maps || !kakao.maps.Map) {
        console.error('[createKakaoMap] kakao.maps.Map이 없습니다. SDK가 완전히 로드되지 않았습니다.');
        var mapEl = document.getElementById('map');
        var fallbackEl = document.getElementById('mapFallback');
        if (mapEl) mapEl.style.display = 'none';
        if (fallbackEl) fallbackEl.style.display = 'flex';
        return;
      }
      
      var centerLat = 37.5665;
      var centerLng = 126.9780;

      // Restore previous location center
      if (prevInput && prevInput.location) {
        centerLat = prevInput.location.lat;
        centerLng = prevInput.location.lng;
      }

      var container = document.getElementById('map');
      if (!container) {
        console.error('[createKakaoMap] 지도 컨테이너를 찾을 수 없습니다.');
        return;
      }
      
      // 지도 컨테이너가 숨겨져 있으면 표시
      if (container.style.display === 'none') {
        container.style.display = 'block';
      }
      
      // 높이가 설정되지 않았으면 기본 높이 설정
      if (!container.style.height || container.style.height === '0px' || container.style.height === '') {
        container.style.height = '400px';
      }
      
      // 부모 컨테이너도 확인
      var mapContainer = document.getElementById('mapContainer');
      if (mapContainer && mapContainer.style.display === 'none') {
        mapContainer.style.display = 'block';
      }
      
      console.log('[createKakaoMap] 컨테이너 확인:', {
        exists: !!container,
        display: container.style.display,
        height: container.style.height,
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight,
        parentDisplay: mapContainer ? mapContainer.style.display : 'N/A'
      });
      
      var options = {
        center: new kakao.maps.LatLng(centerLat, centerLng),
        level: 5
      };
      
      console.log('[createKakaoMap] 지도 옵션:', options);
      map = new kakao.maps.Map(container, options);
      geocoder = new kakao.maps.services.Geocoder();
      mapLoaded = true;
      
      console.log('[createKakaoMap] 지도 생성 완료, map 객체:', !!map);

      // 카카오 로드뷰는 showRoadview에서 초기화됨

      // Restore previous pin
      if (prevInput && prevInput.location) {
        var prevLatlng = new kakao.maps.LatLng(prevInput.location.lat, prevInput.location.lng);
        placeMarker(prevLatlng);
        selectedLocation = prevInput.location;
        if (selectedLocation.address) {
          document.getElementById('addressText').textContent = selectedLocation.address;
          document.getElementById('addressBar').style.display = 'flex';
        }
        // showMockCards(); // 목업 데이터 제거
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
    } catch (e) {
      console.error('[createKakaoMap] 오류:', e);
      document.getElementById('map').style.display = 'none';
      document.getElementById('mapFallback').style.display = 'flex';
      // Still allow pre-fill to work without map
      if (prevInput && prevInput.location) {
        selectedLocation = prevInput.location;
        if (selectedLocation.address) {
          document.getElementById('addressText').textContent = selectedLocation.address;
          document.getElementById('addressBar').style.display = 'flex';
        }
        // showMockCards(); // 목업 데이터 제거
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

    captureMapImage();
    // showMockCards(); // 목업 데이터 제거
    showScenario(); // 시나리오만 표시
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

  // ── 카카오 로드뷰 (캡처용) ──
  function showRoadview(latlng) {
    var lat = latlng.getLat ? latlng.getLat() : latlng.lat;
    var lng = latlng.getLng ? latlng.getLng() : latlng.lng;
    var rvContainer = document.getElementById('roadview');
    var fallback = document.getElementById('roadviewFallback');
    var roadviewCard = document.getElementById('roadviewCard');

    // 로드뷰 카드 표시
    if (roadviewCard) {
      roadviewCard.style.display = 'block';
    }

    // 카카오 로드뷰 초기화
    if (!kakaoRoadview && typeof kakao !== 'undefined' && kakao.maps && kakao.maps.Roadview) {
      try {
        kakaoRoadview = new kakao.maps.Roadview(rvContainer);
        kakaoRoadviewClient = new kakao.maps.RoadviewClient();
        
        // 로드뷰 초기화 완료 이벤트
        kakao.maps.event.addListener(kakaoRoadview, 'init', function() {
          console.log('[카카오 로드뷰] 초기화 완료');
          // 로드뷰 이미지 캡처 시도
          captureRoadviewImage();
        });
      } catch (e) {
        console.warn('[카카오 로드뷰] 초기화 실패:', e);
        if (fallback) fallback.style.display = 'flex';
        return;
      }
    }

    // 파노라마 ID 조회 및 로드뷰 표시
    if (kakaoRoadviewClient) {
      var position = new kakao.maps.LatLng(lat, lng);
      kakaoRoadviewClient.getNearestPanoId(position, 50, function(panoId) {
        if (panoId === null) {
          console.warn('[카카오 로드뷰] 해당 위치에 로드뷰가 없습니다.');
          if (fallback) fallback.style.display = 'flex';
          capturedRoadviewImage = null;
          return;
        }
        
        if (fallback) fallback.style.display = 'none';
        kakaoRoadview.setPanoId(panoId, 0);
        
        // 로드뷰 로드 완료 후 캡처
        setTimeout(function() {
          captureRoadviewImage();
        }, 1500); // 로드뷰 렌더링 대기 (시간 약간 증가)
      });
    } else {
      console.warn('[카카오 로드뷰] 클라이언트가 초기화되지 않았습니다.');
      if (fallback) fallback.style.display = 'flex';
    }
  }

  // ── 로드뷰 이미지 캡처 ──
  // 카카오 로드뷰에서 캡처한 이미지를 백엔드로 전송하여 AI 분석 수행
  function captureRoadviewImage() {
    if (!kakaoRoadview) {
      return;
    }

    try {
      var rvContainer = document.getElementById('roadview');
      if (!rvContainer) {
        return;
      }

      // html2canvas를 사용하여 캡처 (동적 로드)
      if (typeof html2canvas === 'undefined') {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = function() {
          captureRoadviewImage();
        };
        script.onerror = function() {
          console.warn('[로드뷰 캡처] html2canvas 로드 실패');
        };
        document.head.appendChild(script);
        return;
      }

      // 캡처 실행
      // allowTaint: true로 설정하여 CORS 에러가 있어도 캡처 시도
      // 브라우저 콘솔에 CORS 경고가 나타날 수 있지만, 캡처는 가능합니다
      html2canvas(rvContainer, {
        useCORS: false, // CORS 사용 안 함 (외부 이미지 포함 시 tainted canvas 허용)
        allowTaint: true, // tainted canvas 허용 (CORS 에러 무시)
        scale: 0.8, // 이미지 크기 축소 (네트워크 부하 감소)
        logging: false, // html2canvas 로그 비활성화
        backgroundColor: null // 투명 배경
      }).then(function(canvas) {
        // Canvas를 Blob으로 변환
        // tainted canvas는 toBlob은 가능하지만, getImageData는 제한될 수 있음
        canvas.toBlob(function(blob) {
          if (!blob) {
            console.warn('[로드뷰 캡처] Blob 변환 실패');
            return;
          }

          // Blob을 base64로 변환
          var reader = new FileReader();
          reader.onloadend = function() {
            var base64data = reader.result;
            capturedRoadviewImage = base64data;
            console.log('[로드뷰 캡처] 완료, 크기:', (base64data.length / 1024).toFixed(2) + 'KB');
          };
          reader.onerror = function() {
            console.warn('[로드뷰 캡처] Base64 변환 실패');
          };
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.85); // JPEG, 품질 85%
      }).catch(function(error) {
        // CORS 에러는 브라우저 콘솔에 표시되지만, 캡처는 계속 시도됨
        console.warn('[로드뷰 캡처] 캡처 중 오류 (무시 가능):', error.message);
      });
    } catch (e) {
      console.warn('[로드뷰 캡처] 예외 발생:', e.message);
    }
  }

  // ── 지도 정적 이미지 캡처 (StaticMap URL 추출) ──
  function captureMapImage() {
    if (!selectedLocation) return;

    var lat = selectedLocation.lat;
    var lng = selectedLocation.lng;

    var staticContainer = document.createElement('div');
    staticContainer.style.cssText = 'width:600px;height:400px;position:absolute;left:-9999px;top:-9999px;';
    document.body.appendChild(staticContainer);

    try {
      var staticMap = new kakao.maps.StaticMap(staticContainer, {
        center: new kakao.maps.LatLng(lat, lng),
        level: 5,
        marker: {
          position: new kakao.maps.LatLng(lat, lng)
        }
      });

      // StaticMap이 생성한 img src URL을 직접 저장 (CORS 우회)
      setTimeout(function() {
        try {
          var img = staticContainer.querySelector('img');
          if (img && img.src) {
            capturedMapImage = img.src;
            console.log('[지도 캡처] 완료 (URL 방식):', capturedMapImage.substring(0, 80) + '...');
          } else {
            console.warn('[지도 캡처] StaticMap img 태그를 찾을 수 없습니다.');
          }
        } catch (e) {
          console.error('[지도 캡처] URL 추출 오류:', e);
        }
        document.body.removeChild(staticContainer);
      }, 1500);
    } catch (e) {
      console.error('[지도 캡처] StaticMap 생성 오류:', e);
      document.body.removeChild(staticContainer);
    }
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

  // ── Mock Cards (로드뷰) ──
  // 목업 데이터 제거: 실제 로드뷰 분석은 백엔드에서 처리되며, 결과는 대시보드에서 표시됨
  function showMockCards() {
    // 목업 데이터 표시 비활성화
    // 실제 로드뷰 분석 결과는 대시보드에서 표시됨
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
      '<div class="scenario-card" data-value="' + conservative + '" style="cursor:pointer;">' +
      '<div class="label">보수적</div>' +
      '<div class="value">' + conservative + '</div>' +
      '<div class="unit">잔/일</div>' +
      '</div>' +
      '<div class="scenario-card" data-value="' + expected + '" style="cursor:pointer;">' +
      '<div class="label">기대치</div>' +
      '<div class="value">' + expected + '</div>' +
      '<div class="unit">잔/일</div>' +
      '</div>' +
      '<div class="scenario-card" data-value="' + optimistic + '" style="cursor:pointer;">' +
      '<div class="label">낙관적</div>' +
      '<div class="value">' + optimistic + '</div>' +
      '<div class="unit">잔/일</div>' +
      '</div>';

    // 카드 클릭 이벤트 추가 (DOM 업데이트 후 실행)
    setTimeout(function() {
      var cards = document.querySelectorAll('.scenario-card');
      for (var i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', function() {
          var value = this.getAttribute('data-value');
          inputDailySales.value = value;
          validateForm();
          
          // 선택된 카드 하이라이트
          for (var j = 0; j < cards.length; j++) {
            cards[j].classList.remove('selected');
          }
          this.classList.add('selected');
        });
      }

      // 이전 분석의 목표 판매량 확인
      var prevTargetSales = prevInput && prevInput.targetDailySales ? prevInput.targetDailySales : null;
      
      // 기본값 설정: 이전 값이 없거나 0이면 기대치로 설정
      var currentValue = parseInt(inputDailySales.value) || 0;
      
      // 이전 분석 값이 있고, 카드 값 중 하나와 일치하면 사용, 아니면 기대치 사용
      if (prevTargetSales && prevTargetSales > 0) {
        // 이전 값이 카드 값 중 하나와 일치하는지 확인
        var matchesCard = false;
        for (var m = 0; m < cards.length; m++) {
          if (parseInt(cards[m].getAttribute('data-value')) === prevTargetSales) {
            matchesCard = true;
            break;
          }
        }
        if (matchesCard) {
          currentValue = prevTargetSales;
          inputDailySales.value = prevTargetSales;
        } else {
          // 이전 값이 카드 값과 일치하지 않으면 기대치 사용
          currentValue = expected;
          inputDailySales.value = expected;
        }
      } else {
        // 이전 값이 없으면 기대치 사용
        currentValue = expected;
        inputDailySales.value = expected;
      }
      
      // 입력값과 일치하는 카드를 기본 선택으로 표시
      var matched = false;
      for (var k = 0; k < cards.length; k++) {
        var cardValue = parseInt(cards[k].getAttribute('data-value'));
        if (cardValue === currentValue) {
          cards[k].classList.add('selected');
          matched = true;
          break;
        }
      }
      
      // 일치하는 카드가 없으면 기대치 카드(인덱스 1)를 기본 선택
      if (!matched && cards.length >= 2) {
        cards[1].classList.add('selected');
        inputDailySales.value = expected;
      }
    }, 0);
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
      console.error('[분석 실행] brand 객체:', brand);
      alert('브랜드를 먼저 선택해주세요.');
      window.location.href = '../brand/';
      return;
    }
    
    console.log('[분석 실행] 사용할 브랜드 ID:', brand.id);

    if (!selectedLocation) {
      console.error('[분석 실행] 위치가 선택되지 않았습니다.');
      alert('지도를 클릭하여 위치를 선택해주세요.');
      return;
    }

    // 대출 정보를 API 형식으로 변환 (원 단위, apr는 0-1 범위)
    var formattedLoans = [];
    if (loans && loans.length > 0) {
      formattedLoans = loans
        .filter(function(loan) {
          // 유효한 대출만 포함 (원금, 이자율, 기간이 모두 입력된 경우)
          var principal = parseInt(loan.principal);
          var apr = parseFloat(loan.apr);
          var termMonths = parseInt(loan.termMonths);
          return principal > 0 && apr > 0 && apr <= 100 && termMonths > 0;
        })
        .map(function(loan) {
          return {
            principal: parseInt(loan.principal) * 10000, // 만원 → 원
            apr: parseFloat(loan.apr) / 100, // % → 0-1 범위
            termMonths: parseInt(loan.termMonths),
            repaymentType: loan.repaymentType || 'equal_payment'
          };
        });
    }

    // Exit Plan 입력값을 API 형식으로 변환 (원 단위)
    var exitInputs = null;
    if (exitPlanExpanded && inputKeyMoney && inputDemolitionBase && inputDemolitionPerPyeong) {
      // 실제로 값이 입력되었는지 확인 (하나라도 입력되면 exitInputs 생성)
      var hasKeyMoney = inputKeyMoney.value && parseInt(inputKeyMoney.value) > 0;
      var hasDemolitionBase = inputDemolitionBase.value && parseInt(inputDemolitionBase.value) > 0;
      var hasDemolitionPerPyeong = inputDemolitionPerPyeong.value && parseInt(inputDemolitionPerPyeong.value) > 0;
      var hasWorkingCapital = inputWorkingCapital.value && parseInt(inputWorkingCapital.value) > 0;
      
      if (hasKeyMoney || hasDemolitionBase || hasDemolitionPerPyeong || hasWorkingCapital) {
        exitInputs = {
          keyMoney: (inputKeyMoney.value ? parseInt(inputKeyMoney.value) * 10000 : 0),
          pyeong: parseInt(inputArea.value) || 10,
          demolitionBase: (inputDemolitionBase.value ? parseInt(inputDemolitionBase.value) * 10000 : 15000000),
          demolitionPerPyeong: (inputDemolitionPerPyeong.value ? parseInt(inputDemolitionPerPyeong.value) * 10000 : 1000000),
          workingCapital: (inputWorkingCapital.value ? parseInt(inputWorkingCapital.value) * 10000 : 0)
        };
      }
    }

    var conditions = {
      initialInvestment: parseInt(inputInvestment.value) * 10000,
      monthlyRent: parseInt(inputRent.value) * 10000,
      area: parseInt(inputArea.value),
      ownerWorking: inputOwnerWork.checked
    };

    // 대출 정보가 있으면 conditions에 추가
    if (formattedLoans.length > 0) {
      conditions.loans = formattedLoans;
    }

    // Exit Plan 입력값이 있으면 conditions에 추가
    if (exitInputs) {
      conditions.exitInputs = exitInputs;
    }

    var analysisInput = {
      brandId: brand.id,
      location: selectedLocation,
      radius: selectedRadius,
      conditions: conditions,
      targetDailySales: parseInt(inputDailySales.value),
      mapImage: capturedMapImage || null,
      roadviewImage: capturedRoadviewImage || null
    };

    console.log('[분석 실행] 분석 입력 데이터:', analysisInput);
    Utils.saveSession('analysisInput', analysisInput);

    // 백엔드 전송용: 이미지 데이터 제외 (세션에만 저장)
    var apiInput = {};
    for (var key in analysisInput) {
      if (key !== 'mapImage' && key !== 'roadviewImage') apiInput[key] = analysisInput[key];
    }
    startLoading(apiInput);
  });

  // ── Loading Animation & API Call ──
  function startLoading(input) {
    // 지도 컨테이너 숨기기
    document.getElementById('mapContainer').style.display = 'none';
    // 입력 폼 섹션 숨기기
    var pageWrapper = document.querySelector('.page-wrapper');
    if (pageWrapper) pageWrapper.style.display = 'none';

    // 로딩 오버레이 표시
    var overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');

    // API Base URL 가져오기
    var apiBaseUrl = window.API_CONFIG ? window.API_CONFIG.API_BASE_URL : 'http://localhost:3000';

    // 더미 애니메이션 제거 - 바로 API 호출로 실제 진행 상태 추적
    console.log('[분석 실행] 실시간 프로그레스 모드로 API 호출 시작');
    
    // 첫 번째 단계 활성화
    var steps = document.querySelectorAll('.loading-step');
    if (steps.length > 0) {
      steps[0].classList.add('active');
    }
    
    // 실제 백엔드 API 호출
    callAnalyzeAPI(input, apiBaseUrl);
  }

  // ── 실제 백엔드 API 호출 ──
  function callAnalyzeAPI(input, apiBaseUrl) {
    console.log('[분석 실행] API 호출 시작:', apiBaseUrl);
    
    // 로드뷰 이미지가 캡처되었는지 확인
    if (capturedRoadviewImage) {
      console.log('[분석 실행] 로드뷰 이미지 캡처됨, 로드뷰 분석 먼저 진행');
      // 로드뷰 분석 먼저 진행
      sendRoadviewAnalysis(input, apiBaseUrl).then(function(roadviewResult) {
        // 로드뷰 분석 완료 후 일반 분석 진행
        sendAnalyzeRequest(input, apiBaseUrl, roadviewResult);
      }).catch(function(error) {
        console.warn('[분석 실행] 로드뷰 분석 실패, 기본 분석 진행:', error);
        // 로드뷰 분석 실패해도 일반 분석은 진행
        sendAnalyzeRequest(input, apiBaseUrl, null);
      });
    } else {
      console.log('[분석 실행] 로드뷰 이미지 없음, 기본 분석 진행');
      // 로드뷰 없이 분석 진행
      sendAnalyzeRequest(input, apiBaseUrl, null);
    }
  }

  // ── 로드뷰 분석 API 호출 ──
  function sendRoadviewAnalysis(input, apiBaseUrl) {
    return new Promise(function(resolve, reject) {
      // base64를 Blob으로 변환
      var base64Data = capturedRoadviewImage.split(',')[1]; // data:image/jpeg;base64, 제거
      var byteCharacters = atob(base64Data);
      var byteNumbers = new Array(byteCharacters.length);
      for (var i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      var byteArray = new Uint8Array(byteNumbers);
      var blob = new Blob([byteArray], { type: 'image/jpeg' });

      // FormData 생성
      var formData = new FormData();
      formData.append('address', input.location.address || '');
      formData.append('lat', input.location.lat.toString());
      formData.append('lng', input.location.lng.toString());
      formData.append('roadview', blob, 'roadview.jpg');

      // 로드뷰 분석 API 호출
      fetch(apiBaseUrl + '/api/roadview/analyze', {
        method: 'POST',
        body: formData
      })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('로드뷰 분석 실패: ' + response.status);
        }
        return response.json();
      })
      .then(function(roadviewResult) {
        console.log('[분석 실행] 로드뷰 분석 완료:', roadviewResult);
        resolve(roadviewResult);
      })
      .catch(function(error) {
        console.error('[분석 실행] 로드뷰 분석 오류:', error);
        reject(error);
      });
    });
  }

  // ── 일반 분석 요청 (로드뷰 결과 포함) ──
  function sendAnalyzeRequest(input, apiBaseUrl, roadviewAnalysis) {
    // 로드뷰 분석 결과가 있으면 input에 추가 (백엔드에서 사용)
    if (roadviewAnalysis && roadviewAnalysis.success && roadviewAnalysis.results && roadviewAnalysis.results.roadview) {
      // 백엔드 orchestrator에서 로드뷰 분석 결과를 사용하도록 함
      input.roadviewAnalysis = roadviewAnalysis.results.roadview;
      console.log('[분석 실행] 로드뷰 분석 결과를 백엔드에 전달할 준비 완료');
    }
    
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
      
      // 로드뷰 분석 결과가 있으면 세션에 저장 (리포트에서 사용)
      if (roadviewAnalysis && roadviewAnalysis.success) {
        Utils.saveSession('roadviewAnalysis', roadviewAnalysis);
      }
      
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
    var maxAttempts = 120; // 최대 120번 시도 (약 2분)
    var attempt = 0;
    var pollInterval = 1000; // 1초마다 확인
    var currentStep = 0; // 현재 표시 중인 단계

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
          console.log('[분석 실행] 응답 상태:', data.status, '결과 있음:', !!data.result);
          
          // progress 정보가 있으면 로딩 단계 업데이트
          if (data.progress && data.progress.step) {
            var step = data.progress.step;
            var message = data.progress.message || '';
            
            console.log('[분석 실행] Progress 업데이트:', step + '/' + data.progress.total, message);
            
            // 이전 단계들을 완료로 표시
            var steps = document.querySelectorAll('.loading-step');
            for (var i = 0; i < steps.length; i++) {
              if (i < step - 1) {
                steps[i].classList.remove('active');
                steps[i].classList.add('done');
                steps[i].querySelector('i').className = 'fa-solid fa-circle-check';
              } else if (i === step - 1) {
                steps[i].classList.add('active');
                steps[i].classList.remove('done');
                // 메시지 업데이트 (원래 텍스트 유지하거나 서버 메시지 사용)
                var textNode = steps[i].childNodes[steps[i].childNodes.length - 1];
                if (textNode && textNode.nodeType === Node.TEXT_NODE && message) {
                  // 기존 텍스트를 서버 메시지로 대체하지 않고, 진행률만 표시
                  // textNode.nodeValue = ' ' + message;
                }
              }
            }
            
            currentStep = step;
          }
          
          if (data.status === 'completed' && data.result) {
            console.log('[분석 실행] 분석 완료!');
            console.log('[분석 실행] 받은 결과 데이터:', data.result);
            console.log('[분석 실행] 결과 데이터 구조:', {
              hasId: !!data.result.id,
              hasBrand: !!data.result.brand,
              hasLocation: !!data.result.location,
              hasFinance: !!data.result.finance,
              hasDecision: !!data.result.decision,
              hasAiConsulting: !!data.result.aiConsulting,
              hasMarket: !!data.result.market,
              hasRoadview: !!data.result.roadview,
              resultKeys: Object.keys(data.result || {})
            });
            
            // 모든 단계를 완료로 표시
            var steps = document.querySelectorAll('.loading-step');
            for (var i = 0; i < steps.length; i++) {
              steps[i].classList.remove('active');
              steps[i].classList.add('done');
              steps[i].querySelector('i').className = 'fa-solid fa-circle-check';
            }
            
            // 결과 저장
            Utils.saveSession('analysisResult', data.result);
            Utils.saveSession('analysisId', analysisId);
            
            console.log('[분석 실행] 세션 저장 완료');
            
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
              throw new Error('분석 시간 초과 (2분). 서버 로그를 확인하세요.');
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
                                 '<span style="font-size:0.85rem; margin-top:0.5rem; display:block;">' + error.message + '</span>' +
                                 '<span style="font-size:0.75rem; margin-top:0.5rem; display:block; color:var(--text-muted);">분석 ID: ' + analysisId + '</span>';
            
            var stepsContainer = document.getElementById('loadingSteps');
            stepsContainer.appendChild(errorMsg);
            
            setTimeout(function() {
              overlay.classList.remove('active');
              errorMsg.remove();
            }, 5000);
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
      // showMockCards(); // 목업 데이터 제거
      showScenario(); // 시나리오만 표시
      validateForm();
    }
    btnManual.addEventListener('click', applyManualAddress);
    inputManual.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') applyManualAddress();
    });
  }

  // ── 대출 정보 관리 ──
  function addLoanItem() {
    var loanId = 'loan_' + Date.now();
    var loanItem = {
      id: loanId,
      principal: '',
      apr: '',
      termMonths: '',
      repaymentType: 'equal_payment'
    };
    loans.push(loanItem);
    renderLoans();
  }

  function removeLoanItem(loanId) {
    loans = loans.filter(function(loan) {
      return loan.id !== loanId;
    });
    renderLoans();
  }

  function renderLoans() {
    if (loans.length === 0) {
      loansContainer.style.display = 'none';
      loansEmpty.style.display = 'block';
      return;
    }

    loansContainer.style.display = 'block';
    loansEmpty.style.display = 'none';

    var html = '';
    for (var i = 0; i < loans.length; i++) {
      var loan = loans[i];
      html += '<div class="loan-item" data-loan-id="' + loan.id + '" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:var(--radius-sm); padding:1rem; margin-bottom:1rem;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">' +
        '<h4 style="margin:0; font-size:0.95rem; color:var(--text-main);">대출 ' + (i + 1) + '</h4>' +
        '<button type="button" class="btn-remove-loan" data-loan-id="' + loan.id + '" style="background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.3); color:#f87171; padding:0.3rem 0.6rem; border-radius:4px; font-size:0.8rem; cursor:pointer;">' +
        '<i class="fa-solid fa-trash" style="margin-right:0.3rem;"></i>삭제</button>' +
        '</div>' +
        '<div class="two-col">' +
        '<div class="field-group">' +
        '<label class="field-label">대출 원금 (만원)</label>' +
        '<input type="number" class="loan-principal field-input" data-loan-id="' + loan.id + '" placeholder="예: 20000" value="' + (loan.principal || '') + '">' +
        '</div>' +
        '<div class="field-group">' +
        '<label class="field-label">연 이자율 (%)</label>' +
        '<input type="number" class="loan-apr field-input" data-loan-id="' + loan.id + '" placeholder="예: 5" step="0.1" value="' + (loan.apr || '') + '">' +
        '</div>' +
        '</div>' +
        '<div class="two-col">' +
        '<div class="field-group">' +
        '<label class="field-label">대출 기간 (개월)</label>' +
        '<input type="number" class="loan-term field-input" data-loan-id="' + loan.id + '" placeholder="예: 60" value="' + (loan.termMonths || '') + '">' +
        '</div>' +
        '<div class="field-group">' +
        '<label class="field-label">상환 방식</label>' +
        '<select class="loan-repayment field-input" data-loan-id="' + loan.id + '">' +
        '<option value="equal_payment"' + (loan.repaymentType === 'equal_payment' ? ' selected' : '') + '>원리금 균등 상환</option>' +
        '<option value="equal_principal"' + (loan.repaymentType === 'equal_principal' ? ' selected' : '') + '>원금 균등 상환</option>' +
        '<option value="interest_only"' + (loan.repaymentType === 'interest_only' ? ' selected' : '') + '>이자만 상환</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>';
    }
    loansContainer.innerHTML = html;

    // 이벤트 리스너 추가
    loansContainer.querySelectorAll('.btn-remove-loan').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var loanId = this.getAttribute('data-loan-id');
        removeLoanItem(loanId);
      });
    });

    loansContainer.querySelectorAll('.loan-principal, .loan-apr, .loan-term, .loan-repayment').forEach(function(input) {
      input.addEventListener('input', function() {
        var loanId = this.getAttribute('data-loan-id');
        var loan = loans.find(function(l) { return l.id === loanId; });
        if (loan) {
          if (this.classList.contains('loan-principal')) {
            loan.principal = this.value;
          } else if (this.classList.contains('loan-apr')) {
            loan.apr = this.value;
          } else if (this.classList.contains('loan-term')) {
            loan.termMonths = this.value;
          } else if (this.classList.contains('loan-repayment')) {
            loan.repaymentType = this.value;
          }
        }
      });
    });
  }

  // Exit Plan 토글
  btnToggleExitPlan.addEventListener('click', function() {
    exitPlanExpanded = !exitPlanExpanded;
    if (exitPlanExpanded) {
      exitPlanContainer.style.display = 'block';
      btnToggleExitPlan.innerHTML = '<i class="fa-solid fa-chevron-up" style="margin-right:0.3rem;"></i> 접기';
    } else {
      exitPlanContainer.style.display = 'none';
      btnToggleExitPlan.innerHTML = '<i class="fa-solid fa-chevron-down" style="margin-right:0.3rem;"></i> 펼치기';
    }
  });

  // 대출 추가 버튼
  btnAddLoan.addEventListener('click', function() {
    addLoanItem();
  });

  // ── Init ──
  prefillFromPrevious();
  
  // window.onload 이벤트에서 initMap 호출 (원래 방식)
  window.onload = function() {
    console.log('[전역] window.load 이벤트 발생, initMap 호출');
    setTimeout(initMap, 500); // SDK 로드 대기
  };
  
  // DOMContentLoaded 이벤트도 처리
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initMap, 500);
    });
  } else {
    // 이미 로드된 경우
    setTimeout(initMap, 500);
  }
})();
