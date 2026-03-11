import { create } from 'zustand';
import { TechPackData, ChatMessage, StepStatus, Brand, Category, SampleSize, DesignNotes, FabricInfo, TrimInfo, GeneratedVisuals, SizeChart } from '@/lib/types';
import { v4 as uuid } from 'uuid';

interface TechPackStore {
  // Tech pack data
  data: TechPackData;

  // Chat messages
  messages: ChatMessage[];

  // Loading states
  isAnalyzing: boolean;
  isGenerating: boolean;
  isSuggesting: boolean;

  // Actions - Step navigation
  setStep: (step: number) => void;
  setStepStatus: (step: number, status: StepStatus) => void;

  // Actions - Step 1
  setBrand: (brand: Brand) => void;
  setCategory: (category: Category) => void;
  setSampleSize: (size: SampleSize) => void;
  setSampleNumber: (num: string) => void;
  addInspirationImage: (url: string) => void;
  setSampleDescription: (desc: string) => void;
  setDesignNotes: (notes: DesignNotes) => void;
  setClarification: (key: string, value: string) => void;
  addDetectedField: (field: string) => void;

  // Actions - Step 2
  setVisuals: (visuals: Partial<GeneratedVisuals>) => void;
  addDetailCallout: (callout: { label: string; image: string }) => void;

  // Actions - Step 3
  setBaseFabric: (fabric: FabricInfo) => void;
  setLining: (lining: FabricInfo) => void;
  addTrim: (trim: TrimInfo) => void;
  updateTrim: (index: number, trim: TrimInfo) => void;
  setFabricStepSkipped: (skipped: boolean) => void;

  // Actions - Step 4
  setSizeChart: (chart: SizeChart) => void;

  // Actions - Chat
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Actions - Loading
  setAnalyzing: (v: boolean) => void;
  setGenerating: (v: boolean) => void;
  setSuggesting: (v: boolean) => void;

  // Actions - Meta
  setDraft: (v: boolean) => void;
  reset: () => void;
}

const initialData: TechPackData = {
  inspirationImages: [],
  sampleDescription: '',
  clarifications: {},
  detectedFields: [],
  visuals: { detailCallouts: [] },
  trims: [],
  fabricStepSkipped: false,
  currentStep: 1,
  stepStatuses: ['active', 'pending', 'pending', 'pending'],
  isDraft: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useTechPackStore = create<TechPackStore>((set) => ({
  data: { ...initialData },
  messages: [],
  isAnalyzing: false,
  isGenerating: false,
  isSuggesting: false,

  setStep: (step) =>
    set((s) => ({
      data: { ...s.data, currentStep: step, updatedAt: new Date().toISOString() },
    })),

  setStepStatus: (step, status) =>
    set((s) => {
      const statuses = [...s.data.stepStatuses];
      statuses[step - 1] = status;
      return { data: { ...s.data, stepStatuses: statuses } };
    }),

  setBrand: (brand) =>
    set((s) => ({ data: { ...s.data, brand, updatedAt: new Date().toISOString() } })),

  setCategory: (category) =>
    set((s) => ({ data: { ...s.data, category, updatedAt: new Date().toISOString() } })),

  setSampleSize: (sampleSize) =>
    set((s) => ({ data: { ...s.data, sampleSize, updatedAt: new Date().toISOString() } })),

  setSampleNumber: (sampleNumber) =>
    set((s) => ({ data: { ...s.data, sampleNumber, updatedAt: new Date().toISOString() } })),

  addInspirationImage: (url) =>
    set((s) => ({
      data: { ...s.data, inspirationImages: [...s.data.inspirationImages, url], updatedAt: new Date().toISOString() },
    })),

  setSampleDescription: (desc) =>
    set((s) => ({ data: { ...s.data, sampleDescription: desc, updatedAt: new Date().toISOString() } })),

  setDesignNotes: (notes) =>
    set((s) => ({ data: { ...s.data, designNotes: notes, updatedAt: new Date().toISOString() } })),

  setClarification: (key, value) =>
    set((s) => ({
      data: {
        ...s.data,
        clarifications: { ...s.data.clarifications, [key]: value },
        updatedAt: new Date().toISOString(),
      },
    })),

  addDetectedField: (field) =>
    set((s) => ({
      data: {
        ...s.data,
        detectedFields: [...s.data.detectedFields, field],
        updatedAt: new Date().toISOString(),
      },
    })),

  setVisuals: (visuals) =>
    set((s) => ({
      data: {
        ...s.data,
        visuals: { ...s.data.visuals, ...visuals },
        updatedAt: new Date().toISOString(),
      },
    })),

  addDetailCallout: (callout) =>
    set((s) => ({
      data: {
        ...s.data,
        visuals: {
          ...s.data.visuals,
          detailCallouts: [...s.data.visuals.detailCallouts, callout],
        },
        updatedAt: new Date().toISOString(),
      },
    })),

  setBaseFabric: (fabric) =>
    set((s) => ({ data: { ...s.data, baseFabric: fabric, updatedAt: new Date().toISOString() } })),

  setLining: (lining) =>
    set((s) => ({ data: { ...s.data, lining, updatedAt: new Date().toISOString() } })),

  addTrim: (trim) =>
    set((s) => ({
      data: { ...s.data, trims: [...s.data.trims, trim], updatedAt: new Date().toISOString() },
    })),

  updateTrim: (index, trim) =>
    set((s) => {
      const trims = [...s.data.trims];
      trims[index] = trim;
      return { data: { ...s.data, trims, updatedAt: new Date().toISOString() } };
    }),

  setFabricStepSkipped: (skipped) =>
    set((s) => ({ data: { ...s.data, fabricStepSkipped: skipped, updatedAt: new Date().toISOString() } })),

  setSizeChart: (chart) =>
    set((s) => ({ data: { ...s.data, sizeChart: chart, updatedAt: new Date().toISOString() } })),

  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: uuid(), timestamp: Date.now() }],
    })),

  clearMessages: () => set({ messages: [] }),

  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setGenerating: (v) => set({ isGenerating: v }),
  setSuggesting: (v) => set({ isSuggesting: v }),

  setDraft: (v) =>
    set((s) => ({ data: { ...s.data, isDraft: v, updatedAt: new Date().toISOString() } })),

  reset: () => set({ data: { ...initialData, createdAt: new Date().toISOString() }, messages: [] }),
}));
