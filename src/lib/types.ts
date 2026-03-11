export type Brand = 'Froo' | 'Sweet Threads' | 'Prairie' | 'Soirée';
export type Category = 'Baby' | 'Girls' | 'Boys' | 'Preteen' | 'Teen';
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter' | 'Resort' | 'Holiday';
export type SampleSize = '2' | '6' | '8' | '16' | '18' | 'M';

export interface BrandTheme {
  primary: string;
  secondary: string;
  name: Brand;
}

export const BRAND_THEMES: Record<Brand, BrandTheme> = {
  'Froo': { primary: '#C0392B', secondary: '#F9E8E4', name: 'Froo' },
  'Sweet Threads': { primary: '#F4C2C2', secondary: '#FFFFFF', name: 'Sweet Threads' },
  'Prairie': { primary: '#8FAF8A', secondary: '#F5F0E8', name: 'Prairie' },
  'Soirée': { primary: '#EDE0E8', secondary: '#FAFAFA', name: 'Soirée' },
};

export interface DesignNotes {
  silhouette: string;
  construction: string;
  closures: string;
  neckline: string;
  hemFinish: string;
  trims: string;
  overall: string;
}

export interface FabricInfo {
  type: 'uploaded' | 'ai-sourced' | 'factory-source';
  cardImage?: string;
  description: string;
  color?: string;
  composition?: string;
  vendorName?: string;
  vendorContact?: string;
  factoryNote?: string;
}

export interface TrimInfo {
  trimType: string;
  type: 'uploaded' | 'ai-sourced' | 'factory-source';
  cardImage?: string;
  description: string;
  color?: string;
  quantity?: string;
  vendorName?: string;
  vendorContact?: string;
  factoryNote?: string;
}

export interface GeneratedVisuals {
  technicalFlatFront?: string;
  technicalFlatBack?: string;
  mockup3dFront?: string;
  mockup3dBack?: string;
  inspirationNoBg?: string;
  detailCallouts: { label: string; image: string }[];
}

export interface SizeChart {
  type: 'repeat' | 'new' | 'uploaded';
  image?: string;
  data?: string[][];
  name?: string;
}

export type StepStatus = 'pending' | 'active' | 'completed' | 'skipped';

export interface TechPackData {
  // Step 1
  brand?: Brand;
  category?: Category;
  season?: Season;
  sampleSize?: SampleSize;
  sampleNumber?: string;
  inspirationImages: string[];
  sampleDescription: string;
  designNotes?: DesignNotes;
  clarifications: Record<string, string>;
  detectedFields: string[];

  // Step 2
  visuals: GeneratedVisuals;

  // Step 3
  baseFabric?: FabricInfo;
  lining?: FabricInfo;
  trims: TrimInfo[];
  fabricStepSkipped: boolean;

  // Step 4
  sizeChart?: SizeChart;

  // Meta
  currentStep: number;
  stepStatuses: StepStatus[];
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export const GARMENT_TYPES_NO_WAIST = ['top', 'blouse', 'shirt', 'tee', 'tank', 'vest', 'jacket', 'coat', 'cape', 'poncho'];
export const GARMENT_TYPES_NO_SLEEVE = ['dress', 'skirt', 'pants', 'shorts', 'leggings'];

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  options?: { label: string; value: string }[];
  images?: string[];
  timestamp: number;
}
