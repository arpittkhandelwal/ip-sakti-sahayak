import { create } from 'zustand';
import type {
  ChatMessage,
  Language,
  Jurisdiction,
  ClassificationState,
  ConfidenceLevel,
  Chunk,
} from '../types';

interface AppState {
  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;

  // Settings
  language: Language;
  setLanguage: (lang: Language) => void;
  jurisdiction: Jurisdiction;
  setJurisdiction: (j: Jurisdiction) => void;

  // Classification state machine
  classificationState: ClassificationState;
  setClassificationState: (s: ClassificationState) => void;
  resetClassification: () => void;

  // Session
  sessionId: string | null;
  setSessionId: (id: string) => void;

  // UI
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isSampleCorpus: boolean;
  setIsSampleCorpus: (v: boolean) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (v: boolean) => void;

  // Last retrieved chunks (for citation display)
  lastRetrievedChunks: Chunk[];
  setLastRetrievedChunks: (chunks: Chunk[]) => void;
}

const DEFAULT_CLASSIFICATION: ClassificationState = {
  step: 0,
  productCategory: 'unknown',
  jurisdiction: 'india',
  ipType: 'general',
  isClassified: false,
  clarifyingQuestions: [],
  answers: [],
};

export const useAppStore = create<AppState>((set) => ({
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, updates) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  clearMessages: () => set({ messages: [] }),

  language: 'en',
  setLanguage: (language) => set({ language }),

  jurisdiction: 'india',
  setJurisdiction: (jurisdiction) => set({ jurisdiction }),

  classificationState: DEFAULT_CLASSIFICATION,
  setClassificationState: (classificationState) => set({ classificationState }),
  resetClassification: () => set({ classificationState: DEFAULT_CLASSIFICATION }),

  sessionId: null,
  setSessionId: (sessionId) => set({ sessionId }),

  isDarkMode: false,
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.isDarkMode;
      document.documentElement.classList.toggle('dark', next);
      return { isDarkMode: next };
    }),
  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  isSampleCorpus: false,
  setIsSampleCorpus: (isSampleCorpus) => set({ isSampleCorpus }),
  voiceEnabled: false,
  setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),

  lastRetrievedChunks: [],
  setLastRetrievedChunks: (lastRetrievedChunks) => set({ lastRetrievedChunks }),
}));
