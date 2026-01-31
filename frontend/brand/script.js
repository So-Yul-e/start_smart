/**
 * Brand Selection Page - Dark Theme
 */
(function () {
  var grid = document.getElementById('brandGrid');
  var filterWrap = document.getElementById('filterWrap');
  var currentFilter = 'all';

  function formatMoney(n) {
    if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '억';
    if (n >= 10000) return Math.round(n / 10000).toLocaleString() + '만';
    return n.toLocaleString() + '원';
  }

  // 브랜드 이름 정규화 (괄호, 공백 제거 등)
  function normalizeBrandName(brandName) {
    if (!brandName) return '';
    // 괄호와 내용 제거: "컴포즈(2024)" → "컴포즈"
    var normalized = brandName.replace(/\([^)]*\)/g, '').trim();
    // 공백 제거
    normalized = normalized.replace(/\s+/g, '');
    return normalized;
  }
  
  // 브랜드 이름을 로고 파일명으로 매핑
  function getLogoFileName(brandName) {
    if (!brandName) {
      console.log('[getLogoFileName] brandName이 없음');
      return null;
    }
    
    // 브랜드 이름 정규화
    var normalizedName = normalizeBrandName(brandName);
    console.log('[getLogoFileName] 입력:', brandName, '→ 정규화:', normalizedName);
    
    // 실제 존재하는 로고 파일만 매핑 (frontend/images/logos/ 기준)
    var logoMap = {
      // DB 브랜드 → 실제 파일
      '이디야': 'EDIYA.png',
      '이디야커피': 'EDIYA.png',
      '메가커피': 'megamgcoffee_BI.png',
      '빽다방': 'paik.png',
      '탐앤탐스': 'tomntoms.png',
      '투썸플레이스': 'atwosomeplace.png',
      '할리스': 'hollys.png',
      '할리스커피': 'hollys.png',
      '컴포즈': 'compose.png',
      '컴포즈커피': 'compose.png',
      // 새로 추가된 로고
      '던킨도너츠': 'dunkin.png',
      '뚜레쥬르': 'tous.jpg',
      '만렙커피': '10000.png',
      '바나프레소': 'bana.jpg',
      '파리바게트': 'paris.png'
    };
    
    // 1. 원본 이름으로 정확한 매칭
    if (logoMap[brandName]) {
      console.log('[getLogoFileName] 원본 매칭 성공:', brandName, '→', logoMap[brandName]);
      return logoMap[brandName];
    }
    
    // 2. 정규화된 이름으로 정확한 매칭
    if (logoMap[normalizedName]) {
      console.log('[getLogoFileName] 정규화 매칭 성공:', normalizedName, '→', logoMap[normalizedName]);
      return logoMap[normalizedName];
    }
    
    // 3. 부분 매칭 (원본 이름 기준)
    for (var key in logoMap) {
      if (brandName.includes(key) || key.includes(brandName)) {
        console.log('[getLogoFileName] 부분 매칭 성공:', brandName, '포함', key, '→', logoMap[key]);
        return logoMap[key];
      }
    }
    
    // 4. 부분 매칭 (정규화된 이름 기준)
    for (var key in logoMap) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        console.log('[getLogoFileName] 정규화 부분 매칭 성공:', normalizedName, '포함', key, '→', logoMap[key]);
        return logoMap[key];
      }
    }
    
    // 5. 매핑 실패 → null 반환 (아이콘으로 대체됨)
    console.log('[getLogoFileName] 매핑 실패:', brandName);
    return null;
  }
  
  // MockData의 logo 필드 파일명을 실제 파일명으로 변환
  function normalizeLogoFileName(logoFileName) {
    if (!logoFileName) return null;
    
    // MockData의 잘못된 파일명을 실제 파일명으로 변환
    var fileMap = {
      'starbucks.svg': 'Starbucks.png',
      'atwosomeplace.svg': 'atwosomeplace.png',
      'megamgcoffee_BI.png': 'megamgcoffee_BI.png', // 이미 정확함
      'compose.png': 'compose.png',
      'paik.png': 'paik.png',
      'EDIYA.png': 'EDIYA.png',
      'theventi.png': 'theventi.png',
      'hollys.png': 'hollys.png',
      'bluebottle.png': 'bluebottle.png',
      'coffeebean.png': 'coffeebean.png',
      'tomntoms.png': 'tomntoms.png',
      'paulbassett.png': 'paulbassett.png'
    };
    
    // 파일명이 fileMap에 있으면 변환, 없으면 그대로 사용
    return fileMap[logoFileName] || logoFileName;
  }

  function renderBrands(filter) {
    // 실제 API에서 브랜드 목록 가져오기
    var brands = window.brandsFromAPI || MockData.brands;
    if (filter && filter !== 'all') {
      brands = brands.filter(function (b) { return b.position === filter; });
    }

    console.log('[브랜드 렌더링] 브랜드 수:', brands.length);
    
    grid.innerHTML = brands.map(function (b, idx) {
      var logoHtml;
      // DB에서 logo 필드가 없으므로 브랜드 이름으로 매핑
      var logoFileName = getLogoFileName(b.name);
      
      console.log('[브랜드 로고]', b.name, '→', logoFileName || '(없음)');
      
      if (logoFileName) {
        // 절대 경로 사용 (로컬 및 배포 환경 모두 지원)
        var logoPath = '/images/logos/' + logoFileName;
        logoHtml = '<img src="' + logoPath + '" alt="' + Utils.escapeHtml(b.name) + '" style="width:60px;height:60px;object-fit:contain;background:#fff;border-radius:50%;padding:4px;" onerror="console.warn(\'이미지 로드 실패:\', this.src); var icon=document.createElement(\'i\'); icon.className=\'fa-solid fa-mug-hot\'; icon.style.cssText=\'font-size:2.5rem;color:var(--gold);\'; this.parentNode.replaceChild(icon, this);">';
      } else {
        // 로고 파일이 없는 브랜드는 아이콘 표시
        logoHtml = '<i class="fa-solid fa-mug-hot" style="font-size:2.5rem;color:var(--gold);"></i>';
      }

      var posColor = b.position === '프리미엄' ? 'var(--gold)' : b.position === '저가' ? 'var(--primary-glow)' : 'var(--text-muted)';

      return '<div class="brand-card" data-brand-id="' + b.id + '" style="animation:fadeUp 0.5s ease-out ' + (idx * 0.05) + 's both;">' +
        '<div class="brand-icon" style="height:70px;display:flex;align-items:center;justify-content:center;">' + logoHtml + '</div>' +
        '<h3 class="brand-name">' + Utils.escapeHtml(b.name) + '</h3>' +
        '<span class="brand-tag" style="color:' + posColor + ';">' + b.position + '</span>' +
        '<div class="brand-stats">' +
        '<div class="stat-item"><span>초기투자</span><strong>' + formatMoney(b.initialInvestment) + '</strong></div>' +
        '<div class="stat-item"><span>평균 판매</span><strong>' + b.avgDailySales + '잔/일</strong></div>' +
        '</div>' +
        '</div>';
    }).join('');

    // Attach click handlers
    var cards = grid.querySelectorAll('.brand-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('click', handleBrandClick);
    }
  }

  function handleBrandClick(e) {
    var card = e.currentTarget;
    var brandId = card.getAttribute('data-brand-id');
    
    // API에서 가져온 브랜드 목록에서 먼저 찾기
    var brands = window.brandsFromAPI || MockData.brands;
    var brand = brands.find(function(b) { return b.id === brandId; });
    
    // 없으면 MockData에서 찾기
    if (!brand) {
      brand = MockData.getBrandById(brandId);
    }
    
    if (!brand) {
      console.error('[브랜드 선택] 브랜드를 찾을 수 없음:', brandId);
      return;
    }
    
    console.log('[브랜드 선택] 선택된 브랜드:', brand);
    
    // API에서 가져온 브랜드 데이터 형식 변환 (문자열 → 숫자)
    var normalizedBrand = {
      id: brand.id,
      name: brand.name,
      position: brand.position,
      initialInvestment: typeof brand.initialInvestment === 'string' ? parseInt(brand.initialInvestment) : brand.initialInvestment,
      monthlyRoyalty: typeof brand.monthlyRoyalty === 'string' ? parseFloat(brand.monthlyRoyalty) : brand.monthlyRoyalty,
      monthlyMarketing: typeof brand.monthlyMarketing === 'string' ? parseFloat(brand.monthlyMarketing) : brand.monthlyMarketing,
      avgDailySales: typeof brand.avgDailySales === 'string' ? parseInt(brand.avgDailySales) : brand.avgDailySales,
      logo: brand.logo || null
    };
    
    console.log('[브랜드 선택] 정규화된 브랜드:', normalizedBrand);

    // Mark active
    var all = grid.querySelectorAll('.brand-card');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
    card.classList.add('active');

    // Save to sessionStorage and navigate
    Utils.saveSession('selectedBrand', normalizedBrand);
    setTimeout(function () {
      window.location.href = '../input/';
    }, 300);
  }

  // Filter buttons
  var filterBtns = filterWrap.querySelectorAll('.radius-btn');
  for (var i = 0; i < filterBtns.length; i++) {
    filterBtns[i].addEventListener('click', function () {
      for (var j = 0; j < filterBtns.length; j++) filterBtns[j].classList.remove('active');
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      renderBrands(currentFilter);
    });
  }

  // Header scroll
  window.addEventListener('scroll', function () {
    var header = document.getElementById('header');
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  });

  // API에서 브랜드 목록 가져오기
  function loadBrandsFromAPI() {
    var apiBaseUrl = window.API_CONFIG ? window.API_CONFIG.API_BASE_URL : 'http://localhost:3000';
    
    console.log('[브랜드 선택] API에서 브랜드 목록 로드:', apiBaseUrl);
    
    fetch(apiBaseUrl + '/api/brands')
      .then(function(response) {
        if (!response.ok) {
          throw new Error('브랜드 목록 조회 실패: ' + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        if (data.success && data.brands && data.brands.length > 0) {
          console.log('[브랜드 선택] API에서 브랜드 목록 받음:', data.brands.length, '개');
          // API 데이터를 window 객체에 저장
          window.brandsFromAPI = data.brands;
          // 브랜드 목록 다시 렌더링
          renderBrands(currentFilter);
        } else {
          console.warn('[브랜드 선택] API 응답이 비어있어 MockData 사용');
          renderBrands('all');
        }
      })
      .catch(function(error) {
        console.error('[브랜드 선택] API 호출 실패, MockData 사용:', error);
        renderBrands('all');
      });
  }

  // Initial render - API에서 먼저 로드 시도
  loadBrandsFromAPI();
})();
