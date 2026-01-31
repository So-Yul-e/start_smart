/**
 * 매장 평균값 PDF에서 데이터 추출 및 DB 업데이트
 * node backend/db/importAverageData.js
 */

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const pool = require('./connection');

// 파일명을 DB 브랜드명으로 매핑 (파일명에서 .pdf 제거 후 사용)
const brandNameMap = {
  '이디야.pdf': '이디야',
  '컴포즈(2024).pdf': '컴포즈(2024)',
  '메가커피.pdf': '메가커피',
  '할리스.pdf': '할리스',
  '투썸플레이스.pdf': '투썸플레이스',
  '빽다방.pdf': '빽다방',
  '탐앤탐스.pdf': '탐앤탐스',
  '던킨도너츠.pdf': '던킨도너츠',
  '뚜레쥬르.pdf': '뚜레쥬르',
  '바나프레소.pdf': '바나프레소',
  '파리바게뜨.pdf': '파리바게뜨',
  '만랩커피.pdf': '만랩커피'
};

// PDF에서 평균 매출액 추출
function extractAverageRevenue(text) {
  // 패턴 1: "전체" 행에서 평균매출액 추출 (표 형태)
  // 예: "전체	2,562	194,818	6,330" (가맹점수, 평균매출액, 면적당)
  // 또는 "전체	2,581	2,562	19" (전체점포, 가맹점수, 직영점수)
  const lines = text.split('\n');
  
  // "평균매출액" 헤더가 있는 행 찾기
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('평균매출액') && line.includes('면적')) {
      // 다음 행에서 "전체" 데이터 찾기
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const dataLine = lines[j];
        if (dataLine.includes('전체')) {
          const numbers = dataLine.match(/\d{1,3}(?:,\d{3})*/g);
          if (numbers && numbers.length >= 3) {
            // 두 번째 숫자가 평균매출액 (천원)
            const avgRevenue = parseInt(numbers[1].replace(/,/g, ''));
            if (avgRevenue > 1000 && avgRevenue < 1000000) {
              return avgRevenue * 1000;
            }
          }
        }
      }
    }
  }
  
  // 패턴 2: 간단한 표 형태
  const tablePattern = /전체\s+(\d{1,4}(?:,\d{3})*)\s+(\d{1,3}(?:,\d{3})*)\s+(\d{1,4}(?:,\d{3})*)/;
  const tableMatch = text.match(tablePattern);
  if (tableMatch) {
    const avgRevenue = parseInt(tableMatch[2].replace(/,/g, ''));
    if (avgRevenue > 1000 && avgRevenue < 1000000) {
      return avgRevenue * 1000;
    }
  }
  
  // 패턴 2: "평균매출액" 키워드 주변
  const patterns = [
    /평균매출액\s*(\d{1,3}(?:,\d{3})*)/g,
    /평균\s*매출액\s*(\d{1,3}(?:,\d{3})*)/g,
    /매출액\s*(\d{1,3}(?:,\d{3})*)\s*천원/g
  ];
  
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const numbers = matches.map(m => parseInt(m[1].replace(/,/g, '')))
        .filter(n => n > 1000 && n < 1000000)
        .sort((a, b) => b - a);
      
      if (numbers.length > 0) {
        return numbers[0] * 1000;
      }
    }
  }
  
  return null;
}

// 면적당 평균 매출액 추출
function extractRevenuePerArea(text) {
  // 패턴 1: "평균매출액" 헤더가 있는 표에서 추출
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('평균매출액') && line.includes('면적')) {
      // 다음 행에서 "전체" 데이터 찾기
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const dataLine = lines[j];
        if (dataLine.includes('전체')) {
          const numbers = dataLine.match(/\d{1,3}(?:,\d{3})*/g);
          if (numbers && numbers.length >= 3) {
            // 세 번째 숫자가 면적당 매출액 (천원)
            const revenuePerArea = parseInt(numbers[2].replace(/,/g, ''));
            if (revenuePerArea > 100 && revenuePerArea < 100000) {
              return revenuePerArea * 1000;
            }
          }
        }
      }
    }
  }
  
  // 패턴 2: 간단한 표 형태
  const tablePattern = /전체\s+(\d{1,4}(?:,\d{3})*)\s+(\d{1,3}(?:,\d{3})*)\s+(\d{1,4}(?:,\d{3})*)/;
  const tableMatch = text.match(tablePattern);
  if (tableMatch) {
    const revenuePerArea = parseInt(tableMatch[3].replace(/,/g, ''));
    if (revenuePerArea > 100 && revenuePerArea < 100000) {
      return revenuePerArea * 1000;
    }
  }
  
  // 패턴 2: "면적" 키워드 주변
  const patterns = [
    /면적.*?당.*?(\d{1,3}(?:,\d{3})*)/g,
    /3\.3㎡.*?당.*?(\d{1,3}(?:,\d{3})*)/g,
    /(\d{1,3}(?:,\d{3})*).*?면적.*?당/g
  ];
  
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const numbers = matches.map(m => parseInt(m[1].replace(/,/g, '')))
        .filter(n => n > 100 && n < 100000)
        .sort((a, b) => b - a);
      
      if (numbers.length > 0) {
        return numbers[0] * 1000;
      }
    }
  }
  
  return null;
}

// 가맹점 수 추출
function extractStoreCount(text) {
  // 패턴 1: "전체" 행에서 가맹점수 추출 (표 형태)
  // 예: "전체	2,562	194,818	6,330" (첫 번째 숫자)
  const tablePattern = /전체\s+(\d{1,4}(?:,\d{3})*)\s+(\d{1,3}(?:,\d{3})*)\s+(\d{1,4}(?:,\d{3})*)/;
  const tableMatch = text.match(tablePattern);
  if (tableMatch) {
    const storeCount = parseInt(tableMatch[1].replace(/,/g, ''));
    if (storeCount > 0 && storeCount < 10000) {
      return storeCount;
    }
  }
  
  // 패턴 2: "가맹점수" 키워드 주변
  const patterns = [
    /가맹점수\s*(\d{1,4}(?:,\d{3})*)/g,
    /가맹점\s*(\d{1,4}(?:,\d{3})*)/g,
    /전체\s*(\d{1,4}(?:,\d{3})*)\s*가맹/g
  ];
  
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const numbers = matches.map(m => parseInt(m[1].replace(/,/g, '')))
        .filter(n => n > 0 && n < 10000)
        .sort((a, b) => b - a);
      
      if (numbers.length > 0) {
        return numbers[0];
      }
    }
  }
  
  return null;
}

// PDF에서 평균 데이터 추출
async function extractAverageDataFromPDF(pdfPath, brandName) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfParser = new PDFParse({ data: dataBuffer });
    const pdfData = await pdfParser.getText();
    const text = pdfData.text;

    console.log(`\n📄 ${brandName} 평균 데이터 분석 중...`);
    console.log(`   텍스트 길이: ${text.length}자`);

    const avgMonthlyRevenue = extractAverageRevenue(text);
    const avgRevenuePerArea = extractRevenuePerArea(text);
    const avgStoreCount = extractStoreCount(text);

    console.log(`   평균 월 매출액: ${avgMonthlyRevenue ? avgMonthlyRevenue.toLocaleString() + '원' : '추출 실패'}`);
    console.log(`   면적당 평균 매출액: ${avgRevenuePerArea ? avgRevenuePerArea.toLocaleString() + '원' : '추출 실패'}`);
    console.log(`   가맹점 수: ${avgStoreCount ? avgStoreCount.toLocaleString() + '개' : '추출 실패'}`);

    return {
      avgMonthlyRevenue: avgMonthlyRevenue,
      avgRevenuePerArea: avgRevenuePerArea,
      avgStoreCount: avgStoreCount
    };
  } catch (error) {
    console.error(`❌ ${brandName} PDF 파싱 오류:`, error.message);
    return null;
  }
}

// DB에 평균 데이터 업데이트
async function updateBrandAverageData(brandName, averageData) {
  try {
    // 브랜드 ID 찾기 (더 유연한 매칭)
    let brandResult = await pool.query(
      'SELECT id, name FROM brands WHERE name = $1',
      [brandName]
    );

    // 정확한 매칭이 없으면 부분 매칭 시도
    if (brandResult.rows.length === 0) {
      const normalizedBrand = brandName.replace('커피', '').replace('(2024)', '').trim();
      brandResult = await pool.query(
        `SELECT id, name FROM brands 
         WHERE name LIKE $1 OR name LIKE $2 OR 
               REPLACE(REPLACE(name, '커피', ''), '(2024)', '') = $3 OR
               REPLACE(REPLACE(name, '커피', ''), '(2024)', '') LIKE $4`,
        [`%${brandName}%`, `%${normalizedBrand}%`, normalizedBrand, `%${normalizedBrand}%`]
      );
    }

    if (brandResult.rows.length === 0) {
      console.warn(`⚠️  브랜드를 찾을 수 없습니다: ${brandName}`);
      // 디버깅: 모든 브랜드 목록 출력
      const allBrands = await pool.query('SELECT name FROM brands');
      console.log(`   DB에 있는 브랜드: ${allBrands.rows.map(b => b.name).join(', ')}`);
      return false;
    }

    const brandId = brandResult.rows[0].id;
    const foundBrandName = brandResult.rows[0].name;
    console.log(`   → 브랜드 매칭: ${brandName} → ${foundBrandName} (${brandId})`);

    // 평균 데이터 업데이트
    await pool.query(
      `UPDATE brands 
       SET avg_monthly_revenue = $1,
           avg_revenue_per_area = $2,
           avg_store_count = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [
        averageData.avgMonthlyRevenue,
        averageData.avgRevenuePerArea,
        averageData.avgStoreCount,
        brandId
      ]
    );

    console.log(`✅ ${brandName} 평균 데이터 업데이트 완료`);
    return true;
  } catch (error) {
    console.error(`❌ ${brandName} DB 업데이트 실패:`, error.message);
    return false;
  }
}

// 메인 함수
async function importAverageData() {
  try {
    console.log('📊 매장 평균값 데이터 추출 시작...\n');
    
    const dataDir = path.join(__dirname, '../../docs/data_average');
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.pdf'));

    if (files.length === 0) {
      console.log('❌ PDF 파일을 찾을 수 없습니다.');
      return;
    }

    console.log(`📁 발견된 PDF 파일: ${files.length}개\n`);

    const results = [];

    for (const file of files) {
      // 파일명에서 브랜드명 추출 (매핑 테이블 우선)
      let brandName = brandNameMap[file];
      
      // 매핑이 없으면 파일명에서 직접 추출 (.pdf 제거)
      if (!brandName) {
        brandName = file.replace(/\.pdf$/, '').trim();
      }
      
      const pdfPath = path.join(dataDir, file);
      
      console.log(`\n📄 파일: ${file}`);
      console.log(`   추출된 브랜드명: ${brandName}`);

      // PDF에서 평균 데이터 추출
      const averageData = await extractAverageDataFromPDF(pdfPath, brandName);
      
      if (!averageData) {
        console.log(`⚠️  ${brandName} 스킵`);
        continue;
      }

      // DB 업데이트 (파일명에서 추출한 브랜드명 사용)
      const success = await updateBrandAverageData(brandName, averageData);
      results.push({ brandName, success, averageData });
    }

    // 결과 요약
    console.log('\n📊 업데이트 결과 요약:');
    console.log('='.repeat(50));
    results.forEach(({ brandName, success, averageData }) => {
      if (success) {
        console.log(`✅ ${brandName}`);
        if (averageData.avgMonthlyRevenue) {
          console.log(`   평균 월 매출액: ${averageData.avgMonthlyRevenue.toLocaleString()}원`);
        }
        if (averageData.avgRevenuePerArea) {
          console.log(`   면적당 평균 매출액: ${averageData.avgRevenuePerArea.toLocaleString()}원`);
        }
        if (averageData.avgStoreCount) {
          console.log(`   가맹점 수: ${averageData.avgStoreCount.toLocaleString()}개`);
        }
      } else {
        console.log(`❌ ${brandName} - 실패`);
      }
    });

    console.log(`\n🎉 총 ${results.filter(r => r.success).length}/${results.length}개 브랜드 업데이트 완료!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 전체 프로세스 오류:', error);
    process.exit(1);
  }
}

// 실행
importAverageData();
