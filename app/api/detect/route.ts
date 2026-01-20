import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, base64ToGeminiPart, parseGeminiJson } from '@/lib/gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
            temperature: 0.3,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
        },
    });

    const response = await result.response;
    const text = response.text();

    console.log('🔍 Object Detection Raw Response:', text);

    const jsonData = parseGeminiJson(text);
    return jsonData.detected_elements || [];
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { image, imageSize } = body;

        if (!image) {
            return NextResponse.json(
                { error: '이미지가 필요합니다.' },
                { status: 400 }
            );
        }

        const imgWidth = imageSize?.width || 1920;
        const imgHeight = imageSize?.height || 1080;

        const client = getGeminiClient();
        const imagePart = base64ToGeminiPart(image);

        console.log('🔍 Step 1: Object Detection...');
        const detectedElements = await detectObjects(client, imagePart, imgWidth, imgHeight);
        console.log(`✅ Detected ${detectedElements.length} elements`);

        return NextResponse.json({ detectedElements });
    } catch (error) {
        console.error('Detection error:', error);

        return NextResponse.json(
            {
                error: '요소 감지 중 오류가 발생했습니다.',
                details: error instanceof Error ? error.message : '알 수 없는 오류',
            },
            { status: 500 }
        );
    }
}
