import { create } from 'zustand'

export interface SlideData {
  id: string
  title: string
  content: string
  styleJson?: string
}

export interface PresentationState {
  id: string | null
  title: string
  description: string
  design: string
  slideCount: number
  language: string
  slides: SlideData[]
  loading: boolean
  error: string | null
  selectedTemplateId: string | null
  
  // Actions
  setPresentation: (data: Partial<PresentationState>) => void
  addSlide: (slide: SlideData) => void
  updateSlide: (id: string, slide: Partial<SlideData>) => void
  removeSlide: (id: string) => void
  resetPresentation: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedTemplateId: (templateId: string | null) => void
}

const initialState = {
  id: null,
  title: '',
  description: '',
  design: 'standard',
  slideCount: 5,
  language: 'English',
  slides: [],
  loading: false,
  error: null,
  selectedTemplateId: null,
}

export const usePresentationStore = create<PresentationState>((set) => ({
  ...initialState,
  
  setPresentation: (data) =>
    set((state) => ({
      ...state,
      ...data,
    })),
  
  addSlide: (slide) =>
    set((state) => ({
      slides: [...state.slides, slide],
    })),
  
  updateSlide: (id, updates) =>
    set((state) => ({
      slides: state.slides.map((slide) =>
        slide.id === id ? { ...slide, ...updates } : slide
      ),
    })),
  
  removeSlide: (id) =>
    set((state) => ({
      slides: state.slides.filter((slide) => slide.id !== id),
    })),
  
  resetPresentation: () => set(initialState),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),

  setSelectedTemplateId: (templateId) => set({ selectedTemplateId: templateId }),
}))
