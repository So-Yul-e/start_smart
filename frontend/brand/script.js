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

  function renderBrands(filter) {
    // 실제 API에서 브랜드 목록 가져오기
    var brands = window.brandsFromAPI || MockData.brands;
    if (filter && filter !== 'all') {
      brands = brands.filter(function (b) { return b.position === filter; });
    }

    grid.innerHTML = brands.map(function (b, idx) {
      var logoHtml;
      if (b.logo) {
        logoHtml = '<img src="../images/logos/' + b.logo + '" alt="' + Utils.escapeHtml(b.name) + '" style="width:60px;height:60px;object-fit:contain;background:#fff;border-radius:50%;padding:4px;">';
      } else {
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
