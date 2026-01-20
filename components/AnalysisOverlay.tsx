'use client';

import { useAppStore } from '@/store/useAppStore';
import { useMemo } from 'react';
import { Severity } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface AnalysisOverlayProps {
  imageRect: DOMRect | null;
}

const SEVERITY_STYLES: Record<Severity, { border: string; bg: string; badge: string }> = {
  High: { border: 'border-red-500', bg: 'bg-red-500/10', badge: 'bg-red-500' },
  Medium: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', badge: 'bg-yellow-500' },
  Low: { border: 'border-blue-500', bg: 'bg-blue-500/10', badge: 'bg-blue-500' },
};

export function AnalysisOverlay({ imageRect }: AnalysisOverlayProps) {
  const { analysisResult, hoveredItemId, selectedItemId, setSelectedItemId } = useAppStore();

  const activeItem = useMemo(() => {
    if (!analysisResult) return null;
    return analysisResult.feedback_list.find(
      (item) => item.id === (selectedItemId || hoveredItemId)
    );
  }, [analysisResult, hoveredItemId, selectedItemId]);

  if (!activeItem || !activeItem.coordinates || !imageRect) return null;

  const { top, left, width, height } = activeItem.coordinates;
  const styles = SEVERITY_STYLES[activeItem.severity];

  // 퍼센트 좌표를 이미지의 실제 렌더링 크기에 맞게 변환
  const actualTop = imageRect.top + (imageRect.height * top) / 100;
  const actualLeft = imageRect.left + (imageRect.width * left) / 100;
  const actualWidth = (imageRect.width * width) / 100;
  const actualHeight = (imageRect.height * height) / 100;

  // 팝오버 위치 계산 (오버레이 오른쪽 or 왼쪽)
  const isPopoverRight = actualLeft + actualWidth + 320 < window.innerWidth;
  const popoverStyle = isPopoverRight
    ? { left: `${actualWidth + 10}px`, top: 0 }
    : { right: `${actualWidth + 10}px`, top: 0 };

  return (
    <>
      <div
        className={`absolute border-2 border-dashed transition-all duration-200 ease-in-out cursor-pointer z-20 ${styles.border
          } ${styles.bg} ${selectedItemId === activeItem.id ? 'animate-none' : 'animate-pulse'}`}
        style={{
          top: `${actualTop}px`, // DOMRect는 뷰포트 기준이므로 absolute 위치 조정 필요할 수 있음 (부모가 relative라면 ok)
          left: `${actualLeft}px`,
          width: `${actualWidth}px`,
          height: `${actualHeight}px`,
          // 부모 컨테이너(ImageUploader)가 relative이므로, imageRect.top/left 대신 계산된 offset 사용
          // ImageUploader의 imageRect는 container 내부의 offset을 포함하고 있음 (See ImageUploader implementation)
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedItemId(selectedItemId === activeItem.id ? null : activeItem.id);
        }}
      >
        {/* Simple Label (Hover Only) */}
        {!selectedItemId && (
          <div className={`absolute -top-7 left-0 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg ${styles.badge}`}>
            {activeItem.title}
          </div>
        )}

        {/* Detailed Popover (Selected Only) */}
        {selectedItemId === activeItem.id && (
          <Card
            className="absolute w-[300px] z-30 shadow-xl animate-in fade-in zoom-in-95 duration-200"
            style={popoverStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between space-y-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${styles.badge} text-white hover:${styles.badge} border-none`}>
                    {activeItem.severity}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{activeItem.type}</span>
                </div>
                <CardTitle className="text-sm font-bold leading-tight">{activeItem.title}</CardTitle>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemId(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <div>
                <p className="text-xs font-semibold mb-0.5">문제점</p>
                <p className="text-xs text-muted-foreground">{activeItem.description.replace(/\(?(?:[0-9]{2,4}[,]?\s*){4}\)?/g, '').trim()}</p>
              </div>
              <div className="bg-muted/50 p-2 rounded">
                <p className="text-xs font-semibold mb-0.5">💡 개선 방안</p>
                <p className="text-xs text-muted-foreground">{activeItem.action_plan.replace(/\(?(?:[0-9]{2,4}[,]?\s*){4}\)?/g, '').trim()}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Background Dim (Optional: to focus on selected item) */}
      {selectedItemId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setSelectedItemId(null)}
        />
      )}
    </>
  );
}
