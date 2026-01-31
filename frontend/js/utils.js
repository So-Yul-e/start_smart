/**
 * StartSmart Utility Functions
 * KRW 포맷, 신호등 색상, sessionStorage 헬퍼
 */
var Utils = (function () {

  // ── 숫자 포맷 ──
  function formatKRW(n) {
    if (n == null || isNaN(n)) return '-';
    var abs = Math.abs(n);
    var sign = n < 0 ? '-' : '';
    if (abs >= 100000000) return sign + (abs / 100000000).toFixed(1).replace(/\.0$/, '') + '억';
    if (abs >= 10000) return sign + Math.round(abs / 10000).toLocaleString() + '만';
    return sign + abs.toLocaleString() + '원';
  }

  function formatKRWFull(n) {
    if (n == null || isNaN(n)) return '-';
    return (n < 0 ? '-' : '') + '₩ ' + Math.abs(n).toLocaleString();
  }

  function formatNumber(n) {
    if (n == null || isNaN(n)) return '-';
    return n.toLocaleString();
  }

  // ── 신호등 ──
  var signalMap = {
    green: { color: '#4ade80', bg: 'rgba(74,222,128,0.15)', label: '긍정', icon: 'fa-circle-check' },
    yellow: { color: '#facc15', bg: 'rgba(250,204,21,0.15)', label: '주의', icon: 'fa-triangle-exclamation' },
    red: { color: '#f87171', bg: 'rgba(248,113,113,0.15)', label: '부정', icon: 'fa-circle-xmark' }
  };

  function getSignal(signal) {
    return signalMap[signal] || signalMap.yellow;
  }

  // 점수 기반 색상
  function scoreColor(score) {
    if (score >= 70) return '#4ade80';
    if (score >= 40) return '#facc15';
    return '#f87171';
  }

  // Impact 레벨 색상
  function impactColor(impact) {
    if (impact === 'high') return '#f87171';
    if (impact === 'medium') return '#facc15';
    return '#4ade80';
  }

  // density/level 한글
  function levelKR(level) {
    var map = { high: '높음', medium: '보통', low: '낮음', ground: '1층', half_basement: '반지하', second_floor: '2층' };
    return map[level] || level;
  }

  // ── sessionStorage 헬퍼 ──
  function saveSession(key, data) {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('sessionStorage save failed:', e);
    }
  }

  function loadSession(key) {
    try {
      var raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('sessionStorage load failed:', e);
      return null;
    }
  }

  function clearSession(key) {
    try { sessionStorage.removeItem(key); } catch (e) { /* noop */ }
  }

  // ── 시뮬레이션 저장/불러오기 ──
  var SIM_KEY = 'savedSimulations';

  function saveSimulation(result, input) {
    var sims = loadSession(SIM_KEY) || [];
    var entry = {
      id: result.id,
      brandName: result.brand.name,
      address: result.location.address || '',
      score: result.decision.score,
      signal: result.decision.signal,
      monthlyProfit: result.finance.monthlyProfit,
      paybackMonths: result.finance.paybackMonths,
      savedAt: new Date().toISOString(),
      result: result,
      input: input
    };
    // Avoid duplicates by id
    sims = sims.filter(function (s) { return s.id !== entry.id; });
    sims.unshift(entry);
    // Keep max 10
    if (sims.length > 10) sims = sims.slice(0, 10);
    saveSession(SIM_KEY, sims);
    return entry;
  }

  function loadSimulations() {
    return loadSession(SIM_KEY) || [];
  }

  function deleteSimulation(id) {
    var sims = loadSession(SIM_KEY) || [];
    sims = sims.filter(function (s) { return s.id !== id; });
    saveSession(SIM_KEY, sims);
  }

  // ── HTML 이스케이프 ──
  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // ── 날짜 포맷 ──
  function formatDate(isoString) {
    var d = new Date(isoString || Date.now());
    return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  }

  // ── API Base URL 가져오기 ──
  // config.js가 로드되지 않았거나 API_CONFIG가 없을 경우에도 올바른 URL 반환
  function getApiBaseUrl() {
    // 1. config.js에서 설정된 값 사용
    if (window.API_CONFIG && window.API_CONFIG.API_BASE_URL) {
      return window.API_CONFIG.API_BASE_URL;
    }
    // 2. 배포 환경: 현재 호스트 사용
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return window.location.origin;
    }
    // 3. 로컬 환경
    return 'http://localhost:3000';
  }

  return {
    formatKRW: formatKRW,
    formatKRWFull: formatKRWFull,
    formatNumber: formatNumber,
    getSignal: getSignal,
    scoreColor: scoreColor,
    impactColor: impactColor,
    levelKR: levelKR,
    saveSession: saveSession,
    loadSession: loadSession,
    clearSession: clearSession,
    saveSimulation: saveSimulation,
    loadSimulations: loadSimulations,
    deleteSimulation: deleteSimulation,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    getApiBaseUrl: getApiBaseUrl
  };
})();
