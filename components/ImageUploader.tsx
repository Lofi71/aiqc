'use client';

import { useAppStore } from '@/store/useAppStore';
import { Upload, Trash2 } from 'lucide-react';
import { useCallback, useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnalysisOverlay } from './AnalysisOverlay';

export function ImageUploader() {
  const { uploadedImage, setUploadedImage, setImageSize, reset } = useAppStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageRect, setImageRect] = useState<DOMRect | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileChange = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        
        // 이미지 크기 추출
        const img = new Image();
        img.onload = () => {
          setImageSize({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    },
    [setUploadedImage, setImageSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFileChange(file);
      }
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileChange(file);
      }
    };
    input.click();
  }, [handleFileChange]);

  const handleDelete = useCallback(() => {
    reset();
    setShowDeleteDialog(false);
  }, [reset]);

  // 이미지 로드 시 실제 렌더링 크기 계산
  useEffect(() => {
    const updateImageRect = () => {
      if (imageRef.current && containerRef.current) {
        const img = imageRef.current;
        const container = containerRef.current;
        
        // 이미지의 실제 렌더링 크기 계산
        const containerRect = container.getBoundingClientRect();
        const imgNaturalRatio = img.naturalWidth / img.naturalHeight;
        const containerRatio = containerRect.width / containerRect.height;
        
        let renderedWidth, renderedHeight, offsetX, offsetY;
        
        if (imgNaturalRatio > containerRatio) {
          // 이미지가 컨테이너보다 가로로 더 긴 경우
          renderedWidth = containerRect.width;
          renderedHeight = containerRect.width / imgNaturalRatio;
          offsetX = 0;
          offsetY = (containerRect.height - renderedHeight) / 2;
        } else {
          // 이미지가 컨테이너보다 세로로 더 긴 경우
          renderedHeight = containerRect.height;
          renderedWidth = containerRect.height * imgNaturalRatio;
          offsetX = (containerRect.width - renderedWidth) / 2;
          offsetY = 0;
        }
        
        setImageRect(new DOMRect(offsetX, offsetY, renderedWidth, renderedHeight));
      }
    };

    if (uploadedImage && imageRef.current) {
      const img = imageRef.current;
      if (img.complete) {
        updateImageRect();
      } else {
        img.onload = updateImageRect;
      }
    }

    // 윈도우 리사이즈 시에도 재계산
    window.addEventListener('resize', updateImageRect);
    return () => window.removeEventListener('resize', updateImageRect);
  }, [uploadedImage]);

  return (
    <>
      <div ref={containerRef} className="relative w-full h-full">
        {!uploadedImage ? (
          <div
            className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
          >
            <Upload className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              이미지를 드래그 앤 드롭하거나 클릭하여 업로드하세요
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              PNG, JPG, JPEG, WEBP 형식 지원
            </p>
          </div>
        ) : (
          <div className="relative w-full h-full rounded-lg border border-gray-200 overflow-hidden">
            <img
              ref={imageRef}
              src={uploadedImage}
              alt="Uploaded design"
              className="w-full h-full object-contain"
            />
            <AnalysisOverlay imageRect={imageRect} />
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="absolute top-4 right-4 p-2 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-colors shadow-lg z-10"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이미지를 삭제하시겠습니까?</DialogTitle>
            <DialogDescription>
              현재 분석된 피드백도 모두 초기화됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
