import { create } from 'zustand';
import { WordEntry, AIConfig } from '@/types';
import { wordDb } from '@/lib/db';
import {
  SyncConfig,
  getSyncConfig,
  saveSyncConfig,
  smartSync,
  shouldSync,
  clearSyncConfig,
} from '@/lib/sync';

type ReviewMode = 'due' | 'all';

interface WordStore {
  // Current word being viewed
  currentWord: WordEntry | null;
  setCurrentWord: (word: WordEntry | null) => void;

  // Saved words for review
  savedWords: WordEntry[];
  setSavedWords: (words: WordEntry[]) => void;
  addSavedWord: (word: WordEntry) => void;
  removeSavedWord: (id: string) => void;
  isWordSaved: (word: string, partOfSpeech: string) => boolean;

  // SM-2 Review state
  dueWords: WordEntry[];
  reviewMode: ReviewMode;
  loadDueWords: () => Promise<void>;
  setReviewMode: (mode: ReviewMode) => void;

  // Sync state
  syncConfig: SyncConfig | null;
  isLoggedIn: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  setSyncConfig: (config: SyncConfig | null) => void;
  loadSyncConfig: () => void;
  login: (config: SyncConfig) => void;
  logout: () => void;
  triggerSync: () => Promise<{ uploaded: number; downloaded: number }>;
  autoSync: () => Promise<void>;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // AI config state
  aiConfig: AIConfig | null;
  setAIConfig: (config: AIConfig | null) => void;
  getAIConfig: () => AIConfig | null;
  loadAIConfig: () => Promise<void>;
  isEnvConfigured: boolean;
  setIsEnvConfigured: (configured: boolean) => void;
}

export const useWordStore = create<WordStore>((set, get) => ({
  currentWord: null,
  setCurrentWord: (word) => set({ currentWord: word }),

  savedWords: [],
  setSavedWords: (words) => set({ savedWords: words }),
  addSavedWord: (word) => {
    const { savedWords } = get();
    const exists = savedWords.some((w) => w.id === word.id);
    if (!exists) {
      set({ savedWords: [...savedWords, word] });
    }
  },
  removeSavedWord: (id) => {
    const { savedWords } = get();
    set({ savedWords: savedWords.filter((w) => w.id !== id) });
  },
  isWordSaved: (word, partOfSpeech) => {
    const { savedWords } = get();
    const id = `${word}-${partOfSpeech}`;
    return savedWords.some((w) => w.id === id);
  },

  // SM-2 Review state
  dueWords: [],
  reviewMode: 'due',
  loadDueWords: async () => {
    const words = await wordDb.getDueWords();
    set({ dueWords: words });
  },
  setReviewMode: (mode) => set({ reviewMode: mode }),

  // Sync state (initialize with null to avoid SSR localStorage access)
  syncConfig: null,
  isLoggedIn: false,
  isSyncing: false,
  lastSyncTime: null,
  setSyncConfig: (config) => {
    if (config) {
      saveSyncConfig(config);
    }
    set({
      syncConfig: config,
      isLoggedIn: !!config,
      lastSyncTime: config?.lastSyncTime || null
    });
  },
  loadSyncConfig: () => {
    const config = getSyncConfig();
    if (config) {
      set({
        syncConfig: config,
        isLoggedIn: true,
        lastSyncTime: config.lastSyncTime || null
      });
    }
  },
  login: (config) => {
    saveSyncConfig(config);
    set({
      syncConfig: config,
      isLoggedIn: true,
      lastSyncTime: config.lastSyncTime || null
    });
  },
  logout: () => {
    clearSyncConfig();
    set({
      syncConfig: null,
      isLoggedIn: false,
      lastSyncTime: null
    });
  },
  triggerSync: async () => {
    const { syncConfig: config } = get();
    if (!config) {
      throw new Error('未登录');
    }

    set({ isSyncing: true });
    try {
      const result = await smartSync(config);
      set({ lastSyncTime: Date.now() });

      // 刷新本地数据
      const words = await wordDb.getAll();
      set({ savedWords: words });

      return result;
    } finally {
      set({ isSyncing: false });
    }
  },
  autoSync: async () => {
    const { syncConfig: config } = get();
    if (!config || !shouldSync(config)) {
      return;
    }

    try {
      await smartSync(config);
      set({ lastSyncTime: Date.now() });

      // 刷新本地数据
      const words = await wordDb.getAll();
      set({ savedWords: words });
    } catch (error) {
      console.error('Auto sync error:', error);
    }
  },

  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),

  // AI config state
  aiConfig: null,
  isEnvConfigured: false,
  setAIConfig: (config) => {
    set({ aiConfig: config });
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      if (config) {
        localStorage.setItem('ai-config', JSON.stringify(config));
      } else {
        localStorage.removeItem('ai-config');
      }
    }
  },
  setIsEnvConfigured: (configured) => set({ isEnvConfigured: configured }),
  getAIConfig: () => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('ai-config');
    return stored ? JSON.parse(stored) : null;
  },
  loadAIConfig: async () => {
    // 1. 先尝试从 localStorage 读取用户配置
    const stored = get().getAIConfig();
    if (stored) {
      set({ aiConfig: stored, isEnvConfigured: false });
      return;
    }

    // 2. localStorage 没有配置，尝试从环境变量加载
    try {
      const response = await fetch('/api/ai/config/full');
      if (!response.ok) {
        set({ aiConfig: null, isEnvConfigured: false });
        return;
      }

      const config = await response.json() as AIConfig;
      set({ aiConfig: config, isEnvConfigured: true });

      // 自动保存到 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai-config', JSON.stringify(config));
      }
    } catch (error) {
      console.error('Failed to load AI config from env:', error);
      set({ aiConfig: null, isEnvConfigured: false });
    }
  },
}));
