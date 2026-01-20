export type Platform = 'mobile' | 'desktop';

export type FeedbackType =
  | 'part1-basic-ux'
  | 'part2-ux-writing'
  | 'part3-layout-stability'
  | 'part4-designer-judgment';

export type Severity = 'High' | 'Medium' | 'Low';


export type ReferenceImageType = 'parent_page' | 'child_page' | 'error_state' | 'empty_state' | 'style_guide';

export interface ReferenceImage {
  id: string;
  base64: string;
  type: ReferenceImageType;
  fileName: string;
}

export interface Coordinates {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface FeedbackItem {
  id: number;
  type: string;
  severity: Severity;
  title: string;
  description: string;
  action_plan: string;
  coordinates: Coordinates;
  _reasoning?: string; // Internal chain-of-thought
}

export interface AnalysisResult {
  score: number;
  summary: string;
  feedback_list: FeedbackItem[];
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface DesignContext {
  platform: Platform;
  serviceType: string;
  targetUser: string;
  pageGoal: string;
  currentStage: string;
  feedbackTypes: FeedbackType[];
}

export type AnalysisStep = 'idle' | 'detecting' | 'analyzing' | 'complete' | 'error';

export interface AppState {
  uploadedImage: string | null;
  imageSize: ImageSize | null;
  analysisResult: AnalysisResult | null;
  hoveredItemId: number | null;
  selectedItemId: number | null;
  isAnalyzing: boolean;
  analysisStep: AnalysisStep;
  designContext: DesignContext;
  referenceImages: ReferenceImage[];

  setUploadedImage: (image: string | null) => void;
  setImageSize: (size: ImageSize | null) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setHoveredItemId: (id: number | null) => void;
  setSelectedItemId: (id: number | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setAnalysisStep: (step: AnalysisStep) => void;
  setDesignContext: (context: Partial<DesignContext>) => void;
  setReferenceImages: (images: ReferenceImage[]) => void;
  addReferenceImage: (image: ReferenceImage) => void;
  removeReferenceImage: (id: string) => void;
  updateReferenceImageType: (id: string, type: ReferenceImageType) => void;
  reset: () => void;
}

