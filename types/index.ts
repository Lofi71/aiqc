export type Platform = 'mobile' | 'desktop';

export type FeedbackType = 
  | 'part1-basic-ux'
  | 'part2-ux-writing'
  | 'part3-layout-stability'
  | 'part4-designer-judgment';

export type Severity = 'High' | 'Medium' | 'Low';

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
}

export interface AnalysisResult {
  score: number;
  summary: string;
  feedback_list: FeedbackItem[];
}

export interface DesignContext {
  platform: Platform;
  serviceType: string;
  targetUser: string;
  pageGoal: string;
  currentStage: string;
  feedbackTypes: FeedbackType[];
}

export interface AppState {
  uploadedImage: string | null;
  analysisResult: AnalysisResult | null;
  hoveredItemId: number | null;
  isAnalyzing: boolean;
  designContext: DesignContext;
  
  setUploadedImage: (image: string | null) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setHoveredItemId: (id: number | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setDesignContext: (context: Partial<DesignContext>) => void;
  reset: () => void;
}

