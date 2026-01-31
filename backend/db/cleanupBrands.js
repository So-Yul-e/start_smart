/**
 * PDF에 없는 가라데이터 삭제 및 중복 정리
 * node backend/db/cleanupBrands.js
 */

const pool = require('./connection');

// PDF 파일명과 매핑되는 브랜드명 (importFromPDFs.js의 brandNameMap과 동일)
const pdfBrandNameMap = {
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

// PDF에 실제로 있는 브랜드명 목록
const pdfBrandNames = Object.values(pdfBrandNameMap);

async function cleanupBrands() {
  try {
    console.log('🧹 브랜드 데이터 정리 시작...\n');

    // 1. 모든 브랜드 조회
    const allBrands = await pool.query('SELECT id, name FROM brands ORDER BY id');
    console.log(`📋 현재 DB에 있는 브랜드: ${allBrands.rows.length}개\n`);

    // 2. PDF에 없는 가라데이터 찾기
    // brand_1~brand_12 중에서 PDF에 없는 것만 삭제
    // brand_1769...로 시작하는 것은 PDF에서 추출한 것이므로 유지
    const brandsToDelete = [];

    for (const brand of allBrands.rows) {
      // brand_1769...로 시작하는 것은 PDF에서 추출한 것이므로 유지
      if (brand.id.startsWith('brand_1769')) {
        continue;
      }
      
      // brand_1~brand_12 중에서 PDF에 없는 것만 삭제
      const brandName = brand.name;
      
      // PDF에 있는 브랜드인지 확인 (정확한 매칭 또는 부분 매칭)
      const isPdfBrand = pdfBrandNames.some(pdfName => {
        // 정확한 매칭
        if (brandName === pdfName) return true;
        // 부분 매칭 (커피 제거 후 비교)
        const normalizedBrand = brandName.replace('커피', '').replace('(2024)', '').trim();
        const normalizedPdf = pdfName.replace('커피', '').replace('(2024)', '').trim();
        if (normalizedBrand === normalizedPdf) return true;
        // 포함 관계 확인
        if (brandName.includes(pdfName) || pdfName.includes(brandName)) return true;
        return false;
      });

      // PDF에 없는 브랜드면 삭제 대상
      if (!isPdfBrand) {
        brandsToDelete.push(brand);
      }
    }

    console.log('🗑️  삭제할 가라데이터:');
    brandsToDelete.forEach(b => {
      console.log(`   - ${b.id}: ${b.name}`);
    });
    console.log('');

    // 3. 가라데이터 삭제
    if (brandsToDelete.length > 0) {
      const idsToDelete = brandsToDelete.map(b => b.id);
      await pool.query(
        `DELETE FROM brands WHERE id = ANY($1::varchar[])`,
        [idsToDelete]
      );
      console.log(`✅ ${brandsToDelete.length}개 가라데이터 삭제 완료\n`);
    } else {
      console.log('✅ 삭제할 가라데이터가 없습니다.\n');
    }

    // 4. 중복 데이터 확인 및 정리
    const remainingBrands = await pool.query('SELECT id, name FROM brands ORDER BY name');
    const nameGroups = {};
    
    for (const brand of remainingBrands.rows) {
      // 브랜드명 정규화 (커피, (2024) 제거)
      const normalizedName = brand.name
        .replace('커피', '')
        .replace('(2024)', '')
        .trim();
      
      if (!nameGroups[normalizedName]) {
        nameGroups[normalizedName] = [];
      }
      nameGroups[normalizedName].push(brand);
    }

    const duplicates = Object.entries(nameGroups)
      .filter(([name, brands]) => brands.length > 1);

    if (duplicates.length > 0) {
      console.log('⚠️  중복된 브랜드 발견:');
      const duplicateIdsToDelete = [];
      
      for (const [name, brands] of duplicates) {
        console.log(`   - ${name}: ${brands.map(b => `${b.id}(${b.name})`).join(', ')}`);
        
        // PDF에서 추출한 데이터(brand_1769...로 시작)를 우선하고, 
        // 가라데이터(brand_1~brand_12)는 삭제
        const pdfBrand = brands.find(b => b.id.startsWith('brand_1769'));
        const fakeBrands = brands.filter(b => !b.id.startsWith('brand_1769'));
        
        if (pdfBrand && fakeBrands.length > 0) {
          for (const fakeBrand of fakeBrands) {
            console.log(`     → ${fakeBrand.id}(${fakeBrand.name}) 삭제, ${pdfBrand.id}(${pdfBrand.name}) 유지`);
            duplicateIdsToDelete.push(fakeBrand.id);
          }
        }
      }
      
      if (duplicateIdsToDelete.length > 0) {
        await pool.query(
          `DELETE FROM brands WHERE id = ANY($1::varchar[])`,
          [duplicateIdsToDelete]
        );
        console.log(`✅ ${duplicateIdsToDelete.length}개 중복 데이터 삭제 완료\n`);
      }
      console.log('');
    }

    // 5. 최종 결과
    const finalBrands = await pool.query('SELECT id, name FROM brands ORDER BY name');
    console.log(`📊 최종 브랜드 수: ${finalBrands.rows.length}개\n`);
    console.log('📋 최종 브랜드 목록:');
    finalBrands.rows.forEach(b => {
      console.log(`   - ${b.id}: ${b.name}`);
    });

    console.log('\n🎉 브랜드 데이터 정리 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 정리 중 오류:', error);
    process.exit(1);
  }
}

cleanupBrands();
