import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini 클라이언트 초기화
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  
  return new GoogleGenerativeAI(apiKey);
}

// Base64 이미지를 Gemini 형식으로 변환
export function base64ToGeminiPart(base64Image: string) {
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

// JSON 파싱 헬퍼 (코드 펜싱 제거)
export function parseGeminiJson(text: string) {
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
