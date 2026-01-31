/**
 * 전체 플로우 통합 테스트
 * 프론트엔드-백엔드 연동 확인
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// 테스트 결과 추적
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(name, passed, error = null) {
  if (passed) {
    console.log(`✅ ${name}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${name}`);
    if (error) {
      console.error(`   오류: ${error.message || error}`);
      testResults.errors.push({ name, error: error.message || error });
    }
    testResults.failed++;
  }
}

async function testHealthCheck() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    logTest('1. 헬스 체크', response.status === 200 && response.data.status === 'ok');
    return true;
  } catch (error) {
    logTest('1. 헬스 체크', false, error);
    return false;
  }
}

async function testBrandsAPI() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/brands`);
    const hasBrands = response.data.success && Array.isArray(response.data.brands) && response.data.brands.length > 0;
    logTest('2. 브랜드 목록 조회', hasBrands);
    if (hasBrands) {
      console.log(`   브랜드 수: ${response.data.brands.length}개`);
      console.log(`   첫 번째 브랜드: ${response.data.brands[0]?.name || 'N/A'}`);
    }
    return hasBrands ? response.data.brands[0] : null;
  } catch (error) {
    logTest('2. 브랜드 목록 조회', false, error);
    return null;
  }
}

async function testAnalyzeAPI(brandId) {
  if (!brandId) {
    logTest('3. 분석 실행', false, new Error('브랜드 ID가 없습니다'));
    return null;
  }

  try {
    const analyzeRequest = {
      brandId: brandId,
      location: {
        lat: 37.4980,
        lng: 127.0276,
        address: '서울특별시 강남구 강남대로 396'
      },
      radius: 500,
      conditions: {
        initialInvestment: 500000000,
        monthlyRent: 3000000,
        area: 33,
        ownerWorking: true
      },
      targetDailySales: 300
    };

    const response = await axios.post(`${API_BASE_URL}/api/analyze`, analyzeRequest);
    const hasAnalysisId = response.data.success && response.data.analysisId;
    logTest('3. 분석 실행', hasAnalysisId);
    if (hasAnalysisId) {
      console.log(`   분석 ID: ${response.data.analysisId}`);
    }
    return hasAnalysisId ? response.data.analysisId : null;
  } catch (error) {
    logTest('3. 분석 실행', false, error);
    return null;
  }
}

async function testResultAPI(analysisId, maxAttempts = 30) {
  if (!analysisId) {
    logTest('4. 분석 결과 조회', false, new Error('분석 ID가 없습니다'));
    return null;
  }

  try {
    let attempts = 0;
    let result = null;

    while (attempts < maxAttempts) {
      attempts++;
      const response = await axios.get(`${API_BASE_URL}/api/result/${analysisId}`);
      
      if (!response.data.success) {
        logTest('4. 분석 결과 조회', false, new Error(response.data.error || '응답 실패'));
        return null;
      }

      // pending 또는 processing 상태
      if (response.data.status && (response.data.status === 'pending' || response.data.status === 'processing')) {
        console.log(`   ⏳ 분석 진행 중... (${attempts}/${maxAttempts}) - 상태: ${response.data.status}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
        continue;
      }

      // failed 상태
      if (response.data.status === 'failed') {
        logTest('4. 분석 결과 조회', false, new Error(response.data.error || '분석 실패'));
        return null;
      }

      // completed 상태 - result 필드 확인
      if (response.data.status === 'completed' && response.data.result) {
        result = response.data.result;
        logTest('4. 분석 결과 조회', true);
        console.log(`   시도 횟수: ${attempts}회`);
        console.log(`   상태: completed`);
        console.log(`   결과 ID: ${result.id || 'N/A'}`);
        break;
      }

      // 응답 형식이 예상과 다를 경우
      if (response.data.status && response.data.status !== 'pending' && response.data.status !== 'processing') {
        console.log(`   ⚠️  예상치 못한 응답 형식:`, JSON.stringify(response.data).substring(0, 200));
      }
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
    }

    if (!result) {
      logTest('4. 분석 결과 조회', false, new Error(`타임아웃: ${maxAttempts}회 시도 후에도 완료되지 않음`));
      return null;
    }

    return result;
  } catch (error) {
    logTest('4. 분석 결과 조회', false, error);
    return null;
  }
}

async function testResultData(result) {
  if (!result) {
    logTest('5. 결과 데이터 검증', false, new Error('결과 데이터가 없습니다'));
    return false;
  }

  try {
    const checks = {
      brand: !!result.brand,
      location: !!result.location,
      finance: !!result.finance,
      decision: !!result.decision,
      market: !!result.market,
      aiConsulting: !!result.aiConsulting,
      roadview: !!result.roadview
    };

    const allPassed = Object.values(checks).every(v => v === true);
    logTest('5. 결과 데이터 검증', allPassed);
    
    if (allPassed) {
      console.log('   ✅ 필수 필드 모두 존재');
      console.log(`   - 브랜드: ${result.brand?.name || 'N/A'}`);
      console.log(`   - 위치: ${result.location?.address || 'N/A'}`);
      console.log(`   - 판단 점수: ${result.decision?.score || 'N/A'}/100`);
      console.log(`   - 신호등: ${result.decision?.signal || 'N/A'}`);
      console.log(`   - 상권 점수: ${result.market?.marketScore || 'N/A'}/100`);
    } else {
      const missing = Object.entries(checks)
        .filter(([_, v]) => !v)
        .map(([k, _]) => k)
        .join(', ');
      console.log(`   ❌ 누락된 필드: ${missing}`);
    }

    return allPassed;
  } catch (error) {
    logTest('5. 결과 데이터 검증', false, error);
    return false;
  }
}

async function testReportAPI(analysisId) {
  if (!analysisId) {
    logTest('6. 리포트 생성', false, new Error('분석 ID가 없습니다'));
    return false;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/api/report/${analysisId}`);
    const hasReport = response.data.success && (response.data.reportUrl || response.data.reportId);
    logTest('6. 리포트 생성', hasReport);
    if (hasReport) {
      console.log(`   리포트 ID: ${response.data.reportId || 'N/A'}`);
      console.log(`   리포트 URL: ${response.data.reportUrl || 'N/A'}`);
      console.log(`   메시지: ${response.data.message || 'N/A'}`);
    }
    return hasReport;
  } catch (error) {
    // 500 에러인 경우 상세 정보 출력
    if (error.response && error.response.status === 500) {
      console.error(`   서버 오류 상세: ${JSON.stringify(error.response.data)}`);
    }
    logTest('6. 리포트 생성', false, error);
    return false;
  }
}

async function runFullFlowTest() {
  console.log('🧪 전체 플로우 통합 테스트 시작\n');
  console.log(`📍 API Base URL: ${API_BASE_URL}\n`);
  console.log('=' .repeat(60));
  console.log('');

  // 1. 헬스 체크
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ 서버가 실행 중이지 않습니다. 백엔드 서버를 먼저 시작하세요.');
    console.log('   명령어: node backend/server.js');
    process.exit(1);
  }

  console.log('');

  // 2. 브랜드 목록 조회
  const firstBrand = await testBrandsAPI();
  console.log('');

  // 3. 분석 실행
  const analysisId = await testAnalyzeAPI(firstBrand?.id);
  console.log('');

  // 4. 분석 결과 조회 (폴링)
  const result = await testResultAPI(analysisId);
  console.log('');

  // 5. 결과 데이터 검증
  await testResultData(result);
  console.log('');

  // 6. 리포트 생성
  await testReportAPI(analysisId);
  console.log('');

  // 최종 결과
  console.log('='.repeat(60));
  console.log('\n📊 테스트 결과 요약:');
  console.log(`   ✅ 통과: ${testResults.passed}개`);
  console.log(`   ❌ 실패: ${testResults.failed}개`);
  console.log(`   📈 성공률: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ 오류 목록:');
    testResults.errors.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }

  if (testResults.failed === 0) {
    console.log('\n🎉 모든 테스트 통과!');
    process.exit(0);
  } else {
    console.log('\n⚠️  일부 테스트 실패');
    process.exit(1);
  }
}

// 실행
runFullFlowTest().catch(error => {
  console.error('\n💥 테스트 실행 중 오류 발생:');
  console.error(error);
  process.exit(1);
});
