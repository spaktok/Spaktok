export interface Filter {
  id: string;
  name: string;
  description?: string;
  category: 'face' | 'environment' | 'portrait' | 'beauty' | 'artistic' | 'custom';
  thumbnail?: string;
  previewUrl?: string;
  intensity: number; // 0-100
  requiresFaceDetection: boolean;
  properties: FilterProperties;
  version: string;
  createdBy?: string;
  downloads?: number;
  rating?: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FilterProperties {
  // Face effects
  faceMesh?: boolean;
  blurIntensity?: number;
  facialLandmarks?: string[];
  
  // Beauty filters
  skinSmoothing?: number;
  brightening?: number;
  contrastEnhancement?: number;
  toneMapping?: number;
  
  // Color/tone adjustments
  saturation?: number;
  hue?: number;
  exposure?: number;
  temperature?: number;
  vibrance?: number;
  
  // Artistic effects
  blurType?: 'gaussian' | 'motion' | 'radial' | 'tilt-shift';
  overlayType?: 'gradient' | 'pattern' | 'texture';
  glitchIntensity?: number;
  vignette?: number;
  
  // Advanced
  customShader?: string;
  meshUrl?: string;
  animationFrames?: number;
  fps?: number;
}

export interface UserFilter {
  id: string;
  userId: string;
  filterId: string;
  savedAt: string;
  isCustom: boolean;
  customProperties?: Partial<FilterProperties>;
}

export interface FaceDetectionResult {
  faces: Face[];
  timestamp: number;
}

export interface Face {
  id: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks: FaceLandmark[];
  expression: FaceExpression;
  confidence: number;
}

export interface FaceLandmark {
  type: string;
  x: number;
  y: number;
  z?: number;
}

export interface FaceExpression {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  fearful: number;
  disgusted: number;
}

export interface BeautyFilter {
  id: string;
  name: string;
  skinSmoothing: number;
  brightening: number;
  blushIntensity: number;
  eyeBrightness: number;
  teethWhitening: number;
  faceSlimming: number;
  jawlineEnhancement: number;
  foreheadSmoothing: number;
}

export interface FilterEffect {
  id: string;
  name: string;
  type: 'particle' | 'sound' | 'distortion' | 'color' | 'animation';
  data: any;
  duration?: number;
  triggeredBy?: string; // e.g., 'smile', 'face_detected'
}

export interface CustomFilter {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  customProperties: Partial<FilterProperties>;
  effects: FilterEffect[];
  thumbnail?: string;
  isPublic: boolean;
  downloads: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: string[]; // Array of filter IDs
  intensity: number;
  usageCount: number;
  createdAt: string;
}

export interface FilterAnalytics {
  filterId: string;
  filterName: string;
  usageCount: number;
  uniqueUsers: number;
  averageIntensity: number;
  popularity: number;
  trend: 'rising' | 'stable' | 'declining';
}

export interface ApplyFilterInput {
  frameData: any;
  filter: Filter;
  intensity?: number;
  customProperties?: Partial<FilterProperties>;
}

export interface FilterResponse {
  processedFrame: any;
  metadata?: {
    processingTime: number;
    faceCount: number;
    landmarks?: FaceLandmark[];
  };
}
