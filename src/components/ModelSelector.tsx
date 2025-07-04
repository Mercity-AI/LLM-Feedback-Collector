'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import modelsConfig from '@/lib/models.json';

interface Model {
  id: string;
  name: string;
  provider: string;
  category: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [models] = useState<Model[]>(modelsConfig.models);

  // Find the currently selected model
  const currentModel = models.find(model => model.id === selectedModel) || models[0];

  // Group models by provider
  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'flagship':
        return 'bg-purple-100 text-purple-800';
      case 'advanced':
        return 'bg-blue-100 text-blue-800';
      case 'fast':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] text-left"
      >
        <div className="flex-1">
          <div className="font-medium">{currentModel?.name}</div>
        </div>
        <Badge className={`text-xs ${getCategoryColor(currentModel?.category || 'fast')}`}>
          {currentModel?.category}
        </Badge>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
          {Object.entries(groupedModels).map(([provider, providerModels]) => (
            <div key={provider} className="border-b border-gray-100 last:border-b-0">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                {provider}
              </div>
              {providerModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model.id)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                    model.id === selectedModel ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{model.name}</div>
                    <div className="text-xs text-gray-500">{model.id}</div>
                  </div>
                  <Badge className={`text-xs ${getCategoryColor(model.category)}`}>
                    {model.category}
                  </Badge>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 