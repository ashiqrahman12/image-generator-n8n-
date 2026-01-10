"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ModelConfig, imageModels, videoModels, wanImageEdit } from '@/config/models';

interface ModelContextType {
    selectedModel: ModelConfig;
    setSelectedModel: (model: ModelConfig) => void;
    imageModels: ModelConfig[];
    videoModels: ModelConfig[];
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
    const [selectedModel, setSelectedModel] = useState<ModelConfig>(wanImageEdit);

    return (
        <ModelContext.Provider value={{
            selectedModel,
            setSelectedModel,
            imageModels,
            videoModels
        }}>
            {children}
        </ModelContext.Provider>
    );
}

export function useModel() {
    const context = useContext(ModelContext);
    if (!context) {
        throw new Error('useModel must be used within a ModelProvider');
    }
    return context;
}
