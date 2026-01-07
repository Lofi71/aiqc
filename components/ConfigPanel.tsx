'use client';

import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Check } from 'lucide-react';
import { Platform, FeedbackType, Severity } from '@/types';
import { useState } from 'react';

const SEVERITY_COLORS: Record<Severity, string> = {
  High: 'bg-red-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-blue-500',
};

export function ConfigPanel() {
  const { 
    designContext, 
    setDesignContext, 
    uploadedImage, 
    isAnalyzing,
    setIsAnalyzing,
    setAnalysisResult,
    analysisResult,
    setHoveredItemId,
  } = useAppStore();

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!uploadedImage) return;

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: uploadedImage,
          context: designContext,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        const errorMessage = result.details || result.error || '분석 요청에 실패했습니다.';
        throw new Error(errorMessage);
      }

      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.';
      
      if (errorMessage.includes('429') || errorMessage.includes('한도')) {
        alert('⏱️ API 요청 제한\n\nGemini API의 요청 한도에 도달했습니다.\n잠시 후(약 1분) 다시 시도해주세요.\n\n💡 무료 티어는 분당 15회로 제한됩니다.');
      } else if (errorMessage.includes('401') || errorMessage.includes('API 키')) {
        alert('🔑 API 키 오류\n\n.env.local 파일의 GEMINI_API_KEY를 확인해주세요.');
      } else {
        alert(`❌ 오류 발생\n\n${errorMessage}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFeedbackTypeChange = (type: FeedbackType, checked: boolean) => {
    const currentTypes = designContext.feedbackTypes;
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter((t) => t !== type);
    
    setDesignContext({ feedbackTypes: newTypes });
  };

  const handleCopyCard = async (item: any) => {
    const markdown = `## ${item.title}

**유형:** ${item.type}
**심각도:** ${item.severity}

### 문제
${item.description}

### 개선 방안
${item.action_plan}`;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      alert('복사에 실패했습니다.');
    }
  };

  const isFormValid = 
    uploadedImage && 
    !isAnalyzing && 
    designContext.feedbackTypes.length > 0 &&
    designContext.serviceType.trim() !== '' &&
    designContext.pageGoal.trim() !== '';

  // 분석 결과가 있으면 결과만 표시
  if (analysisResult) {
    return (
      <div className="px-6 py-6 space-y-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* 종합 점수 */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold">분석 결과</h2>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-primary">
              {analysisResult.score}
            </div>
            <div className="text-xs text-muted-foreground">/ 100</div>
          </div>
          <p className="text-xs text-foreground">{analysisResult.summary}</p>
        </div>

        {/* 피드백 리스트 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            발견된 문제 ({analysisResult.feedback_list.length}개)
          </h3>
          {analysisResult.feedback_list.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-md transition-all relative group"
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              <CardHeader className="px-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xs font-semibold">{item.title}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={`${SEVERITY_COLORS[item.severity]} text-white text-[10px] px-1.5 py-0`}
                  >
                    {item.severity}
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground">{item.type}</div>
              </CardHeader>
              <CardContent className="space-y-1.5 px-3">
                <div>
                  <p className="text-[10px] font-medium mb-0.5">문제</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium mb-0.5">개선 방안</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {item.action_plan}
                  </p>
                </div>
                
                {/* 복사 버튼 */}
                <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCard(item);
                    }}
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="mr-1 h-3 w-3" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3 w-3" />
                        복사하기
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 분석 전: 설정 폼 표시
  return (
    <div className="px-6 py-6 space-y-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div>
        <h2 className="text-2xl font-bold mb-6">설정</h2>
      </div>

      {/* 플랫폼 선택 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">플랫폼</Label>
        <Tabs
          value={designContext.platform}
          onValueChange={(value) =>
            setDesignContext({ platform: value as Platform })
          }
        >
          <TabsList className="w-full">
            <TabsTrigger value="mobile" className="flex-1">
              모바일
            </TabsTrigger>
            <TabsTrigger value="desktop" className="flex-1">
              데스크탑
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 서비스 요약 */}
      <div className="space-y-2">
        <Label htmlFor="serviceType" className="text-sm font-semibold">
          서비스 요약
        </Label>
        <Input
          id="serviceType"
          placeholder="예: 퍼포먼스 마케팅 데이터 분석 툴, 소재 유형 분류 툴 등"
          value={designContext.serviceType}
          onChange={(e) => setDesignContext({ serviceType: e.target.value })}
        />
      </div>

      {/* 페이지 목표 */}
      <div className="space-y-2">
        <Label htmlFor="pageGoal" className="text-sm font-semibold">
          페이지 목표
        </Label>
        <Textarea
          id="pageGoal"
          placeholder="예: '한도 조회' 버튼을 누르게 하는 것"
          value={designContext.pageGoal}
          onChange={(e) => setDesignContext({ pageGoal: e.target.value })}
          rows={2}
        />
      </div>

      {/* 현재 단계 */}
      <div className="space-y-2">
        <Label htmlFor="currentStage" className="text-sm font-semibold">
          현재 단계
        </Label>
        <Input
          id="currentStage"
          placeholder="예: 본인 인증 → [현재] → 결과 대기"
          value={designContext.currentStage}
          onChange={(e) => setDesignContext({ currentStage: e.target.value })}
        />
      </div>

      {/* 피드백 파트 선택 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">분석 파트 (최소 1개)</Label>
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="part1-basic-ux"
              checked={designContext.feedbackTypes.includes('part1-basic-ux')}
              onCheckedChange={(checked) =>
                handleFeedbackTypeChange('part1-basic-ux', checked as boolean)
              }
            />
            <div className="flex-1">
              <Label
                htmlFor="part1-basic-ux"
                className="cursor-pointer text-xs font-medium leading-tight"
              >
                PART 1. 기본 UX & 사용성
              </Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                접근성, 플랫폼 표준, 시각적 위계
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="part2-ux-writing"
              checked={designContext.feedbackTypes.includes('part2-ux-writing')}
              onCheckedChange={(checked) =>
                handleFeedbackTypeChange('part2-ux-writing', checked as boolean)
              }
            />
            <div className="flex-1">
              <Label
                htmlFor="part2-ux-writing"
                className="cursor-pointer text-xs font-medium leading-tight"
              >
                PART 2. UX 라이팅 & 맥락
              </Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                인지 부하, 맥락 연결, 용어 적합성
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="part3-layout-stability"
              checked={designContext.feedbackTypes.includes('part3-layout-stability')}
              onCheckedChange={(checked) =>
                handleFeedbackTypeChange('part3-layout-stability', checked as boolean)
              }
            />
            <div className="flex-1">
              <Label
                htmlFor="part3-layout-stability"
                className="cursor-pointer text-xs font-medium leading-tight"
              >
                PART 3. 레이아웃 안정성
              </Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                데이터 변동, 상태 변화, 디바이스 대응
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="part4-designer-judgment"
              checked={designContext.feedbackTypes.includes('part4-designer-judgment')}
              onCheckedChange={(checked) =>
                handleFeedbackTypeChange('part4-designer-judgment', checked as boolean)
              }
            />
            <div className="flex-1">
              <Label
                htmlFor="part4-designer-judgment"
                className="cursor-pointer text-xs font-medium leading-tight"
              >
                PART 4. 디자이너 판단
              </Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                필수 수정 vs 유지/논의 구분
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI 분석 시작 버튼 */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleAnalyze}
        disabled={!isFormValid}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            분석 중...
          </>
        ) : (
          'AI 분석 시작'
        )}
      </Button>
      
      {!isFormValid && uploadedImage && (
        <p className="text-xs text-destructive text-center">
          모든 필수 항목을 입력하고 최소 1개의 분석 파트를 선택하세요.
        </p>
      )}
    </div>
  );
}
