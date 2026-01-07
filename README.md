# UX Insight - AI Design QC Tool

AI 기반 디자인 시안 분석 및 피드백 제공 웹 서비스입니다. 디자이너/기획자가 웹 브라우저에서 디자인 시안을 업로드하면, AI가 UX 결함을 분석하고 시각적으로 피드백을 제공합니다.

## 주요 기능

- **이미지 업로드**: 드래그 앤 드롭 또는 클릭으로 디자인 시안 업로드
- **맥락 입력**: 플랫폼, 서비스 유형, 타겟 유저, 페이지 목표, 현재 단계 등 설정
- **AI 분석**: Gemini Vision API를 통한 전문가 수준의 UX/UI QC
- **인터랙티브 피드백**: 피드백 항목에 마우스를 올리면 이미지에서 해당 문제 영역이 강조됨
- **4가지 분석 파트**:
  - PART 1: 기본 UX & 사용성 (접근성, 플랫폼 표준, 시각적 위계, 어포던스)
  - PART 2: UX 라이팅 & 맥락 (인지 부하, 맥락 연결, 용어 적합성)
  - PART 3: 레이아웃 안정성 & 엣지 케이스 (데이터 변동, 상태 변화, 디바이스 대응)
  - PART 4: 디자이너 판단 분리 (필수 수정 vs 유지/논의)

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Shadcn/ui
- **AI Model**: Google Gemini Vision API
- **Icons**: Lucide React

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Gemini API 키는 [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급받을 수 있습니다.

**⚠️ API Rate Limit 주의사항**
- 무료 티어: 분당 15회 요청 제한
- 이미지 분석은 리소스를 많이 사용하므로 연속 요청 시 제한에 걸릴 수 있습니다
- 429 에러 발생 시 1분 정도 대기 후 재시도하세요

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
/Users/madup/Documents/vibe/aiqc/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # Gemini API 연동
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # 메인 페이지
├── components/
│   ├── ui/                       # Shadcn UI 컴포넌트
│   ├── AnalysisOverlay.tsx       # 이미지 오버레이
│   ├── ConfigPanel.tsx           # 설정 패널
│   ├── ImageUploader.tsx         # 이미지 업로더
│   └── ResultPanel.tsx           # 결과 패널
├── store/
│   └── useAppStore.ts            # Zustand 스토어
├── types/
│   └── index.ts                  # TypeScript 타입 정의
└── lib/
    └── utils.ts                  # 유틸리티 함수
```

## 사용 방법

1. **이미지 업로드**: 좌측 캔버스 영역에 디자인 시안을 드래그 앤 드롭하거나 클릭하여 업로드합니다.

2. **설정 입력**: 우측 패널에서 다음 정보를 입력합니다:
   - 플랫폼 (모바일 / 데스크탑)
   - 서비스 유형 (예: 30대 직장인을 위한 비대면 대출 핀테크 앱)
   - 타겟 유저 (예: 금융 용어가 어렵고 성격이 급한 사용자)
   - 페이지 목표 (예: 복잡한 정보 없이 '한도 조회' 버튼을 누르게 하는 것)
   - 현재 단계 (예: 본인 인증 직후 → [현재 화면] → 결과 대기)
   - 분석 파트 선택 (PART 1~4 중 원하는 항목 체크)

3. **AI 분석 시작**: "AI 분석 시작" 버튼을 클릭합니다.

4. **결과 확인**: 분석이 완료되면 "결과" 탭으로 자동 전환됩니다. 피드백 카드에 마우스를 올리면 이미지에서 해당 문제 영역이 빨간색 점선으로 표시됩니다.

## 개발 참고사항

- **QC 룰셋 프롬프트**: 10년 차 Senior UX 디자이너 페르소나로 닐슨의 휴리스틱, WCAG 2.2, HIG/Material Design 기준 적용
- **Gemini API**: OpenAI SDK 호환 인터페이스를 제공하므로 `openai` 패키지를 사용합니다.
- **좌표 시스템**: 퍼센트(%) 단위로 저장되어 반응형 레이아웃에 대응합니다.
- **AI 응답**: JSON 형식으로 파싱되며, 마크다운 코드 블록이 포함될 수 있습니다.
- **필수 입력 검증**: 모든 필수 필드 입력 및 최소 1개 분석 파트 선택 시 분석 버튼 활성화

## TODO

- [ ] Slack 연동 기능
- [ ] Jira 티켓 생성 기능
- [ ] 분석 결과 PDF 내보내기
- [ ] 과거 분석 이력 저장/불러오기

## 라이선스

MIT
