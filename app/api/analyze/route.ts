import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  
  return new OpenAI({
    apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  });
}

const FEEDBACK_PART_DESCRIPTIONS = {
  'part1-basic-ux': {
    title: 'PART 1. 기본 UX & 사용성 QA (표준 및 위계)',
    description: `다음 기준을 엄격히 적용하여 문제를 찾으세요:
- 접근성: WCAG 2.2 AA (명도 대비, 폰트 크기)
- 플랫폼 표준: 타겟 플랫폼(iOS/Android)의 최소 터치 영역 및 컴포넌트 관례 준수 여부
- 시각적 위계(Visual Hierarchy): 사용자의 시선이 [현재 화면의 목표]에 자연스럽게 도달하는가? (가장 중요한 정보가 가장 눈에 띄는가?)
- 어포던스(Affordance): 누를 수 있는 요소와 단순 정보가 명확히 구분되는가?`,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, context } = body;

    if (!image || !context) {
      return NextResponse.json(
        { error: '이미지와 컨텍스트 정보가 필요합니다.' },
        { status: 400 }
      );
    }

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

    // QC 마스터 프롬프트
    const systemPrompt = `당신은 10년 차 Senior UX 디자이너이자 사용자 경험 연구원(UX Researcher)입니다.

닐슨의 사용성 휴리스틱(Nielsen's 10 Usability Heuristics), WCAG 2.2(접근성), 그리고 최신 모바일 UX 트렌드(HIG/Material Design)를 기준으로 엄격하고 통찰력 있는 피드백을 제공합니다.

단순한 칭찬보다는 개선이 필요한 취약점 위주로 분석하세요.

${platformRule}

**중요 지시사항:**
1. 아래 디자인 컨텍스트를 완전히 숙지하고 분석하세요.
2. 문제가 있는 영역의 **정확한 위치 좌표**를 반드시 포함하세요.
3. 좌표는 이미지 전체를 기준으로 한 **퍼센트(%) 단위**로 계산하세요.
   - top: 상단에서부터의 거리 (%)
   - left: 왼쪽에서부터의 거리 (%)
   - width: 영역의 너비 (%)
   - height: 영역의 높이 (%)
4. 좌표는 대략적이어도 괜찮지만, 반드시 모든 피드백 항목에 좌표를 포함해야 합니다.
5. 응답은 반드시 아래의 JSON 형식으로만 제공하세요.

**응답 형식:**
{
  "score": 85,
  "summary": "전체적인 평가 요약 (2-3문장)",
  "feedback_list": [
    {
      "id": 1,
      "type": "기본 UX & 사용성",
      "severity": "High",
      "title": "문제 제목",
      "description": "문제의 원인과 사용자에게 미칠 심리적 영향을 포함한 전문가 코멘트",
      "action_plan": "구체적인 수정 권고",
      "coordinates": {
        "top": 20.5,
        "left": 10.0,
        "width": 30.0,
        "height": 5.0
      }
    }
  ]
}`;

    const userPrompt = `1️⃣ 디자인 컨텍스트 (필수 숙지)

서비스 유형: ${serviceType}
타겟 유저: ${targetUser}
현재 화면의 목표(User Goal): ${pageGoal}
타겟 플랫폼: ${platform === 'mobile' ? '모바일 (MOBILE ONLY - 데스크톱 피드백 금지)' : '데스크톱 (DESKTOP ONLY - 모바일 피드백 금지)'}
현재 단계: ${currentStage}

⚠️ 중요: 타겟 플랫폼은 ${platform}입니다. 
${platform === 'mobile' 
  ? '모바일 환경에서만 발생하는 문제만 피드백하세요. 데스크톱이나 반응형 관련 피드백은 하지 마세요.' 
  : '데스크톱 환경에서만 발생하는 문제만 피드백하세요. 모바일이나 터치 관련 피드백은 하지 마세요.'}

2️⃣ 세부 QA 수행 요청

아래 관점으로 이미지를 분석하고 결과를 리포트하세요:

${selectedParts}

위 관점들을 바탕으로 디자인 시안의 문제점을 찾아내고, 각 문제 영역의 위치 좌표를 포함하여 JSON 형식으로 피드백을 제공해주세요.

각 피드백 항목은 다음 정보를 포함해야 합니다:
- Issue ID (id)
- 위치 좌표 (coordinates)
- 문제 유형 (type)
- 위험도 (severity: Critical / High / Medium / Low)
- 전문가 코멘트 (description)
- 수정 권고 (action_plan)`;

    // Gemini API 호출
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gemini-2.0-flash-exp',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: systemPrompt + '\n\n' + userPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: image, // data:image/...;base64,... 형식
              },
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('AI 응답이 비어있습니다.');
    }

    // JSON 파싱 (마크다운 코드 블록 제거)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const analysisResult = JSON.parse(jsonContent);

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Rate Limit 에러 처리
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status?: number; message?: string };
      
      if (apiError.status === 429) {
        return NextResponse.json(
          {
            error: 'API 요청 한도 초과',
            details: 'Gemini API의 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요. (무료 티어: 분당 15회 제한)',
          },
          { status: 429 }
        );
      }
      
      if (apiError.status === 401) {
        return NextResponse.json(
          {
            error: 'API 키 오류',
            details: 'Gemini API 키가 유효하지 않습니다. .env.local 파일의 GEMINI_API_KEY를 확인해주세요.',
          },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      {
        error: '분석 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
