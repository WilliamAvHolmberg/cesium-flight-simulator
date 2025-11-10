import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { GenerationTask, GeneratedModel } from '../services/types';
import { modelCache } from '../services/modelCache';

interface GenerationContextType {
  // API Key management
  apiKey: string | null;
  setApiKey: (key: string) => void;
  hasApiKey: boolean;

  // Generation tasks
  activeTasks: GenerationTask[];
  addTask: (task: GenerationTask) => void;
  updateTask: (id: string, updates: Partial<GenerationTask>) => void;
  removeTask: (id: string) => void;

  // Model inventory
  models: GeneratedModel[];
  addModel: (model: GeneratedModel) => void;
  removeModel: (id: string) => void;
  toggleFavorite: (id: string) => void;
  refreshModels: () => Promise<void>;

  // UI state
  isOverlayOpen: boolean;
  setIsOverlayOpen: (open: boolean) => void;
  activeTab: 'generator' | 'queue' | 'inventory';
  setActiveTab: (tab: 'generator' | 'queue' | 'inventory') => void;
}

const GenerationContext = createContext<GenerationContextType | null>(null);

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within GenerationProvider');
  }
  return context;
}

interface GenerationProviderProps {
  children: ReactNode;
}

export function GenerationProvider({ children }: GenerationProviderProps) {
  // API Key (stored in localStorage)
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem('meshyai_api_key');
  });

  const setApiKey = (key: string) => {
    localStorage.setItem('meshyai_api_key', key);
    setApiKeyState(key);
  };

  const hasApiKey = Boolean(apiKey && apiKey.length > 0);

  // Active generation tasks
  const [activeTasks, setActiveTasks] = useState<GenerationTask[]>([]);

  const addTask = (task: GenerationTask) => {
    setActiveTasks((prev) => [...prev, task]);
  };

  const updateTask = (id: string, updates: Partial<GenerationTask>) => {
    setActiveTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
  };

  const removeTask = (id: string) => {
    setActiveTasks((prev) => prev.filter((task) => task.id !== id));
  };

  // Model inventory
  const [models, setModels] = useState<GeneratedModel[]>([]);

  const refreshModels = async () => {
    try {
      const loadedModels = await modelCache.getAllModels();
      // Recreate blob URLs for models
      const modelsWithUrls = loadedModels.map((model) => ({
        ...model,
        modelUrl: URL.createObjectURL(new Blob([model.glbData])),
      }));
      setModels(modelsWithUrls);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const addModel = async (model: GeneratedModel) => {
    try {
      await modelCache.saveModel(model);
      setModels((prev) => [...prev, model]);
    } catch (error) {
      console.error('Failed to save model:', error);
      throw error;
    }
  };

  const removeModel = async (id: string) => {
    try {
      await modelCache.deleteModel(id);
      setModels((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Failed to delete model:', error);
      throw error;
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      await modelCache.toggleFavorite(id);
      await refreshModels();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  };

  // UI state
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'generator' | 'queue' | 'inventory'>(
    'generator'
  );

  // Initialize IndexedDB and load models on mount
  useEffect(() => {
    const init = async () => {
      try {
        await modelCache.init();
        await refreshModels();
      } catch (error) {
        console.error('Failed to initialize model cache:', error);
      }
    };

    init();
  }, []);

  const value: GenerationContextType = {
    apiKey,
    setApiKey,
    hasApiKey,
    activeTasks,
    addTask,
    updateTask,
    removeTask,
    models,
    addModel,
    removeModel,
    toggleFavorite,
    refreshModels,
    isOverlayOpen,
    setIsOverlayOpen,
    activeTab,
    setActiveTab,
  };

  return (
    <GenerationContext.Provider value={value}>{children}</GenerationContext.Provider>
  );
}
