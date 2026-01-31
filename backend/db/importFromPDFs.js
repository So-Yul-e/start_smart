/**
 * PDF 파일에서 브랜드 데이터 추출 및 DB 삽입
 * node backend/db/importFromPDFs.js
 */

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const pool = require('./connection');

// 파일명을 브랜드명으로 매핑
const brandNameMap = {
  '이디야.pdf': '이디야커피',
  '컴포즈(2024).pdf': '컴포즈커피',
  '메가커피.pdf': '메가커피',
  '할리스.pdf': '할리스커피',
  '투썸플레이스.pdf': '투썸플레이스',
  '빽다방.pdf': '빽다방',
  '탐앤탐스.pdf': '탐앤탐스',
  '던킨도너츠.pdf': '던킨도너츠',
  '뚜레쥬르.pdf': '뚜레쥬르',
  '바나프레소.pdf': '바나프레소',
  '파리바게뜨.pdf': '파리바게뜨',
  '만랩커피.pdf': '만랩커피'
};

// 브랜드 ID 생성 함수
function generateBrandId(brandName) {
  const idMap = {
    '이디야커피': 'brand_2',
    '컴포즈커피': 'brand_4',
    '메가커피': 'brand_5',
    '할리스커피': 'brand_6',
    '투썸플레이스': 'brand_3',
    '빽다방': 'brand_8',
    '탐앤탐스': 'brand_9',
    '던킨도너츠': 'brand_13',
    '뚜레쥬르': 'brand_14',
    '바나프레소': 'brand_15',
    '파리바게뜨': 'brand_16',
    '만랩커피': 'brand_17'
  };
  return idMap[brandName] || `brand_${Date.now()}`;
}

// PDF에서 초기 투자금 추출 (더 정확한 패턴)
function extractInitialInvestment(text) {
  // 패턴 1: "초기 투자금", "설치비", "개설비" 등 키워드 주변
  const patterns = [
    /(?:초기\s*투자|설치비|개설비|투자금|창업비).*?(\d{1,3}(?:,\d{3})*)\s*(?:만|억|원)/gi,
    /(\d{1,3}(?:,\d{3})*)\s*(?:만|억)\s*(?:원|초기|투자)/gi,
    /(\d{1,3}(?:,\d{3})*)\s*억\s*원/gi,
    /(\d{1,3}(?:,\d{3})*)\s*만\s*원/gi
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const numMatch = match.match(/(\d{1,3}(?:,\d{3})*)/);
        if (numMatch) {
          let num = parseInt(numMatch[1].replace(/,/g, ''));
          if (match.includes('억')) {
            num = num * 100000000;
          } else if (match.includes('만')) {
            num = num * 10000;
          }
          // 합리적인 범위 체크 (1억 ~ 10억)
          if (num >= 100000000 && num <= 10000000000) {
            return num;
          }
        }
      }
    }
  }
  
  // 패턴 2: 일반적인 큰 숫자 (1억~10억 범위)
  const allNumbers = text.match(/\d{8,11}/g);
  if (allNumbers) {
    const candidates = allNumbers
      .map(n => parseInt(n))
      .filter(n => n >= 100000000 && n <= 10000000000)
      .sort((a, b) => b - a);
    if (candidates.length > 0) {
      return candidates[0];
    }
  }
  
  return null;
}

// PDF에서 퍼센트 추출
function extractPercentages(text) {
  const percentages = text.match(/(\d+\.?\d*)\s*%/g);
  if (!percentages) return null;
  return percentages.map(p => parseFloat(p.replace('%', '')));
}

// PDF 텍스트에서 브랜드 정보 추출
async function extractBrandInfoFromPDF(pdfPath, brandName) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfParser = new PDFParse({ data: dataBuffer });
    const pdfData = await pdfParser.getText();
    const text = pdfData.text;

    console.log(`\n📄 ${brandName} PDF 분석 중...`);
    console.log(`   텍스트 길이: ${text.length}자`);

    // 초기 투자금 추출
    let initialInvestment = extractInitialInvestment(text);
    if (!initialInvestment) {
      // 기본값 (브랜드별로 다를 수 있음)
      initialInvestment = 200000000;
    }
    
    // 로열티 추출 (더 정확한 패턴)
    const royaltyPatterns = [
      /로열티.*?(\d+\.?\d*)\s*%/gi,
      /로열티.*?(\d+\.?\d*)\s*퍼센트/gi,
      /(\d+\.?\d*)\s*%.*?로열티/gi
    ];
    let monthlyRoyalty = 3; // 기본값
    for (const pattern of royaltyPatterns) {
      const match = text.match(pattern);
      if (match) {
        const numMatch = match[0].match(/(\d+\.?\d*)/);
        if (numMatch) {
          const num = parseFloat(numMatch[1]);
          if (num >= 0 && num <= 10) {
            monthlyRoyalty = num;
            break;
          }
        }
      }
    }
    
    // 마케팅비 추출
    const marketingPatterns = [
      /마케팅.*?(\d+\.?\d*)\s*%/gi,
      /광고.*?(\d+\.?\d*)\s*%/gi,
      /(\d+\.?\d*)\s*%.*?마케팅/gi
    ];
    let monthlyMarketing = 1; // 기본값
    for (const pattern of marketingPatterns) {
      const match = text.match(pattern);
      if (match) {
        const numMatch = match[0].match(/(\d+\.?\d*)/);
        if (numMatch) {
          const num = parseFloat(numMatch[1]);
          if (num >= 0 && num <= 10) {
            monthlyMarketing = num;
            break;
          }
        }
      }
    }

    // 포지션 추정 (투자금 기준)
    const position = initialInvestment >= 350000000 ? '프리미엄' : '스탠다드';

    // 평균 일 판매량 추정 (PDF에서 찾거나 기본값)
    const salesMatch = text.match(/(\d+)\s*(?:잔|잔\/일|잔\/day)/i);
    const avgDailySales = salesMatch ? parseInt(salesMatch[1]) : 200;

    return {
      name: brandName,
      position: position,
      initialInvestment: initialInvestment,
      monthlyRoyalty: monthlyRoyalty,
      monthlyMarketing: monthlyMarketing,
      avgDailySales: avgDailySales,
      pdfText: text // 전체 텍스트 저장 (DB에 삽입 시 일부만 저장)
    };
  } catch (error) {
    console.error(`❌ ${brandName} PDF 파싱 오류:`, error.message);
    return null;
  }
}

// DB에 브랜드 삽입
async function insertBrandToDB(brandId, brandInfo) {
  try {
    await pool.query(
      `INSERT INTO brands (id, name, position, initial_investment, monthly_royalty, monthly_marketing, avg_daily_sales, pdf_source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         position = EXCLUDED.position,
         initial_investment = EXCLUDED.initial_investment,
         monthly_royalty = EXCLUDED.monthly_royalty,
         monthly_marketing = EXCLUDED.monthly_marketing,
         avg_daily_sales = EXCLUDED.avg_daily_sales,
         pdf_source = EXCLUDED.pdf_source,
         updated_at = CURRENT_TIMESTAMP`,
      [
        brandId,
        brandInfo.name,
        brandInfo.position,
        brandInfo.initialInvestment,
        brandInfo.monthlyRoyalty,
        brandInfo.monthlyMarketing,
        brandInfo.avgDailySales,
        brandInfo.pdfText ? brandInfo.pdfText.substring(0, 5000) : null // 최대 5000자만 저장
      ]
    );
    console.log(`✅ ${brandInfo.name} DB 삽입 완료`);
    return true;
  } catch (error) {
    console.error(`❌ ${brandInfo.name} DB 삽입 실패:`, error.message);
    // DB 연결 오류인 경우 상세 정보 출력
    if (error.message.includes('password') || error.message.includes('connection')) {
      console.error(`   💡 PostgreSQL 연결을 확인하세요. .env 파일의 DB 설정을 확인하거나`);
      console.error(`   💡 PostgreSQL이 실행 중인지 확인하세요: brew services list (macOS)`);
    }
    return false;
  }
}

// 메인 함수
async function importFromPDFs() {
  try {
    console.log('📚 PDF 파일에서 브랜드 데이터 추출 시작...\n');
    
    const dataDir = path.join(__dirname, '../../docs/data');
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.pdf'));

    if (files.length === 0) {
      console.log('❌ PDF 파일을 찾을 수 없습니다.');
      return;
    }

    console.log(`📁 발견된 PDF 파일: ${files.length}개\n`);

    const results = [];

    for (const file of files) {
      const brandName = brandNameMap[file] || file.replace('.pdf', '');
      const brandId = generateBrandId(brandName);
      const pdfPath = path.join(dataDir, file);

      // PDF에서 정보 추출
      const brandInfo = await extractBrandInfoFromPDF(pdfPath, brandName);
      
      if (!brandInfo) {
        console.log(`⚠️  ${brandName} 스킵`);
        continue;
      }

      // DB에 삽입
      const success = await insertBrandToDB(brandId, brandInfo);
      results.push({ brandName, success, brandInfo });
    }

    // 결과 요약
    console.log('\n📊 추출 결과 요약:');
    console.log('='.repeat(50));
    results.forEach(({ brandName, success, brandInfo }) => {
      if (success) {
        console.log(`✅ ${brandName}`);
        console.log(`   투자금: ${brandInfo.initialInvestment.toLocaleString()}원`);
        console.log(`   로열티: ${brandInfo.monthlyRoyalty}%`);
        console.log(`   마케팅: ${brandInfo.monthlyMarketing}%`);
        console.log(`   일 판매량: ${brandInfo.avgDailySales}잔`);
      } else {
        console.log(`❌ ${brandName} - 실패`);
      }
    });

    console.log(`\n🎉 총 ${results.filter(r => r.success).length}/${results.length}개 브랜드 삽입 완료!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 전체 프로세스 오류:', error);
    process.exit(1);
  }
}

// 실행
importFromPDFs();
