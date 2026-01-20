import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, base64ToGeminiPart, parseGeminiJson } from '@/lib/gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ----------------------------------------------------------------------
// 1. Constants & Configurations
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// 1. Constants & Configurations
// ----------------------------------------------------------------------

// 도메인 및 플랫폼별 특화 룰셋 (Context-Aware Rules)
const DOMAIN_RULES = {
    ecommerce: `
- **Baymard Institute Guidelines**: 장바구니, 결제 프로세스, 상품 목록에서의 사용자 흐름 최적화 기준을 적용하세요.
- **Conversion Centric**: '구매 버튼'의 가시성, '가격 정보'의 명확성, '신뢰 요소(Trust Badges)'의 배치를 우선 평가하세요.`,

    finance: `
- **FSS/Financial Compliance**: 금액 표기(3자리 콤마), 중요 약관의 가시성, 보안 키패드 등 필수 요소 점검.
- **Trust & Safety**: 사용자에게 불안감을 줄 수 있는 모호한 표현이나 디자인을 엄격히 금지합니다.`,

    entertainment: `
- **Engagement Metrics**: 체류 시간(Time on Page)과 상호작용(Interaction)을 높이는 요소를 긍정적으로 평가하세요.
- **Immersion**: 몰입을 방해하는 불필요한 팝업이나 복잡한 텍스트를 지적하세요.`,
};

const PLATFORM_RULES = {
    mobile: `
- **iOS HIG / Material Design**: 터치 타겟은 최소 44pt/48dp 이상이어야 합니다.
- **Thumb Zone**: 주요 조작 요소가 하단 또는 엄지 손가락 도달 범위 내에 있는지 확인하세요.
- **Safe Area**: 노치(Notch)나 제스처 바(Home Indicator) 영역을 침범하지 않는지 확인하세요.`,

    desktop: `
- **Hover Interaction**: 클릭 가능한 요소에 마우스 호버 시각적 피드백이 있는지 확인하세요.
- **Space Utilization**: 넓은 화면을 효율적으로 사용하고 있는지(지나친 여백이나 빽빽함) 확인하세요.`,
};

// 전략적 판단 및 피드백 품질 룰셋 (Global Strategic Mindset)
const GLOBAL_STRATEGIC_MINDSET = `
## 전략적 사고 및 피드백 원칙 (Global Strategic Mindset)
당신은 단순한 '오류 탐지기'가 아닌, **비즈니스 성공을 돕는 전략적 파트너**입니다.
모든 발견 사항에 대해 다음 3가지 관점을 필수적으로 적용하여 판단하세요.

1.  **Business Probability (비즈니스 임팩트)**:
    -   이 문제가 KPI(전환율, 체류시간 등)에 악영향을 주는가?
    -   사소한 심미적 문제보다, 매출/전환에 직결되는 문제를 최우선으로 다루세요. (Severity: High 기준)

2.  **Intentional Design (의도된 디자인 판별)**:
    -   UX 원칙 위반처럼 보이나, 브랜드 차별화나 마케팅을 위한 **"의도된 위반(Intentional Violation)"**인지 구분하세요.
    -   예: "가독성을 약간 희생하더라도, 강렬한 인상을 주기 위한 타이포그래피"라면 무조건 수정하라고 하지 말고, 득실을 형량하세요.

3.  **Feasibility & Specificity (실행 가능성)**:
    -   모호한 피드백("더 잘 보이게 하세요")은 금지입니다.
    -   개발자나 디자이너가 즉시 수정할 수 있는 **구체적인 값(수치, 컬러, 텍스트)**을 제시해야 합니다.
`;

const SEVERITY_RUBRIC = `
## 심각도(Severity) 판정 기준 (Global Standard)
위의 [전략적 사고]에 기반하여 심각도를 결정하세요.
- **High**: 치명적 (Critical). 사용자의 핵심 과업(Goal) 또는 결제/가입 등 비즈니스 목표 달성을 불가능하게 함. (즉시 수정 필수)
- **Medium**: 주요함 (Major). 과업 달성은 가능하나, 상당한 인지 부하(Friction)를 주거나 이탈을 유발할 수 있음. (수정 권장)
- **Low**: 사소함 (Minor Issues). 미적 완성도 부족이나 아주 사소한 불편함. (개선 시 품질 향상)
`;

// 파트별 전문 표준 (Part-Specific Standards)
const FEEDBACK_PARTS = {
    'part1-basic-ux': {
        title: 'PART 1. 기본 UX & 휴리스틱 (Basic UX)',
        standards: [
            'Nielsen Norman Group (NN/g) 10 Usability Heuristics',
            'Laws of UX (Jakob\'s Law, Fitts\'s Law, Hick\'s Law)',
            'ISO 9241-11 (Usability Definitions)',
        ],
        objective: '사용성 공학(Usability Engineering) 관점에서 기본 원칙 위반 사항을 점검합니다.',
        checklist: [
            'H1. 시스템 상태 가시성 (사용자가 현재 상태를 알 수 있는가?)',
            'H2. 실세계 매칭 (친숙한 용어와 아이콘인가?)',
            'H3. 사용자 통제 (취소/뒤로가기가 쉬운가?)',
            'H4. 일관성과 표준 (플랫폼 관습을 따르는가?)',
            'H5. 오류 방지 (실수를 막는 장치가 있는가?)',
            'H6. 가시성 (기억보다 직관에 의존하는가?)',
            'H7. 효율성 & 미니멀리즘 (불필요한 정보는 없는가?)',
            'H8. 에러 복구 (문제 해결 방법을 제시하는가?)',
        ]
    },
    'part2-ux-writing': {
        title: 'PART 2. UX 라이팅 & 맥락 (UX Writing)',
        standards: [
            'Microsoft Style Guide (Voice & Tone)',
            'Plain Language Guidelines (쉬운 언어 쓰기)',
        ],
        objective: '텍스트가 사용자에게 명확한 정보와 행동을 유도하는지 분석합니다.',
        checklist: [
            '명확성: 모호한 표현 없이 직관적인가?',
            '간결성: 불필요한 수식어 없이 핵심만 전달하는가?',
            '용어 적합성: 어려운 전문 용어(Jargon) 대신 사용자 언어를 쓰는가?',
            '행동 유도: 버튼명이 클릭 후 결과를 예측하게 하는가?',
            '톤앤매너: 페르소나와 서비스 성격에 맞는 어조인가?',
        ]
    },
    'part3-layout-stability': {
        title: 'PART 3. 레이아웃 & 인터페이스 (UI/GUI)',
        standards: [
            'Google Material Design 3 (Layout, Spacing, States)',
            'Apple Human Interface Guidelines (Layout, Touch Targets)',
            'WCAG 2.2 AA (Color Contrast, Text Size)',
        ],
        objective: '시각적 계층 구조, 그리드 시스템, 플랫폼 표준 준수 여부를 점검합니다.',
        checklist: [
            '시각적 계층: 중요한 정보가 가장 먼저 눈에 띄는가?',
            '그리드 & 정렬: 요소들의 간격과 배치가 규칙적인가(8pt grid)?',
            '터치/클릭 영역: 사용자가 실수 없이 조작할 수 있는 크기인가?',
            '가독성: 배경과 텍스트의 명도 대비가 충분한가(최소 4.5:1)?',
            '상태 표현: Empty, Error, Loading 상태 등에 대한 고려가 보이는가?',
        ]
    },
};

// ----------------------------------------------------------------------
// 2. Persona Logic
// ----------------------------------------------------------------------

interface PersonaProfile {
    role: string;
    attitude: string;
    domain_rule_key?: keyof typeof DOMAIN_RULES;
}

function getPersona(serviceType: string, platform: string): PersonaProfile {
    // Feedback Expert Persona (객관성, 전문성 강화)
    const base: PersonaProfile = {
        role: 'Lead Product Designer & Logic-Driven UX Auditor',
        attitude: `
- **Objectivity**: "느낌"이 아닌 "원칙"과 "데이터"에 기반하여 말합니다.
- **Evidence-Based or Logical**: 근거 문서(NN/g, HIG 등)가 있다면 반드시 인용하고, 없다면 **"사용자 심리"와 "논리적 추론(First Principles)"**을 통해 설득합니다.
- **Critic**: 듣기 좋은 칭찬보다는, 뼈 아픈 개선점을 지적하여 제품을 성장시키는 역할을 자처합니다.`,
    };

    const typeLower = serviceType.toLowerCase();

    if (typeLower.match(/금융|은행|핀테크|finance|bank|fintech/)) {
        base.role = 'Finance UX Specialist';
        base.attitude += ' 신뢰(Trust)와 정확성을 0순위로 두며, 보수적인 관점(Conservative View)을 견지합니다.';
        base.domain_rule_key = 'finance';
    } else if (typeLower.match(/쇼핑|커머스|shop|commerce/)) {
        base.role = 'E-Commerce CRO Specialist';
        base.attitude += ' 구매 전환율(Conversion)을 최우선으로 하며, 마찰 없는(Frictionless) 경험에 집착합니다.';
        base.domain_rule_key = 'ecommerce';
    } else if (typeLower.match(/게임|엔터|game|entertainment/)) {
        base.role = 'Engagement & Interaction Designer';
        base.attitude += ' 단순 편리함보다는 "재미"와 "몰입감"을 중요하게 평가합니다.';
        base.domain_rule_key = 'entertainment';
    } else if (typeLower.match(/b2b|admin|saas|dashboard/)) {
        base.role = 'B2B SaaS Efficiency Expert';
        base.attitude += ' 데이터 가독성과 업무 생산성(Productivity)을 최우선으로 평가합니다.';
    }

    if (platform === 'mobile') {
        base.attitude += ' (Mobile First 관점: 엄지 손가락 영역, 제스처, 작은 화면에서의 가독성을 엄격하게 체크)';
    } else {
        base.attitude += ' (Desktop 관점: 마우스 호버, 키보드 접근성, 넓은 화면의 효율적 활용을 체크)';
    }

    return base;
}

// ----------------------------------------------------------------------
// 3. Coordinate Conversion Utility
// ----------------------------------------------------------------------

function convertCoordinates(box2d: number[], imgWidth: number, imgHeight: number) {
    const [ymin, xmin, ymax, xmax] = box2d;

    const percentCoords = {
        top: (ymin / 1000) * 100,
        left: (xmin / 1000) * 100,
        width: ((xmax - xmin) / 1000) * 100,
        height: ((ymax - ymin) / 1000) * 100,
    };

    return percentCoords;
}

// ----------------------------------------------------------------------
// 4. Main Analysis Function
// ----------------------------------------------------------------------

async function analyzeUX(
    client: GoogleGenerativeAI,
    imagePart: any,
    detectedElements: any[],
    context: any,
    referenceImages: any[],
    imgWidth: number,
    imgHeight: number,
) {
    const { platform, serviceType, targetUser, pageGoal, currentStage, feedbackTypes } = context;

    const persona = getPersona(serviceType, platform);
    console.log(`🎭 Persona: ${persona.role} (${persona.attitude})`);

    // 1. 도메인/플랫폼 맞춤형 규칙 생성
    // ... logic same as above ...
    let specializedRules = '';

    // 도메인 규칙
    if (persona.domain_rule_key && DOMAIN_RULES[persona.domain_rule_key]) {
        specializedRules += `### Domain Specific Standards (${serviceType})\n${DOMAIN_RULES[persona.domain_rule_key]}\n\n`;
    }

    // 플랫폼 규칙
    const platformKey = platform === 'mobile' ? 'mobile' : 'desktop';
    if (PLATFORM_RULES[platformKey]) {
        specializedRules += `### Platform Standards (${platform})\n${PLATFORM_RULES[platformKey]}\n`;
    }

    // 2. 구조화된 분석 관점 생성 (표준 포함)
    const selectedPartsContext = feedbackTypes
        .map((type: string) => {
            const part = FEEDBACK_PARTS[type as keyof typeof FEEDBACK_PARTS];
            if (!part) return '';

            // 파트별 표준 목록 생성
            const standardsText = part.standards
                ? `**Reference Standards**: ${part.standards.join(', ')}`
                : '';

            return `### ${part.title}
${standardsText}
- **목표**: ${part.objective}
- **체크리스트**:
${part.checklist.map(item => `  - ${item}`).join('\n')}`;
        })
        .join('\n\n');

    const elementsList = detectedElements
        .map((elem, idx) => `${idx + 1}. ${elem.label}: [${elem.box_2d.join(', ')}]`)
        .join('\n');

    // Reference Images Logic
    let refImagesContext = '';
    const refImageParts: any[] = [];

    if (referenceImages && referenceImages.length > 0) {
        refImagesContext = `
## 참고 이미지 (Context Images)
다음 이미지들이 추가로 제공됩니다. 분석 시 맥락으로만 참고하고, 직접적인 평가 대상으로는 삼지 마세요.
${referenceImages.map((img, idx) => `- 이미지 ${idx + 2}: ${getRefImageTypeLabel(img.type)} (파일명: ${img.fileName})`).join('\n')}
`;

        // Convert reference images to Gemini parts
        referenceImages.forEach(img => {
            refImageParts.push(base64ToGeminiPart(img.base64));
        });
    }

    const uxAnalysisPrompt = `
당신은 **${persona.role}**입니다.
**태도 및 관점**: ${persona.attitude}

---

## 1. 분석 대상 정보 (Context)
- 서비스 유형: ${serviceType}
- 타겟 유저: ${targetUser}
- 페이지 목표: ${pageGoal}
- 현재 단계: ${currentStage}
- 플랫폼: ${platform}
${refImagesContext}

## 2. 감지된 UI 요소 (Detected Elements)
좌표 기반 분석을 위해 다음 요소들의 위치를 참고하세요.
${elementsList}

---

## 3. 적용할 전문 표준 및 규칙 (Applied Standards)
다음의 도메인 및 플랫폼 규칙을 분석의 절대적인 기준으로 삼으세요.

${specializedRules}

${GLOBAL_STRATEGIC_MINDSET}

${SEVERITY_RUBRIC}

---

## 4. 분석 관점 및 체크리스트 (Analysis Scope)
각 파트별로 명시된 'Reference Standards'를 근거로 분석하세요.

${selectedPartsContext}

---

## 5. 출력 형식 (Output Format)
반드시 아래 JSON 형식으로만 응답하세요.

{
  "score": 0-100 사이의 점수 (냉정하게 평가),
  "summary": "전체 평가 요약 (참고 이미지가 있다면, 메인 이미지와의 맥락적 관계-일관성/흐름-를 포함하여 3문장 내외로 서술)",
  "feedback_list": [
    {
      "id": 1,
      "type": "분석 파트 이름",
      "severity": "High" | "Medium" | "Low",
      "_reasoning": "심각도 판정의 근거 (Standard 인용 또는 논리적 추론 과정 서술)",
      "title": "직관적인 문제 제목",
      "description": "문제 상황 설명 (절대 좌표값 포함 금지, 위치나 크기로 서술)",
      "action_plan": "구체적인 해결 방안 (수치, 컬러코드 포함)",
      "box_2d": [ymin, xmin, ymax, xmax]
    }
  ]
}

## 6. 분석 규칙 (Rules)
1. **Focus**: 첫 번째 이미지(Main Image)를 중심으로 분석하되, **Context Images와의 관계(일관성, 상태 변화)**를 고려하여 평가하세요.
2. **Citation vs Logic**: 
   - Known Pattern? -> Design Standard(Material, Baymard)를 인용하세요.
   - Unknown/Specific? -> **"Why?"(근거)**를 사용성 원칙이나 논리에 기반하여 설명하세요.
3. **Fact-Check (Spatial)**: 요소의 위치(상단/하단/좌측/우측)를 지적할 때는 반드시 **Detected Elements의 box_2d 좌표**를 확인하세요.
   - ymin < 100 (상단), ymin > 800 (하단) 등 좌표 기반으로 사실 관계가 맞을 때만 지적하세요. (잘못된 위치 지적은 절대 금지)
4. **Actionable**: 구체적인 변경 수치를 제안하세요.
5. **NO COORDINATES IN TEXT**: title, description, action_plan에 좌표 숫자를 절대 포함하지 마세요. 텍스트로 풀어 쓰세요.
6. **No Halucination**: 없는 요소를 지적하지 마세요.
7. **Coordinates**: box_2d는 [ymin, xmin, ymax, xmax] (0-1000 Scale)입니다.
`;

    const model = client.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
    });

    const result = await model.generateContent({
        contents: [
            {
                role: 'user',
                parts: [
                    { text: uxAnalysisPrompt },
                    imagePart,
                    ...refImageParts, // Add reference images
                ],
            },
        ],
        generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
        },
    });

    const response = await result.response;
    const text = response.text();

    console.log('📊 UX Analysis Raw Response:', text.substring(0, 300) + '...');

    const jsonData = parseGeminiJson(text);
    return jsonData;
}

function getRefImageTypeLabel(type: string) {
    switch (type) {
        case 'parent_page': return '상위/이전 페이지 (Parent Page) - 일관성/흐름 참고';
        case 'child_page': return '하위/다음 페이지 (Child Page) - 흐름/결과 참고';
        case 'error_state': return '에러/예외 케이스 (Error State) - 상태 처리 비교';
        case 'empty_state': return '데이터 없음 (Empty State) - 초기 상태 비교';
        case 'style_guide': return '스타일 가이드 (Style Guide) - 디자인 규칙 준수 확인';
        default: return '참고 이미지';
    }
}

// ----------------------------------------------------------------------
// 5. API Handler
// ----------------------------------------------------------------------

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { image, imageSize, context, detectedElements, referenceImages } = body;

        if (!image || !context) {
            return NextResponse.json(
                { error: '이미지와 컨텍스트 정보가 필요합니다.' },
                { status: 400 }
            );
        }

        const client = getGeminiClient();
        const imagePart = base64ToGeminiPart(image);

        const imgWidth = imageSize?.width || 1920;
        const imgHeight = imageSize?.height || 1080;

        console.log('📊 Step 2: UX Analysis...');
        console.log(`ℹ️ Service: ${context.serviceType} / Platform: ${context.platform}`);
        if (referenceImages?.length) {
            console.log(`🖼️ Context Images: ${referenceImages.length} files`);
        }

        const analysisResult = await analyzeUX(
            client,
            imagePart,
            detectedElements || [],
            context,
            referenceImages || [],
            imgWidth,
            imgHeight
        );

        // box_2d → coordinates (percent) 변환
        if (analysisResult.feedback_list && Array.isArray(analysisResult.feedback_list)) {
            analysisResult.feedback_list = analysisResult.feedback_list.map((item: any) => {
                if (item.box_2d && Array.isArray(item.box_2d)) {
                    const coords = convertCoordinates(item.box_2d, imgWidth, imgHeight);
                    return {
                        ...item,
                        coordinates: coords,
                    };
                }
                return item;
            });
        }

        console.log(`✅ Analysis complete. Found ${analysisResult.feedback_list?.length || 0} issues`);

        return NextResponse.json(analysisResult);

    } catch (error) {
        console.error('Analysis error:', error);

        return NextResponse.json(
            {
                error: '분석 중 오류가 발생했습니다.',
                details: error instanceof Error ? error.message : '알 수 없는 오류',
            },
            { status: 500 }
        );
    }
}
