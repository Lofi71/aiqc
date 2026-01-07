import { create } from 'zustand';
import { AppState, DesignContext } from '@/types';

const initialDesignContext: DesignContext = {
  platform: 'mobile',
  serviceType: '',
  targetUser: '뷰티, 건기식 브랜드의 퍼포먼스 마케터 및 쇼핑몰 운영자',
  pageGoal: '',
  currentStage: '',
  feedbackTypes: ['part1-basic-ux'],
};

export const useAppStore = create<AppState>((set) => ({
  uploadedImage: null,
  analysisResult: null,
  hoveredItemId: null,
  isAnalyzing: false,
  designContext: initialDesignContext,

  setUploadedImage: (image) => set({ uploadedImage: image }),
  
  setAnalysisResult: (result) => set({ analysisResult: result }),
  
  setHoveredItemId: (id) => set({ hoveredItemId: id }),
  
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  
  setDesignContext: (context) =>
    set((state) => ({
      designContext: { ...state.designContext, ...context },
    })),
  
  reset: () =>
    set({
      uploadedImage: null,
      analysisResult: null,
      hoveredItemId: null,
      isAnalyzing: false,
      designContext: initialDesignContext,
    }),
}));

