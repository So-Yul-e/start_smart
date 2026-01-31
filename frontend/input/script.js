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
      document.getElementById('mapContainer').classList.add('fallback-mode');
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

  // ── Capture: html2canvas helpers ──

  /**
   * Capture a single DOM element to JPEG Blob via html2canvas.
   * Handles WebGL canvas (Kakao Maps) by manually copying via drawImage in onclone.
   */
  function captureElement(el, cb) {
    if (typeof html2canvas === 'undefined') {
      console.warn('html2canvas not loaded, skipping capture');
      return cb(null);
    }
    html2canvas(el, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      onclone: function (clonedDoc) {
        // Copy WebGL / hardware-accelerated canvases that html2canvas can't read
        var origCanvases = el.querySelectorAll('canvas');
        var clonedEl = clonedDoc.getElementById(el.id) || clonedDoc.querySelector('[data-capture="' + el.id + '"]');
        if (!clonedEl) return;
        var clonedCanvases = clonedEl.querySelectorAll('canvas');
        for (var i = 0; i < origCanvases.length; i++) {
          try {
            clonedCanvases[i].width = origCanvases[i].width;
            clonedCanvases[i].height = origCanvases[i].height;
            var ctx = clonedCanvases[i].getContext('2d');
            ctx.drawImage(origCanvases[i], 0, 0);
          } catch (e) {
            console.warn('Canvas copy failed:', e);
          }
        }
      }
    }).then(function (canvas) {
      canvas.toBlob(function (blob) {
        cb(blob);
      }, 'image/jpeg', 0.85);
    }).catch(function (err) {
      console.warn('html2canvas capture failed:', err);
      cb(null);
    });
  }

  /**
   * Orchestrate capture of roadview + map images.
   * Skips captures that aren't available (fallback states).
   * cb(roadviewBlob, roadmapBlob)
   */
  function captureAllImages(cb) {
    var roadviewBlob = null;
    var roadmapBlob = null;
    var done = 0;
    var total = 0;

    var isFallbackMode = document.getElementById('mapContainer').classList.contains('fallback-mode');
    var roadviewHidden = document.getElementById('roadviewFallback').style.display !== 'none';

    // Determine what to capture
    var captureRoadview = !isFallbackMode && !roadviewHidden && roadview;
    var captureMap = !isFallbackMode && mapLoaded;

    if (!captureRoadview && !captureMap) {
      console.log('Capture: nothing to capture (fallback mode)');
      return cb(null, null);
    }

    function checkDone() {
      done++;
      if (done >= total) {
        cb(roadviewBlob, roadmapBlob);
      }
    }

    if (captureRoadview) {
      total++;
      var rvEl = document.getElementById('roadviewPreview');
      captureElement(rvEl, function (blob) {
        roadviewBlob = blob;
        console.log('Capture roadview:', blob ? (blob.size + ' bytes') : 'skipped');
        checkDone();
      });
    }

    if (captureMap) {
      total++;
      var mapEl = document.getElementById('mapContainer');
      captureElement(mapEl, function (blob) {
        roadmapBlob = blob;
        console.log('Capture map:', blob ? (blob.size + ' bytes') : 'skipped');
        checkDone();
      });
    }
  }

  /**
   * Fallback to mock data when backend is unavailable.
   */
  function fallbackToMock(input) {
    console.log('Falling back to mock data');
    var result = MockData.generateResult(input);
    Utils.saveSession('analysisResult', result);
    window.location.href = '../dashboard/';
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
      brand.name + ' 평균 판매량 + 상권 분석 기반 AI 추정치 — 클릭하여 선택';

    document.getElementById('scenarioCards').innerHTML =
      '<div class="scenario-card" data-sales="' + conservative + '">' +
      '<div class="label">보수적</div>' +
      '<div class="value">' + conservative + '</div>' +
      '<div class="unit">잔/일</div>' +
      '</div>' +
      '<div class="scenario-card highlight" data-sales="' + expected + '">' +
      '<div class="label">기대치</div>' +
      '<div class="value">' + expected + '</div>' +
      '<div class="unit">잔/일</div>' +
      '</div>' +
      '<div class="scenario-card" data-sales="' + optimistic + '">' +
      '<div class="label">낙관적</div>' +
      '<div class="value">' + optimistic + '</div>' +
      '<div class="unit">잔/일</div>' +
      '</div>';

    // Click to select scenario
    var cards = document.querySelectorAll('#scenarioCards .scenario-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('click', function () {
        for (var j = 0; j < cards.length; j++) {
          cards[j].classList.remove('highlight');
        }
        this.classList.add('highlight');
        inputDailySales.value = this.getAttribute('data-sales');
        updateSalesHint();
        validateForm();
      });
    }

    // Set default value
    if (!inputDailySales.value) {
      inputDailySales.value = expected;
    }
    updateSalesHint();
    validateForm();
  }

  // ── Sales Hint — sync highlight with input value ──
  function updateSalesHint() {
    var hint = document.getElementById('salesHint');
    if (!hint) return;
    var val = parseInt(inputDailySales.value);
    if (!val) {
      hint.textContent = '잔/일';
      return;
    }
    var cards = document.querySelectorAll('#scenarioCards .scenario-card');
    if (cards.length === 0) {
      hint.textContent = '잔/일';
      return;
    }
    var matched = false;
    for (var i = 0; i < cards.length; i++) {
      if (parseInt(cards[i].getAttribute('data-sales')) === val) {
        var label = cards[i].querySelector('.label').textContent;
        hint.textContent = '잔/일 — AI ' + label + ' 기준';
        cards[i].classList.add('highlight');
        matched = true;
      } else {
        cards[i].classList.remove('highlight');
      }
    }
    if (!matched) {
      hint.textContent = '잔/일 — 직접 입력';
    }
  }

  // ── Form Validation ──
  function validateForm() {
    var hasLocation = !!selectedLocation;
    var hasInvestment = inputInvestment.value && parseInt(inputInvestment.value) > 0;
    var hasRent = inputRent.value && parseInt(inputRent.value) > 0;
    var hasArea = inputArea.value && parseInt(inputArea.value) > 0;
    var hasSales = inputDailySales.value && parseInt(inputDailySales.value) > 0;

    btnAnalyze.disabled = !(hasLocation && hasInvestment && hasRent && hasArea && hasSales);
  }

  [inputInvestment, inputRent, inputArea, inputDailySales].forEach(function (el) {
    el.addEventListener('input', validateForm);
  });

  inputDailySales.addEventListener('input', updateSalesHint);

  // ── Analysis Execution ──
  btnAnalyze.addEventListener('click', function () {
    if (btnAnalyze.disabled) return;

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

    Utils.saveSession('analysisInput', analysisInput);
    startLoading(analysisInput);
  });

  // ── Loading Animation ──
  function startLoading(input) {
    var overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');

    var steps = document.querySelectorAll('.loading-step');
    var current = 0;
    // 5 steps: capture(0), data(1), simulation(2), roadview AI(3), consulting(4)
    var delays = [600, 800, 1200, 1000, 1500];
    var animationDone = false;
    var apiDone = false;
    var apiResult = null;
    var apiFailed = false;

    function markStep(idx) {
      if (idx >= 0 && idx < steps.length) {
        steps[idx].classList.remove('active');
        steps[idx].classList.add('done');
        steps[idx].querySelector('i').className = 'fa-solid fa-circle-check';
      }
    }

    function nextStep() {
      if (current > 0) markStep(current - 1);
      if (current < steps.length) {
        steps[current].classList.add('active');
        current++;
        setTimeout(nextStep, delays[current - 1]);
      } else {
        animationDone = true;
        tryNavigate();
      }
    }

    function tryNavigate() {
      if (!animationDone || !apiDone) return;
      setTimeout(function () {
        window.location.href = '../dashboard/';
      }, 400);
    }

    // Start animation
    nextStep();

    // Start capture → API flow
    captureAllImages(function (roadviewBlob, roadmapBlob) {
      var formData = new FormData();
      formData.append('data', JSON.stringify(input));
      if (roadviewBlob) formData.append('roadview', roadviewBlob, 'roadview.jpg');
      if (roadmapBlob) formData.append('roadmap', roadmapBlob, 'roadmap.jpg');

      // Attempt backend API call with timeout
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timeoutId = setTimeout(function () {
        if (controller) controller.abort();
        console.warn('API timeout, falling back to mock');
        if (!apiDone) {
          apiDone = true;
          fallbackToMock(input);
        }
      }, 15000);

      var fetchOptions = {
        method: 'POST',
        body: formData
      };
      if (controller) fetchOptions.signal = controller.signal;

      fetch('/api/analyze', fetchOptions)
        .then(function (res) {
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error('API returned ' + res.status);
          return res.json();
        })
        .then(function (data) {
          console.log('API success:', data);
          // If backend returns a full result, use it; otherwise mock
          if (data.result) {
            Utils.saveSession('analysisResult', data.result);
          } else {
            var result = MockData.generateResult(input);
            Utils.saveSession('analysisResult', result);
          }
          apiDone = true;
          tryNavigate();
        })
        .catch(function (err) {
          clearTimeout(timeoutId);
          console.warn('API failed:', err.message);
          if (!apiDone) {
            apiDone = true;
            var result = MockData.generateResult(input);
            Utils.saveSession('analysisResult', result);
            tryNavigate();
          }
        });
    });
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
