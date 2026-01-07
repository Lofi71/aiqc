'use client';

import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2, FileText } from 'lucide-react';
import { Severity } from '@/types';

const SEVERITY_COLORS: Record<Severity, string> = {
  High: 'bg-red-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-blue-500',
};

export function ResultPanel() {
  const { analysisResult, setHoveredItemId } = useAppStore();

  if (!analysisResult) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground text-center">
          이미지를 업로드하고 설정을 완료한 후<br />
          AI 분석을 시작하세요.
        </p>
      </div>
    );
  }

  const handleExportSlack = () => {
    // TODO: Slack 연동
    alert('Slack 연동 기능은 준비 중입니다.');
  };

  const handleExportJira = () => {
    // TODO: Jira 연동
    alert('Jira 연동 기능은 준비 중입니다.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 종합 점수 */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">분석 결과</h2>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">
              {analysisResult.score}
            </div>
            <div className="text-sm text-muted-foreground">/ 100</div>
          </div>
          <p className="text-sm text-foreground">{analysisResult.summary}</p>
        </div>

        {/* 피드백 리스트 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            발견된 문제 ({analysisResult.feedback_list.length}개)
          </h3>
          {analysisResult.feedback_list.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={`${SEVERITY_COLORS[item.severity]} text-white`}
                  >
                    {item.severity}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{item.type}</div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium mb-1">문제</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">개선 방안</p>
                  <p className="text-sm text-muted-foreground">
                    {item.action_plan}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Export 버튼 */}
      <div className="border-t p-4 space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleExportSlack}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Slack으로 보내기
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleExportJira}
        >
          <FileText className="mr-2 h-4 w-4" />
          Jira 티켓 생성
        </Button>
      </div>
    </div>
  );
}


