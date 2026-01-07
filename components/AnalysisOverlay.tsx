'use client';

import { useAppStore } from '@/store/useAppStore';
import { useMemo } from 'react';

interface AnalysisOverlayProps {
  imageRect: DOMRect | null;
}

export function AnalysisOverlay({ imageRect }: AnalysisOverlayProps) {
  const { analysisResult, hoveredItemId } = useAppStore();

  const hoveredItem = useMemo(() => {
    if (!analysisResult || hoveredItemId === null) return null;
    return analysisResult.feedback_list.find((item) => item.id === hoveredItemId);
  }, [analysisResult, hoveredItemId]);

  if (!hoveredItem || !hoveredItem.coordinates || !imageRect) return null;

  const { top, left, width, height } = hoveredItem.coordinates;

  // 퍼센트 좌표를 이미지의 실제 렌더링 크기에 맞게 변환
  const actualTop = imageRect.top + (imageRect.height * top) / 100;
  const actualLeft = imageRect.left + (imageRect.width * left) / 100;
  const actualWidth = (imageRect.width * width) / 100;
  const actualHeight = (imageRect.height * height) / 100;

  return (
    <div
      className="absolute border-2 border-red-500 border-dashed bg-red-500/10 pointer-events-none transition-all duration-200 ease-in-out animate-pulse"
      style={{
        top: `${actualTop}px`,
        left: `${actualLeft}px`,
        width: `${actualWidth}px`,
        height: `${actualHeight}px`,
      }}
    >
      <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
        {hoveredItem.title}
      </div>
    </div>
  );
}
