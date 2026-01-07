import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini 클라이언트 초기화
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  
  return new GoogleGenerativeAI(apiKey);
}

// Base64 이미지를 Gemini 형식으로 변환
function base64ToGeminiPart(base64Image: string) {
  // data:image/png;base64,... 형식에서 MIME 타입과 데이터 추출
  const matches = base64Image.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('잘못된 base64 이미지 형식입니다.');
  }
  
  return {
    inlineData: {
      mimeType: matches[1],
      data: matches[2],
    },
  };
}

const FEEDBACK_PART_DESCRIPTIONS = {
  'part1-basic-ux': {
    title: 'PART 1. 기본 UX & 휴리스틱 평가 (Integrated UX Audit)',
    description: `Nielsen의 휴리스틱, Laws of UX, WCAG 접근성 기준을 통합하여 체계적으로 분석하세요.

**📋 Nielsen's Usability Heuristics (각 항목을 반드시 체크):**
- H1 (시스템 상태 가시성): 사용자가 현재 무슨 일이 일어나고 있는지 알 수 있는가? (로딩 상태, 진행률, 피드백)
- H2 (실세계 매칭): 아이콘과 용어가 사용자에게 친숙하고 멘탈 모델과 일치하는가?
- H3 (사용자 통제와 자유): 사용자가 쉽게 되돌리기, 취소, 빠져나가기를 할 수 있는가?
- H4 (일관성과 표준): 플랫폼 가이드라인(iOS HIG/Material Design)과 내부 일관성을 준수하는가?
- H5 (오류 방지): 방어적 디자인인가? 제약 조건과 확인 단계가 명확한가?
- H6 (재인식 우선): 핵심 정보가 가시적이며, 사용자가 기억에 의존하지 않아도 되는가?
- H7 (미학과 미니멀리즘): 신호 대 잡음 비율이 높은가? 불필요한 요소는 없는가?
- H8 (오류 인식 및 복구): 에러 메시지가 명확하고, 복구 방법을 제시하는가?

**🎯 Laws of UX (인지 심리학 기반 평가):**
- L1 (Hick's Law): 선택지가 너무 많아 인지 부하를 일으키지 않는가? 주요 행동이 명확한가?
- L2 (Fitts's Law): 인터랙티브 요소의 크기가 충분한가? (모바일 44px+, 데스크톱 클릭 영역)
- L3 (Jakob's Law): 일반적인 웹/앱 관습을 따르는가? 사용자의 기존 멘탈 모델과 충돌하지 않는가?
- L4 (근접성/공통 영역의 법칙): 관련 요소들이 시각적으로 그룹화되어 있는가?

**♿ Accessibility (WCAG 2.2 AA 기준):**
- 명도 대비: 텍스트와 배경의 대비가 충분한가? (일반 텍스트 4.5:1, 큰 텍스트 3:1)
- 텍스트 크기: 타겟 유저가 읽기에 충분한 폰트 크기인가?
- 색맹 고려: 정보가 색상만으로 전달되지 않는가? 다른 시각적 단서가 있는가?

**분석 시 주의사항:**
- 각 휴리스틱/법칙을 명시적으로 언급하세요 (예: "H5 위반: 삭제 전 확인 절차 없음")
- 타겟 유저의 특성과 페이지 목표를 고려하여 우선순위를 판단하세요
- 문제의 근거와 사용자 영향을 명확히 설명하세요`,
  },
  'part2-ux-writing': {
    title: 'PART 2. UX 라이팅 & 맥락 QA (의미 전달)',
    description: `버튼, 라벨, 안내 문구를 타겟 유저의 관점에서 분석하세요:
- 인지 부하: 사용자가 한 번에 처리해야 할 정보가 너무 많지 않은가?
- 맥락 연결: 이전 단계에서의 경험과 현재 화면이 논리적으로 이어지는가?
- 용어 적합성: 내부 전문 용어(Jargon)가 사용되지 않았는가?
- 예측 가능성: 버튼 라벨이 클릭 후의 결과를 명확히 암시하는가?`,
  },
  'part3-layout-stability': {
    title: 'PART 3. 레이아웃 안정성 & 엣지 케이스 QA',
    description: `정적 이미지가 아닌, 실제 개발 및 구동 환경을 시뮬레이션하여 문제를 찾으세요:
- 데이터 변동: 텍스트 길이 30%~200% 증가, 숫자(금액) 최대 단위 표시
- 상태 변화: 데이터 로딩 중(Skeleton), 데이터 없음(Empty State), 에러 발생 시 처리 고려 여부
- 디바이스 대응: 폰트 크기 확대(시스템 설정), 작은 해상도(iPhone SE 등)에서의 줄 바꿈`,
  },
  'part4-designer-judgment': {
    title: 'PART 4. 디자이너 판단 분리 (전략적 필터링)',
    description: `위에서 발견된 이슈 중 '반드시 고쳐야 할 것'과 '디자인 의도상 유지해도 되는 것'을 전문가 시각에서 분류하세요:
- 🚨 Fix Immediately (필수 수정): 사용성이나 접근성에 치명적이며, KPI 달성을 방해하는 요소
- 🤔 Discuss / Keep (유지 또는 논의): UX 원칙에는 약간 어긋나지만, [현재 화면의 목표]나 [서비스 컨텍스트]를 위해 전략적으로 유지할 가치가 있는 요소 (이유 명시 필수)`,
  },
};

// 1차 API: Object Detection (좌표 추출 전용)
async function detectObjects(
  client: GoogleGenerativeAI,
  imagePart: any,
  imgWidth: number,
  imgHeight: number
) {
  const model = client.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

  const objectDetectionPrompt = `
당신은 UI/UX 디자인 이미지 분석 전문가입니다.

**임무**: 이 디자인 이미지에서 문제가 있을 가능성이 높은 UI 요소들의 위치를 정확하게 감지하세요.

**이미지 크기**: ${imgWidth}px × ${imgHeight}px

**감지할 요소 예시**:
- 작은 버튼이나 터치 영역
- 대비가 낮은 텍스트
- 정렬이 어긋난 요소
- 크기가 일관되지 않은 요소
- 그룹화가 명확하지 않은 섹션
- 주요 정보 카드나 컨테이너

**응답 형식 (JSON):**
반드시 다음 형식으로만 응답하세요. 코드 펜싱은 절대 사용하지 마세요.

{
  "detected_elements": [
    {
      "label": "요소의 간단한 설명 (예: 상단 헤더 영역, 중앙 카드 섹션)",
      "box_2d": [ymin, xmin, ymax, xmax]
    }
  ]
}

**좌표 형식**: [ymin, xmin, ymax, xmax] (0-1000 정규화 스케일)
- ymin: 요소 상단의 Y 좌표 (0 = 이미지 맨 위, 1000 = 이미지 맨 아래)
- xmin: 요소 왼쪽의 X 좌표 (0 = 이미지 맨 왼쪽, 1000 = 이미지 맨 오른쪽)
- ymax: 요소 하단의 Y 좌표
- xmax: 요소 오른쪽의 X 좌표

**중요**: 
- 최대 10개의 주요 UI 요소만 감지하세요
- 정확한 경계 좌표를 제공하세요
- JSON 형식만 반환하고, 다른 텍스트는 포함하지 마세요
`;

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: objectDetectionPrompt },
          imagePart,
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3, // 낮은 temperature로 일관성 향상
      maxOutputTokens: 2048,
      responseMimeType: 'application/json', // JSON 강제
    },
  });

  const response = await result.response;
  const text = response.text();
  
  console.log('🔍 Object Detection Raw Response:', text);
  
  // JSON 파싱
  let jsonData;
  try {
    jsonData = JSON.parse(text);
  } catch (e) {
    // 코드 펜싱 제거 시도
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    jsonData = JSON.parse(cleanText);
  }

  return jsonData.detected_elements || [];
}

// 2차 API: UX 분석 (1차에서 얻은 좌표 활용)
async function analyzeUX(
  client: GoogleGenerativeAI,
  imagePart: any,
  detectedElements: any[],
  context: any,
  imgWidth: number,
  imgHeight: number
) {
  const { platform, serviceType, targetUser, pageGoal, currentStage, feedbackTypes } = context;
  
  // 선택된 피드백 파트 설명 생성
  const selectedParts = feedbackTypes
    .map((type: string) => {
      const part = FEEDBACK_PART_DESCRIPTIONS[type as keyof typeof FEEDBACK_PART_DESCRIPTIONS];
      return `🔎 ${part.title}\n${part.description}`;
    })
    .join('\n\n');

  // 플랫폼별 피드백 룰
  const platformRule = platform === 'mobile'
    ? `**🚫 플랫폼 제한 규칙 (중요):**
- 이 디자인은 **모바일 플랫폼 전용**입니다.
- 모바일 환경에서만 발생하는 문제를 분석하세요.
- 데스크톱 환경이나 반응형 웹 관련 피드백은 절대 하지 마세요.
- 모바일 터치 인터랙션, 작은 화면 크기, iOS/Android 가이드라인에만 집중하세요.`
    : `**🚫 플랫폼 제한 규칙 (중요):**
- 이 디자인은 **데스크톱 플랫폼 전용**입니다.
- 데스크톱 환경에서만 발생하는 문제를 분석하세요.
- 모바일 환경이나 터치 인터랙션 관련 피드백은 절대 하지 마세요.
- 마우스 호버, 큰 화면 크기, 웹 표준에만 집중하세요.`;

  // 감지된 요소 목록 생성
  const elementsList = detectedElements
    .map((elem, idx) => `${idx + 1}. ${elem.label}: [${elem.box_2d.join(', ')}]`)
    .join('\n');

  const uxAnalysisPrompt = `
당신은 10년 차 Senior UX 디자이너이자 사용자 경험 연구원(UX Researcher)입니다.

닐슨의 사용성 휴리스틱(Nielsen's 10 Usability Heuristics), WCAG 2.2(접근성), 그리고 최신 모바일 UX 트렌드(HIG/Material Design)를 기준으로 엄격하고 통찰력 있는 피드백을 제공합니다.

${platformRule}

**📋 디자인 컨텍스트:**
- 서비스 유형: ${serviceType}
- 타겟 유저: 뷰티, 건기식 브랜드의 퍼포먼스 마케터 및 쇼핑몰 운영자
- 현재 화면의 목표: ${pageGoal}
- 타겟 플랫폼: ${platform === 'mobile' ? '모바일' : '데스크톱'}
- 현재 단계: ${currentStage}

**🔍 감지된 UI 요소 (0-1000 정규화 좌표):**
${elementsList}

**📐 이미지 크기**: ${imgWidth}px × ${imgHeight}px

**🎯 분석 요청:**
아래 관점으로 이미지를 분석하세요:

${selectedParts}

**응답 형식 (JSON):**
반드시 다음 형식으로만 응답하세요. 코드 펜싱은 절대 사용하지 마세요.

{
  "score": 85,
  "summary": "전체적인 평가 요약 (2-3문장)",
  "feedback_list": [
    {
      "id": 1,
      "type": "기본 UX & 사용성",
      "severity": "High",
      "title": "문제 제목",
      "description": "문제의 원인과 사용자에게 미칠 심리적 영향",
      "action_plan": "구체적인 수정 권고",
      "box_2d": [ymin, xmin, ymax, xmax]
    }
  ]
}

**🚨 중요 규칙:**
1. box_2d는 위의 감지된 요소 중 하나를 선택하거나, 직접 측정하세요
2. box_2d 형식: [ymin, xmin, ymax, xmax] (0-1000 정규화 스케일)
3. **title, description, action_plan에는 좌표 숫자를 절대 포함하지 마세요**
4. 위치는 "상단 헤더", "화면 중앙" 같은 자연스러운 표현만 사용하세요
5. JSON 형식만 반환하고, 다른 텍스트는 포함하지 마세요
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
        ],
      },
    ],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json', // JSON 강제
    },
  });

  const response = await result.response;
  const text = response.text();
  
  console.log('📊 UX Analysis Raw Response:', text.substring(0, 500) + '...');
  
  // JSON 파싱
  let jsonData;
  try {
    jsonData = JSON.parse(text);
  } catch (e) {
    // 코드 펜싱 제거 시도
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    jsonData = JSON.parse(cleanText);
  }

  return jsonData;
}

// 좌표 변환: 0-1000 스케일 → 픽셀 → 퍼센트
function convertCoordinates(box2d: number[], imgWidth: number, imgHeight: number) {
  const [ymin, xmin, ymax, xmax] = box2d;
  
  // 1. 0-1000 스케일을 픽셀로 변환
  const pixelCoords = {
    top: Math.round((ymin / 1000) * imgHeight),
    left: Math.round((xmin / 1000) * imgWidth),
    bottom: Math.round((ymax / 1000) * imgHeight),
    right: Math.round((xmax / 1000) * imgWidth),
  };
  
  // 2. 픽셀을 퍼센트로 변환
  const percentCoords = {
    top: (pixelCoords.top / imgHeight) * 100,
    left: (pixelCoords.left / imgWidth) * 100,
    width: ((pixelCoords.right - pixelCoords.left) / imgWidth) * 100,
    height: ((pixelCoords.bottom - pixelCoords.top) / imgHeight) * 100,
  };
  
  return { pixelCoords, percentCoords };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, imageSize, context } = body;

    if (!image || !context) {
      return NextResponse.json(
        { error: '이미지와 컨텍스트 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이미지 크기 정보
    const imgWidth = imageSize?.width || 1920;
    const imgHeight = imageSize?.height || 1080;

    console.log(`📏 Image Size: ${imgWidth}x${imgHeight}`);

    // Gemini 클라이언트 초기화
    const client = getGeminiClient();
    const imagePart = base64ToGeminiPart(image);

    // 🔍 1단계: Object Detection (좌표 추출)
    console.log('🔍 Step 1: Object Detection...');
    const detectedElements = await detectObjects(client, imagePart, imgWidth, imgHeight);
    console.log(`✅ Detected ${detectedElements.length} elements`);

    // 📊 2단계: UX 분석 (1차 좌표 활용)
    console.log('📊 Step 2: UX Analysis...');
    const analysisResult = await analyzeUX(
      client,
      imagePart,
      detectedElements,
      context,
      imgWidth,
      imgHeight
    );
    console.log(`✅ Found ${analysisResult.feedback_list?.length || 0} issues`);

    // 좌표 변환: box_2d (0-1000) → coordinates (퍼센트)
    if (analysisResult.feedback_list && Array.isArray(analysisResult.feedback_list)) {
      analysisResult.feedback_list = analysisResult.feedback_list.map((item: any) => {
        if (item.box_2d && Array.isArray(item.box_2d)) {
          const { pixelCoords, percentCoords } = convertCoordinates(
            item.box_2d,
            imgWidth,
            imgHeight
          );
          
          console.log(`🎯 Coordinate Conversion [${item.title}]:`, {
            box_2d: item.box_2d,
            pixelCoords,
            percentCoords,
          });
          
          // box_2d 제거하고 coordinates로 교체
          delete item.box_2d;
          item.coordinates = percentCoords;
        }
        return item;
      });
    }

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
