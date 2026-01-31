/**
 * AI 창업 컨설팅 챗봇 API
 * POST /api/chatbot
 */

const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getAnalysis } = require('../db/analysisRepository');
require('dotenv').config();

// Gemini API 초기화
if (!process.env.GEMINI_API_KEY) {
  console.error('[챗봇] ⚠️  GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  console.error('[챗봇] ⚠️  .env 파일에 GEMINI_API_KEY를 추가해주세요.');
} else {
  console.log('[챗봇] ✅ GEMINI_API_KEY 설정됨 (길이:', process.env.GEMINI_API_KEY.length, ')');
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
// 모델명: 실제 사용 가능한 Gemini 모델 목록
// 참고: gemini-3-pro-preview, gemini-3.0-flash, gemini-2.5-pro-preview는 존재하지 않거나 할당량 초과
const MODEL_NAMES = ['gemini-2.5-pro', 'gemini-2.5-flash'];
const MODEL_NAME = MODEL_NAMES[0]; // gemini-2.5-pro
const FALLBACK_MODEL = MODEL_NAMES[1] || 'gemini-2.5-flash'; // 대체 모델

const MAX_QUESTIONS = 10;

// 대화 히스토리 저장소 (메모리 기반, analysisId별로 관리)
const conversationHistory = new Map();

// 가드레일 검증 클래스
class GuardrailValidator {
  constructor(analysisData) {
    this.analysisData = analysisData;
  }

  // 수치 환각 검증
  validateNumericResponse(response) {
    const numberPattern = /\d+\.?\d*/g;
    const numbers = response.match(numberPattern);
    if (!numbers) return { valid: true };

    // 분석 데이터에서 주요 수치만 추출 (금액, 기간 등)
    const keyNumbers = this.extractKeyNumbers(this.analysisData);

    for (const num of numbers) {
      const numValue = parseFloat(num);

      // 작은 숫자(0-1000)는 일반적인 설명에 사용될 수 있으므로 제외
      // 예: "1단계", "2가지", "3개월", "10%", "50점", "500m" 등
      if (numValue <= 1000 && numValue >= 0) {
        continue;
      }

      // 주요 수치와 비교 (±1% 오차 허용)
      const found = keyNumbers.some(an => {
        if (an === 0 || numValue === 0) return false;
        const diff = Math.abs(an - numValue);
        const percentDiff = diff / Math.max(Math.abs(an), Math.abs(numValue));
        return diff < 1000 || percentDiff < 0.01; // 1% 오차 또는 1000원 이하 차이 허용
      });

      // 주요 수치가 아니고, 1000 이상 1억 미만인 경우만 검증
      if (!found && numValue > 1000 && numValue < 100000000) {
        return {
          valid: false,
          reason: '수치 환각 감지: ' + num,
          severity: 'CRITICAL'
        };
      }
    }
    return { valid: true };
  }

  // 주요 수치만 추출 (금액, 기간 등)
  extractKeyNumbers(obj, numbers = []) {
    if (typeof obj === 'number' && obj > 1000) {
      numbers.push(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(item => this.extractKeyNumbers(item, numbers));
    } else if (obj && typeof obj === 'object') {
      // 주요 필드만 추출
      const keyFields = ['monthlyProfit', 'monthlyRevenue', 'paybackMonths', 'score',
        'survivalMonths', 'initialInvestment', 'monthlyRent', 'area'];
      Object.keys(obj).forEach(key => {
        if (keyFields.includes(key) && typeof obj[key] === 'number') {
          numbers.push(obj[key]);
        } else {
          this.extractKeyNumbers(obj[key], numbers);
        }
      });
    }
    return numbers;
  }

  // 금지 표현 검증
  validateForbiddenExpressions(response) {
    const forbidden = [
      '100% 성공', '반드시 성공', '무조건 성공',
      '절대 망', '완전 실패', '하지 마세요',
      '보장합니다', '확실합니다', '틀림없습니다',
      '제가 계산해보니', '제 분석 결과', '데이터베이스 조회 시',
      '다른 고객 사례와', '대부분의 사용자는', '통계적으로 보면'
    ];

    for (const phrase of forbidden) {
      if (response.includes(phrase)) {
        return {
          valid: false,
          reason: '금지 표현 감지: ' + phrase,
          severity: 'HIGH'
        };
      }
    }
    return { valid: true };
  }

  // 법률/세무 조언 검증
  validateLegalAdvice(response) {
    const legalKeywords = ['계약서 작성', '위약금 분쟁', '소송', '법률 조언', '변호사 없이'];
    const taxKeywords = ['세액 계산', '절세 전략', '세무 신고', '부가세', '소득세'];

    const lowerResponse = response.toLowerCase();
    for (const keyword of [...legalKeywords, ...taxKeywords]) {
      if (lowerResponse.includes(keyword.toLowerCase())) {
        return {
          valid: false,
          reason: '법률/세무 조언 감지: ' + keyword,
          severity: 'CRITICAL'
        };
      }
    }
    return { valid: true };
  }

  // 시스템 판정 존중 검증
  validateSystemJudgment(response, category) {
    // nonNegotiable 판정 변경 시도 감지
    if (category === 'gostop') {
      const decision = this.analysisData.decision;
      if (decision?.finalJudgement?.nonNegotiable) {
        const overridePatterns = [
          '변경 가능', '조정 가능', '다시 계산', '봐줄 수',
          '점수 올려', '점수 높여', '판정 바꿔'
        ];
        for (const pattern of overridePatterns) {
          if (response.includes(pattern)) {
            return {
              valid: false,
              reason: '시스템 판정 변경 시도 감지',
              severity: 'CRITICAL'
            };
          }
        }
      }
    }
    return { valid: true };
  }

  // 종합 검증
  validate(response, category) {
    const checks = [
      this.validateNumericResponse(response),
      this.validateForbiddenExpressions(response),
      this.validateLegalAdvice(response),
      this.validateSystemJudgment(response, category)
    ];

    for (const check of checks) {
      if (!check.valid) {
        return check;
      }
    }
    return { valid: true };
  }

}

// 챗봇 프롬프트 생성
function buildChatbotPrompt(analysisData, category, question) {
  // analysisData 검증 및 정리
  if (!analysisData || typeof analysisData !== 'object') {
    console.error('[챗봇] analysisData 검증 실패:', {
      hasAnalysisData: !!analysisData,
      type: typeof analysisData,
      isArray: Array.isArray(analysisData),
      value: analysisData
    });
    throw new Error('analysisData가 유효하지 않습니다. 분석 데이터를 확인해주세요.');
  }

  // 순환 참조 방지를 위한 안전한 JSON 변환
  let analysisDataStr;
  try {
    // 필요한 필드만 추출하여 안전하게 변환
    const safeData = {
      brand: analysisData.brand || {},
      finance: analysisData.finance || {},
      decision: analysisData.decision || {},
      market: analysisData.market || {},
      aiConsulting: analysisData.aiConsulting || {},
      roadview: analysisData.roadview || {}
    };
    analysisDataStr = JSON.stringify(safeData, null, 2);
  } catch (jsonError) {
    console.error('[챗봇] JSON 변환 오류:', jsonError.message);
    analysisDataStr = JSON.stringify({ error: '데이터 변환 실패' });
  }

  const systemPrompt = `[SYSTEM ROLE]
당신은 **"StartSmart AI 창업 컨설턴트"**입니다.

전문성
- 프랜차이즈 카페 창업 컨설팅 10년 경력
- 500건 이상의 창업 사례 분석 경험
- 상권 분석, 재무 설계, 리스크 관리 전문

커뮤니케이션 스타일
- 친근하면서도 전문적인 어조 (존댓말 사용)
- 복잡한 수치를 쉬운 비유로 설명
- 긍정적이되 현실적인 조언 제공
- 과도한 낙관/비관 없이 균형 잡힌 시각 유지
- **직관적이고 이해하기 쉬운 설명**: 전문 용어는 피하고 일상적인 비유와 구체적인 예시를 사용하여 누구나 쉽게 이해할 수 있도록 설명

[CONTEXT]
사용자는 StartSmart 분석 리포트를 받은 예비 카페 창업자입니다.
아래 데이터는 시스템이 분석한 결과이며, 이를 기반으로 상담합니다.

[CONSTRAINTS]
절대 금지 사항 🚫
- 데이터 조작 금지: 데이터에 없는 수치를 임의로 생성하지 않음
- 과도한 보장 금지: "반드시 성공합니다" 표현 금지
- 전문 영역 침범 금지: 법률/세무 조언 금지
- 브랜드 관련 주의: 경쟁 브랜드 비하 금지
- 시스템 판정 존중: nonNegotiable = true인 판정은 변경 불가

[ANSWERING GUIDELINES]
- 분석 데이터가 없는 질문에도 일반적인 창업 상담 관점에서 답변 제공
- 브랜드 비교 질문 시 각 브랜드의 일반적인 특징과 장단점을 객관적으로 설명
- "모르겠다"보다는 "일반적으로는..." 형식으로 도움이 되는 정보 제공
- 사용자의 질문 의도를 파악하여 최대한 도움이 되는 답변 제공
- 분석 데이터가 있으면 그것을 우선 활용하되, 없어도 일반적인 조언 제공

[OUTPUT FORMAT]
응답은 반드시 다음 구조로 작성합니다. **완전하고 상세한 답변을 제공하세요. 중간에 끊기지 않도록 충분한 길이로 작성하세요.**

1. **간단한 인사** (1-2문장)
   - 예: "안녕하세요! [브랜드명] 창업에 대해 궁금해하시는군요."

2. **핵심 메트릭 카드** (반드시 포함, 3-5개)
   메트릭을 "메트릭명: 값" 형식으로 작성
   예: 월 매출: 2,280만원
   예: 월 순이익: 529만원
   예: 회수 기간: 9.5개월
   예: 손익분기점: 192.5잔/일
   예: 마진율: 23.2%
   해당 카테고리에 맞는 핵심 메트릭을 **충분히** 나열하세요.

3. **상세 설명** (5-8문장, 완전한 설명)
   - 핵심 내용을 **완전히** 설명하세요
   - 각 문장은 명확하고 구체적으로 작성
   - 사용자가 이해할 수 있도록 충분한 맥락 제공
   - 중간에 끊기지 않도록 완전한 문장으로 작성

4. **구체적 조언** (3-5문장)
   - 실질적인 개선 방안이나 조언 제공
   - 구체적인 수치나 예시 포함
   - 실행 가능한 액션 아이템 제시

5. **요약 박스** (선택사항, "쉽게 말해" 같은 설명)
   > 쉽게 말해: [간단한 요약]

**중요 규칙:**
- **응답은 반드시 완전해야 합니다. 중간에 끊기지 않도록 충분한 길이로 작성하세요.**
- 메트릭은 반드시 "메트릭명: 값" 형식으로 작성
- 핵심 수치: 굵게 강조 (**값**)
- 단위 표기: 금액(만원), 비율(%), 기간(개월), 판매량(잔/일)
- 리스크 표현: high→높음, medium→보통, low→낮음
- **카드 UI를 활용하여 정보를 구조화하세요. 메트릭은 카드 형식으로, 리스크나 개선안은 리스트 형식으로 작성하세요.**
- **사용자가 한 번에 모든 정보를 이해할 수 있도록 충분히 상세하고 완전한 답변을 제공하세요.**`;

  let categoryPrompt = '';
  switch (category) {
    case 'profit':
      categoryPrompt = `수익성 분석을 요청했습니다.
다음 정보를 **모두 포함**하여 **완전하고 상세한** 답변을 제공하세요:

**핵심 메트릭 (카드 형식으로 표시):**
- 월 매출: ${analysisData.finance?.monthlyRevenue || 0}원
- 월 순이익: ${analysisData.finance?.monthlyProfit || 0}원
- 회수 기간: ${analysisData.finance?.paybackMonths || 0}개월
- 손익분기점: ${analysisData.finance?.breakEvenDailySales || 0}잔/일
- 마진율: ${analysisData.finance?.monthlyProfit && analysisData.finance?.monthlyRevenue ? ((analysisData.finance.monthlyProfit / analysisData.finance.monthlyRevenue) * 100).toFixed(1) : 0}%

**상세 설명 요구사항:**
1. 현재 조건에서의 수익성을 **완전히** 설명하세요 (5-8문장)
2. 비용 구조를 분석하고 각 항목의 비중을 설명하세요
3. 개선 가능한 부분을 **구체적으로** 제시하세요 (3-5개 항목)
4. 실질적인 개선 방안과 예상 효과를 수치와 함께 제시하세요
5. 사용자가 이해하기 쉽도록 비유나 예시를 포함하세요

**중요:** 응답이 중간에 끊기지 않도록 충분히 상세하고 완전하게 작성하세요.`;
      break;
    case 'risk':
      const topRisks = analysisData.aiConsulting?.topRisks || [];
      categoryPrompt = `리스크 분석을 요청했습니다.
다음 리스크 정보를 바탕으로 **완전하고 상세한** 답변을 제공하세요:

**리스크 목록:**
${topRisks.length > 0 ? topRisks.map((risk, idx) => `${idx + 1}. ${risk.title} (${risk.impact || 'medium'})`).join('\n') : '리스크 정보 없음'}

**상세 설명 요구사항:**
1. 각 리스크를 **카드 형식**으로 상세히 설명하세요 (리스크당 3-5문장)
2. 각 리스크의 영향도를 명확히 하고, 왜 위험한지 구체적으로 설명하세요
3. 각 리스크에 대한 **구체적인 개선 방안**을 함께 제시하세요 (리스크당 2-3개)
4. 리스크 관리 우선순위를 제시하세요
5. 전체적인 리스크 평가와 종합 의견을 제공하세요

**중요:** 모든 리스크를 빠짐없이 설명하고, 각 리스크에 대한 개선 방안을 구체적으로 제시하세요. 응답이 중간에 끊기지 않도록 완전하게 작성하세요.`;
      break;
    case 'competition':
      categoryPrompt = `경쟁 환경 분석을 요청했습니다.
다음 정보를 **모두 포함**하여 **완전하고 상세한** 답변을 제공하세요:

**핵심 메트릭 (카드 형식으로 표시):**
- 반경 내 경쟁점: ${analysisData.market?.competitors?.total || 0}개
- 동일 브랜드: ${analysisData.market?.competitors?.sameBrand || 0}개
- 타 브랜드: ${(analysisData.market?.competitors?.total || 0) - (analysisData.market?.competitors?.sameBrand || 0)}개
- 경쟁 강도: ${analysisData.aiConsulting?.competitiveAnalysis?.intensity || 'medium'}

**상세 설명 요구사항:**
1. 경쟁 환경이 창업에 미치는 영향을 **완전히** 설명하세요 (5-8문장)
2. 경쟁 강도에 따른 리스크와 기회를 분석하세요
3. 차별화 전략을 **구체적으로** 제시하세요 (3-5개 항목)
4. 경쟁 우위를 확보하기 위한 실질적인 방안을 제시하세요
5. 경쟁 환경을 고려한 마케팅 전략을 제안하세요

**중요:** 응답이 중간에 끊기지 않도록 충분히 상세하고 완전하게 작성하세요.`;
      break;
    case 'improve':
      const improvements = analysisData.aiConsulting?.improvements || [];
      categoryPrompt = `개선 방안을 요청했습니다.
다음 개선안을 바탕으로 **완전하고 상세한** 답변을 제공하세요:

**개선안 목록:**
${improvements.length > 0 ? improvements.map((imp, idx) => `${idx + 1}. ${imp.title}`).join('\n') : '개선안 정보 없음'}

**상세 설명 요구사항:**
1. 각 개선안을 **카드 형식**으로 상세히 설명하세요 (개선안당 4-6문장)
2. 각 개선안의 기대 효과를 **구체적인 수치**와 함께 설명하세요
3. 각 개선안의 실행 방법을 단계별로 제시하세요
4. 개선안 실행 시 예상되는 변화를 수치로 제시하세요 (예: "월 순이익이 720만원에서 850만원으로 증가")
5. 개선안의 우선순위와 실행 난이도를 평가하세요
6. 전체적인 개선 전략과 로드맵을 제시하세요

**중요:** 모든 개선안을 빠짐없이 설명하고, 각 개선안의 효과를 구체적인 수치로 제시하세요. 응답이 중간에 끊기지 않도록 완전하게 작성하세요.`;
      break;
    case 'gostop':
      categoryPrompt = `GO/STOP 판정을 요청했습니다.
다음 판정 정보를 **모두 포함**하여 **완전하고 상세한** 답변을 제공하세요:

**핵심 메트릭 (카드 형식으로 표시):**
- 종합 점수: ${analysisData.decision?.score || 0}점
- 신호등: ${analysisData.decision?.signal || 'yellow'}
- 판정 사유: ${analysisData.decision?.finalJudgement?.summary || ''}
- 생존 기간: ${analysisData.decision?.survivalMonths || 0}개월
- 리스크 레벨: ${analysisData.decision?.riskLevel || 'medium'}

**상세 설명 요구사항:**
1. 판정 근거를 **완전히** 설명하세요 (6-10문장)
2. 각 판정 요소(점수, 신호등, 리스크)의 의미를 구체적으로 설명하세요
3. 판정에 영향을 미친 주요 요인들을 분석하세요
4. 판정을 개선하기 위한 구체적인 방안을 제시하세요
5. 최종 결정은 사용자의 몫임을 명시하되, 판정의 의미를 명확히 전달하세요

**중요:** 응답이 중간에 끊기지 않도록 충분히 상세하고 완전하게 작성하세요.`;
      break;
    case 'location':
      const roadview = analysisData.roadview || {};
      categoryPrompt = `입지 평가를 요청했습니다.
다음 로드뷰 분석 결과를 바탕으로 **완전하고 상세한** 답변을 제공하세요:

**입지 메트릭 (카드 형식으로 표시):**
- 입지 점수: ${roadview.riskScore || 0}점
- 간판 가시성: ${roadview.risks?.signage_obstruction?.level || 'medium'}
- 경사도: ${roadview.risks?.steep_slope?.level || 'medium'}
- 층위: ${roadview.risks?.floor_level?.level || 'ground'}
- 보행 가시성: ${roadview.risks?.visibility?.level || 'medium'}

**상세 설명 요구사항:**
1. 입지의 강점과 약점을 **카드 형식**으로 균형있게 설명하세요 (각 항목당 2-3문장)
2. 각 리스크 항목의 의미와 영향도를 구체적으로 설명하세요
3. 입지 개선을 위한 실질적인 방안을 제시하세요
4. 입지가 창업 성공에 미치는 영향을 분석하세요
5. 전체적인 입지 평가와 종합 의견을 제공하세요

**중요:** 모든 입지 요소를 빠짐없이 설명하고, 각 요소의 의미를 구체적으로 전달하세요. 응답이 중간에 끊기지 않도록 완전하게 작성하세요.`;
      break;
    case 'general':
      // 일반 질문 처리 - 분석 데이터와 질문을 모두 활용
      categoryPrompt = `사용자가 다음 질문을 했습니다:
"${question || '일반적인 창업 상담'}"

다음 분석 데이터를 참고하여 답변하세요:
- 브랜드: ${analysisData.brand?.name || '미확인'}
- 종합 점수: ${analysisData.decision?.score || 0}점
- 신호등: ${analysisData.decision?.signal || 'yellow'}
- 월 순이익: ${analysisData.finance?.monthlyProfit || 0}원
- 회수 기간: ${analysisData.finance?.paybackMonths || 0}개월

질문에 답변하면서, 가능한 경우 위 분석 데이터를 참고하여 구체적인 정보를 제공하세요.
분석 데이터에 없는 내용이라도, 일반적인 창업 상담 관점에서 도움이 되는 답변을 제공하세요.
브랜드 비교 질문의 경우, 각 브랜드의 일반적인 특징과 현재 분석된 브랜드와의 비교를 제공하세요.`;
      break;
    default:
      categoryPrompt = question ? `사용자 질문: "${question}"
위 질문에 답변하면서, 가능한 경우 분석 데이터를 참고하여 구체적인 정보를 제공하세요.` : '일반적인 창업 상담을 요청했습니다.';
  }

  return {
    system: systemPrompt,
    user: `분석 데이터:
${analysisDataStr}

${categoryPrompt}

위 데이터를 기반으로 친근하고 전문적인 톤으로 답변해주세요.

**답변 원칙:**
1. 분석 데이터에 있는 정보는 정확히 사용하세요.
2. 분석 데이터에 없는 질문이라도, 일반적인 창업 상담 관점에서 도움이 되는 답변을 제공하세요.
3. 브랜드 비교 질문의 경우, 각 브랜드의 일반적인 특징과 현재 분석된 브랜드와의 비교를 제공하세요.
4. "모르겠다"보다는 "일반적으로는..." 형식으로 도움이 되는 정보를 제공하세요.

**중요**: 직관적이고 이해하기 쉽게 설명해주세요.
- 전문 용어 대신 일상적인 표현 사용 (예: "손익분기점" → "본전을 찾는 판매량")
- 구체적인 비유와 예시 활용 (예: "100만원 순이익" → "한 달에 100만원씩 남는 것")
- 숫자는 쉬운 단위로 변환 (예: "1,800만원" → "1,800만원(약 1억 8천만원)")
- 복잡한 개념은 단계별로 설명
- 시각적으로 이해하기 쉽게 구조화된 설명 제공`
  };
}

// 챗봇 응답 생성 (Gemini API 사용 - 멀티턴 대화)
async function generateChatbotResponse(analysisData, category, question, analysisId) {
  try {
    const prompt = buildChatbotPrompt(analysisData, category, question);
  } catch (promptError) {
    console.error('[챗봇] 프롬프트 생성 실패:', promptError.message);
    console.error('[챗봇] analysisData 타입:', typeof analysisData);
    console.error('[챗봇] analysisData 키:', analysisData ? Object.keys(analysisData).slice(0, 20) : 'null');
    throw new Error('프롬프트 생성 중 오류: ' + promptError.message);
  }
  
  const prompt = buildChatbotPrompt(analysisData, category, question);

  // 대화 히스토리 가져오기 또는 초기화
  const historyKey = analysisId || 'default';
  let history = conversationHistory.get(historyKey);

  // 첫 대화인 경우 시스템 프롬프트와 초기 컨텍스트 설정
  if (!history) {
    history = {
      chat: null,
      modelName: null,
      systemPrompt: prompt.system,
      analysisData: analysisData
    };
    conversationHistory.set(historyKey, history);
  }

  // 사용자 메시지 생성
  const userMessage = prompt.user;

  // API 키 확인
  if (!genAI) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 추가해주세요.');
  }

  // 여러 모델명을 순차적으로 시도 (실제 사용 가능한 모델 목록)
  const modelsToTry = MODEL_NAMES.length > 0 ? MODEL_NAMES : ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro'];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[챗봇] 모델 시도: ${modelName} (멀티턴)`);

      // 기존 채팅이 없거나 모델이 변경된 경우 새 채팅 시작
      if (!history.chat || history.modelName !== modelName) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: history.systemPrompt
          });

          // 새 채팅 시작
          history.chat = model.startChat({
            history: [],
            generationConfig: {
              temperature: 0.7,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 8192, // 더 긴 응답을 위해 토큰 수 증가 (4096 -> 8192)
            },
          });
          history.modelName = modelName;
          console.log(`[챗봇] 새 채팅 세션 시작: ${modelName}`);
        } catch (modelError) {
          console.log(`[챗봇] 모델 ${modelName} 초기화 실패:`, modelError.message);
          throw modelError; // 다음 모델 시도
        }
      }

      // 멀티턴 대화: 이전 대화 히스토리 포함하여 메시지 전송
      const result = await history.chat.sendMessage(userMessage);
      const response = result.response;

      // 응답 완전성 확인 (finishReason 체크)
      let finishReason = null;
      if (response && response.candidates && response.candidates.length > 0) {
        finishReason = response.candidates[0].finishReason;
        console.log(`[챗봇] 응답 완료 이유: ${finishReason}`);

        // 응답이 중간에 끊긴 경우 경고
        if (finishReason === 'MAX_TOKENS' || finishReason === 'OTHER') {
          console.warn(`[챗봇] ⚠️ 응답이 중간에 끊겼을 수 있습니다. finishReason: ${finishReason}`);
        }
      }

      // 텍스트 추출 (여러 방법 시도)
      let responseText = '';

      try {
        // 방법 1: response.text() 직접 호출 (가장 안정적)
        if (response && typeof response.text === 'function') {
          responseText = await response.text();
          console.log(`[챗봇] 텍스트 추출 성공 (response.text()): ${responseText.length}자`);
        }
        // 방법 2: response.text가 문자열인 경우
        else if (response && typeof response.text === 'string') {
          responseText = response.text;
          console.log(`[챗봇] 텍스트 추출 성공 (문자열): ${responseText.length}자`);
        }
        // 방법 3: candidates를 통한 추출
        else if (response && response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.content) {
            if (candidate.content.parts && candidate.content.parts.length > 0) {
              // 모든 parts의 텍스트를 합침 (응답이 여러 parts로 나뉠 수 있음)
              responseText = candidate.content.parts
                .map(part => part.text || '')
                .filter(text => text.length > 0)
                .join('');
              console.log(`[챗봇] 텍스트 추출 성공 (candidates.parts): ${responseText.length}자, parts 수: ${candidate.content.parts.length}`);
            } else if (candidate.content.text) {
              responseText = candidate.content.text;
              console.log(`[챗봇] 텍스트 추출 성공 (candidate.content.text): ${responseText.length}자`);
            }
          }
        }
        // 방법 4: 직접 text 속성 확인
        else if (response && response.text) {
          responseText = String(response.text);
          console.log(`[챗봇] 텍스트 추출 성공 (직접 속성): ${responseText.length}자`);
        }
      } catch (extractError) {
        console.warn(`[챗봇] 텍스트 추출 오류:`, extractError.message);
        // candidates로 재시도
        if (response && response.candidates && response.candidates[0]) {
          const candidate = response.candidates[0];
          if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            responseText = candidate.content.parts
              .map(part => part.text || '')
              .filter(text => text.length > 0)
              .join('');
            console.log(`[챗봇] 텍스트 추출 재시도 성공: ${responseText.length}자`);
          }
        }
      }

      // 응답 텍스트 길이 확인 및 로깅
      if (responseText) {
        console.log(`[챗봇] 최종 추출된 텍스트 길이: ${responseText.length}자`);
        if (responseText.length < 50) {
          console.warn(`[챗봇] ⚠️ 응답이 매우 짧습니다. 완전한 응답인지 확인 필요.`);
        }
      }

      // 응답 텍스트 정리 (에러 메시지 및 깨진 문자 제거)
      if (responseText) {
        // 문자열로 변환
        responseText = String(responseText);

        // 에러 메시지 패턴 제거
        responseText = responseText.replace(/^pro:generateContent:.*?(\n|$)/gim, '');
        responseText = responseText.replace(/^\[404.*?\]\s*/gim, '');
        responseText = responseText.replace(/^models\/.*?is not found.*?(\n|$)/gim, '');
        responseText = responseText.replace(/^Call ListModels.*?(\n|$)/gim, '');
        responseText = responseText.replace(/^or is not supported.*?(\n|$)/gim, '');
        responseText = responseText.replace(/^API version.*?(\n|$)/gim, '');
        responseText = responseText.replace(/^generateContent.*?(\n|$)/gim, '');

        // 앞부분의 깨진 문자 제거 (BOM, Zero-width 문자 등)
        // 단, 유효한 특수 문자는 보존
        responseText = responseText.replace(/^[\uFEFF\u200B-\u200D\u2060\ufeff\ufffe\uffff]+/, '');
        responseText = responseText.replace(/^[\s\u00A0\u2000-\u200A\u202F\u205F]+/, '');

        // "중학생도 이해하는" 문구 제거
        responseText = responseText.replace(/중학생도\s*이해하는?\s*/gi, '');
        responseText = responseText.replace(/중학생도\s*이해하기\s*쉽게\s*/gi, '');

        // 깨진 한글 자모 패턴 제거 (예: "이바 길이 ㄴㄴㅋㅍㄷ자")
        responseText = responseText.replace(/[가-힣\s]*[ㄱ-ㅎㅏ-ㅣ]{2,}[가-힣\s]*/g, (match) => {
          // 한글 자모가 2개 이상 연속된 경우 제거
          const valid = match.replace(/[ㄱ-ㅎㅏ-ㅣ]{2,}/g, '');
          return valid.trim();
        });

        // 불완전한 단어 제거 (한글 자모로 끝나는 경우)
        responseText = responseText.replace(/[가-힣]+[ㄱ-ㅎㅏ-ㅣ]\s/g, '');

        // 깨진 문장 패턴 제거 (예: "상권 특", "성상 점", "심시간은")
        responseText = responseText.replace(/\b[가-힣]{1,2}\s+[가-힣]{1,2}\s+[가-힣]{1,2}\b/g, '');

        // 불완전한 문장 제거 (예: "'시간 싸", "움'입니", "다 키오")
        responseText = responseText.replace(/['"]\s*[가-힣]{1,3}\s+[가-힣]{1,3}['"]?/g, '');
        responseText = responseText.replace(/[가-힣]{1,2}\s+[가-힣]{1,2}\s*['"]/g, '');

        // 깨진 숫자와 단위 패턴 제거 (예: "약 3 만원 준입 다")
        responseText = responseText.replace(/약\s*\d+\s*만원\s+[가-힣]{1,3}\s+[가-힣]{1,3}/g, '');

        // 연속된 공백과 깨진 문자 정리
        responseText = responseText.replace(/\s{3,}/g, ' ');
        responseText = responseText.replace(/[가-힣]\s+[가-힣]\s+[가-힣]\s+[가-힣]\s+[가-힣]/g, (match) => {
          // 5개 이상의 한글이 공백으로 분리된 경우 제거 (깨진 패턴)
          return '';
        });

        // 연속된 줄바꿈 정리
        responseText = responseText.replace(/\n{3,}/g, '\n\n');

        // 최종 trim
        responseText = responseText.trim();

        if (responseText && responseText.length > 0) {
          // 응답 완전성 검증
          const isComplete = finishReason === 'STOP' || finishReason === null;
          if (!isComplete) {
            console.warn(`[챗봇] ⚠️ 응답이 완전하지 않을 수 있습니다. finishReason: ${finishReason}`);
          }

          // 응답이 너무 짧으면 경고 (50자 미만)
          if (responseText.length < 50) {
            console.warn(`[챗봇] ⚠️ 응답이 매우 짧습니다 (${responseText.length}자). 완전한 응답인지 확인 필요.`);
          }

          // 응답이 중간에 끊긴 것처럼 보이는 경우 (마지막 문장이 불완전)
          const trimmedText = responseText.trim();
          const lastChar = trimmedText[trimmedText.length - 1];
          const validEndings = ['.', '!', '?', '원', '개월', '%', '다', '요', '니다', '습니다', '합니다'];
          const endsWithValid = validEndings.some(ending => trimmedText.endsWith(ending));

          // 불완전한 응답 감지
          if (!endsWithValid && trimmedText.length > 0) {
            console.warn(`[챗봇] ⚠️ 응답이 중간에 끊긴 것처럼 보입니다. 마지막 문자: "${lastChar}", 마지막 50자: "${trimmedText.substring(Math.max(0, trimmedText.length - 50))}"`);

            // 불완전한 응답인 경우, 마지막 불완전한 문장 제거
            const sentences = trimmedText.split(/[.!?]\s+/);
            if (sentences.length > 1) {
              // 마지막 문장이 불완전하면 제거
              const lastSentence = sentences[sentences.length - 1];
              if (lastSentence.length < 10 || !endsWithValid) {
                responseText = sentences.slice(0, -1).join('. ') + '.';
                console.log(`[챗봇] 불완전한 마지막 문장 제거: "${lastSentence.substring(0, 30)}..."`);
              }
            }
          }

          console.log(`[챗봇] ✅ 성공: ${modelName} 사용 (멀티턴), 응답 길이: ${responseText.length}자, 완전성: ${isComplete ? '완전' : '불완전 가능'}`);

          // 히스토리 업데이트
          conversationHistory.set(historyKey, history);

          return responseText;
        } else {
          console.warn(`[챗봇] 응답 텍스트가 비어있음: ${modelName}`);
        }
      } else {
        console.warn(`[챗봇] 응답 텍스트 추출 실패: ${modelName}`);
      }
    } catch (error) {
      console.log(`[챗봇] 모델 ${modelName} 실패:`, error.message.split('\n')[0]);
      lastError = error;

      // 모델 실패 시 채팅 세션 초기화
      if (history.chat && history.modelName === modelName) {
        history.chat = null;
        history.modelName = null;
      }

      // 다음 모델 시도
      continue;
    }
  }

  // 모든 모델 실패
  console.error('[챗봇] ❌ 모든 모델 시도 실패');
  throw new Error('AI 응답 생성 중 오류가 발생했습니다. 사용 가능한 Gemini 모델을 찾을 수 없습니다. API 키 권한을 확인해주세요. ' + (lastError ? lastError.message.split('\n')[0] : ''));
}

// 텍스트를 HTML로 포맷팅 (카드 기반 구조화 레이아웃)
function formatTextToHTML(text) {
  if (!text) return '';

  // 텍스트를 문자열로 변환하고 정리
  let html = String(text).trim();

  // 에러 메시지나 디버그 정보 제거 (먼저 처리)
  html = html.replace(/^pro:generateContent:.*?\n?/gi, '');
  html = html.replace(/^\[404.*?\]\s*/gi, '');
  html = html.replace(/^models\/.*?is not found.*?\n?/gi, '');
  html = html.replace(/^Call ListModels.*?\n?/gi, '');
  html = html.replace(/^or is not supported.*?\n?/gi, '');
  html = html.replace(/^API version.*?\n?/gi, '');

  // 앞부분의 깨진 문자나 특수문자 제거
  html = html.replace(/^[\uFEFF\u200B-\u200D\u2060\ufeff\ufffe\uffff]+/, '');
  html = html.replace(/^[\s\u00A0\u2000-\u200A\u202F\u205F]+/, '');

  // "중학생도 이해하는" 문구 제거
  html = html.replace(/중학생도\s*이해하는?\s*/gi, '');
  html = html.replace(/중학생도\s*이해하기\s*쉽게\s*/gi, '');

  // 연속된 줄바꿈 정리
  html = html.replace(/\n{3,}/g, '\n\n');

  // 깨진 한글 자모 패턴 제거
  html = html.replace(/[ㄱ-ㅎㅏ-ㅣ]{3,}/g, '');

  // 코드 블록 보호
  const codeBlocks = [];
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const id = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(match);
    return id;
  });

  // ==========================================
  // 마크다운 테이블 파싱 (핵심 개선사항)
  // ==========================================
  html = parseMarkdownTables(html);

  // ==========================================
  // 메트릭 라인 변환 (파이프 문자 기반)
  // ==========================================
  // "| 월 매출 | 2,280만원 | 설명 |" 형식을 카드로 변환
  html = html.replace(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|?\s*$/gm, (match, label, value, desc) => {
    // 테이블 구분선이면 스킵
    if (/^[\s:|-]+$/.test(label)) return '';
    // 헤더 행이면 스킵 (항목, 분석 결과, 비고 등)
    if (/^(항목|메트릭|지표|구분)$/i.test(label.trim())) return '';

    const cleanLabel = label.trim();
    const cleanValue = value.trim();
    const cleanDesc = desc ? desc.trim() : '';

    if (cleanDesc) {
      return `<div class="chat-metric-card with-desc">
        <div class="metric-main">
          <span class="metric-label">${cleanLabel}</span>
          <span class="metric-value">${cleanValue}</span>
        </div>
        <div class="metric-desc">${cleanDesc}</div>
      </div>`;
    }
    return `<div class="chat-metric-card">
      <span class="metric-label">${cleanLabel}</span>
      <span class="metric-value">${cleanValue}</span>
    </div>`;
  });

  // 테이블 구분선 제거 (|:--|:--|:--|)
  html = html.replace(/^\|[\s:|-]+\|[\s:|-]*\|?[\s:|-]*\|?\s*$/gm, '');
  html = html.replace(/^\|?[\s]*:?-+:?[\s]*\|[\s]*:?-+:?[\s]*\|?[\s]*:?-*:?[\s]*\|?\s*$/gm, '');

  // ==========================================
  // 마크다운 헤딩 변환
  // ==========================================
  // #### 헤딩 (h4)
  html = html.replace(/^####\s+(.+?)$/gm,
    '<div class="chat-subsection-header"><h4>$1</h4></div>');

  // ### 헤딩 (h3)
  html = html.replace(/^###\s+(.+?)$/gm,
    '<div class="chat-section-header"><h3>$1</h3></div>');

  // ## 헤딩 (h2)
  html = html.replace(/^##\s+(.+?)$/gm,
    '<div class="chat-section-title"><h2>$1</h2></div>');

  // ==========================================
  // 인용문 변환
  // ==========================================
  html = html.replace(/^>\s*(.+?)$/gm,
    '<div class="chat-summary-box">$1</div>');

  // ==========================================
  // 텍스트 스타일 변환
  // ==========================================
  // **굵은 글씨**
  html = html.replace(/\*\*([^*\n]+?)\*\*/g,
    '<strong class="chat-highlight">$1</strong>');

  // *기울임*
  html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g,
    '<em class="chat-emphasis">$1</em>');

  // ==========================================
  // 메트릭 패턴 변환 (콜론 기반)
  // ==========================================
  // "월 매출: 2,280만원" 형식
  html = html.replace(/^([가-힣\s]+):\s*(\d+[,\d]*(?:\.\d+)?\s*(?:만원|억원|개월|잔\/일|잔|점|%|원|퍼센트))$/gm,
    '<div class="chat-metric-card"><span class="metric-label">$1</span><span class="metric-value">$2</span></div>');

  // ==========================================
  // 숫자 강조
  // ==========================================
  html = html.replace(/(?<!<[^>]*)(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(만원|억원|개월|잔\/일|잔|점|%|원)(?![^<]*>)/g,
    '<strong class="chat-number">$1$2</strong>');

  // ==========================================
  // 리스트 처리
  // ==========================================
  // 번호 목록 (1. 2. 3.)
  html = html.replace(/^(\d+)\.\s+(.+?)$/gm,
    '<div class="chat-list-item numbered"><div class="list-number">$1</div><div class="list-content">$2</div></div>');

  // 불릿 목록 (- 또는 •)
  html = html.replace(/^[-•]\s+(.+?)$/gm,
    '<div class="chat-list-item"><div class="list-bullet">•</div><div class="list-content">$1</div></div>');

  // ==========================================
  // 코드 블록 복원
  // ==========================================
  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`,
      `<pre class="chat-code-block">${block.replace(/```\w*\n?/g, '').replace(/```/g, '')}</pre>`);
  });

  // ==========================================
  // 줄바꿈 및 문단 처리
  // ==========================================
  // 연속된 빈 줄은 문단 구분
  html = html.replace(/\n\n+/g, '</p><p class="chat-paragraph">');
  // 단일 줄바꿈은 <br>
  html = html.replace(/\n/g, '<br>');

  // 문단 래퍼 추가
  if (!html.startsWith('<')) {
    html = '<p class="chat-paragraph">' + html;
  }
  if (!html.endsWith('>')) {
    html = html + '</p>';
  }

  // ==========================================
  // 최종 정리
  // ==========================================
  // 빈 문단 제거
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '');
  html = html.replace(/<p[^>]*>\s*<br>\s*<\/p>/g, '');

  // 연속된 <br> 정리
  html = html.replace(/(<br>\s*){3,}/g, '<br><br>');

  // 빈 태그 제거
  html = html.replace(/<(\w+)[^>]*>\s*<\/\1>/g, '');

  // XSS 방지
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  return html;
}

// 마크다운 테이블을 HTML 테이블로 변환
function parseMarkdownTables(text) {
  const lines = text.split('\n');
  let result = [];
  let tableBuffer = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableLine = /^\|.*\|/.test(line.trim());
    const isSeparatorLine = /^\|[\s:|-]+\|/.test(line.trim());

    if (isTableLine) {
      if (!inTable) {
        inTable = true;
        tableBuffer = [];
      }
      // 구분선이 아닌 경우만 추가
      if (!isSeparatorLine) {
        tableBuffer.push(line);
      }
    } else {
      if (inTable && tableBuffer.length > 0) {
        // 테이블 종료 - HTML로 변환
        result.push(convertTableBufferToHTML(tableBuffer));
        tableBuffer = [];
        inTable = false;
      }
      result.push(line);
    }
  }

  // 마지막 테이블 처리
  if (inTable && tableBuffer.length > 0) {
    result.push(convertTableBufferToHTML(tableBuffer));
  }

  return result.join('\n');
}

// 테이블 버퍼를 HTML 테이블로 변환
function convertTableBufferToHTML(rows) {
  if (rows.length === 0) return '';

  // 첫 번째 행이 헤더인지 확인
  const firstRow = rows[0];
  const cells = firstRow.split('|').filter(c => c.trim());

  // 메트릭 테이블인 경우 (항목 | 값 | 설명 형태)
  const isMetricTable = cells.some(cell =>
    /^(항목|메트릭|지표|구분)$/i.test(cell.trim()) ||
    /만원|억원|개월|%|점/.test(cell)
  );

  if (isMetricTable && rows.length > 1) {
    // 메트릭 카드 그리드로 변환
    let html = '<div class="chat-metric-grid">';

    // 헤더 행 스킵 (항목 | 분석 결과 | 비고 등)
    const dataRows = rows.slice(1);

    for (const row of dataRows) {
      const rowCells = row.split('|').filter(c => c.trim());
      if (rowCells.length >= 2) {
        const label = rowCells[0].trim();
        const value = rowCells[1].trim();
        const desc = rowCells[2] ? rowCells[2].trim() : '';

        // 빈 행이나 구분선 스킵
        if (!label || /^[\s:-]+$/.test(label)) continue;

        html += `<div class="chat-metric-card${desc ? ' with-desc' : ''}">`;
        html += `<div class="metric-main">`;
        html += `<span class="metric-label">${label}</span>`;
        html += `<span class="metric-value">${value}</span>`;
        html += `</div>`;
        if (desc) {
          html += `<div class="metric-desc">${desc}</div>`;
        }
        html += `</div>`;
      }
    }

    html += '</div>';
    return html;
  }

  // 일반 테이블로 변환
  let html = '<table class="chat-table">';

  // 첫 번째 행을 헤더로
  if (rows.length > 0) {
    const headerCells = rows[0].split('|').filter(c => c.trim());
    html += '<thead><tr>';
    for (const cell of headerCells) {
      html += `<th>${cell.trim()}</th>`;
    }
    html += '</tr></thead>';
  }

  // 나머지 행을 본문으로
  if (rows.length > 1) {
    html += '<tbody>';
    for (let i = 1; i < rows.length; i++) {
      const bodyCells = rows[i].split('|').filter(c => c.trim());
      if (bodyCells.length > 0 && !/^[\s:-]+$/.test(bodyCells[0])) {
        html += '<tr>';
        for (const cell of bodyCells) {
          html += `<td>${cell.trim()}</td>`;
        }
        html += '</tr>';
      }
    }
    html += '</tbody>';
  }

  html += '</table>';
  return html;
}

// 후속 CTA 생성
function buildFollowupCTAs(category) {
  const followupMap = {
    profit: [
      { label: '비용 구조 자세히', category: 'profit_detail' },
      { label: '매출 10% 감소하면?', category: 'profit_sensitivity' },
      { label: '회수 기간 단축 방법', category: 'improve' }
    ],
    risk: [
      { label: '개선 방안 보기', category: 'improve' },
      { label: '경쟁 환경 분석', category: 'competition' },
      { label: 'GO/STOP 판정 확인', category: 'gostop' }
    ],
    competition: [
      { label: '차별화 전략', category: 'improve' },
      { label: '리스크 분석', category: 'risk' },
      { label: 'GO/STOP 판정 확인', category: 'gostop' }
    ],
    improve: [
      { label: '수익성 분석', category: 'profit' },
      { label: '리스크 분석', category: 'risk' },
      { label: 'GO/STOP 판정 확인', category: 'gostop' }
    ],
    gostop: [
      { label: '수익성 분석', category: 'profit' },
      { label: '리스크 분석', category: 'risk' },
      { label: '개선 방안 보기', category: 'improve' }
    ],
    location: [
      { label: '리스크 분석', category: 'risk' },
      { label: '경쟁 환경 분석', category: 'competition' },
      { label: 'GO/STOP 판정 확인', category: 'gostop' }
    ]
  };

  return followupMap[category] || [];
}

// API 엔드포인트
router.post('/', async (req, res) => {
  try {
    console.log('[챗봇] 요청 받음:', {
      hasAnalysisId: !!req.body.analysisId,
      category: req.body.category,
      hasQuestion: !!req.body.question,
      questionCount: req.body.questionCount,
      hasAnalysisData: !!req.body.analysisData
    });
    
    const { analysisId, category, question, questionCount } = req.body;

    // 입력 검증
    if (!analysisId) {
      return res.status(400).json({
        success: false,
        error: 'analysisId가 필요합니다.'
      });
    }

    if (!category && !question) {
      return res.status(400).json({
        success: false,
        error: 'category 또는 question이 필요합니다.'
      });
    }

    // 질문 횟수 제한
    if (questionCount && questionCount > MAX_QUESTIONS) {
      return res.status(429).json({
        success: false,
        error: '질문 횟수 제한(10회)에 도달했습니다.',
        maxQuestions: MAX_QUESTIONS
      });
    }

    // 분석 데이터 조회 (DB 또는 요청 본문)
    let analysisData = req.body.analysisData;

    // 요청 본문에 없으면 DB에서 조회 시도
    if (!analysisData) {
      try {
        const analysis = await getAnalysis(analysisId);
        if (analysis && analysis.result) {
          analysisData = analysis.result;
        }
      } catch (dbError) {
        console.warn('[챗봇] DB 조회 실패, 요청 본문 데이터 사용:', dbError.message);
      }
    }

    if (!analysisData) {
      return res.status(404).json({
        success: false,
        error: '분석 데이터를 찾을 수 없습니다. 먼저 분석을 실행해주세요.'
      });
    }

    // analysisData 검증 및 로깅
    console.log('[챗봇] analysisData 구조 확인:', {
      hasBrand: !!analysisData.brand,
      hasFinance: !!analysisData.finance,
      hasDecision: !!analysisData.decision,
      hasMarket: !!analysisData.market,
      hasAiConsulting: !!analysisData.aiConsulting,
      hasRoadview: !!analysisData.roadview,
      dataType: typeof analysisData,
      isArray: Array.isArray(analysisData),
      keys: Object.keys(analysisData || {}).slice(0, 10) // 처음 10개 키만
    });

    // 가드레일 검증기 생성 (비활성화)
    // const validator = new GuardrailValidator(analysisData);

    // AI 응답 생성 (멀티턴 대화 - analysisId로 히스토리 관리)
    let aiResponse;
    try {
      console.log('[챗봇] AI 응답 생성 시작:', {
        category: category || 'general',
        hasQuestion: !!question,
        analysisId: analysisId,
        hasAnalysisData: !!analysisData,
        hasGenAI: !!genAI,
        analysisDataType: typeof analysisData,
        analysisDataIsArray: Array.isArray(analysisData)
      });
      
      // analysisData가 유효한지 한 번 더 확인
      if (!analysisData || typeof analysisData !== 'object' || Array.isArray(analysisData)) {
        throw new Error('analysisData가 유효하지 않습니다. 객체여야 합니다.');
      }
      
      aiResponse = await generateChatbotResponse(
        analysisData,
        category || 'general',
        question,
        analysisId
      );
      
      console.log('[챗봇] AI 응답 생성 완료, 길이:', aiResponse?.length || 0);

      // 응답 검증
      if (!aiResponse || typeof aiResponse !== 'string' || aiResponse.trim().length === 0) {
        throw new Error('AI 응답이 비어있거나 유효하지 않습니다.');
      }

      // 에러 메시지가 포함되어 있는지 확인
      const errorPatterns = ['404', 'Not Found', 'is not found', 'generateContent', 'v1beta', 'Call ListModels'];
      const hasError = errorPatterns.some(pattern => aiResponse.includes(pattern));
      if (hasError) {
        console.warn('[챗봇] 응답에 에러 메시지 포함 감지, 정리 시도');
        // 에러 메시지 제거 시도
        aiResponse = aiResponse.replace(/pro:generateContent:.*?(\n|$)/gim, '');
        aiResponse = aiResponse.replace(/\[404.*?\]/gim, '');
        aiResponse = aiResponse.replace(/models\/.*?is not found.*?(\n|$)/gim, '');
        aiResponse = aiResponse.trim();

        // 여전히 에러 메시지만 남아있으면 재시도
        if (aiResponse.length < 10 || errorPatterns.some(pattern => aiResponse.includes(pattern))) {
          throw new Error('응답에 에러 메시지가 포함되어 있습니다.');
        }
      }
    } catch (error) {
      console.error('[챗봇] ❌ AI 응답 생성 실패:', error.message);
      console.error('[챗봇] ❌ 에러 스택:', error.stack);
      
      // 더 구체적인 에러 메시지
      let errorMessage = 'AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      
      if (error.message.includes('GEMINI_API_KEY')) {
        errorMessage = 'GEMINI_API_KEY가 설정되지 않았습니다. 서버 관리자에게 문의하세요.';
      } else if (error.message.includes('모델') || error.message.includes('model')) {
        errorMessage = 'AI 모델 초기화에 실패했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('API') || error.message.includes('api')) {
        errorMessage = 'AI API 호출에 실패했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage
      });
    }

    // 가드레일 검증 (비활성화)
    // const validation = validator.validate(aiResponse, category || 'general');
    // if (!validation.valid) {
    //   console.warn('[챗봇] 가드레일 위반:', validation);
    //   
    //   // 위반 시 안전한 응답 반환
    //   const safeResponse = `죄송합니다. 해당 질문에 대해 정확한 답변을 제공하기 어렵습니다.
    //   
    // 분석 리포트의 데이터를 기반으로 정확한 정보를 확인하시려면:
    // 1. 대시보드에서 상세 분석 확인
    // 2. 조건을 변경하여 재분석 실행
    // 3. 전문가 상담 권장
    // 
    // 궁금한 다른 항목이 있으시면 선택해주세요.`;
    // 
    //   return res.json({
    //     success: true,
    //     response: safeResponse,
    //     followups: buildFollowupCTAs(category || 'general'),
    //     guardrailViolation: validation
    //   });
    // }

    // 후속 CTA 생성
    const followups = buildFollowupCTAs(category || 'general');

    // 텍스트를 HTML로 포맷팅
    const formattedResponse = formatTextToHTML(aiResponse);

    // 포맷팅 후 검증
    if (!formattedResponse || formattedResponse.trim().length === 0) {
      console.error('[챗봇] 포맷팅된 응답이 비어있음');
      return res.status(500).json({
        success: false,
        error: '응답 포맷팅 중 오류가 발생했습니다.'
      });
    }

    res.json({
      success: true,
      response: formattedResponse,
      followups: followups,
      questionCount: questionCount || 0
    });

  } catch (error) {
    console.error('[챗봇] ❌ 최상위 오류:', error);
    console.error('[챗봇] ❌ 오류 메시지:', error.message);
    console.error('[챗봇] ❌ 오류 스택:', error.stack);
    console.error('[챗봇] ❌ 오류 이름:', error.name);
    console.error('[챗봇] ❌ 요청 본문 (일부):', JSON.stringify({
      analysisId: req.body.analysisId,
      category: req.body.category,
      hasQuestion: !!req.body.question,
      hasAnalysisData: !!req.body.analysisData
    }, null, 2));
    
    // 더 자세한 에러 메시지 제공
    let errorMessage = '챗봇 응답 생성 중 오류가 발생했습니다.';
    
    if (error.message.includes('GEMINI_API_KEY')) {
      errorMessage = 'GEMINI_API_KEY가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 추가해주세요.';
    } else if (error.message.includes('모델') || error.message.includes('model')) {
      errorMessage = 'AI 모델 초기화에 실패했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('JSON') || error.message.includes('json')) {
      errorMessage = '데이터 변환 중 오류가 발생했습니다. 분석 데이터 형식을 확인해주세요.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
