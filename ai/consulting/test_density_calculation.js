// ai/consulting/test_density_calculation.js
// 경쟁 밀도 자동 계산 테스트

const { calculateDensity } = require('./utils');

console.log('=== 경쟁 밀도 자동 계산 테스트 ===\n');

// 테스트 케이스: 반경 500m 기준
console.log('【반경 500m 기준】');
console.log('경쟁 카페 0개:', calculateDensity(0, 500));   // low
console.log('경쟁 카페 1개:', calculateDensity(1, 500));   // low
console.log('경쟁 카페 3개:', calculateDensity(3, 500));   // low
console.log('경쟁 카페 4개:', calculateDensity(4, 500));   // medium
console.log('경쟁 카페 5개:', calculateDensity(5, 500));   // medium
console.log('경쟁 카페 6개:', calculateDensity(6, 500));   // medium
console.log('경쟁 카페 7개:', calculateDensity(7, 500));   // high
console.log('경쟁 카페 10개:', calculateDensity(10, 500)); // high
console.log('경쟁 카페 28개:', calculateDensity(28, 500));  // high

// 테스트 케이스: 반경 1000m 기준
console.log('\n【반경 1000m 기준】');
console.log('경쟁 카페 7개:', calculateDensity(7, 1000));   // medium (기준이 2배로 조정)
console.log('경쟁 카페 14개:', calculateDensity(14, 1000));  // high
console.log('경쟁 카페 8개:', calculateDensity(8, 1000));    // medium

// 테스트 케이스: 반경 300m 기준
console.log('\n【반경 300m 기준】');
console.log('경쟁 카페 4개:', calculateDensity(4, 300));    // medium (기준이 0.6배로 조정)
console.log('경쟁 카페 5개:', calculateDensity(5, 300));   // high

console.log('\n=== 테스트 완료 ===');

