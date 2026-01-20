import { create } from 'zustand';
import { AppState, DesignContext } from '@/types';

const initialDesignContext: DesignContext = {
  platform: 'desktop',
  serviceType: '',
  targetUser: '뷰티, 건기식 브랜드의 퍼포먼스 마케터 및 쇼핑몰 운영자',
  pageGoal: '',
  currentStage: '',
  feedbackTypes: ['part1-basic-ux'],
};

export const useAppStore = create<AppState>((set) => ({
  uploadedImage: null,
  imageSize: null,
  analysisResult: null,
  hoveredItemId: null,
  selectedItemId: null,
  isAnalyzing: false,
  analysisStep: 'idle',
  designContext: initialDesignContext,
  referenceImages: [],

  setUploadedImage: (image) => set({ uploadedImage: image }),

  setImageSize: (size) => set({ imageSize: size }),

  setAnalysisResult: (result) => set({ analysisResult: result }),

  setHoveredItemId: (id) => set({ hoveredItemId: id }),

  setSelectedItemId: (id) => set({ selectedItemId: id }),

  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  setAnalysisStep: (step) => set({ analysisStep: step }),

  setDesignContext: (context) =>
    set((state) => ({
      designContext: { ...state.designContext, ...context },
    })),

  setReferenceImages: (images) => set({ referenceImages: images }),

  addReferenceImage: (image) =>
    set((state) => ({ referenceImages: [...state.referenceImages, image] })),

  removeReferenceImage: (id) =>
    set((state) => ({
      referenceImages: state.referenceImages.filter((img) => img.id !== id),
    })),

  updateReferenceImageType: (id, type) =>
    set((state) => ({
      referenceImages: state.referenceImages.map((img) =>
        img.id === id ? { ...img, type } : img
      ),
    })),

  reset: () =>
    set({
      uploadedImage: null,
      imageSize: null,
      analysisResult: null,
      hoveredItemId: null,
      selectedItemId: null,
      isAnalyzing: false,
      analysisStep: 'idle',
      designContext: initialDesignContext,
      referenceImages: [],
    }),
}));

